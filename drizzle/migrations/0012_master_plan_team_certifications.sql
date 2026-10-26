CREATE TABLE IF NOT EXISTS public.master_plan_team_certifications (
  collaborator_id uuid NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  capability_code text NOT NULL REFERENCES public.master_plan_capability_library(code) ON DELETE CASCADE,
  certified_level smallint NOT NULL CHECK (certified_level BETWEEN 1 AND 3),
  certified_by uuid NOT NULL REFERENCES public.collaborators(id) ON DELETE RESTRICT,
  certified_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collaborator_id, capability_code)
);

ALTER TABLE public.master_plan_team_certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS master_plan_team_certifications_read ON public.master_plan_team_certifications;
CREATE POLICY master_plan_team_certifications_read ON public.master_plan_team_certifications
  FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.master_plan_team_certifications TO anon, authenticated;

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
  target_level smallint;
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
      target_level := (update_item ->> 'level')::smallint;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'invalid_team_certification_update';
    END;

    IF target_collaborator_id IS NULL
      OR target_capability_code = ''
      OR target_level NOT BETWEEN 1 AND 3 THEN
      RAISE EXCEPTION 'invalid_team_certification_update';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.collaborators
      WHERE id = target_collaborator_id AND is_active
    ) THEN
      RAISE EXCEPTION 'active_collaborator_required';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.master_plan_capability_library
      WHERE code = target_capability_code
    ) THEN
      RAISE EXCEPTION 'unknown_capability';
    END IF;

    INSERT INTO public.master_plan_team_certifications (
      collaborator_id,
      capability_code,
      certified_level,
      certified_by,
      certified_at,
      updated_at
    )
    VALUES (
      target_collaborator_id,
      target_capability_code,
      target_level,
      p_actor_id,
      now(),
      now()
    )
    ON CONFLICT (collaborator_id, capability_code) DO UPDATE
    SET certified_level = EXCLUDED.certified_level,
        certified_by = EXCLUDED.certified_by,
        certified_at = now(),
        updated_at = now();
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.master_plan_apply_team_certifications(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.master_plan_apply_team_certifications(uuid, jsonb) TO anon, authenticated;
