BEGIN;

-- A reward of zero is not the same as a reward that has not been defined yet.
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS reward_stars INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_status TEXT NOT NULL DEFAULT 'unpriced',
  ADD COLUMN IF NOT EXISTS reward_configured_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reward_configured_by TEXT;

ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS challenges_reward_status_check;
ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_reward_status_check CHECK (reward_status IN (
    'unpriced', 'requested', 'configured', 'non_rewarded'
  ));

UPDATE public.challenges
SET reward_status = CASE
  WHEN COALESCE(reward_stars, 0) > 0
    OR COALESCE(reward_superstars, 0) > 0
    OR COALESCE(penalty_stars, 0) > 0 THEN 'configured'
  ELSE 'unpriced'
END
WHERE reward_status IS NULL OR reward_status = 'unpriced';

CREATE OR REPLACE FUNCTION public.set_initial_challenge_reward_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.reward_status = 'unpriced'
    AND (COALESCE(NEW.reward_stars, 0) > 0 OR COALESCE(NEW.reward_superstars, 0) > 0 OR COALESCE(NEW.penalty_stars, 0) > 0) THEN
    NEW.reward_status := 'configured';
    NEW.reward_configured_at := COALESCE(NEW.reward_configured_at, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS challenges_set_initial_reward_status ON public.challenges;
CREATE TRIGGER challenges_set_initial_reward_status
  BEFORE INSERT ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.set_initial_challenge_reward_status();

CREATE TABLE IF NOT EXISTS public.challenge_value_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE RESTRICT,
  justification TEXT NOT NULL CHECK (length(btrim(justification)) > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'declined')),
  admin_note TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS challenge_value_requests_one_pending_per_person
  ON public.challenge_value_requests (challenge_id, collaborator_id)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS challenge_value_requests_queue_idx
  ON public.challenge_value_requests (status, requested_at DESC);

ALTER TABLE public.challenge_value_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY challenge_value_requests_read
  ON public.challenge_value_requests FOR SELECT TO anon, authenticated USING (TRUE);
