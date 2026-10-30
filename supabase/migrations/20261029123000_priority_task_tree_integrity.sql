-- Keep priority deletion and its task tree atomic. The function is intentionally
-- narrow: it deletes only tasks linked to the requested priority or its source.
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS created_by text;

CREATE OR REPLACE FUNCTION public.delete_priority_with_task_tree(p_priority_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_source_task_id uuid;
  v_root_ids uuid[];
  v_deleted_tasks integer := 0;
  v_deleted_priorities integer := 0;
BEGIN
  SELECT source_task_id
  INTO v_source_task_id
  FROM public.priorities
  WHERE id = p_priority_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('priority_deleted', 0, 'task_roots_deleted', 0);
  END IF;

  SELECT COALESCE(array_agg(DISTINCT root_id), ARRAY[]::uuid[])
  INTO v_root_ids
  FROM (
    SELECT v_source_task_id AS root_id
    WHERE v_source_task_id IS NOT NULL
    UNION ALL
    SELECT task.id
    FROM public.tasks AS task
    WHERE task.priority_id = p_priority_id
      AND task.parent_task_id IS NULL
  ) AS roots;

  UPDATE public.priorities
  SET source_task_id = NULL
  WHERE id = p_priority_id;

  IF cardinality(v_root_ids) > 0 THEN
    DELETE FROM public.tasks
    WHERE id = ANY(v_root_ids);
    GET DIAGNOSTICS v_deleted_tasks = ROW_COUNT;
  END IF;

  DELETE FROM public.priorities
  WHERE id = p_priority_id;
  GET DIAGNOSTICS v_deleted_priorities = ROW_COUNT;

  RETURN jsonb_build_object(
    'priority_deleted', v_deleted_priorities,
    'task_roots_deleted', v_deleted_tasks
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_priority_with_task_tree(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_priority_with_task_tree(uuid) TO anon, authenticated;

-- Darley remains part of the operational team. This corrects the stale status
-- that made the collaborator disappear from selectors and Central de Entregas.
UPDATE public.collaborators
SET is_active = true,
    updated_at = now()
WHERE lower(trim(name)) = 'darley'
  AND is_active IS DISTINCT FROM true;

