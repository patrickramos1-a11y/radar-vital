BEGIN;

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS challenge_kind TEXT NOT NULL DEFAULT 'company_general',
  ADD COLUMN IF NOT EXISTS expected_deliverable TEXT,
  ADD COLUMN IF NOT EXISTS evidence_requirements TEXT;

ALTER TABLE public.challenges ALTER COLUMN due_at DROP NOT NULL;

ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_status_check;
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_challenge_kind_check;
ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_status_check CHECK (status IN (
    'draft', 'open', 'accepted', 'in_progress', 'active',
    'awaiting_validation', 'won', 'lost', 'cancelled'
  )),
  ADD CONSTRAINT challenges_challenge_kind_check CHECK (challenge_kind IN (
    'sector', 'project', 'company', 'individual_goal', 'company_general'
  ));

CREATE TABLE IF NOT EXISTS public.challenge_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  url TEXT,
  created_by TEXT NOT NULL DEFAULT 'Sistema',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS challenges_internal_lookup_idx
  ON public.challenges (client_id, challenge_kind, status, due_at);
CREATE INDEX IF NOT EXISTS challenge_evidences_challenge_idx
  ON public.challenge_evidences (challenge_id, created_at DESC);

ALTER TABLE public.challenge_evidences ENABLE ROW LEVEL SECURITY;
CREATE POLICY challenge_evidences_current_access_read
  ON public.challenge_evidences FOR SELECT TO anon, authenticated USING (TRUE);
GRANT SELECT ON public.challenge_evidences TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_universe_challenge(
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_success_criteria TEXT DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_challenge_kind TEXT DEFAULT 'company_general',
  p_expected_deliverable TEXT DEFAULT NULL,
  p_evidence_requirements TEXT DEFAULT NULL,
  p_due_at TIMESTAMPTZ DEFAULT NULL,
  p_reward_superstars INTEGER DEFAULT 0,
  p_penalty_stars INTEGER DEFAULT 0,
  p_participant_ids UUID[] DEFAULT ARRAY[]::UUID[],
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_challenge_id UUID; initial_status TEXT;
BEGIN
  IF length(btrim(COALESCE(p_title, ''))) = 0 THEN RAISE EXCEPTION 'Challenge title is required'; END IF;
  IF COALESCE(p_reward_superstars, 0) < 0 OR COALESCE(p_penalty_stars, 0) < 0 THEN RAISE EXCEPTION 'Challenge rewards and penalties cannot be negative'; END IF;
  IF p_challenge_kind NOT IN ('sector', 'project', 'company', 'individual_goal', 'company_general') THEN RAISE EXCEPTION 'Invalid challenge kind'; END IF;
  initial_status := CASE WHEN cardinality(COALESCE(p_participant_ids, ARRAY[]::UUID[])) = 0 THEN 'open' ELSE 'accepted' END;
  INSERT INTO public.challenges (title, description, success_criteria, client_id, challenge_kind, expected_deliverable, evidence_requirements, status, due_at, reward_superstars, penalty_stars, created_by)
  VALUES (btrim(p_title), NULLIF(btrim(COALESCE(p_description, '')), ''), COALESCE(NULLIF(btrim(COALESCE(p_success_criteria, '')), ''), 'Validacao administrativa'), p_client_id, p_challenge_kind, NULLIF(btrim(COALESCE(p_expected_deliverable, '')), ''), NULLIF(btrim(COALESCE(p_evidence_requirements, '')), ''), initial_status, p_due_at, COALESCE(p_reward_superstars, 0), COALESCE(p_penalty_stars, 0), COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'))
  RETURNING id INTO new_challenge_id;
  INSERT INTO public.challenge_participants (challenge_id, collaborator_id)
  SELECT new_challenge_id, participant_id FROM unnest(COALESCE(p_participant_ids, ARRAY[]::UUID[])) AS participant(participant_id)
  ON CONFLICT (challenge_id, collaborator_id) DO NOTHING;
  INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, after_data)
  VALUES (new_challenge_id, COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), 'universe_challenge_created', jsonb_build_object('status', initial_status, 'challenge_kind', p_challenge_kind));
  RETURN new_challenge_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_universe_challenge(TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, INTEGER, INTEGER, UUID[], TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.accept_universe_challenge(
  p_challenge_id UUID,
  p_collaborator_id UUID,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_status TEXT;
BEGIN
  SELECT status INTO current_status FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF current_status IS NULL THEN RAISE EXCEPTION 'Challenge not found'; END IF;
  IF current_status <> 'open' THEN RAISE EXCEPTION 'Only open challenges can be accepted'; END IF;
  INSERT INTO public.challenge_participants (challenge_id, collaborator_id)
  VALUES (p_challenge_id, p_collaborator_id)
  ON CONFLICT (challenge_id, collaborator_id) DO NOTHING;
  UPDATE public.challenges SET status = 'accepted', updated_at = now() WHERE id = p_challenge_id;
  INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, before_data, after_data)
  VALUES (p_challenge_id, COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), 'universe_challenge_accepted', jsonb_build_object('status', 'open'), jsonb_build_object('status', 'accepted', 'collaborator_id', p_collaborator_id));
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_universe_challenge(UUID, UUID, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.resolve_challenge(
  p_challenge_id UUID,
  p_outcome TEXT,
  p_resolution_notes TEXT DEFAULT NULL,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE previous_challenge public.challenges%ROWTYPE; updated_challenge public.challenges%ROWTYPE;
BEGIN
  IF p_outcome NOT IN ('won', 'lost') THEN RAISE EXCEPTION 'Challenge outcome must be won or lost'; END IF;
  SELECT * INTO previous_challenge FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF previous_challenge.id IS NULL THEN RAISE EXCEPTION 'Challenge not found'; END IF;
  IF previous_challenge.status IN ('won', 'lost') THEN
    IF previous_challenge.status = p_outcome THEN PERFORM public.record_challenge_resolution_transactions(p_challenge_id, p_actor_name); RETURN previous_challenge.status; END IF;
    RAISE EXCEPTION 'Challenge has already been resolved';
  END IF;
  IF previous_challenge.status NOT IN ('accepted', 'in_progress', 'active', 'awaiting_validation') THEN RAISE EXCEPTION 'Only accepted or active challenges can be resolved'; END IF;
  UPDATE public.challenges SET status = p_outcome, resolved_by = COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), resolved_at = now(), resolution_notes = NULLIF(btrim(COALESCE(p_resolution_notes, '')), '') WHERE id = p_challenge_id RETURNING * INTO updated_challenge;
  INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, before_data, after_data)
  VALUES (updated_challenge.id, COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), CASE WHEN p_outcome = 'won' THEN 'challenge_won' ELSE 'challenge_lost' END, to_jsonb(previous_challenge), to_jsonb(updated_challenge));
  PERFORM public.record_challenge_resolution_transactions(p_challenge_id, p_actor_name);
  RETURN updated_challenge.status;
END;
$$;
COMMIT;
