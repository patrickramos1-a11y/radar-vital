-- Give task urgency and priority weight their own aging clocks. Manual changes
-- restart the relevant clock, while automatic progression advances one level
-- per configured interval instead of recalculating from the original age.

ALTER TABLE public.priorities
ADD COLUMN IF NOT EXISTS weight_changed_at timestamptz;

UPDATE public.priorities
SET weight_changed_at = COALESCE(weight_changed_at, created_at, now())
WHERE weight_changed_at IS NULL;

ALTER TABLE public.priorities
  ALTER COLUMN weight_changed_at SET DEFAULT now(),
  ALTER COLUMN weight_changed_at SET NOT NULL;

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS priority_changed_at timestamptz;

UPDATE public.tasks
SET priority_changed_at = COALESCE(priority_changed_at, created_at, now())
WHERE priority_changed_at IS NULL;

ALTER TABLE public.tasks
  ALTER COLUMN priority_changed_at SET DEFAULT now(),
  ALTER COLUMN priority_changed_at SET NOT NULL;

CREATE OR REPLACE FUNCTION public.stamp_priority_weight_changed_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.weight_changed_at := COALESCE(NEW.weight_changed_at, NEW.created_at, now());
  ELSIF NEW.weight IS DISTINCT FROM OLD.weight THEN
    NEW.weight_changed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stamp_priority_weight_changed_at_trigger ON public.priorities;
CREATE TRIGGER stamp_priority_weight_changed_at_trigger
BEFORE INSERT OR UPDATE OF weight ON public.priorities
FOR EACH ROW EXECUTE FUNCTION public.stamp_priority_weight_changed_at();

CREATE OR REPLACE FUNCTION public.stamp_task_priority_changed_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.priority_changed_at := COALESCE(NEW.priority_changed_at, NEW.created_at, now());
  ELSIF NEW.priority IS DISTINCT FROM OLD.priority THEN
    NEW.priority_changed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stamp_task_priority_changed_at_trigger ON public.tasks;
CREATE TRIGGER stamp_task_priority_changed_at_trigger
BEFORE INSERT OR UPDATE OF priority ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.stamp_task_priority_changed_at();

