-- The published Radar Vital model selects a collaborator operationally and
-- does not require a Supabase Auth session. This keeps the Master Plan
-- journey consistent with that model. It is not an identity boundary.

UPDATE public.collaborators
SET role = CASE
  WHEN lower(trim(name)) LIKE 'patrick%' THEN 'admin'
  ELSE 'colaborador'
END;

CREATE OR REPLACE FUNCTION public.master_plan_operational_is_admin(
  p_collaborator_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.collaborators
    WHERE id = p_collaborator_id
      AND is_active = true
      AND lower(trim(name)) LIKE 'patrick%'
  );
$$;

CREATE OR REPLACE FUNCTION public.master_plan_assert_current_collaborator(
  p_collaborator_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.collaborators
    WHERE id = p_collaborator_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'active_collaborator_required';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.master_plan_review_certification_request(
  p_reviewer_id uuid,
  p_id uuid,
  p_reviews jsonb,
  p_decision text
)
RETURNS public.master_plan_certification_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_request public.master_plan_certification_requests;
  required_criteria jsonb;
  previous_level integer;
  criterion jsonb;
  result public.master_plan_certification_requests;
BEGIN
  IF NOT public.master_plan_operational_is_admin(p_reviewer_id) THEN
    RAISE EXCEPTION 'admin_profile_required';
  END IF;
  PERFORM public.master_plan_assert_current_collaborator(p_reviewer_id);
  IF p_decision NOT IN ('approved', 'changes_requested')
    OR p_reviews IS NULL
    OR jsonb_typeof(p_reviews) <> 'object'
    OR octet_length(p_reviews::text) > 200000 THEN
    RAISE EXCEPTION 'invalid_review';
  END IF;

  SELECT * INTO current_request
  FROM public.master_plan_certification_requests
  WHERE id = p_id
  FOR UPDATE;
  IF NOT FOUND OR current_request.status <> 'submitted' THEN
    RAISE EXCEPTION 'request_not_reviewable';
  END IF;

  SELECT criteria INTO required_criteria
  FROM public.master_plan_capability_library
  WHERE code = current_request.capability_code;
  SELECT coalesce(max(target_level), 0) INTO previous_level
  FROM public.master_plan_certification_requests
  WHERE collaborator_id = current_request.collaborator_id
    AND capability_code = current_request.capability_code
    AND status = 'approved'
    AND id <> p_id;
  IF current_request.target_level <= previous_level THEN
    RAISE EXCEPTION 'level_already_approved';
  END IF;

  IF p_decision = 'approved' THEN
    FOR criterion IN
      SELECT value FROM jsonb_array_elements(required_criteria)
      WHERE (value->>'level')::integer <= current_request.target_level
        AND (previous_level = 0 OR (value->>'level')::integer > previous_level)
    LOOP
      IF p_reviews->(criterion->>'id')->>'decision' IS DISTINCT FROM 'accepted' THEN
        RAISE EXCEPTION 'criterion_not_accepted: %', criterion->>'id';
      END IF;
    END LOOP;
  ELSIF NOT EXISTS (
    SELECT 1
    FROM jsonb_each(p_reviews)
    WHERE value->>'decision' = 'changes_requested'
      AND length(trim(coalesce(value->>'note', ''))) > 0
  ) THEN
    RAISE EXCEPTION 'review_note_required';
  END IF;

  UPDATE public.master_plan_certification_requests
  SET reviews = p_reviews,
      status = p_decision,
      decided_at = now(),
      reviewed_by = p_reviewer_id,
      updated_at = now()
  WHERE id = p_id
  RETURNING * INTO result;

  INSERT INTO public.master_plan_journey_events (
    request_id, actor_collaborator_id, event_type, payload
  ) VALUES (
    p_id,
    p_reviewer_id,
    p_decision,
    jsonb_build_object('reviews', p_reviews)
  );
  RETURN result;
END;
$$;

DROP POLICY IF EXISTS master_plan_capability_library_read ON public.master_plan_capability_library;
CREATE POLICY master_plan_capability_library_read ON public.master_plan_capability_library
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS master_plan_responsibility_library_read ON public.master_plan_responsibility_library;
CREATE POLICY master_plan_responsibility_library_read ON public.master_plan_responsibility_library
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS master_plan_library_metadata_read ON public.master_plan_library_metadata;
CREATE POLICY master_plan_library_metadata_read ON public.master_plan_library_metadata
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS master_plan_self_assessments_read ON public.master_plan_self_assessments;
CREATE POLICY master_plan_self_assessments_read ON public.master_plan_self_assessments
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS master_plan_certification_requests_read ON public.master_plan_certification_requests;
CREATE POLICY master_plan_certification_requests_read ON public.master_plan_certification_requests
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS master_plan_journey_events_read ON public.master_plan_journey_events;
CREATE POLICY master_plan_journey_events_read ON public.master_plan_journey_events
  FOR SELECT TO anon, authenticated USING (true);

GRANT SELECT ON public.master_plan_capability_library,
  public.master_plan_responsibility_library,
  public.master_plan_library_metadata,
  public.master_plan_self_assessments,
  public.master_plan_certification_requests,
  public.master_plan_journey_events TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.master_plan_record_self_assessment(uuid, text, smallint[], text),
  public.master_plan_save_certification_request(uuid, uuid, text, smallint, jsonb, boolean),
  public.master_plan_review_certification_request(uuid, uuid, jsonb, text)
  TO anon, authenticated;

REVOKE ALL ON FUNCTION public.master_plan_operational_is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.master_plan_operational_is_admin(uuid) TO anon, authenticated;
