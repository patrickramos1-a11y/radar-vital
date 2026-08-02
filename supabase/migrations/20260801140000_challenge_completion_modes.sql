BEGIN;

ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS completion_mode TEXT NOT NULL DEFAULT 'guidance';

ALTER TABLE public.challenges
  DROP CONSTRAINT IF EXISTS challenges_completion_mode_check;

ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_completion_mode_check
  CHECK (completion_mode IN ('guidance', 'checklist', 'mixed'));

-- Existing non-draft challenges already used the checkable-conditions flow.
UPDATE public.challenges AS challenge
SET completion_mode = 'checklist'
WHERE challenge.status <> 'draft'
  AND EXISTS (
    SELECT 1 FROM public.challenge_completion_conditions AS condition
    WHERE condition.challenge_id = challenge.id
  );

CREATE OR REPLACE FUNCTION public.set_challenge_completion_mode(
  p_challenge_id UUID,
  p_completion_mode TEXT,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  previous_challenge public.challenges%ROWTYPE;
  updated_challenge public.challenges%ROWTYPE;
BEGIN
  IF p_completion_mode NOT IN ('guidance', 'checklist', 'mixed') THEN
    RAISE EXCEPTION 'Invalid completion mode';
  END IF;

  SELECT * INTO previous_challenge FROM public.challenges WHERE id = p_challenge_id FOR UPDATE;
  IF previous_challenge.id IS NULL THEN RAISE EXCEPTION 'Challenge not found'; END IF;

  UPDATE public.challenges
  SET completion_mode = p_completion_mode, updated_at = now()
  WHERE id = p_challenge_id
  RETURNING * INTO updated_challenge;

  INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, before_data, after_data)
  VALUES (p_challenge_id, COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'),
    'challenge_completion_mode_updated', to_jsonb(previous_challenge), to_jsonb(updated_challenge));
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_challenge_completion_conditions(
  p_challenge_id UUID,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE removed_count INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.challenges WHERE id = p_challenge_id) THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  DELETE FROM public.challenge_completion_conditions WHERE challenge_id = p_challenge_id;
  GET DIAGNOSTICS removed_count = ROW_COUNT;

  INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, after_data)
  VALUES (p_challenge_id, COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'),
    'challenge_conditions_cleared', jsonb_build_object('removed_count', removed_count));
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_challenge_completion_mode(UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clear_challenge_completion_conditions(UUID, TEXT) TO anon, authenticated;

COMMIT;
