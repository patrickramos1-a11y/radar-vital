BEGIN;

CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  description TEXT,
  success_criteria TEXT NOT NULL CHECK (length(btrim(success_criteria)) > 0),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft',
      'active',
      'awaiting_validation',
      'won',
      'lost',
      'cancelled'
    )),
  due_at TIMESTAMPTZ NOT NULL,
  reward_superstars INTEGER NOT NULL DEFAULT 0
    CHECK (reward_superstars >= 0),
  penalty_stars INTEGER NOT NULL DEFAULT 0
    CHECK (penalty_stars >= 0),
  created_by TEXT NOT NULL DEFAULT 'Sistema',
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (status IN ('won', 'lost') AND resolved_at IS NOT NULL)
    OR (status NOT IN ('won', 'lost'))
  )
);

CREATE TABLE public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, collaborator_id)
);

CREATE TABLE public.challenge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('task', 'priority', 'deliverable')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, item_type, item_id)
);

CREATE TABLE public.challenge_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  actor_user_id TEXT NOT NULL DEFAULT 'Sistema',
  action_type TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX challenges_status_due_at_idx
  ON public.challenges (status, due_at);
CREATE INDEX challenges_client_id_idx
  ON public.challenges (client_id, created_at DESC);
CREATE INDEX challenge_participants_collaborator_idx
  ON public.challenge_participants (collaborator_id, challenge_id);
CREATE INDEX challenge_items_challenge_idx
  ON public.challenge_items (challenge_id);
