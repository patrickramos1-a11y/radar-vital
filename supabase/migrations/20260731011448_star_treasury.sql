BEGIN;

CREATE TABLE public.star_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE,
  period_end DATE,
  star_to_brl NUMERIC(12, 4),
  total_stars INTEGER NOT NULL DEFAULT 0,
  total_brl NUMERIC(14, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by TEXT NOT NULL DEFAULT 'Sistema',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (star_to_brl IS NULL OR star_to_brl >= 0),
  CHECK (period_end IS NULL OR period_start IS NULL OR period_end >= period_start)
);

CREATE TABLE public.star_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL CHECK (amount <> 0),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'opening_grant',
    'deliverable_reward',
    'challenge_reward',
    'challenge_penalty',
    'manual_award',
    'manual_penalty',
    'adjustment',
    'reversal',
    'settlement'
  )),
  source_type TEXT,
  source_id UUID,
  reason TEXT NOT NULL CHECK (length(btrim(reason)) > 0),
  created_by TEXT NOT NULL DEFAULT 'Sistema',
  reverses_transaction_id UUID REFERENCES public.star_transactions(id) ON DELETE RESTRICT,
  settlement_id UUID REFERENCES public.star_settlements(id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (transaction_type = 'reversal' AND reverses_transaction_id IS NOT NULL)
    OR transaction_type <> 'reversal'
  )
);

CREATE TABLE public.star_settlement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES public.star_settlements(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE RESTRICT,
  balance_before INTEGER NOT NULL,
  stars_settled INTEGER NOT NULL,
  amount_brl NUMERIC(14, 2) NOT NULL DEFAULT 0,
  settlement_transaction_id UUID REFERENCES public.star_transactions(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (settlement_id, collaborator_id)
);

ALTER TABLE public.deliverable_ratings
  ADD COLUMN IF NOT EXISTS star_transaction_version UUID;

CREATE INDEX star_transactions_collaborator_created_at_idx
  ON public.star_transactions (collaborator_id, created_at DESC);
CREATE INDEX star_transactions_source_idx
  ON public.star_transactions (source_type, source_id);
CREATE INDEX star_transactions_settlement_idx
  ON public.star_transactions (settlement_id);
CREATE INDEX star_settlement_items_collaborator_idx
  ON public.star_settlement_items (collaborator_id, settlement_id);

CREATE VIEW public.collaborator_star_balances
WITH (security_invoker = TRUE)
AS
SELECT
  collaborator.id AS collaborator_id,
  collaborator.name AS collaborator_name,
  collaborator.color AS collaborator_color,
  collaborator.photo_url,
  COALESCE(SUM(transaction.amount), 0)::INTEGER AS balance,
  COALESCE(SUM(transaction.amount) FILTER (WHERE transaction.amount > 0), 0)::INTEGER AS credits,
  COALESCE(SUM(transaction.amount) FILTER (WHERE transaction.amount < 0), 0)::INTEGER AS debits
FROM public.collaborators collaborator
LEFT JOIN public.star_transactions transaction
  ON transaction.collaborator_id = collaborator.id
GROUP BY collaborator.id, collaborator.name, collaborator.color, collaborator.photo_url;

CREATE VIEW public.star_treasury_summary
WITH (security_invoker = TRUE)
AS
SELECT
  COALESCE(SUM(amount), 0)::INTEGER AS collective_balance,
  COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0)::INTEGER AS total_credits,
  COALESCE(SUM(amount) FILTER (WHERE amount < 0), 0)::INTEGER AS total_debits,
  COUNT(*)::INTEGER AS transaction_count
FROM public.star_transactions;

ALTER TABLE public.star_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.star_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.star_settlement_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY star_settlements_current_access_read
  ON public.star_settlements FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY star_transactions_current_access_read
  ON public.star_transactions FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY star_settlement_items_current_access_read
  ON public.star_settlement_items FOR SELECT TO anon, authenticated USING (TRUE);

