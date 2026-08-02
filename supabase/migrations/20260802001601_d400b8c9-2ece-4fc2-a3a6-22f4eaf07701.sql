ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS completion_mode TEXT NOT NULL DEFAULT 'guidance';

ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_completion_mode_check;
ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_completion_mode_check
  CHECK (completion_mode IN ('guidance', 'checklist', 'mixed'));

-- Preserve current behaviour for challenges that already have checklist items.
UPDATE public.challenges c
SET completion_mode = 'checklist'
WHERE completion_mode = 'guidance'
  AND EXISTS (SELECT 1 FROM public.challenge_completion_conditions cc WHERE cc.challenge_id = c.id);

CREATE OR REPLACE FUNCTION public.clear_challenge_completion_conditions(p_challenge_id uuid, p_actor_name text DEFAULT 'Sistema'::text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE removed_count INTEGER := 0; removed_titles JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object('title', title, 'is_required', is_required) ORDER BY sort_order), '[]'::jsonb)
  INTO removed_titles
  FROM public.challenge_completion_conditions
  WHERE challenge_id = p_challenge_id;

  DELETE FROM public.challenge_completion_conditions WHERE challenge_id = p_challenge_id;
  GET DIAGNOSTICS removed_count = ROW_COUNT;

  IF removed_count > 0 THEN
    INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, before_data)
    VALUES (p_challenge_id, COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), 'challenge_checklist_cleared', removed_titles);
  END IF;

  RETURN removed_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_challenge_completion_mode(p_challenge_id uuid, p_completion_mode text, p_actor_name text DEFAULT 'Sistema'::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE previous_mode TEXT;
BEGIN
  IF p_completion_mode NOT IN ('guidance', 'checklist', 'mixed') THEN
    RAISE EXCEPTION 'Invalid completion mode';
  END IF;

  SELECT completion_mode INTO previous_mode FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF previous_mode IS NULL THEN RAISE EXCEPTION 'Challenge not found'; END IF;

  UPDATE public.challenges
  SET completion_mode = p_completion_mode, updated_at = now()
  WHERE id = p_challenge_id;

  IF p_completion_mode = 'guidance' THEN
    PERFORM public.clear_challenge_completion_conditions(p_challenge_id, p_actor_name);
  END IF;

  INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, before_data, after_data)
  VALUES (p_challenge_id, COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), 'challenge_completion_mode_changed',
    jsonb_build_object('completion_mode', previous_mode), jsonb_build_object('completion_mode', p_completion_mode));
END;
$$;

-- create_universe_challenge with completion mode
DROP FUNCTION IF EXISTS public.create_universe_challenge(text, text, text, uuid, text, text, text, timestamptz, integer, integer, uuid[], text);
CREATE OR REPLACE FUNCTION public.create_universe_challenge(
  p_title text,
  p_description text DEFAULT NULL::text,
  p_success_criteria text DEFAULT NULL::text,
  p_client_id uuid DEFAULT NULL::uuid,
  p_challenge_kind text DEFAULT 'company_general'::text,
  p_expected_deliverable text DEFAULT NULL::text,
  p_evidence_requirements text DEFAULT NULL::text,
  p_due_at timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_reward_superstars integer DEFAULT 0,
  p_penalty_stars integer DEFAULT 0,
  p_participant_ids uuid[] DEFAULT ARRAY[]::uuid[],
  p_actor_name text DEFAULT 'Sistema'::text,
  p_completion_mode text DEFAULT 'guidance'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE new_challenge_id UUID; initial_status TEXT;
BEGIN
  IF length(btrim(COALESCE(p_title, ''))) = 0 THEN RAISE EXCEPTION 'Challenge title is required'; END IF;
  IF COALESCE(p_reward_superstars, 0) < 0 OR COALESCE(p_penalty_stars, 0) < 0 THEN RAISE EXCEPTION 'Challenge rewards and penalties cannot be negative'; END IF;
  IF p_challenge_kind NOT IN ('sector', 'project', 'company', 'individual_goal', 'company_general') THEN RAISE EXCEPTION 'Invalid challenge kind'; END IF;
  IF COALESCE(p_completion_mode, 'guidance') NOT IN ('guidance', 'checklist', 'mixed') THEN RAISE EXCEPTION 'Invalid completion mode'; END IF;
  initial_status := CASE WHEN cardinality(COALESCE(p_participant_ids, ARRAY[]::UUID[])) = 0 THEN 'open' ELSE 'accepted' END;
  INSERT INTO public.challenges (title, description, success_criteria, client_id, challenge_kind, expected_deliverable, evidence_requirements, status, due_at, reward_superstars, penalty_stars, created_by, completion_mode)
  VALUES (btrim(p_title), NULLIF(btrim(COALESCE(p_description, '')), ''), COALESCE(NULLIF(btrim(COALESCE(p_success_criteria, '')), ''), 'Validacao administrativa'), p_client_id, p_challenge_kind, NULLIF(btrim(COALESCE(p_expected_deliverable, '')), ''), NULLIF(btrim(COALESCE(p_evidence_requirements, '')), ''), initial_status, p_due_at, COALESCE(p_reward_superstars, 0), COALESCE(p_penalty_stars, 0), COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), COALESCE(p_completion_mode, 'guidance'))
  RETURNING id INTO new_challenge_id;
  INSERT INTO public.challenge_participants (challenge_id, collaborator_id)
  SELECT new_challenge_id, participant_id FROM unnest(COALESCE(p_participant_ids, ARRAY[]::UUID[])) AS participant(participant_id)
  ON CONFLICT (challenge_id, collaborator_id) DO NOTHING;
  INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, after_data)
  VALUES (new_challenge_id, COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), 'universe_challenge_created', jsonb_build_object('status', initial_status, 'challenge_kind', p_challenge_kind, 'completion_mode', COALESCE(p_completion_mode, 'guidance')));
  RETURN new_challenge_id;
