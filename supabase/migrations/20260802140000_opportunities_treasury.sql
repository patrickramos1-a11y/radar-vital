BEGIN;

-- OP-0: reward profiles, Treasury membership and individual rewards.
-- This migration is additive. Existing imported challenges remain drafts and
-- legacy participants keep their previous Treasury behavior until explicitly
-- configured through the new opportunity flow.

CREATE TABLE IF NOT EXISTS public.collaborator_reward_profiles (
  collaborator_id UUID PRIMARY KEY REFERENCES public.collaborators(id) ON DELETE CASCADE,
  profile_kind TEXT NOT NULL DEFAULT 'production'
    CHECK (profile_kind IN ('production', 'intern', 'provider', 'admin')),
  created_by TEXT NOT NULL DEFAULT 'Sistema',
  updated_by TEXT NOT NULL DEFAULT 'Sistema',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.treasury_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL UNIQUE REFERENCES public.collaborators(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'not_participant'
    CHECK (status IN ('not_participant', 'requested', 'active', 'ended')),
  requested_at TIMESTAMPTZ,
  requested_by TEXT,
  decided_at TIMESTAMPTZ,
  decided_by TEXT,
  decision_note TEXT,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.star_value_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  star_value_brl NUMERIC(12, 4) NOT NULL CHECK (star_value_brl > 0),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until TIMESTAMPTZ,
  created_by TEXT NOT NULL DEFAULT 'Sistema',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (effective_until IS NULL OR effective_until > effective_from)
);

CREATE UNIQUE INDEX IF NOT EXISTS star_value_rates_one_open_rate_idx
  ON public.star_value_rates ((1)) WHERE effective_until IS NULL;
CREATE INDEX IF NOT EXISTS star_value_rates_effective_idx
  ON public.star_value_rates (effective_from DESC);

INSERT INTO public.star_value_rates (star_value_brl, effective_from, created_by, note)
SELECT 1.0000, now(), 'Patrick', 'Taxa inicial: uma estrela-base vale R$ 1,00.'
WHERE NOT EXISTS (SELECT 1 FROM public.star_value_rates);

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS opportunity_visibility TEXT NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS reward_destination_policy TEXT NOT NULL DEFAULT 'choice_allowed';

ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS challenges_opportunity_visibility_check;
ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_opportunity_visibility_check
    CHECK (opportunity_visibility IN ('internal', 'opportunity'));
ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS challenges_reward_destination_policy_check;
ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_reward_destination_policy_check
    CHECK (reward_destination_policy IN ('treasury_required', 'choice_allowed', 'individual_only'));

UPDATE public.challenges
SET reward_destination_policy = 'treasury_required'
WHERE kind = 'individual_goal' AND reward_destination_policy = 'choice_allowed';

ALTER TABLE public.challenge_participants
  ADD COLUMN IF NOT EXISTS approval_source TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS reward_destination TEXT,
  ADD COLUMN IF NOT EXISTS operational_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS acceptance_request_id UUID;

ALTER TABLE public.challenge_participants
  DROP CONSTRAINT IF EXISTS challenge_participants_reward_destination_check;
ALTER TABLE public.challenge_participants
  ADD CONSTRAINT challenge_participants_reward_destination_check
    CHECK (reward_destination IS NULL OR reward_destination IN ('treasury', 'individual'));
ALTER TABLE public.challenge_participants
  DROP CONSTRAINT IF EXISTS challenge_participants_operational_status_check;
ALTER TABLE public.challenge_participants
  ADD CONSTRAINT challenge_participants_operational_status_check
    CHECK (operational_status IN ('pending', 'active', 'declined', 'ended'));

CREATE TABLE IF NOT EXISTS public.challenge_acceptance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE RESTRICT,
  proposed_due_at TIMESTAMPTZ NOT NULL,
  proposed_reward_superstars INTEGER CHECK (proposed_reward_superstars IS NULL OR proposed_reward_superstars >= 0),
  requested_destination TEXT NOT NULL CHECK (requested_destination IN ('treasury', 'individual')),
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ,
  decided_by TEXT,
  decision_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS challenge_acceptance_requests_one_open_idx
  ON public.challenge_acceptance_requests (challenge_id, collaborator_id)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS challenge_acceptance_requests_queue_idx
  ON public.challenge_acceptance_requests (status, requested_at DESC);

ALTER TABLE public.challenge_participants
  DROP CONSTRAINT IF EXISTS challenge_participants_acceptance_request_id_fkey;
ALTER TABLE public.challenge_participants
  ADD CONSTRAINT challenge_participants_acceptance_request_id_fkey
    FOREIGN KEY (acceptance_request_id) REFERENCES public.challenge_acceptance_requests(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.individual_reward_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE RESTRICT,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE RESTRICT,
  rate_id UUID NOT NULL REFERENCES public.star_value_rates(id) ON DELETE RESTRICT,
  gross_stars INTEGER NOT NULL CHECK (gross_stars <> 0),
  frozen_star_value_brl NUMERIC(12, 4) NOT NULL CHECK (frozen_star_value_brl > 0),
  payout_fraction NUMERIC(5, 4) NOT NULL CHECK (payout_fraction > 0 AND payout_fraction <= 1),
  amount_brl NUMERIC(14, 2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'payment', 'reversal')),
  payment_status TEXT NOT NULL DEFAULT 'payable' CHECK (payment_status IN ('payable', 'paid', 'reversed')),
  reason TEXT NOT NULL CHECK (length(btrim(reason)) > 0),
  created_by TEXT NOT NULL DEFAULT 'Sistema',
  reverses_transaction_id UUID REFERENCES public.individual_reward_transactions(id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL UNIQUE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (transaction_type = 'reversal' AND reverses_transaction_id IS NOT NULL)
    OR transaction_type <> 'reversal'
  )
);
CREATE INDEX IF NOT EXISTS individual_reward_transactions_collaborator_idx
  ON public.individual_reward_transactions (collaborator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS individual_reward_transactions_payment_idx
  ON public.individual_reward_transactions (payment_status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.reward_program_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id UUID REFERENCES public.collaborators(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  actor_name TEXT NOT NULL DEFAULT 'Sistema',
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reward_program_events_collaborator_idx
  ON public.reward_program_events (collaborator_id, created_at DESC);

INSERT INTO public.collaborator_reward_profiles (collaborator_id, profile_kind, created_by, updated_by)
SELECT id,
  CASE WHEN lower(coalesce(role, '')) = 'admin' OR lower(name) LIKE '%patrick%' THEN 'admin' ELSE 'production' END,
  'Sistema', 'Sistema'
FROM public.collaborators
ON CONFLICT (collaborator_id) DO NOTHING;

ALTER TABLE public.collaborator_reward_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.star_value_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_acceptance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.individual_reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_program_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY collaborator_reward_profiles_read ON public.collaborator_reward_profiles
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY treasury_memberships_read ON public.treasury_memberships
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY star_value_rates_read ON public.star_value_rates
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY challenge_acceptance_requests_read ON public.challenge_acceptance_requests
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY individual_reward_transactions_read ON public.individual_reward_transactions
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY reward_program_events_read ON public.reward_program_events
  FOR SELECT TO anon, authenticated USING (TRUE);

GRANT SELECT ON public.collaborator_reward_profiles, public.treasury_memberships,
  public.star_value_rates, public.challenge_acceptance_requests,
  public.individual_reward_transactions, public.reward_program_events TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.current_star_value_rate()
RETURNS public.star_value_rates
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.star_value_rates
  WHERE effective_from <= now() AND (effective_until IS NULL OR effective_until > now())
  ORDER BY effective_from DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.request_treasury_membership(
  p_collaborator_id UUID,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE membership_id UUID; profile_kind_value TEXT;
BEGIN
  SELECT profile_kind INTO profile_kind_value
  FROM public.collaborator_reward_profiles WHERE collaborator_id = p_collaborator_id;
  IF profile_kind_value IS DISTINCT FROM 'production' THEN
    RAISE EXCEPTION 'Only production collaborators can request Treasury membership';
  END IF;
  INSERT INTO public.treasury_memberships (collaborator_id, status, requested_at, requested_by, ended_at)
  VALUES (p_collaborator_id, 'requested', now(), COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), NULL)
  ON CONFLICT (collaborator_id) DO UPDATE SET
    status = CASE WHEN public.treasury_memberships.status = 'active' THEN 'active' ELSE 'requested' END,
    requested_at = CASE WHEN public.treasury_memberships.status = 'active' THEN public.treasury_memberships.requested_at ELSE now() END,
    requested_by = CASE WHEN public.treasury_memberships.status = 'active' THEN public.treasury_memberships.requested_by ELSE EXCLUDED.requested_by END,
    updated_at = now()
  RETURNING id INTO membership_id;
  INSERT INTO public.reward_program_events (collaborator_id, event_type, actor_name, payload)
  VALUES (p_collaborator_id, 'treasury_membership_requested', COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), '{}'::JSONB);
  RETURN membership_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_treasury_membership(
  p_collaborator_id UUID,
  p_approve BOOLEAN,
  p_note TEXT DEFAULT NULL,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE actor TEXT := COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema');
BEGIN
  IF lower(actor) NOT LIKE '%patrick%' THEN RAISE EXCEPTION 'Only Patrick can review Treasury memberships'; END IF;
  UPDATE public.treasury_memberships
  SET status = CASE WHEN p_approve THEN 'active' ELSE 'not_participant' END,
      decided_at = now(), decided_by = actor, decision_note = NULLIF(btrim(COALESCE(p_note, '')), ''),
      updated_at = now()
  WHERE collaborator_id = p_collaborator_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Treasury membership not found'; END IF;
  INSERT INTO public.reward_program_events (collaborator_id, event_type, actor_name, payload)
  VALUES (p_collaborator_id, 'treasury_membership_reviewed', actor, jsonb_build_object('approved', p_approve));
END;
$$;

CREATE OR REPLACE FUNCTION public.request_opportunity_acceptance(
  p_challenge_id UUID,
  p_collaborator_id UUID,
  p_proposed_due_at TIMESTAMPTZ,
  p_requested_destination TEXT,
  p_proposed_reward_superstars INTEGER DEFAULT NULL,
  p_note TEXT DEFAULT NULL,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  challenge_record public.challenges%ROWTYPE;
  profile_kind_value TEXT;
  membership_status TEXT;
  request_id UUID;
BEGIN
  SELECT * INTO challenge_record FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF challenge_record.id IS NULL THEN RAISE EXCEPTION 'Challenge not found'; END IF;
  IF challenge_record.status NOT IN ('open', 'active') OR challenge_record.opportunity_visibility <> 'opportunity' THEN
    RAISE EXCEPTION 'This challenge is not available as an opportunity';
  END IF;
  IF p_proposed_due_at IS NULL OR p_proposed_due_at <= now() THEN RAISE EXCEPTION 'A future delivery date is required'; END IF;
  SELECT profile_kind INTO profile_kind_value FROM public.collaborator_reward_profiles WHERE collaborator_id = p_collaborator_id;
  IF profile_kind_value IS NULL OR profile_kind_value = 'admin' THEN RAISE EXCEPTION 'Collaborator reward profile is not eligible'; END IF;
  SELECT status INTO membership_status FROM public.treasury_memberships WHERE collaborator_id = p_collaborator_id;

  IF challenge_record.reward_status = 'unpriced' AND COALESCE(p_proposed_reward_superstars, -1) < 0 THEN
    RAISE EXCEPTION 'A Super Star proposal is required for an unpriced challenge';
  END IF;
  IF profile_kind_value IN ('intern', 'provider') AND p_requested_destination <> 'individual' THEN
    RAISE EXCEPTION 'Interns and providers receive individual rewards only';
  END IF;
  IF profile_kind_value = 'production' THEN
    IF membership_status IS DISTINCT FROM 'active' THEN RAISE EXCEPTION 'An active Treasury membership is required'; END IF;
    IF challenge_record.reward_destination_policy = 'treasury_required' AND p_requested_destination <> 'treasury' THEN
      RAISE EXCEPTION 'This individual production challenge must go to the Treasury';
    END IF;
    IF challenge_record.reward_destination_policy = 'individual_only' AND p_requested_destination <> 'individual' THEN
      RAISE EXCEPTION 'This challenge permits individual reward only';
    END IF;
  END IF;

  INSERT INTO public.challenge_acceptance_requests (
    challenge_id, collaborator_id, proposed_due_at, proposed_reward_superstars,
    requested_destination, note
  ) VALUES (
    p_challenge_id, p_collaborator_id, p_proposed_due_at, p_proposed_reward_superstars,
    p_requested_destination, NULLIF(btrim(COALESCE(p_note, '')), '')
  ) RETURNING id INTO request_id;

  INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, after_data)
  VALUES (p_challenge_id, COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), 'opportunity_acceptance_requested',
    jsonb_build_object('request_id', request_id, 'collaborator_id', p_collaborator_id,
      'destination', p_requested_destination, 'proposed_due_at', p_proposed_due_at,
      'proposed_reward_superstars', p_proposed_reward_superstars));
  RETURN request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_opportunity_acceptance(
  p_request_id UUID,
  p_approve BOOLEAN,
  p_due_at TIMESTAMPTZ DEFAULT NULL,
  p_reward_superstars INTEGER DEFAULT NULL,
  p_destination TEXT DEFAULT NULL,
  p_note TEXT DEFAULT NULL,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE request_record public.challenge_acceptance_requests%ROWTYPE; actor TEXT := COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema');
DECLARE final_due_at TIMESTAMPTZ; final_destination TEXT; final_superstars INTEGER;
BEGIN
  IF lower(actor) NOT LIKE '%patrick%' THEN RAISE EXCEPTION 'Only Patrick can review opportunity requests'; END IF;
  SELECT * INTO request_record FROM public.challenge_acceptance_requests WHERE id = p_request_id FOR UPDATE;
  IF request_record.id IS NULL OR request_record.status <> 'pending' THEN RAISE EXCEPTION 'Pending acceptance request not found'; END IF;
  final_due_at := COALESCE(p_due_at, request_record.proposed_due_at);
  final_destination := COALESCE(p_destination, request_record.requested_destination);
  final_superstars := COALESCE(p_reward_superstars, request_record.proposed_reward_superstars);
  UPDATE public.challenge_acceptance_requests SET status = CASE WHEN p_approve THEN 'approved' ELSE 'declined' END,
    decided_at = now(), decided_by = actor, decision_note = NULLIF(btrim(COALESCE(p_note, '')), ''), updated_at = now()
  WHERE id = p_request_id;
  IF p_approve THEN
    UPDATE public.challenges
    SET due_at = final_due_at,
        reward_superstars = CASE WHEN reward_status = 'unpriced' THEN COALESCE(final_superstars, 0) ELSE reward_superstars END,
        reward_status = CASE WHEN reward_status = 'unpriced' THEN 'configured' ELSE reward_status END,
        reward_configured_at = CASE WHEN reward_status = 'unpriced' THEN now() ELSE reward_configured_at END,
        reward_configured_by = CASE WHEN reward_status = 'unpriced' THEN actor ELSE reward_configured_by END,
        status = 'accepted', updated_at = now()
    WHERE id = request_record.challenge_id;
    INSERT INTO public.challenge_participants (challenge_id, collaborator_id, approval_source, reward_destination, operational_status, acceptance_request_id)
    VALUES (request_record.challenge_id, request_record.collaborator_id, 'opportunity_request', final_destination, 'active', request_record.id)
    ON CONFLICT (challenge_id, collaborator_id) DO UPDATE SET
      approval_source = EXCLUDED.approval_source, reward_destination = EXCLUDED.reward_destination,
      operational_status = 'active', acceptance_request_id = EXCLUDED.acceptance_request_id;
  END IF;
  INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, after_data)
  VALUES (request_record.challenge_id, actor, 'opportunity_acceptance_reviewed',
    jsonb_build_object('request_id', p_request_id, 'approved', p_approve, 'destination', final_destination));
END;
$$;

CREATE OR REPLACE FUNCTION public.record_opportunity_individual_reward(
  p_challenge_id UUID,
  p_collaborator_id UUID,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE challenge_record public.challenges%ROWTYPE; rate_record public.star_value_rates%ROWTYPE;
DECLARE profile_kind_value TEXT; gross INTEGER; fraction NUMERIC(5,4); transaction_id UUID;
BEGIN
  SELECT * INTO challenge_record FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF challenge_record.status <> 'won' OR challenge_record.reward_status <> 'configured' THEN
    RAISE EXCEPTION 'Only a validated rewarded challenge can create an individual reward';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.challenge_participants WHERE challenge_id = p_challenge_id AND collaborator_id = p_collaborator_id AND operational_status = 'active' AND reward_destination = 'individual') THEN
    RAISE EXCEPTION 'Active individual challenge participant not found';
  END IF;
  SELECT profile_kind INTO profile_kind_value FROM public.collaborator_reward_profiles WHERE collaborator_id = p_collaborator_id;
  SELECT * INTO rate_record FROM public.current_star_value_rate();
  IF rate_record.id IS NULL THEN RAISE EXCEPTION 'No active star value rate'; END IF;
  gross := COALESCE(challenge_record.reward_stars, 0) + COALESCE(challenge_record.reward_superstars, 0) * 10;
  IF gross <= 0 THEN RETURN NULL; END IF;
  fraction := CASE WHEN profile_kind_value = 'production' THEN 0.25 ELSE 1.00 END;
  INSERT INTO public.individual_reward_transactions (
    collaborator_id, challenge_id, rate_id, gross_stars, frozen_star_value_brl,
    payout_fraction, amount_brl, transaction_type, payment_status, reason,
    created_by, idempotency_key, metadata
  ) VALUES (
    p_collaborator_id, p_challenge_id, rate_record.id, gross, rate_record.star_value_brl,
    fraction, round(gross * rate_record.star_value_brl * fraction, 2), 'credit', 'payable',
    'Recompensa individual por desafio validado', COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'),
    format('individual-reward:%s:%s', p_challenge_id, p_collaborator_id),
    jsonb_build_object('gross_stars', gross, 'profile_kind', profile_kind_value)
  ) ON CONFLICT (idempotency_key) DO NOTHING RETURNING id INTO transaction_id;
  RETURN transaction_id;
END;
$$;

-- Keep the legacy resolution entry point, but route newly approved individual
-- destinations to their own immutable financial ledger. Existing participants
-- with no destination retain the historical Treasury behavior.
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
  SELECT * INTO challenge_record FROM public.challenges WHERE id = p_challenge_id;
  IF challenge_record.status NOT IN ('won', 'lost') THEN RETURN; END IF;
  transaction_amount := CASE
    WHEN challenge_record.status = 'won' AND challenge_record.reward_status = 'configured'
      THEN COALESCE(challenge_record.reward_stars, 0) + (COALESCE(challenge_record.reward_superstars, 0) * 10)
    ELSE -COALESCE(challenge_record.penalty_stars, 0)
  END;
  IF transaction_amount = 0 THEN RETURN; END IF;
  transaction_kind := CASE WHEN challenge_record.status = 'won' THEN 'challenge_reward' ELSE 'challenge_penalty' END;

  FOR participant_record IN
    SELECT collaborator_id, reward_destination, operational_status
    FROM public.challenge_participants
    WHERE challenge_id = p_challenge_id
      AND operational_status IN ('active', 'ended')
  LOOP
    IF challenge_record.status = 'won' AND participant_record.reward_destination = 'individual' THEN
      PERFORM public.record_opportunity_individual_reward(
        challenge_record.id, participant_record.collaborator_id, p_actor_name
      );
    ELSIF participant_record.reward_destination IS DISTINCT FROM 'individual' THEN
      PERFORM public.insert_star_transaction(
        participant_record.collaborator_id, transaction_amount, transaction_kind, 'challenge', challenge_record.id,
        CASE WHEN challenge_record.status = 'won' THEN 'Recompensa por desafio cumprido' ELSE 'Penalidade por desafio nao cumprido' END,
        format('challenge:%s:%s:%s', challenge_record.id, challenge_record.status, participant_record.collaborator_id),
        jsonb_build_object('reward_stars', challenge_record.reward_stars, 'reward_superstars', challenge_record.reward_superstars, 'penalty_stars', challenge_record.penalty_stars, 'integral_per_participant', TRUE),
        NULL, NULL, p_actor_name
      );
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE VIEW public.opportunity_catalog
WITH (security_invoker = TRUE) AS
SELECT c.id, c.title, c.description, c.success_criteria, c.expected_deliverable,
  c.evidence_requirements, c.kind, c.status, c.due_at, c.reward_stars,
  c.reward_superstars, c.reward_status, c.reward_destination_policy,
  c.client_id AS origin_id, u.name AS origin_name, u.universe_category AS origin_category,
  c.created_at
FROM public.challenges c
LEFT JOIN public.clients u ON u.id = c.client_id
WHERE c.opportunity_visibility = 'opportunity'
  AND c.status IN ('open', 'active', 'accepted', 'in_progress', 'awaiting_validation');

CREATE OR REPLACE VIEW public.individual_reward_balances
WITH (security_invoker = TRUE) AS
SELECT t.collaborator_id, c.name AS collaborator_name, c.color AS collaborator_color, c.photo_url,
  COALESCE(SUM(t.amount_brl) FILTER (WHERE t.payment_status = 'payable'), 0)::NUMERIC(14,2) AS payable_brl,
  COALESCE(SUM(t.amount_brl) FILTER (WHERE t.payment_status = 'paid'), 0)::NUMERIC(14,2) AS paid_brl,
  COUNT(*) FILTER (WHERE t.payment_status = 'payable')::INTEGER AS payable_count
FROM public.collaborators c
LEFT JOIN public.individual_reward_transactions t ON t.collaborator_id = c.id
GROUP BY c.id, c.name, c.color, c.photo_url;

CREATE OR REPLACE VIEW public.treasury_active_balances
WITH (security_invoker = TRUE) AS
SELECT b.*
FROM public.collaborator_star_balances b
JOIN public.treasury_memberships m ON m.collaborator_id = b.collaborator_id AND m.status = 'active'
JOIN public.collaborator_reward_profiles p ON p.collaborator_id = b.collaborator_id AND p.profile_kind = 'production';

CREATE OR REPLACE VIEW public.treasury_active_summary
WITH (security_invoker = TRUE) AS
SELECT COALESCE(SUM(balance), 0)::INTEGER AS collective_balance,
  COALESCE(SUM(credits), 0)::INTEGER AS total_credits,
  COALESCE(SUM(debits), 0)::INTEGER AS total_debits,
  COUNT(*)::INTEGER AS participant_count
FROM public.treasury_active_balances;

GRANT SELECT ON public.opportunity_catalog, public.individual_reward_balances,
  public.treasury_active_balances, public.treasury_active_summary TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.current_star_value_rate() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_treasury_membership(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_treasury_membership(UUID, BOOLEAN, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_opportunity_acceptance(UUID, UUID, TIMESTAMPTZ, TEXT, INTEGER, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_opportunity_acceptance(UUID, BOOLEAN, TIMESTAMPTZ, INTEGER, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_opportunity_individual_reward(UUID, UUID, TEXT) TO anon, authenticated;

COMMIT;