CREATE INDEX challenge_events_challenge_created_at_idx
  ON public.challenge_events (challenge_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_challenge_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER challenges_touch_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.touch_challenge_updated_at();

CREATE VIEW public.challenge_summary
WITH (security_invoker = TRUE)
AS
SELECT
  challenge.id AS challenge_id,
  count(DISTINCT participant.id)::INTEGER AS participant_count,
  count(DISTINCT item.id)::INTEGER AS linked_item_count,
  CASE
    WHEN challenge.status = 'active' AND challenge.due_at <= now()
      THEN 'awaiting_validation'
    ELSE challenge.status
  END AS effective_status
FROM public.challenges challenge
LEFT JOIN public.challenge_participants participant
  ON participant.challenge_id = challenge.id
LEFT JOIN public.challenge_items item
  ON item.challenge_id = challenge.id
GROUP BY challenge.id;

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY challenges_current_access_read
  ON public.challenges FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY challenge_participants_current_access_read
  ON public.challenge_participants FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY challenge_items_current_access_read
  ON public.challenge_items FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY challenge_events_current_access_read
  ON public.challenge_events FOR SELECT TO anon, authenticated USING (TRUE);

GRANT SELECT ON public.challenges, public.challenge_participants,
  public.challenge_items, public.challenge_events, public.challenge_summary
  TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_challenge(
  p_title TEXT,
  p_description TEXT,
  p_success_criteria TEXT,
  p_client_id UUID DEFAULT NULL,
  p_due_at TIMESTAMPTZ DEFAULT NULL,
  p_reward_superstars INTEGER DEFAULT 0,
  p_penalty_stars INTEGER DEFAULT 0,
  p_participant_ids UUID[] DEFAULT ARRAY[]::UUID[],
  p_items JSONB DEFAULT '[]'::JSONB,
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_challenge_id UUID;
  participant_count INTEGER;
  expected_participant_count INTEGER;
BEGIN
  IF length(btrim(COALESCE(p_title, ''))) = 0 THEN
    RAISE EXCEPTION 'Challenge title is required';
  END IF;

  IF length(btrim(COALESCE(p_success_criteria, ''))) = 0 THEN
    RAISE EXCEPTION 'Challenge success criteria are required';
  END IF;

  IF p_due_at IS NULL THEN
    RAISE EXCEPTION 'Challenge due date is required';
  END IF;

  IF COALESCE(p_reward_superstars, 0) < 0
     OR COALESCE(p_penalty_stars, 0) < 0 THEN
    RAISE EXCEPTION 'Challenge rewards and penalties cannot be negative';
  END IF;

  SELECT count(DISTINCT participant_id)
  INTO expected_participant_count
  FROM unnest(COALESCE(p_participant_ids, ARRAY[]::UUID[])) AS participant(participant_id);

  IF expected_participant_count = 0 THEN
    RAISE EXCEPTION 'At least one challenge participant is required';
  END IF;

  SELECT count(*) INTO participant_count
  FROM public.collaborators
  WHERE id = ANY(p_participant_ids)
    AND is_active = TRUE;

  IF participant_count <> expected_participant_count THEN
    RAISE EXCEPTION 'Every challenge participant must be an active collaborator';
  END IF;

  INSERT INTO public.challenges (
    title,
    description,
    success_criteria,
    client_id,
    status,
    due_at,
    reward_superstars,
    penalty_stars,
    created_by
  ) VALUES (
    btrim(p_title),
    NULLIF(btrim(COALESCE(p_description, '')), ''),
    btrim(p_success_criteria),
    p_client_id,
    'active',
    p_due_at,
    COALESCE(p_reward_superstars, 0),
    COALESCE(p_penalty_stars, 0),
    COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema')
  )
  RETURNING id INTO new_challenge_id;

  INSERT INTO public.challenge_participants (challenge_id, collaborator_id)
  SELECT new_challenge_id, participant_id
  FROM unnest(COALESCE(p_participant_ids, ARRAY[]::UUID[])) AS participant(participant_id)
  ON CONFLICT (challenge_id, collaborator_id) DO NOTHING;

  INSERT INTO public.challenge_items (challenge_id, item_type, item_id)
  SELECT
    new_challenge_id,
    item.value ->> 'item_type',
    (item.value ->> 'item_id')::UUID
  FROM jsonb_array_elements(COALESCE(p_items, '[]'::JSONB)) item(value)
  WHERE item.value ->> 'item_type' IN ('task', 'priority', 'deliverable')
    AND NULLIF(item.value ->> 'item_id', '') IS NOT NULL
  ON CONFLICT (challenge_id, item_type, item_id) DO NOTHING;

  INSERT INTO public.challenge_events (
    challenge_id,
    actor_user_id,
    action_type,
    after_data
  ) VALUES (
    new_challenge_id,
    COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'),
    'challenge_created',
    jsonb_build_object(
      'participant_count', expected_participant_count,
      'reward_superstars', COALESCE(p_reward_superstars, 0),
      'penalty_stars', COALESCE(p_penalty_stars, 0)
    )
  );

  RETURN new_challenge_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_overdue_challenges(
  p_actor_name TEXT DEFAULT 'Sistema'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed_challenge RECORD;
  changed_count INTEGER := 0;
BEGIN
  FOR changed_challenge IN
    UPDATE public.challenges
    SET status = 'awaiting_validation'
    WHERE status = 'active'
      AND due_at <= now()
    RETURNING *
  LOOP
    INSERT INTO public.challenge_events (
      challenge_id,
      actor_user_id,
      action_type,
      after_data
    ) VALUES (
      changed_challenge.id,
      COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'),
      'challenge_due_for_validation',
      to_jsonb(changed_challenge)
    );
    changed_count := changed_count + 1;
  END LOOP;

  RETURN changed_count;
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

  RETURN updated_challenge.status;
END;
$$;

REVOKE ALL ON FUNCTION public.create_challenge(
  TEXT, TEXT, TEXT, UUID, TIMESTAMPTZ, INTEGER, INTEGER, UUID[], JSONB, TEXT
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_overdue_challenges(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_challenge(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_challenge(
  TEXT, TEXT, TEXT, UUID, TIMESTAMPTZ, INTEGER, INTEGER, UUID[], JSONB, TEXT
) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_overdue_challenges(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_challenge(UUID, TEXT, TEXT, TEXT)
  TO anon, authenticated;

COMMIT;