REVOKE ALL ON FUNCTION public.stamp_priority_weight_changed_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.stamp_task_priority_changed_at() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.reconcile_stale_task_priorities(
  p_actor_name text DEFAULT 'Sistema'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  policy_row public.task_priority_policies%ROWTYPE;
  task_row public.tasks%ROWTYPE;
  priority_row public.priorities%ROWTYPE;
  days_in_level integer;
  elapsed_steps integer;
  target_weight integer;
  promoted_count integer := 0;
  updated_count integer := 0;
BEGIN
  SELECT * INTO policy_row
  FROM public.task_priority_policies
  WHERE id = true;

  IF NOT FOUND OR NOT policy_row.enabled THEN
    RETURN jsonb_build_object('promoted', 0, 'updated', 0, 'enabled', false);
  END IF;

  FOR task_row IN
    SELECT *
    FROM public.tasks
    WHERE completed = false
      AND status <> 'cancelada'
      AND parent_task_id IS NULL
    ORDER BY priority_changed_at ASC
  LOOP
    IF task_row.priority_id IS NULL THEN
      days_in_level := greatest(
        0,
        floor(extract(epoch FROM (now() - task_row.priority_changed_at)) / 86400)::integer
      );

      IF days_in_level < policy_row.promotion_after_days THEN
        CONTINUE;
      END IF;

      INSERT INTO public.priorities (
        title, description, client_id, assigned_to, due_date, status, weight,
        category, created_by, source_task_id
      ) VALUES (
        task_row.title,
        format('Prioridade criada automaticamente porque a tarefa permaneceu %s dias no nível atual.', days_in_level),
        task_row.client_id,
        task_row.assigned_to,
        task_row.due_date,
        'aberta',
        1,
        'auto_task_aging',
        p_actor_name,
        task_row.id
      ) RETURNING * INTO priority_row;

      UPDATE public.tasks
      SET priority_id = priority_row.id
      WHERE id = task_row.id;

      INSERT INTO public.activity_logs (
        user_name, action_type, entity_type, entity_id, entity_name, description, new_value
      ) VALUES (
        p_actor_name,
        'task_auto_promoted',
        'task',
        task_row.id,
        task_row.title,
        format('Tarefa promovida automaticamente após %s dias no nível atual.', days_in_level),
        jsonb_build_object('priority_id', priority_row.id, 'weight', 1, 'days_in_level', days_in_level)::text
      );

      promoted_count := promoted_count + 1;
      CONTINUE;
    END IF;

    SELECT * INTO priority_row
    FROM public.priorities
    WHERE id = task_row.priority_id;

    IF NOT FOUND
      OR priority_row.category IS DISTINCT FROM 'auto_task_aging'
      OR priority_row.status NOT IN ('aberta', 'em_andamento')
      OR priority_row.weight >= policy_row.maximum_weight THEN
      CONTINUE;
    END IF;

    days_in_level := greatest(
      0,
      floor(extract(epoch FROM (now() - priority_row.weight_changed_at)) / 86400)::integer
    );
    elapsed_steps := floor(days_in_level::numeric / policy_row.weight_step_days)::integer;
    target_weight := least(policy_row.maximum_weight, priority_row.weight + elapsed_steps);

    IF target_weight > priority_row.weight THEN
      UPDATE public.priorities
      SET weight = target_weight
      WHERE id = priority_row.id;

      INSERT INTO public.activity_logs (
        user_name, action_type, entity_type, entity_id, entity_name, description, old_value, new_value
      ) VALUES (
        p_actor_name,
        'task_auto_priority_weight_updated',
        'priority',
        priority_row.id,
        priority_row.title,
        format('Peso automático atualizado após %s dias no nível anterior.', days_in_level),
        priority_row.weight::text,
        target_weight::text
      );

      updated_count := updated_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('promoted', promoted_count, 'updated', updated_count, 'enabled', true);
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_stale_task_priorities(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_stale_task_priorities(text) TO anon, authenticated;

-- Finish by priority id so legacy rows with incomplete source-task metadata can
-- still be completed atomically. Descendants are closed deepest-first to keep
-- the existing open-subtask guard satisfied.
CREATE OR REPLACE FUNCTION public.finish_priority_with_task_tree(
  p_priority_id uuid,
  p_finish_children boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  priority_row public.priorities%ROWTYPE;
  root_task_id uuid;
  descendant_id uuid;
  open_count integer := 0;
  completed_tasks integer := 0;
  affected_rows integer := 0;
BEGIN
  SELECT * INTO priority_row
  FROM public.priorities
  WHERE id = p_priority_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prioridade não encontrada.' USING ERRCODE = 'P0002';
  END IF;

  root_task_id := priority_row.source_task_id;

  IF root_task_id IS NULL THEN
    SELECT id INTO root_task_id
    FROM public.tasks
    WHERE priority_id = p_priority_id
      AND parent_task_id IS NULL
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE;
  END IF;

  IF root_task_id IS NOT NULL THEN
    SELECT count(*) INTO open_count
    FROM (
      WITH RECURSIVE descendants AS (
        SELECT id, completed, status
        FROM public.tasks
        WHERE parent_task_id = root_task_id
        UNION ALL
        SELECT task.id, task.completed, task.status
        FROM public.tasks AS task
        JOIN descendants ON task.parent_task_id = descendants.id
      )
      SELECT id FROM descendants
      WHERE NOT completed AND status <> 'cancelada'
    ) AS pending;

    IF open_count > 0 AND NOT p_finish_children THEN
      RAISE EXCEPTION 'Existem % subtarefas abertas.', open_count USING ERRCODE = 'P0001';
    END IF;

    IF p_finish_children THEN
      FOR descendant_id IN
        WITH RECURSIVE descendants AS (
          SELECT id, 1 AS depth
          FROM public.tasks
          WHERE parent_task_id = root_task_id
          UNION ALL
          SELECT task.id, descendants.depth + 1
          FROM public.tasks AS task
          JOIN descendants ON task.parent_task_id = descendants.id
        )
        SELECT id FROM descendants ORDER BY depth DESC
      LOOP
        UPDATE public.tasks
        SET completed = true,
            status = 'concluida',
            completed_at = COALESCE(completed_at, now()),
            scheduled_for = NULL
        WHERE id = descendant_id
          AND NOT completed
          AND status <> 'cancelada';
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        completed_tasks := completed_tasks + affected_rows;
      END LOOP;
    END IF;

    UPDATE public.tasks
    SET completed = true,
        status = 'concluida',
        completed_at = COALESCE(completed_at, now()),
        scheduled_for = NULL
    WHERE id = root_task_id
      AND NOT completed;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    completed_tasks := completed_tasks + affected_rows;
  END IF;

  UPDATE public.priorities
  SET status = 'concluida',
      completed_at = COALESCE(completed_at, now()),
      updated_at = now()
  WHERE id = p_priority_id;

  RETURN jsonb_build_object(
    'priority_id', p_priority_id,
    'root_task_id', root_task_id,
    'completed_tasks', completed_tasks,
    'open_subtasks', open_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.finish_priority_with_task_tree(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finish_priority_with_task_tree(uuid, boolean) TO anon, authenticated;

-- Replace legacy versions of the promotion RPC with the current single-owner
-- contract. Locking the task prevents duplicate priorities on double submit.
CREATE OR REPLACE FUNCTION public.promote_client_task(
  p_task_id uuid,
  p_weight integer DEFAULT 1,
  p_category text DEFAULT NULL,
  p_actor text DEFAULT NULL
)
RETURNS public.priorities
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  task_row public.tasks%ROWTYPE;
  priority_row public.priorities%ROWTYPE;
  normalized_weight integer := greatest(1, least(5, coalesce(p_weight, 1)));
BEGIN
  SELECT * INTO task_row
  FROM public.tasks
  WHERE id = p_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tarefa não encontrada.' USING ERRCODE = 'P0002';
  END IF;

  IF task_row.parent_task_id IS NOT NULL THEN
    RAISE EXCEPTION 'Somente uma tarefa principal pode ser promovida.' USING ERRCODE = 'P0001';
  END IF;

  IF task_row.completed OR task_row.status IN ('concluida', 'cancelada') THEN
    RAISE EXCEPTION 'Uma tarefa concluída ou cancelada não pode ser promovida.' USING ERRCODE = 'P0001';
  END IF;

  IF task_row.priority_id IS NOT NULL THEN
    SELECT * INTO priority_row
    FROM public.priorities
    WHERE id = task_row.priority_id;
    IF FOUND THEN
      RETURN priority_row;
    END IF;
  END IF;

  INSERT INTO public.priorities (
    title,
    description,
    client_id,
    assigned_to,
    due_date,
    status,
    weight,
    category,
    created_by,
    source_task_id
  ) VALUES (
    task_row.title,
    task_row.description,
    task_row.client_id,
    (task_row.assigned_to)[1:1],
    task_row.due_date,
    'aberta',
    normalized_weight,
    nullif(trim(p_category), ''),
    coalesce(nullif(trim(p_actor), ''), task_row.created_by),
    task_row.id
  )
  RETURNING * INTO priority_row;

  UPDATE public.tasks
  SET priority_id = priority_row.id,
      priority = CASE
        WHEN normalized_weight >= 4 THEN 'urgente'
        WHEN normalized_weight = 3 THEN 'alta'
        WHEN normalized_weight = 2 THEN 'normal'
        ELSE 'baixa'
      END
  WHERE id = task_row.id;

  RETURN priority_row;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_client_task(uuid, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_client_task(uuid, integer, text, text) TO anon, authenticated;

-- Delete both sides of the relationship in one transaction. The source task
-- deletion cascades to its subtasks; the second delete covers legacy links in
-- which source_task_id was not populated.
CREATE OR REPLACE FUNCTION public.delete_priority_with_task_tree(p_priority_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_source_task_id uuid;
  deleted_tasks integer := 0;
  deleted_priorities integer := 0;
  affected_rows integer := 0;
BEGIN
  SELECT priority.source_task_id INTO v_source_task_id
  FROM public.priorities
  AS priority
  WHERE id = p_priority_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('priority_deleted', 0, 'tasks_deleted', 0);
  END IF;

  UPDATE public.priorities
  SET source_task_id = NULL
  WHERE id = p_priority_id;

  IF v_source_task_id IS NOT NULL THEN
    DELETE FROM public.tasks WHERE id = v_source_task_id;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    deleted_tasks := deleted_tasks + affected_rows;
  END IF;

  DELETE FROM public.tasks WHERE priority_id = p_priority_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  deleted_tasks := deleted_tasks + affected_rows;

  DELETE FROM public.priorities WHERE id = p_priority_id;
  GET DIAGNOSTICS deleted_priorities = ROW_COUNT;

  RETURN jsonb_build_object(
    'priority_deleted', deleted_priorities,
    'task_roots_deleted', deleted_tasks
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_priority_with_task_tree(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_priority_with_task_tree(uuid) TO anon, authenticated;
