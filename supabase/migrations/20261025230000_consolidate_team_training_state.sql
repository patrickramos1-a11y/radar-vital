BEGIN;

-- A certification is cumulative: an applied higher level cannot be reduced by
-- a stale local plan, and it closes training requests already covered by it.
CREATE OR REPLACE FUNCTION public.master_plan_apply_team_certifications(
  p_actor_id uuid,
  p_updates jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  update_item jsonb;
  target_collaborator_id uuid;
  target_capability_code text;
  requested_level smallint;
  consolidated_level smallint;
  current_level smallint;
BEGIN
  IF NOT public.master_plan_operational_is_admin(p_actor_id) THEN
    RAISE EXCEPTION 'admin_profile_required';
  END IF;

  PERFORM public.master_plan_assert_current_collaborator(p_actor_id);

  IF p_updates IS NULL
    OR jsonb_typeof(p_updates) <> 'array'
    OR jsonb_array_length(p_updates) = 0
    OR jsonb_array_length(p_updates) > 500 THEN
    RAISE EXCEPTION 'invalid_team_certification_updates';
  END IF;

  FOR update_item IN SELECT value FROM jsonb_array_elements(p_updates)
  LOOP
    BEGIN
      target_collaborator_id := (update_item ->> 'collaboratorId')::uuid;
      target_capability_code := trim(update_item ->> 'capabilityCode');
      requested_level := (update_item ->> 'level')::smallint;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'invalid_team_certification_update';
    END;

    IF target_collaborator_id IS NULL
      OR target_capability_code = ''
      OR requested_level NOT BETWEEN 1 AND 3 THEN
      RAISE EXCEPTION 'invalid_team_certification_update';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.collaborators
      WHERE id = target_collaborator_id AND is_active
    ) OR NOT EXISTS (
      SELECT 1 FROM public.master_plan_capability_library
      WHERE code = target_capability_code
    ) THEN
      RAISE EXCEPTION 'invalid_team_certification_target';
    END IF;

    SELECT certified_level
    INTO current_level
    FROM public.master_plan_team_certifications
    WHERE collaborator_id = target_collaborator_id
      AND capability_code = target_capability_code;

    consolidated_level := greatest(coalesce(current_level, 0), requested_level);

    INSERT INTO public.master_plan_team_certifications (
      collaborator_id, capability_code, certified_level, certified_by, certified_at, updated_at
    ) VALUES (
      target_collaborator_id, target_capability_code, consolidated_level, p_actor_id, now(), now()
    )
    ON CONFLICT (collaborator_id, capability_code) DO UPDATE
    SET certified_level = greatest(
          public.master_plan_team_certifications.certified_level,
          EXCLUDED.certified_level
        ),
        certified_by = EXCLUDED.certified_by,
        certified_at = now(),
        updated_at = now();

    UPDATE public.master_plan_team_training_requests
    SET status = 'completed', updated_at = now()
    WHERE collaborator_id = target_collaborator_id
      AND capability_code = target_capability_code
      AND status IN ('requested', 'started')
      AND target_level <= consolidated_level;
  END LOOP;
END;
$$;

-- Training follows the same sequential path shown to the collaborator.
CREATE OR REPLACE FUNCTION public.master_plan_request_team_training(
  p_actor_id uuid,
  p_collaborator_id uuid,
  p_capability_code text,
  p_target_level smallint
)
RETURNS public.master_plan_team_training_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result public.master_plan_team_training_requests;
  current_level smallint;
  target_code text := trim(coalesce(p_capability_code, ''));
BEGIN
  IF NOT public.master_plan_operational_is_admin(p_actor_id) THEN
    RAISE EXCEPTION 'admin_profile_required';
  END IF;

  PERFORM public.master_plan_assert_current_collaborator(p_actor_id);

  IF p_collaborator_id IS NULL
    OR target_code = ''
    OR p_target_level NOT BETWEEN 1 AND 3 THEN
    RAISE EXCEPTION 'invalid_team_training_request';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.collaborators
    WHERE id = p_collaborator_id AND is_active
  ) OR NOT EXISTS (
    SELECT 1 FROM public.master_plan_capability_library
      WHERE code = target_code
  ) THEN
    RAISE EXCEPTION 'invalid_team_training_target';
  END IF;

  SELECT coalesce(certified_level, 0)
  INTO current_level
  FROM public.master_plan_team_certifications AS certification
  WHERE certification.collaborator_id = p_collaborator_id
    AND certification.capability_code = target_code;
  current_level := coalesce(current_level, 0);

  IF p_target_level <= current_level THEN
    RAISE EXCEPTION 'target_level_already_certified';
  END IF;
  IF p_target_level <> current_level + 1 THEN
    RAISE EXCEPTION 'next_training_level_required';
  END IF;

  INSERT INTO public.master_plan_team_training_requests (
    collaborator_id, capability_code, target_level, status, requested_by, requested_at, updated_at
  ) VALUES (
    p_collaborator_id, target_code, p_target_level, 'requested', p_actor_id, now(), now()
  )
  ON CONFLICT (collaborator_id, capability_code) DO UPDATE
  SET target_level = EXCLUDED.target_level,
      status = 'requested',
      requested_by = EXCLUDED.requested_by,
      requested_at = now(),
      updated_at = now()
  RETURNING * INTO result;

  RETURN result;
END;
$$;

-- Clean up requests that were already fulfilled before this rule existed.
UPDATE public.master_plan_team_training_requests AS training
SET status = 'completed', updated_at = now()
FROM public.master_plan_team_certifications AS certification
WHERE certification.collaborator_id = training.collaborator_id
  AND certification.capability_code = training.capability_code
  AND training.status IN ('requested', 'started')
  AND training.target_level <= certification.certified_level;

COMMIT;
