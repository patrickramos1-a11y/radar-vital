BEGIN;

CREATE TABLE public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  description TEXT,
  objective TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'closed', 'cancelled')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (due_at IS NULL OR due_at >= starts_at)
);

CREATE TABLE public.audit_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_client_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'validated')),
  assignee_id UUID REFERENCES public.collaborators(id) ON DELETE SET NULL,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (audit_id, client_id)
);

CREATE TABLE public.audit_client_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_client_item_id UUID NOT NULL
    REFERENCES public.audit_client_items(id) ON DELETE CASCADE,
  audit_criterion_id UUID NOT NULL
    REFERENCES public.audit_criteria(id) ON DELETE CASCADE,
  result TEXT NOT NULL DEFAULT 'pending'
    CHECK (result IN ('pending', 'ok', 'not_ok', 'not_applicable')),
  notes TEXT,
  evidence_url TEXT,
  evaluated_at TIMESTAMPTZ,
  evaluated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (audit_client_item_id, audit_criterion_id)
);

CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  audit_client_item_id UUID
    REFERENCES public.audit_client_items(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  action_type TEXT NOT NULL,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audits_status_created_at_idx
  ON public.audits (status, created_at DESC);
CREATE INDEX audit_client_items_audit_status_idx
  ON public.audit_client_items (audit_id, status);
CREATE INDEX audit_client_items_client_idx
  ON public.audit_client_items (client_id, created_at DESC);
CREATE INDEX audit_events_audit_created_at_idx
  ON public.audit_events (audit_id, created_at DESC);

CREATE VIEW public.audit_campaign_summary
WITH (security_invoker = TRUE)
AS
SELECT
  audit.id AS audit_id,
  count(item.id)::INTEGER AS total_clients,
  count(item.id) FILTER (WHERE item.status = 'pending')::INTEGER AS pending,
  count(item.id) FILTER (WHERE item.status = 'in_progress')::INTEGER
    AS in_progress,
  count(item.id) FILTER (WHERE item.status = 'completed')::INTEGER
    AS completed,
  count(item.id) FILTER (WHERE item.status = 'validated')::INTEGER
    AS validated,
  CASE
    WHEN count(item.id) = 0 THEN 0
    ELSE round(
      100.0
      * count(item.id) FILTER (WHERE item.status = 'validated')
      / count(item.id)
    )::INTEGER
  END AS progress
FROM public.audits audit
LEFT JOIN public.audit_client_items item ON item.audit_id = audit.id
GROUP BY audit.id;

CREATE OR REPLACE FUNCTION public.touch_audit_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER audits_touch_updated_at
  BEFORE UPDATE ON public.audits
  FOR EACH ROW EXECUTE FUNCTION public.touch_audit_updated_at();

CREATE TRIGGER audit_client_items_touch_updated_at
  BEFORE UPDATE ON public.audit_client_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_audit_updated_at();

CREATE TRIGGER audit_client_results_touch_updated_at
  BEFORE UPDATE ON public.audit_client_results
  FOR EACH ROW EXECUTE FUNCTION public.touch_audit_updated_at();

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_client_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_client_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY audits_authenticated_read
  ON public.audits FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY audit_criteria_authenticated_read
  ON public.audit_criteria FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY audit_client_items_authenticated_read
  ON public.audit_client_items FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY audit_client_results_authenticated_read
  ON public.audit_client_results FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY audit_events_authenticated_read
  ON public.audit_events FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY audits_admin_manage
  ON public.audits FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY audit_criteria_admin_manage
  ON public.audit_criteria FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY audit_client_items_admin_manage
  ON public.audit_client_items FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY audit_client_results_admin_manage
  ON public.audit_client_results FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

REVOKE ALL ON public.audits FROM anon;
REVOKE ALL ON public.audit_criteria FROM anon;
REVOKE ALL ON public.audit_client_items FROM anon;
REVOKE ALL ON public.audit_client_results FROM anon;
REVOKE ALL ON public.audit_events FROM anon;
REVOKE ALL ON public.audit_campaign_summary FROM anon;

REVOKE INSERT, UPDATE, DELETE ON public.audits FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_criteria FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_client_items FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_client_results FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_events FROM authenticated;

GRANT SELECT ON public.audits TO authenticated;
GRANT SELECT ON public.audit_criteria TO authenticated;
GRANT SELECT ON public.audit_client_items TO authenticated;
GRANT SELECT ON public.audit_client_results TO authenticated;
GRANT SELECT ON public.audit_events TO authenticated;
GRANT SELECT ON public.audit_campaign_summary TO authenticated;

CREATE OR REPLACE FUNCTION public.open_audit(
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_objective TEXT DEFAULT NULL,
  p_starts_at TIMESTAMPTZ DEFAULT now(),
  p_due_at TIMESTAMPTZ DEFAULT NULL,
  p_criteria TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_audit_id UUID;
  criterion_title TEXT;
  snapshot_count INTEGER;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator role required';
  END IF;

  IF length(btrim(COALESCE(p_title, ''))) = 0 THEN
    RAISE EXCEPTION 'Audit title is required';
  END IF;

  IF p_due_at IS NOT NULL AND p_due_at < p_starts_at THEN
    RAISE EXCEPTION 'Audit due date must not precede its start date';
  END IF;

  INSERT INTO public.audits (
    title,
    description,
    objective,
    status,
    starts_at,
    due_at,
    created_by
  )
  VALUES (
    btrim(p_title),
    NULLIF(btrim(COALESCE(p_description, '')), ''),
    NULLIF(btrim(COALESCE(p_objective, '')), ''),
    'active',
    p_starts_at,
    p_due_at,
    auth.uid()
  )
  RETURNING id INTO new_audit_id;

  INSERT INTO public.audit_client_items (audit_id, client_id)
  SELECT new_audit_id, id
  FROM public.clients
  WHERE is_active = TRUE
    AND client_type = 'AC'
  ORDER BY display_order, name;

  GET DIAGNOSTICS snapshot_count = ROW_COUNT;

  FOREACH criterion_title IN ARRAY COALESCE(p_criteria, ARRAY[]::TEXT[])
  LOOP
    IF length(btrim(criterion_title)) > 0 THEN
      INSERT INTO public.audit_criteria (
        audit_id,
        title,
        display_order
      )
      VALUES (
        new_audit_id,
        btrim(criterion_title),
        COALESCE(
          (
            SELECT max(display_order) + 1
            FROM public.audit_criteria
            WHERE audit_id = new_audit_id
          ),
          0
        )
      );
    END IF;
  END LOOP;

  INSERT INTO public.audit_client_results (
    audit_client_item_id,
    audit_criterion_id
  )
  SELECT item.id, criterion.id
  FROM public.audit_client_items item
  CROSS JOIN public.audit_criteria criterion
  WHERE item.audit_id = new_audit_id
    AND criterion.audit_id = new_audit_id;

  INSERT INTO public.audit_events (
    audit_id,
    actor_user_id,
    action_type,
    after_data
  )
  VALUES (
    new_audit_id,
    auth.uid(),
    'audit_opened',
    jsonb_build_object('client_count', snapshot_count)
  );

  RETURN new_audit_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_audit_client_item(
  p_item_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  previous_item public.audit_client_items%ROWTYPE;
  updated_item public.audit_client_items%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator role required';
  END IF;

  IF p_status NOT IN ('pending', 'in_progress', 'completed', 'validated') THEN
    RAISE EXCEPTION 'Invalid audit client status';
  END IF;

  SELECT * INTO previous_item
  FROM public.audit_client_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF previous_item.id IS NULL THEN
    RAISE EXCEPTION 'Audit client item not found';
  END IF;

  UPDATE public.audit_client_items
  SET
    status = p_status,
    notes = NULLIF(btrim(COALESCE(p_notes, '')), ''),
    started_at = CASE
      WHEN p_status = 'pending' THEN NULL
      ELSE COALESCE(started_at, now())
    END,
    completed_at = CASE
      WHEN p_status IN ('completed', 'validated')
        THEN COALESCE(completed_at, now())
      ELSE NULL
    END,
    validated_at = CASE
      WHEN p_status = 'validated' THEN now()
      ELSE NULL
    END,
    validated_by = CASE
      WHEN p_status = 'validated' THEN auth.uid()
      ELSE NULL
    END
  WHERE id = p_item_id
  RETURNING * INTO updated_item;

  INSERT INTO public.audit_events (
    audit_id,
    audit_client_item_id,
    actor_user_id,
    action_type,
    before_data,
    after_data
  )
  VALUES (
    updated_item.audit_id,
    updated_item.id,
    auth.uid(),
    'audit_client_status_changed',
    to_jsonb(previous_item),
    to_jsonb(updated_item)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.close_audit(p_audit_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining_count INTEGER;
  previous_audit public.audits%ROWTYPE;
  updated_audit public.audits%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator role required';
  END IF;

  SELECT * INTO previous_audit
  FROM public.audits
  WHERE id = p_audit_id
  FOR UPDATE;

  IF previous_audit.id IS NULL THEN
    RAISE EXCEPTION 'Audit not found';
  END IF;

  SELECT count(*) INTO remaining_count
  FROM public.audit_client_items
  WHERE audit_id = p_audit_id
    AND status <> 'validated';

  IF remaining_count > 0 THEN
    RAISE EXCEPTION 'All audit clients must be validated before closing';
  END IF;

  UPDATE public.audits
  SET
    status = 'closed',
    closed_at = now(),
    validated_by = auth.uid()
  WHERE id = p_audit_id
  RETURNING * INTO updated_audit;

  INSERT INTO public.audit_events (
    audit_id,
    actor_user_id,
    action_type,
    before_data,
    after_data
  )
  VALUES (
    p_audit_id,
    auth.uid(),
    'audit_closed',
    to_jsonb(previous_audit),
    to_jsonb(updated_audit)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_audit_client_result(
  p_result_id UUID,
  p_result TEXT,
  p_notes TEXT DEFAULT NULL,
  p_evidence_url TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  previous_result public.audit_client_results%ROWTYPE;
  updated_result public.audit_client_results%ROWTYPE;
  parent_item public.audit_client_items%ROWTYPE;
  pending_count INTEGER;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator role required';
  END IF;

  IF p_result NOT IN ('pending', 'ok', 'not_ok', 'not_applicable') THEN
    RAISE EXCEPTION 'Invalid audit criterion result';
  END IF;

  SELECT * INTO previous_result
  FROM public.audit_client_results
  WHERE id = p_result_id
  FOR UPDATE;

  IF previous_result.id IS NULL THEN
    RAISE EXCEPTION 'Audit criterion result not found';
  END IF;

  UPDATE public.audit_client_results
  SET
    result = p_result,
    notes = NULLIF(btrim(COALESCE(p_notes, '')), ''),
    evidence_url = NULLIF(btrim(COALESCE(p_evidence_url, '')), ''),
    evaluated_at = CASE WHEN p_result = 'pending' THEN NULL ELSE now() END,
    evaluated_by = CASE WHEN p_result = 'pending' THEN NULL ELSE auth.uid() END
  WHERE id = p_result_id
  RETURNING * INTO updated_result;

  SELECT item.* INTO parent_item
  FROM public.audit_client_items item
  WHERE item.id = updated_result.audit_client_item_id;

  SELECT count(*) INTO pending_count
  FROM public.audit_client_results
  WHERE audit_client_item_id = parent_item.id
    AND result = 'pending';

  IF pending_count = 0
     AND parent_item.status IN ('pending', 'in_progress') THEN
    UPDATE public.audit_client_items
    SET
      status = 'completed',
      started_at = COALESCE(started_at, now()),
      completed_at = now()
    WHERE id = parent_item.id;
  ELSIF pending_count > 0
        AND parent_item.status = 'completed' THEN
    UPDATE public.audit_client_items
    SET
      status = 'in_progress',
      started_at = COALESCE(started_at, now()),
      completed_at = NULL
    WHERE id = parent_item.id;
  END IF;

  INSERT INTO public.audit_events (
    audit_id,
    audit_client_item_id,
    actor_user_id,
    action_type,
    before_data,
    after_data
  )
  VALUES (
    parent_item.audit_id,
    parent_item.id,
    auth.uid(),
    'audit_criterion_evaluated',
    to_jsonb(previous_result),
    to_jsonb(updated_result)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.open_audit(
  TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT[]
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_audit_client_item(
  UUID, TEXT, TEXT
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.close_audit(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_audit_client_result(
  UUID, TEXT, TEXT, TEXT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.open_audit(
  TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT[]
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_audit_client_item(
  UUID, TEXT, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_audit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_audit_client_result(
  UUID, TEXT, TEXT, TEXT
) TO authenticated;

COMMIT;
