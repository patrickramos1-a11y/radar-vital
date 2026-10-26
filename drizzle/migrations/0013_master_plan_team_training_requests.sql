CREATE TABLE IF NOT EXISTS public.master_plan_team_training_requests (
  collaborator_id uuid NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  capability_code text NOT NULL REFERENCES public.master_plan_capability_library(code) ON DELETE CASCADE,
  target_level smallint NOT NULL CHECK (target_level BETWEEN 1 AND 3),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'started', 'completed', 'cancelled')),
  requested_by uuid NOT NULL REFERENCES public.collaborators(id) ON DELETE RESTRICT,
  requested_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collaborator_id, capability_code)
);

ALTER TABLE public.master_plan_team_training_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS master_plan_team_training_requests_read ON public.master_plan_team_training_requests;
CREATE POLICY master_plan_team_training_requests_read ON public.master_plan_team_training_requests
  FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.master_plan_team_training_requests TO anon, authenticated;

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
BEGIN
  IF NOT public.master_plan_operational_is_admin(p_actor_id) THEN
    RAISE EXCEPTION 'admin_profile_required';
  END IF;

  PERFORM public.master_plan_assert_current_collaborator(p_actor_id);

  IF p_collaborator_id IS NULL
    OR trim(coalesce(p_capability_code, '')) = ''
    OR p_target_level NOT BETWEEN 1 AND 3 THEN
    RAISE EXCEPTION 'invalid_team_training_request';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.collaborators
    WHERE id = p_collaborator_id AND is_active
  ) THEN
    RAISE EXCEPTION 'active_collaborator_required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.master_plan_capability_library
    WHERE code = trim(p_capability_code)
  ) THEN
    RAISE EXCEPTION 'unknown_capability';
  END IF;

  INSERT INTO public.master_plan_team_training_requests (
    collaborator_id,
    capability_code,
    target_level,
    status,
    requested_by,
    requested_at,
    updated_at
  )
  VALUES (
    p_collaborator_id,
    trim(p_capability_code),
    p_target_level,
    'requested',
    p_actor_id,
    now(),
    now()
  )
  ON CONFLICT (collaborator_id, capability_code) DO UPDATE
  SET target_level = EXCLUDED.target_level,
      status = CASE
        WHEN public.master_plan_team_training_requests.status = 'completed' THEN 'completed'
        ELSE 'requested'
      END,
      requested_by = EXCLUDED.requested_by,
      requested_at = now(),
      updated_at = now()
  RETURNING * INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.master_plan_request_team_training(uuid, uuid, text, smallint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.master_plan_request_team_training(uuid, uuid, text, smallint) TO anon, authenticated;
