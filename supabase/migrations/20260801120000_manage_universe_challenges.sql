BEGIN;

CREATE OR REPLACE FUNCTION public.update_universe_challenge(
  p_challenge_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_success_criteria TEXT DEFAULT NULL,
  p_expected_deliverable TEXT DEFAULT NULL,
  p_evidence_requirements TEXT DEFAULT NULL,
  p_client_id UUID DEFAULT NULL,
  p_challenge_kind TEXT DEFAULT NULL,
  p_due_at TIMESTAMPTZ DEFAULT NULL,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE previous_challenge public.challenges%ROWTYPE; updated_challenge public.challenges%ROWTYPE;
BEGIN
  SELECT * INTO previous_challenge FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF previous_challenge.id IS NULL THEN RAISE EXCEPTION 'Challenge not found'; END IF;
  IF length(btrim(COALESCE(p_title, ''))) = 0 THEN RAISE EXCEPTION 'Title is required'; END IF;
  IF length(btrim(COALESCE(p_success_criteria, ''))) = 0 THEN RAISE EXCEPTION 'Success criteria are required'; END IF;

  UPDATE public.challenges SET
    title = btrim(p_title),
    description = NULLIF(btrim(COALESCE(p_description, '')), ''),
    success_criteria = btrim(p_success_criteria),
    expected_deliverable = NULLIF(btrim(COALESCE(p_expected_deliverable, '')), ''),
    evidence_requirements = NULLIF(btrim(COALESCE(p_evidence_requirements, '')), ''),
    client_id = p_client_id,
    challenge_kind = COALESCE(NULLIF(btrim(COALESCE(p_challenge_kind, '')), ''), previous_challenge.challenge_kind),
    due_at = p_due_at,
    updated_at = now()
  WHERE id = p_challenge_id
  RETURNING * INTO updated_challenge;

  INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, before_data, after_data)
  VALUES (p_challenge_id, COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), 'challenge_updated', to_jsonb(previous_challenge), to_jsonb(updated_challenge));
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_universe_challenges(
  p_challenge_ids UUID[],
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE deleted_count INTEGER := 0; challenge_record public.challenges%ROWTYPE;
BEGIN
  IF COALESCE(array_length(p_challenge_ids, 1), 0) = 0 THEN RAISE EXCEPTION 'Select at least one challenge'; END IF;
  FOR challenge_record IN SELECT * FROM public.challenges WHERE id = ANY(p_challenge_ids) FOR UPDATE LOOP
    INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, before_data)
    VALUES (challenge_record.id, COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), 'challenge_deleted', to_jsonb(challenge_record));
    DELETE FROM public.challenges WHERE id = challenge_record.id;
    deleted_count := deleted_count + 1;
  END LOOP;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_universe_challenge(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TIMESTAMPTZ, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_universe_challenges(UUID[], TEXT) TO anon, authenticated;

COMMIT;