END;
$$;

-- import_universe_challenge with completion mode, always draft-safe
DROP FUNCTION IF EXISTS public.import_universe_challenge(text, text, text, text, uuid, text, text, text, timestamptz, integer, integer, uuid[], text, text);
CREATE OR REPLACE FUNCTION public.import_universe_challenge(
  p_import_key text,
  p_title text,
  p_description text DEFAULT NULL::text,
  p_success_criteria text DEFAULT NULL::text,
  p_client_id uuid DEFAULT NULL::uuid,
  p_challenge_kind text DEFAULT 'company_general'::text,
  p_expected_deliverable text DEFAULT NULL::text,
  p_evidence_requirements text DEFAULT NULL::text,
  p_due_at timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_reward_superstars integer DEFAULT 0,
  p_penalty_stars integer DEFAULT 0,
  p_participant_ids uuid[] DEFAULT ARRAY[]::uuid[],
  p_status text DEFAULT 'open'::text,
  p_actor_name text DEFAULT 'Sistema'::text,
  p_completion_mode text DEFAULT 'guidance'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE existing_id UUID; new_id UUID;
BEGIN
  IF length(btrim(COALESCE(p_import_key, ''))) = 0 THEN RAISE EXCEPTION 'Import key is required'; END IF;
  SELECT id INTO existing_id FROM public.challenges WHERE import_key = btrim(p_import_key);
  IF existing_id IS NOT NULL THEN RETURN existing_id; END IF;
  new_id := public.create_universe_challenge(p_title, p_description, p_success_criteria, p_client_id, p_challenge_kind, p_expected_deliverable, p_evidence_requirements, p_due_at, p_reward_superstars, p_penalty_stars, p_participant_ids, p_actor_name, COALESCE(p_completion_mode, 'guidance'));
  UPDATE public.challenges SET import_key = btrim(p_import_key), status = CASE WHEN p_status = 'draft' THEN 'draft' WHEN p_status = 'accepted' AND cardinality(COALESCE(p_participant_ids, ARRAY[]::UUID[])) > 0 THEN 'accepted' ELSE status END WHERE id = new_id;
  RETURN new_id;
END;
$$;

-- update_universe_challenge with completion mode
DROP FUNCTION IF EXISTS public.update_universe_challenge(uuid, text, text, text, text, text, uuid, text, timestamptz, text);
CREATE OR REPLACE FUNCTION public.update_universe_challenge(
  p_challenge_id uuid,
  p_title text,
  p_description text DEFAULT NULL::text,
  p_success_criteria text DEFAULT NULL::text,
  p_expected_deliverable text DEFAULT NULL::text,
  p_evidence_requirements text DEFAULT NULL::text,
  p_client_id uuid DEFAULT NULL::uuid,
  p_challenge_kind text DEFAULT NULL::text,
  p_due_at timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_actor_name text DEFAULT 'Sistema'::text,
  p_completion_mode text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE previous_challenge public.challenges%ROWTYPE; updated_challenge public.challenges%ROWTYPE;
BEGIN
  SELECT * INTO previous_challenge FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF previous_challenge.id IS NULL THEN RAISE EXCEPTION 'Challenge not found'; END IF;
  IF length(btrim(COALESCE(p_title, ''))) = 0 THEN RAISE EXCEPTION 'Challenge title is required'; END IF;
  IF p_challenge_kind IS NOT NULL AND p_challenge_kind NOT IN ('sector', 'project', 'company', 'individual_goal', 'company_general') THEN RAISE EXCEPTION 'Invalid challenge kind'; END IF;
  IF p_completion_mode IS NOT NULL AND p_completion_mode NOT IN ('guidance', 'checklist', 'mixed') THEN RAISE EXCEPTION 'Invalid completion mode'; END IF;

  UPDATE public.challenges
  SET title = btrim(p_title),
      description = NULLIF(btrim(COALESCE(p_description, '')), ''),
      success_criteria = COALESCE(NULLIF(btrim(COALESCE(p_success_criteria, '')), ''), success_criteria),
      expected_deliverable = NULLIF(btrim(COALESCE(p_expected_deliverable, '')), ''),
      evidence_requirements = NULLIF(btrim(COALESCE(p_evidence_requirements, '')), ''),
      client_id = p_client_id,
      challenge_kind = COALESCE(p_challenge_kind, challenge_kind),
      due_at = p_due_at,
      completion_mode = COALESCE(p_completion_mode, completion_mode),
      updated_at = now()
  WHERE id = p_challenge_id
  RETURNING * INTO updated_challenge;

  IF updated_challenge.completion_mode = 'guidance' THEN
    PERFORM public.clear_challenge_completion_conditions(p_challenge_id, p_actor_name);
  END IF;

  INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, before_data, after_data)
  VALUES (p_challenge_id, COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), 'challenge_updated', to_jsonb(previous_challenge), to_jsonb(updated_challenge));
END;
$$;