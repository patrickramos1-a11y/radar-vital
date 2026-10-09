CREATE OR REPLACE FUNCTION public.update_audit_client_item_v2(
  p_item_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL,
  p_assignee_id UUID DEFAULT NULL,
  p_actor_name TEXT DEFAULT 'Sistema'
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
  IF p_status NOT IN (
    'pending',
    'in_progress',
    'completed',
    'validated'
  ) THEN
    RAISE EXCEPTION 'Invalid audit client status';
  END IF;

  SELECT *
  INTO previous_item
  FROM public.audit_client_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF previous_item.id IS NULL THEN
    RAISE EXCEPTION 'Audit client item not found';
  END IF;

  IF p_assignee_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.collaborators
    WHERE id = p_assignee_id
      AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Active collaborator not found';
  END IF;

  UPDATE public.audit_client_items
  SET
    status = p_status,
    notes = NULLIF(btrim(COALESCE(p_notes, '')), ''),
    assignee_id = p_assignee_id,
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
      WHEN p_status = 'validated'
        THEN COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema')
      ELSE NULL
    END
  WHERE id = p_item_id
  RETURNING *
  INTO updated_item;

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
    COALESCE(NULLIF(btrim(p_actor_name), ''), 'Sistema'),
    'audit_client_item_updated',
    to_jsonb(previous_item),
    to_jsonb(updated_item)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_audit_client_item_v2(
  UUID,
  TEXT,
  TEXT,
  UUID,
  TEXT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.update_audit_client_item_v2(
  UUID,
  TEXT,
  TEXT,
  UUID,
  TEXT
) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';