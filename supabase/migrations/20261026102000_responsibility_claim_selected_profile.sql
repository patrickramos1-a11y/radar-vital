BEGIN;

-- The product selects an operational collaborator profile independently of
-- Supabase Auth. Keep the authenticated ownership check when it is enforced,
-- while allowing the selected active collaborator to be the claim owner.
CREATE OR REPLACE FUNCTION public.master_plan_request_responsibility(
  p_collaborator_id uuid,
  p_responsibility_source_id text
)
RETURNS public.master_plan_responsibility_claims
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  responsibility_payload jsonb;
  unmet_requirement jsonb;
  result public.master_plan_responsibility_claims;
BEGIN
  PERFORM public.master_plan_assert_current_collaborator(p_collaborator_id);

  IF NOT EXISTS (
    SELECT 1 FROM public.collaborators
    WHERE id = p_collaborator_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'active_collaborator_required';
  END IF;

  SELECT payload INTO responsibility_payload
  FROM public.master_plan_responsibility_library
  WHERE source_id = p_responsibility_source_id;
  IF responsibility_payload IS NULL THEN
    RAISE EXCEPTION 'unknown_responsibility';
  END IF;

  SELECT requirement.value INTO unmet_requirement
  FROM jsonb_array_elements(coalesce(responsibility_payload->'requiredCapabilities', '[]'::jsonb)) AS requirement(value)
  WHERE greatest(
    coalesce((
      SELECT max(certification.certified_level)
      FROM public.master_plan_team_certifications AS certification
      WHERE certification.collaborator_id = p_collaborator_id
        AND certification.capability_code = requirement.value->>'capabilityCode'
    ), 0),
    coalesce((
      SELECT max(request.target_level)
      FROM public.master_plan_certification_requests AS request
      WHERE request.collaborator_id = p_collaborator_id
        AND request.capability_code = requirement.value->>'capabilityCode'
        AND request.status = 'approved'
    ), 0)
  ) < (requirement.value->>'minimumLevel')::smallint
  LIMIT 1;

  IF unmet_requirement IS NOT NULL THEN
    RAISE EXCEPTION 'responsibility_prerequisite_not_certified: %', unmet_requirement->>'capabilityCode';
  END IF;

  INSERT INTO public.master_plan_responsibility_claims (
    collaborator_id, responsibility_source_id
  ) VALUES (p_collaborator_id, p_responsibility_source_id)
  RETURNING * INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.master_plan_review_responsibility_claim(
  p_reviewer_id uuid,
  p_claim_id uuid,
  p_decision text,
  p_note text DEFAULT ''
)
RETURNS public.master_plan_responsibility_claims
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result public.master_plan_responsibility_claims;
BEGIN
  PERFORM public.master_plan_assert_current_collaborator(p_reviewer_id);

  IF NOT EXISTS (
    SELECT 1 FROM public.collaborators
    WHERE id = p_reviewer_id
      AND is_active = true
      AND lower(name) LIKE 'patrick%'
  ) THEN
    RAISE EXCEPTION 'admin_profile_required';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid_claim_decision';
  END IF;

  UPDATE public.master_plan_responsibility_claims
  SET status = p_decision,
      decided_at = now(),
      decided_by = p_reviewer_id,
      decision_note = trim(coalesce(p_note, ''))
  WHERE id = p_claim_id
    AND status = 'requested'
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'claim_not_pending';
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.master_plan_request_responsibility(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.master_plan_review_responsibility_claim(uuid, uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.master_plan_request_responsibility(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.master_plan_review_responsibility_claim(uuid, uuid, text, text) TO authenticated;

COMMIT;