GRANT SELECT ON public.star_settlements, public.star_transactions,
  public.star_settlement_items, public.collaborator_star_balances,
  public.star_treasury_summary TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.insert_star_transaction(
  p_collaborator_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_source_type TEXT,
  p_source_id UUID,
  p_reason TEXT,
  p_idempotency_key TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_reverses_transaction_id UUID DEFAULT NULL,
  p_settlement_id UUID DEFAULT NULL,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  transaction_id UUID;
BEGIN
  IF p_amount = 0 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.star_transactions (
    collaborator_id,
    amount,
    transaction_type,
    source_type,
    source_id,
    reason,
    created_by,
    reverses_transaction_id,
    settlement_id,
    idempotency_key,
    metadata
  ) VALUES (
    p_collaborator_id,
    p_amount,
    p_transaction_type,
    p_source_type,
    p_source_id,
    p_reason,
    COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'),
    p_reverses_transaction_id,
    p_settlement_id,
    p_idempotency_key,
    COALESCE(p_metadata, '{}'::JSONB)
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO transaction_id;

  RETURN transaction_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_deliverable_rating(
  p_rating_id UUID,
  p_version UUID,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rating_record public.deliverable_ratings%ROWTYPE;
  deliverable_record public.deliverables%ROWTYPE;
  collaborator_record RECORD;
  reward_stars INTEGER;
BEGIN
  SELECT * INTO rating_record
  FROM public.deliverable_ratings
  WHERE id = p_rating_id;

  IF rating_record.id IS NULL THEN
    RAISE EXCEPTION 'Deliverable rating not found';
  END IF;

  SELECT * INTO deliverable_record
  FROM public.deliverables
  WHERE id = rating_record.deliverable_id;

  IF deliverable_record.id IS NULL THEN
    RAISE EXCEPTION 'Deliverable not found';
  END IF;

  reward_stars := CASE rating_record.rating_type
    WHEN 'thumbs' THEN 0
    WHEN 'superstar' THEN 10
    ELSE GREATEST(1, LEAST(5, rating_record.value))
  END;

  IF reward_stars = 0 THEN
    RETURN;
  END IF;

  FOR collaborator_record IN
    SELECT DISTINCT collaborator.id
    FROM public.collaborators collaborator
    JOIN unnest(deliverable_record.assigned_to) AS assignee(name)
      ON lower(btrim(assignee.name)) = lower(btrim(collaborator.name))
  LOOP
    PERFORM public.insert_star_transaction(
      collaborator_record.id,
      reward_stars,
      'deliverable_reward',
      'deliverable_rating',
      rating_record.id,
      'Avaliacao de entregavel',
      format('deliverable-rating:%s:%s:%s', p_rating_id, p_version, collaborator_record.id),
      jsonb_build_object(
        'deliverable_id', rating_record.deliverable_id,
        'rating_type', rating_record.rating_type,
        'rating_value', rating_record.value,
        'rating_version', p_version
      ),
      NULL,
      NULL,
      p_actor_name
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.reverse_active_rating_transactions(
  p_rating_id UUID,
  p_reason TEXT,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  transaction_record public.star_transactions%ROWTYPE;
BEGIN
  FOR transaction_record IN
    SELECT transaction.*
    FROM public.star_transactions transaction
    WHERE transaction.source_type = 'deliverable_rating'
      AND transaction.source_id = p_rating_id
      AND transaction.transaction_type = 'deliverable_reward'
      AND NOT EXISTS (
        SELECT 1
        FROM public.star_transactions reversal
        WHERE reversal.reverses_transaction_id = transaction.id
      )
  LOOP
    PERFORM public.insert_star_transaction(
      transaction_record.collaborator_id,
      -transaction_record.amount,
      'reversal',
      'deliverable_rating',
      p_rating_id,
      p_reason,
      format('deliverable-rating-reversal:%s', transaction_record.id),
      jsonb_build_object('reversed_transaction_id', transaction_record.id),
      transaction_record.id,
      NULL,
      p_actor_name
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_deliverable_rating(
  p_deliverable_id UUID,
  p_rater_name TEXT,
  p_rating_type TEXT,
  p_value INTEGER DEFAULT 1,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_rating public.deliverable_ratings%ROWTYPE;
  rating_id UUID;
  rating_version UUID := gen_random_uuid();
BEGIN
  IF p_rating_type NOT IN ('thumbs', 'star', 'superstar') THEN
    RAISE EXCEPTION 'Invalid rating type';
  END IF;

  IF p_rating_type = 'star' AND (p_value < 1 OR p_value > 5) THEN
    RAISE EXCEPTION 'Star rating must be between 1 and 5';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.deliverables WHERE id = p_deliverable_id) THEN
    RAISE EXCEPTION 'Deliverable not found';
  END IF;

  SELECT * INTO existing_rating
  FROM public.deliverable_ratings
  WHERE deliverable_id = p_deliverable_id
    AND lower(btrim(rater_name)) = lower(btrim(p_rater_name))
  FOR UPDATE;

  IF existing_rating.id IS NOT NULL THEN
    PERFORM public.reverse_active_rating_transactions(
      existing_rating.id,
      'Estorno por atualizacao da avaliacao do entregavel',
      p_actor_name
    );

    UPDATE public.deliverable_ratings
    SET
      rater_name = btrim(p_rater_name),
      rating_type = p_rating_type,
      value = CASE WHEN p_rating_type = 'superstar' THEN 10 ELSE p_value END,
      star_transaction_version = rating_version
    WHERE id = existing_rating.id
    RETURNING id INTO rating_id;
  ELSE
    INSERT INTO public.deliverable_ratings (
      deliverable_id,
      rater_name,
      rating_type,
      value,
      star_transaction_version
    ) VALUES (
      p_deliverable_id,
      btrim(p_rater_name),
      p_rating_type,
      CASE WHEN p_rating_type = 'superstar' THEN 10 ELSE p_value END,
      rating_version
    )
    RETURNING id INTO rating_id;
  END IF;

  PERFORM public.credit_deliverable_rating(rating_id, rating_version, p_actor_name);
  RETURN rating_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_deliverable_rating(
  p_deliverable_id UUID,
  p_rater_name TEXT,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rating_record public.deliverable_ratings%ROWTYPE;
BEGIN
  SELECT * INTO rating_record
  FROM public.deliverable_ratings
  WHERE deliverable_id = p_deliverable_id
    AND lower(btrim(rater_name)) = lower(btrim(p_rater_name))
  FOR UPDATE;

  IF rating_record.id IS NULL THEN
    RETURN;
  END IF;

  PERFORM public.reverse_active_rating_transactions(
    rating_record.id,
    'Estorno por remocao da avaliacao do entregavel',
    p_actor_name
  );

  DELETE FROM public.deliverable_ratings WHERE id = rating_record.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_challenge_resolution_transactions(
  p_challenge_id UUID,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  challenge_record public.challenges%ROWTYPE;
  participant_record RECORD;
  transaction_amount INTEGER;
  transaction_kind TEXT;
BEGIN
  SELECT * INTO challenge_record
  FROM public.challenges
  WHERE id = p_challenge_id;

  IF challenge_record.status NOT IN ('won', 'lost') THEN
    RETURN;
  END IF;

  transaction_amount := CASE
    WHEN challenge_record.status = 'won' THEN challenge_record.reward_superstars * 10
    ELSE -challenge_record.penalty_stars
  END;

  IF transaction_amount = 0 THEN
    RETURN;
  END IF;

  transaction_kind := CASE
    WHEN challenge_record.status = 'won' THEN 'challenge_reward'
    ELSE 'challenge_penalty'
  END;

  FOR participant_record IN
    SELECT collaborator_id
    FROM public.challenge_participants
    WHERE challenge_id = p_challenge_id
  LOOP
    PERFORM public.insert_star_transaction(
      participant_record.collaborator_id,
      transaction_amount,
      transaction_kind,
      'challenge',
      challenge_record.id,
      CASE
        WHEN challenge_record.status = 'won' THEN 'Recompensa por desafio cumprido'
        ELSE 'Penalidade por desafio nao cumprido'
      END,
      format('challenge:%s:%s:%s', challenge_record.id, challenge_record.status, participant_record.collaborator_id),
      jsonb_build_object(
        'reward_superstars', challenge_record.reward_superstars,
        'penalty_stars', challenge_record.penalty_stars,
        'integral_per_participant', TRUE
      ),
      NULL,
      NULL,
      p_actor_name
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_challenge(
  p_challenge_id UUID,
  p_outcome TEXT,
  p_resolution_notes TEXT DEFAULT NULL,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  previous_challenge public.challenges%ROWTYPE;
  updated_challenge public.challenges%ROWTYPE;
BEGIN
  IF p_outcome NOT IN ('won', 'lost') THEN
    RAISE EXCEPTION 'Challenge outcome must be won or lost';
  END IF;

  SELECT * INTO previous_challenge
  FROM public.challenges
  WHERE id = p_challenge_id
  FOR UPDATE;

  IF previous_challenge.id IS NULL THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  IF previous_challenge.status IN ('won', 'lost') THEN
    IF previous_challenge.status = p_outcome THEN
      PERFORM public.record_challenge_resolution_transactions(p_challenge_id, p_actor_name);
      RETURN previous_challenge.status;
    END IF;
    RAISE EXCEPTION 'Challenge has already been resolved';
  END IF;

  IF previous_challenge.status NOT IN ('active', 'awaiting_validation') THEN
    RAISE EXCEPTION 'Only active challenges can be resolved';
  END IF;

  UPDATE public.challenges
  SET
    status = p_outcome,
    resolved_by = COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'),
    resolved_at = now(),
    resolution_notes = NULLIF(btrim(COALESCE(p_resolution_notes, '')), '')
  WHERE id = p_challenge_id
  RETURNING * INTO updated_challenge;

  INSERT INTO public.challenge_events (
    challenge_id,
    actor_user_id,
    action_type,
    before_data,
    after_data
  ) VALUES (
    updated_challenge.id,
    COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'),
    CASE WHEN p_outcome = 'won' THEN 'challenge_won' ELSE 'challenge_lost' END,
    to_jsonb(previous_challenge),
    to_jsonb(updated_challenge)
  );

  PERFORM public.record_challenge_resolution_transactions(p_challenge_id, p_actor_name);
  RETURN updated_challenge.status;
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_manual_stars(
  p_collaborator_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_is_penalty BOOLEAN DEFAULT FALSE,
  p_request_id UUID DEFAULT gen_random_uuid(),
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Manual star amount must be positive';
  END IF;

  IF length(btrim(COALESCE(p_reason, ''))) = 0 THEN
    RAISE EXCEPTION 'A reason is required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.collaborators WHERE id = p_collaborator_id) THEN
    RAISE EXCEPTION 'Collaborator not found';
  END IF;

  RETURN public.insert_star_transaction(
    p_collaborator_id,
    CASE WHEN p_is_penalty THEN -p_amount ELSE p_amount END,
    CASE WHEN p_is_penalty THEN 'manual_penalty' ELSE 'manual_award' END,
    'manual',
    NULL,
    btrim(p_reason),
    format('manual:%s:%s', p_request_id, p_collaborator_id),
    jsonb_build_object('request_id', p_request_id, 'is_penalty', p_is_penalty),
    NULL,
    NULL,
    p_actor_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_opening_stars(
  p_collaborator_ids UUID[],
  p_amount INTEGER DEFAULT 500,
  p_reason TEXT DEFAULT 'Credito inicial',
  p_batch_id UUID DEFAULT gen_random_uuid(),
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  collaborator_record RECORD;
  inserted_count INTEGER := 0;
  transaction_id UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Opening credit must be positive';
  END IF;

  IF COALESCE(array_length(p_collaborator_ids, 1), 0) = 0 THEN
    RAISE EXCEPTION 'Select at least one collaborator';
  END IF;

  FOR collaborator_record IN
    SELECT DISTINCT collaborator.id
    FROM public.collaborators collaborator
    WHERE collaborator.id = ANY(p_collaborator_ids)
      AND collaborator.is_active = TRUE
  LOOP
    transaction_id := public.insert_star_transaction(
      collaborator_record.id,
      p_amount,
      'opening_grant',
      'opening_batch',
      NULL,
      btrim(COALESCE(p_reason, 'Credito inicial')),
      format('opening:%s:%s', p_batch_id, collaborator_record.id),
      jsonb_build_object('batch_id', p_batch_id),
      NULL,
      NULL,
      p_actor_name
    );
    IF transaction_id IS NOT NULL THEN
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;

  RETURN inserted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.settle_star_balances(
  p_collaborator_ids UUID[],
  p_period_start DATE DEFAULT NULL,
  p_period_end DATE DEFAULT NULL,
  p_star_to_brl NUMERIC DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settlement_id UUID;
  collaborator_record RECORD;
  current_balance INTEGER;
  settlement_transaction_id UUID;
  current_cash NUMERIC(14, 2);
  total_stars_value INTEGER := 0;
  total_brl_value NUMERIC(14, 2) := 0;
BEGIN
  IF COALESCE(array_length(p_collaborator_ids, 1), 0) = 0 THEN
    RAISE EXCEPTION 'Select at least one collaborator';
  END IF;

  IF p_star_to_brl IS NOT NULL AND p_star_to_brl < 0 THEN
    RAISE EXCEPTION 'Star conversion must be positive';
  END IF;

  INSERT INTO public.star_settlements (
    period_start,
    period_end,
    star_to_brl,
    notes,
    created_by
  ) VALUES (
    p_period_start,
    p_period_end,
    p_star_to_brl,
    NULLIF(btrim(COALESCE(p_notes, '')), ''),
    COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema')
  )
  RETURNING id INTO settlement_id;

  FOR collaborator_record IN
    SELECT DISTINCT collaborator.id
    FROM public.collaborators collaborator
    WHERE collaborator.id = ANY(p_collaborator_ids)
  LOOP
    SELECT COALESCE(SUM(amount), 0)::INTEGER INTO current_balance
    FROM public.star_transactions
    WHERE collaborator_id = collaborator_record.id;

    current_cash := CASE
      WHEN p_star_to_brl IS NULL OR current_balance <= 0 THEN 0
      ELSE round(current_balance * p_star_to_brl, 2)
    END;

    settlement_transaction_id := public.insert_star_transaction(
      collaborator_record.id,
      -current_balance,
      'settlement',
      'settlement',
      settlement_id,
      'Liquidacao do saldo de estrelas',
      format('settlement:%s:%s', settlement_id, collaborator_record.id),
      jsonb_build_object(
        'balance_before', current_balance,
        'star_to_brl', p_star_to_brl,
        'cash_value', current_cash
      ),
      NULL,
      settlement_id,
      p_actor_name
    );

    INSERT INTO public.star_settlement_items (
      settlement_id,
      collaborator_id,
      balance_before,
      stars_settled,
      amount_brl,
      settlement_transaction_id
    ) VALUES (
      settlement_id,
      collaborator_record.id,
      current_balance,
      current_balance,
      current_cash,
      settlement_transaction_id
    );

    total_stars_value := total_stars_value + current_balance;
    total_brl_value := total_brl_value + current_cash;
  END LOOP;

  UPDATE public.star_settlements
  SET total_stars = total_stars_value,
      total_brl = total_brl_value
  WHERE id = settlement_id;

  RETURN settlement_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reverse_star_transaction(
  p_transaction_id UUID,
  p_reason TEXT,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  transaction_record public.star_transactions%ROWTYPE;
BEGIN
  IF length(btrim(COALESCE(p_reason, ''))) = 0 THEN
    RAISE EXCEPTION 'A reversal reason is required';
  END IF;

  SELECT * INTO transaction_record
  FROM public.star_transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF transaction_record.id IS NULL THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  IF transaction_record.transaction_type = 'reversal' THEN
    RAISE EXCEPTION 'A reversal cannot be reversed directly';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.star_transactions
    WHERE reverses_transaction_id = p_transaction_id
  ) THEN
    RAISE EXCEPTION 'Transaction has already been reversed';
  END IF;

  RETURN public.insert_star_transaction(
    transaction_record.collaborator_id,
    -transaction_record.amount,
    'reversal',
    transaction_record.source_type,
    transaction_record.source_id,
    btrim(p_reason),
    format('reversal:%s', transaction_record.id),
    jsonb_build_object('original_transaction_id', transaction_record.id),
    transaction_record.id,
    NULL,
    p_actor_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.backfill_star_sources(
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rating_record public.deliverable_ratings%ROWTYPE;
  challenge_record RECORD;
  rating_count INTEGER := 0;
  challenge_count INTEGER := 0;
  version_id UUID;
BEGIN
  FOR rating_record IN SELECT * FROM public.deliverable_ratings
  LOOP
    version_id := COALESCE(rating_record.star_transaction_version, gen_random_uuid());
    UPDATE public.deliverable_ratings
    SET star_transaction_version = version_id
    WHERE id = rating_record.id
      AND star_transaction_version IS NULL;
    PERFORM public.credit_deliverable_rating(rating_record.id, version_id, p_actor_name);
    rating_count := rating_count + 1;
  END LOOP;

  FOR challenge_record IN
    SELECT id FROM public.challenges WHERE status IN ('won', 'lost')
  LOOP
    PERFORM public.record_challenge_resolution_transactions(challenge_record.id, p_actor_name);
    challenge_count := challenge_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'ratings_checked', rating_count,
    'challenges_checked', challenge_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.insert_star_transaction(UUID, INTEGER, TEXT, TEXT, UUID, TEXT, TEXT, JSONB, UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.credit_deliverable_rating(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reverse_active_rating_transactions(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_challenge_resolution_transactions(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_deliverable_rating(UUID, TEXT, TEXT, INTEGER, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.remove_deliverable_rating(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_challenge(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.grant_manual_stars(UUID, INTEGER, TEXT, BOOLEAN, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.grant_opening_stars(UUID[], INTEGER, TEXT, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.settle_star_balances(UUID[], DATE, DATE, NUMERIC, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reverse_star_transaction(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.backfill_star_sources(TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.set_deliverable_rating(UUID, TEXT, TEXT, INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.remove_deliverable_rating(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_challenge(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_manual_stars(UUID, INTEGER, TEXT, BOOLEAN, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_opening_stars(UUID[], INTEGER, TEXT, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_star_balances(UUID[], DATE, DATE, NUMERIC, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reverse_star_transaction(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_star_sources(TEXT) TO anon, authenticated;

COMMIT;