GRANT SELECT ON public.challenge_value_requests TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.request_challenge_value(
  p_challenge_id UUID,
  p_collaborator_id UUID,
  p_justification TEXT,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id UUID;
  challenge_record public.challenges%ROWTYPE;
BEGIN
  SELECT * INTO challenge_record FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF challenge_record.id IS NULL THEN RAISE EXCEPTION 'Challenge not found'; END IF;
  IF challenge_record.reward_status NOT IN ('unpriced', 'requested') THEN
    RAISE EXCEPTION 'This challenge already has a reward decision';
  END IF;
  IF challenge_record.status IN ('won', 'lost', 'cancelled') THEN
    RAISE EXCEPTION 'This challenge is no longer available';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.collaborators WHERE id = p_collaborator_id AND is_active = TRUE) THEN
    RAISE EXCEPTION 'Active collaborator not found';
  END IF;
  IF length(btrim(COALESCE(p_justification, ''))) = 0 THEN
    RAISE EXCEPTION 'A justification is required';
  END IF;

  INSERT INTO public.challenge_value_requests (challenge_id, collaborator_id, justification)
  VALUES (p_challenge_id, p_collaborator_id, btrim(p_justification))
  RETURNING id INTO request_id;

  UPDATE public.challenges
  SET reward_status = 'requested', updated_at = now()
  WHERE id = p_challenge_id;

  INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, after_data)
  VALUES (p_challenge_id, COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'),
    'challenge_value_requested',
    jsonb_build_object('request_id', request_id, 'collaborator_id', p_collaborator_id));

  RETURN request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.configure_challenge_reward(
  p_challenge_ids UUID[],
  p_reward_stars INTEGER DEFAULT 0,
  p_reward_superstars INTEGER DEFAULT 0,
  p_penalty_stars INTEGER DEFAULT 0,
  p_reward_status TEXT DEFAULT 'configured',
  p_note TEXT DEFAULT NULL,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed_count INTEGER := 0;
  challenge_record RECORD;
BEGIN
  IF COALESCE(array_length(p_challenge_ids, 1), 0) = 0 THEN RAISE EXCEPTION 'Select at least one challenge'; END IF;
  IF p_reward_status NOT IN ('configured', 'non_rewarded') THEN RAISE EXCEPTION 'Invalid reward status'; END IF;
  IF COALESCE(p_reward_stars, 0) < 0 OR COALESCE(p_reward_superstars, 0) < 0 OR COALESCE(p_penalty_stars, 0) < 0 THEN
    RAISE EXCEPTION 'Rewards and penalties cannot be negative';
  END IF;

  FOR challenge_record IN
    UPDATE public.challenges
    SET reward_stars = CASE WHEN p_reward_status = 'non_rewarded' THEN 0 ELSE COALESCE(p_reward_stars, 0) END,
        reward_superstars = CASE WHEN p_reward_status = 'non_rewarded' THEN 0 ELSE COALESCE(p_reward_superstars, 0) END,
        penalty_stars = CASE WHEN p_reward_status = 'non_rewarded' THEN 0 ELSE COALESCE(p_penalty_stars, 0) END,
        reward_status = p_reward_status,
        reward_configured_at = now(),
        reward_configured_by = COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'),
        updated_at = now()
    WHERE id = ANY(p_challenge_ids)
    RETURNING id
  LOOP
    changed_count := changed_count + 1;
    UPDATE public.challenge_value_requests
    SET status = 'reviewed', reviewed_at = now(), reviewed_by = COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), admin_note = NULLIF(btrim(COALESCE(p_note, '')), '')
    WHERE challenge_id = challenge_record.id AND status = 'pending';
    INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, after_data)
    VALUES (challenge_record.id, COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), 'challenge_reward_configured',
      jsonb_build_object('reward_stars', p_reward_stars, 'reward_superstars', p_reward_superstars, 'penalty_stars', p_penalty_stars, 'reward_status', p_reward_status));
  END LOOP;

  RETURN changed_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_challenge_value_request(
  p_request_id UUID,
  p_status TEXT,
  p_admin_note TEXT DEFAULT NULL,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE request_record public.challenge_value_requests%ROWTYPE;
BEGIN
  IF p_status NOT IN ('declined', 'reviewed') THEN RAISE EXCEPTION 'Invalid request status'; END IF;
  SELECT * INTO request_record FROM public.challenge_value_requests WHERE id = p_request_id FOR UPDATE;
  IF request_record.id IS NULL THEN RAISE EXCEPTION 'Value request not found'; END IF;
  UPDATE public.challenge_value_requests
  SET status = p_status, reviewed_at = now(), reviewed_by = COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), admin_note = NULLIF(btrim(COALESCE(p_admin_note, '')), '')
  WHERE id = p_request_id;
  IF p_status = 'declined' AND NOT EXISTS (
    SELECT 1 FROM public.challenge_value_requests WHERE challenge_id = request_record.challenge_id AND status = 'pending'
  ) THEN
    UPDATE public.challenges SET reward_status = 'unpriced', updated_at = now() WHERE id = request_record.challenge_id;
  END IF;
  INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, after_data)
  VALUES (request_record.challenge_id, COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), 'challenge_value_request_reviewed', jsonb_build_object('request_id', p_request_id, 'status', p_status));
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
DECLARE challenge_record public.challenges%ROWTYPE; participant_record RECORD; transaction_amount INTEGER; transaction_kind TEXT;
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
  FOR participant_record IN SELECT collaborator_id FROM public.challenge_participants WHERE challenge_id = p_challenge_id LOOP
    PERFORM public.insert_star_transaction(
      participant_record.collaborator_id, transaction_amount, transaction_kind, 'challenge', challenge_record.id,
      CASE WHEN challenge_record.status = 'won' THEN 'Recompensa por desafio cumprido' ELSE 'Penalidade por desafio nao cumprido' END,
      format('challenge:%s:%s:%s', challenge_record.id, challenge_record.status, participant_record.collaborator_id),
      jsonb_build_object('reward_stars', challenge_record.reward_stars, 'reward_superstars', challenge_record.reward_superstars, 'penalty_stars', challenge_record.penalty_stars, 'integral_per_participant', TRUE),
      NULL, NULL, p_actor_name);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_challenge_value(UUID, UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.configure_challenge_reward(UUID[], INTEGER, INTEGER, INTEGER, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_challenge_value_request(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;

COMMIT;
