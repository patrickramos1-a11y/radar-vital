CREATE OR REPLACE FUNCTION public.replace_challenge_completion_conditions(p_challenge_id uuid, p_conditions jsonb, p_actor_name text DEFAULT 'Sistema'::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE normalized_conditions JSONB; criteria_summary TEXT; current_mode TEXT;
BEGIN
  SELECT completion_mode INTO current_mode FROM public.challenges WHERE id = p_challenge_id;
  IF current_mode IS NULL THEN RAISE EXCEPTION 'Challenge not found'; END IF;
  SELECT COALESCE(jsonb_agg(item ORDER BY ordinal), '[]'::jsonb) INTO normalized_conditions FROM jsonb_array_elements(COALESCE(p_conditions, '[]'::jsonb)) WITH ORDINALITY AS source(item, ordinal) WHERE length(btrim(COALESCE(item->>'title', ''))) > 0;
  IF jsonb_array_length(normalized_conditions) = 0 THEN RAISE EXCEPTION 'At least one completion condition is required'; END IF;
  SELECT string_agg(btrim(item->>'title'), E'\n' ORDER BY ordinal) INTO criteria_summary FROM jsonb_array_elements(normalized_conditions) WITH ORDINALITY AS source(item, ordinal);
  DELETE FROM public.challenge_completion_conditions WHERE challenge_id = p_challenge_id;
  INSERT INTO public.challenge_completion_conditions (challenge_id, title, sort_order, is_required)
  SELECT p_challenge_id, btrim(item->>'title'), ordinal - 1, COALESCE((item->>'is_required')::BOOLEAN, TRUE) FROM jsonb_array_elements(normalized_conditions) WITH ORDINALITY AS source(item, ordinal);
  -- Guidance text must survive in guidance/mixed challenges.
  UPDATE public.challenges
  SET success_criteria = CASE WHEN current_mode = 'checklist' THEN criteria_summary ELSE success_criteria END,
      updated_at = now()
  WHERE id = p_challenge_id;
  INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, after_data) VALUES (p_challenge_id, COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), 'challenge_conditions_replaced', normalized_conditions);
END; $function$;