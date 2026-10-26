BEGIN;

CREATE OR REPLACE FUNCTION public.master_plan_request_responsibility(
  p_responsibility_source_id text
)
RETURNS public.master_plan_responsibility_claims
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor_id uuid;
  responsibility_payload jsonb;
  unmet_requirement jsonb;
  result public.master_plan_responsibility_claims;
BEGIN
  SELECT public.current_collaborator_id() INTO actor_id;
  PERFORM public.master_plan_assert_current_collaborator(actor_id);
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'current_collaborator_required';
  END IF;

  SELECT payload INTO responsibility_payload
  FROM public.master_plan_responsibility_library
  WHERE source_id = p_responsibility_source_id;
  IF responsibility_payload IS NULL THEN
    RAISE EXCEPTION 'unknown_responsibility';
  END IF;

  -- A responsibility is only requestable when every capability reaches the
  -- level declared in its official requirement matrix.
  SELECT requirement.value INTO unmet_requirement
  FROM jsonb_array_elements(coalesce(responsibility_payload->'requiredCapabilities', '[]'::jsonb)) AS requirement(value)
  WHERE greatest(
    coalesce((
      SELECT max(certification.certified_level)
      FROM public.master_plan_team_certifications AS certification
      WHERE certification.collaborator_id = actor_id
        AND certification.capability_code = requirement.value->>'capabilityCode'
    ), 0),
    coalesce((
      SELECT max(request.target_level)
      FROM public.master_plan_certification_requests AS request
      WHERE request.collaborator_id = actor_id
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
  ) VALUES (actor_id, p_responsibility_source_id)
  RETURNING * INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.master_plan_request_responsibility(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.master_plan_request_responsibility(text) TO authenticated;

COMMIT;
