BEGIN;

CREATE TABLE IF NOT EXISTS public.challenge_completion_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS challenge_completion_conditions_challenge_idx
  ON public.challenge_completion_conditions (challenge_id, sort_order);

ALTER TABLE public.challenge_completion_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY challenge_completion_conditions_read
  ON public.challenge_completion_conditions FOR SELECT TO anon, authenticated USING (TRUE);
GRANT SELECT ON public.challenge_completion_conditions TO anon, authenticated;

-- Preserve every existing textual criterion as the first checkable condition.
INSERT INTO public.challenge_completion_conditions (challenge_id, title, sort_order)
SELECT challenge.id, challenge.success_criteria, 0
FROM public.challenges AS challenge
WHERE NOT EXISTS (
  SELECT 1 FROM public.challenge_completion_conditions AS condition
  WHERE condition.challenge_id = challenge.id
);

CREATE OR REPLACE FUNCTION public.replace_challenge_completion_conditions(
  p_challenge_id UUID,
  p_conditions JSONB,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_conditions JSONB;
  criteria_summary TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.challenges WHERE id = p_challenge_id) THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  SELECT COALESCE(jsonb_agg(item ORDER BY ordinal), '[]'::jsonb)
  INTO normalized_conditions
  FROM jsonb_array_elements(COALESCE(p_conditions, '[]'::jsonb)) WITH ORDINALITY AS source(item, ordinal)
  WHERE length(btrim(COALESCE(item->>'title', ''))) > 0;

  IF jsonb_array_length(normalized_conditions) = 0 THEN
    RAISE EXCEPTION 'At least one completion condition is required';
  END IF;

  SELECT string_agg(btrim(item->>'title'), E'\n' ORDER BY ordinal)
  INTO criteria_summary
  FROM jsonb_array_elements(normalized_conditions) WITH ORDINALITY AS source(item, ordinal);

  DELETE FROM public.challenge_completion_conditions WHERE challenge_id = p_challenge_id;
  INSERT INTO public.challenge_completion_conditions (challenge_id, title, sort_order, is_required)
  SELECT p_challenge_id, btrim(item->>'title'), ordinal - 1, COALESCE((item->>'is_required')::BOOLEAN, TRUE)
  FROM jsonb_array_elements(normalized_conditions) WITH ORDINALITY AS source(item, ordinal);

  UPDATE public.challenges
  SET success_criteria = criteria_summary, updated_at = now()
  WHERE id = p_challenge_id;

  INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, after_data)
  VALUES (p_challenge_id, COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'), 'challenge_conditions_replaced', normalized_conditions);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_challenge_completion_condition(
  p_condition_id UUID,
  p_completed BOOLEAN,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  condition_record public.challenge_completion_conditions%ROWTYPE;
BEGIN
  SELECT * INTO condition_record
  FROM public.challenge_completion_conditions
  WHERE id = p_condition_id FOR UPDATE;
  IF condition_record.id IS NULL THEN RAISE EXCEPTION 'Condition not found'; END IF;

  UPDATE public.challenge_completion_conditions
  SET completed_at = CASE WHEN p_completed THEN now() ELSE NULL END,
      completed_by = CASE WHEN p_completed THEN COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema') ELSE NULL END,
      updated_at = now()
  WHERE id = p_condition_id;

  INSERT INTO public.challenge_events (challenge_id, actor_user_id, action_type, after_data)
  VALUES (
    condition_record.challenge_id,
    COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'),
    CASE WHEN p_completed THEN 'challenge_condition_completed' ELSE 'challenge_condition_reopened' END,
    jsonb_build_object('condition_id', condition_record.id, 'title', condition_record.title)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.replace_challenge_completion_conditions(UUID, JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_challenge_completion_condition(UUID, BOOLEAN, TEXT) TO anon, authenticated;

COMMIT;
