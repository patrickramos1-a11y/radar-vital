CREATE OR REPLACE FUNCTION public.master_plan_deactivate_collaborator(
  p_actor_id uuid,
  p_collaborator_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_actor_id = p_collaborator_id THEN
    RAISE EXCEPTION 'cannot_deactivate_current_administrator';
  END IF;
  IF NOT public.master_plan_operational_is_admin(p_actor_id) THEN
    RAISE EXCEPTION 'admin_profile_required';
  END IF;
  IF public.master_plan_operational_is_admin(p_collaborator_id) THEN
    RAISE EXCEPTION 'cannot_deactivate_administrator_profile';
  END IF;
  PERFORM public.master_plan_assert_current_collaborator(p_collaborator_id);

  DELETE FROM public.master_plan_capability_development_plans
  WHERE collaborator_id = p_collaborator_id;

  UPDATE public.master_plan_responsibility_claims
  SET status = 'cancelled',
      decided_at = now(),
      decided_by = p_actor_id,
      decision_note = 'Perfil desativado; responsabilidade voltou a ficar pendente.'
  WHERE collaborator_id = p_collaborator_id
    AND status IN ('requested', 'approved');

  UPDATE public.collaborators
  SET is_active = false,
      updated_at = now()
  WHERE id = p_collaborator_id
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'active_collaborator_not_found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.master_plan_deactivate_collaborator(uuid, uuid)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.master_plan_deactivate_collaborator(uuid, uuid)
  TO anon, authenticated;
