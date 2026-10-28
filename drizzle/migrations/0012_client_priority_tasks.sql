-- A priority is the client-facing projection of one root task.

ALTER TABLE public.priorities
  ADD COLUMN IF NOT EXISTS source_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS priorities_source_task_unique
  ON public.priorities(source_task_id) WHERE source_task_id IS NOT NULL;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM public.tasks
    WHERE priority_id IS NOT NULL AND parent_task_id IS NULL
    GROUP BY priority_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Uma prioridade está vinculada a mais de uma tarefa principal';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.tasks AS t
    JOIN public.priorities AS p ON p.id = t.priority_id
    WHERE t.parent_task_id IS NULL AND t.client_id IS DISTINCT FROM p.client_id
  ) THEN
    RAISE EXCEPTION 'Há vínculo prioridade-tarefa com clientes divergentes';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.tasks
    WHERE priority_id IS NOT NULL AND parent_task_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Há subtarefa vinculada diretamente a uma prioridade';
  END IF;
END $$;

-- Preserve already promoted tasks; never create a second task for them.
UPDATE public.priorities AS p
SET source_task_id = linked.id
FROM (
  SELECT DISTINCT ON (priority_id) id, priority_id
  FROM public.tasks
  WHERE priority_id IS NOT NULL AND parent_task_id IS NULL
  ORDER BY priority_id, created_at, id
) AS linked
WHERE p.id = linked.priority_id AND p.source_task_id IS NULL;

CREATE OR REPLACE FUNCTION public.ensure_priority_task()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE linked_id uuid;
BEGIN
  IF NEW.client_id IS NULL OR NEW.source_task_id IS NOT NULL
    OR NEW.category = 'auto_task_aging' THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.tasks WHERE priority_id = NEW.id) THEN RETURN NEW; END IF;
  INSERT INTO public.tasks (
    client_id, title, description, assigned_to, due_date, status, completed,
    completed_at, created_at, priority_id, priority
  ) VALUES (
    NEW.client_id, NEW.title, NEW.description, NEW.assigned_to, NEW.due_date,
    CASE WHEN NEW.status = 'concluida' THEN 'concluida'
         WHEN NEW.status = 'em_andamento' THEN 'em_andamento'
         WHEN NEW.status = 'cancelada' THEN 'cancelada' ELSE 'pendente' END,
    NEW.status = 'concluida', NEW.completed_at, NEW.created_at, NEW.id, 'alta'
  ) RETURNING id INTO linked_id;
  UPDATE public.priorities SET source_task_id = linked_id WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_priority_task_trigger ON public.priorities;
CREATE TRIGGER ensure_priority_task_trigger AFTER INSERT OR UPDATE OF client_id ON public.priorities
  FOR EACH ROW EXECUTE FUNCTION public.ensure_priority_task();

-- Aged and manually-created priorities that have no task keep their original age.
INSERT INTO public.tasks (
  client_id, title, description, assigned_to, due_date, status, completed,
  completed_at, created_at, priority_id, priority
)
SELECT p.client_id, p.title, p.description, p.assigned_to, p.due_date,
  CASE WHEN p.status = 'concluida' THEN 'concluida'
       WHEN p.status = 'em_andamento' THEN 'em_andamento'
       WHEN p.status = 'cancelada' THEN 'cancelada' ELSE 'pendente' END,
  p.status = 'concluida', p.completed_at, p.created_at, p.id, 'alta'
FROM public.priorities AS p
WHERE p.client_id IS NOT NULL AND p.source_task_id IS NULL
  AND p.status IN ('aberta', 'em_andamento')
  AND NOT EXISTS (SELECT 1 FROM public.tasks AS t WHERE t.priority_id = p.id);

UPDATE public.priorities AS p SET source_task_id = t.id
FROM public.tasks AS t
WHERE t.priority_id = p.id AND t.parent_task_id IS NULL AND p.source_task_id IS NULL;

-- Completing a root task must not silently leave unfinished descendants.
CREATE OR REPLACE FUNCTION public.guard_open_subtasks()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF (NEW.completed OR NEW.status = 'concluida') AND NOT OLD.completed AND EXISTS (
    WITH RECURSIVE descendants AS (
      SELECT id, completed, status FROM public.tasks WHERE parent_task_id = NEW.id
      UNION ALL
      SELECT t.id, t.completed, t.status FROM public.tasks t
      JOIN descendants d ON t.parent_task_id = d.id
    )
    SELECT 1 FROM descendants WHERE NOT completed AND status <> 'cancelada'
  ) THEN
    RAISE EXCEPTION 'Existem subtarefas abertas. Confirme a conclusão de todas.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_open_subtasks_trigger ON public.tasks;
CREATE TRIGGER guard_open_subtasks_trigger BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.guard_open_subtasks();

CREATE OR REPLACE FUNCTION public.sync_priority_to_task()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF pg_trigger_depth() > 1 OR NEW.source_task_id IS NULL THEN RETURN NEW; END IF;
  UPDATE public.tasks SET
    title = NEW.title, description = NEW.description, client_id = NEW.client_id,
    assigned_to = NEW.assigned_to, due_date = NEW.due_date,
    completed = NEW.status = 'concluida',
    completed_at = CASE WHEN NEW.status = 'concluida' THEN COALESCE(NEW.completed_at, now()) ELSE NULL END,
    status = CASE WHEN NEW.status = 'concluida' THEN 'concluida'
                  WHEN NEW.status = 'cancelada' THEN 'cancelada'
                  WHEN NEW.status = 'em_andamento' THEN 'em_andamento' ELSE 'pendente' END
  WHERE id = NEW.source_task_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_priority_to_task_trigger ON public.priorities;
CREATE TRIGGER sync_priority_to_task_trigger AFTER UPDATE OF title, description, client_id,
  assigned_to, due_date, status, completed_at ON public.priorities
  FOR EACH ROW EXECUTE FUNCTION public.sync_priority_to_task();

CREATE OR REPLACE FUNCTION public.sync_task_to_priority()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF pg_trigger_depth() > 1 OR NEW.priority_id IS NULL OR NEW.parent_task_id IS NOT NULL THEN RETURN NEW; END IF;
  UPDATE public.priorities SET
    source_task_id = COALESCE(source_task_id, NEW.id),
    title = NEW.title, description = NEW.description, client_id = NEW.client_id,
    assigned_to = NEW.assigned_to, due_date = NEW.due_date,
    status = CASE WHEN NEW.completed THEN 'concluida'
                  WHEN NEW.status = 'cancelada' THEN 'cancelada'
                  WHEN NEW.status = 'pendente' THEN 'aberta' ELSE 'em_andamento' END,
    completed_at = CASE WHEN NEW.completed THEN NEW.completed_at ELSE NULL END
  WHERE id = NEW.priority_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_task_to_priority_trigger ON public.tasks;
CREATE TRIGGER sync_task_to_priority_trigger AFTER UPDATE OF priority_id, title, description, client_id,
  assigned_to, due_date, status, completed, completed_at ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.sync_task_to_priority();

-- Removing a root task also removes its priority; removing a priority only demotes its task.
CREATE OR REPLACE FUNCTION public.remove_priority_with_task()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF OLD.parent_task_id IS NULL AND OLD.priority_id IS NOT NULL THEN
    DELETE FROM public.priorities WHERE id = OLD.priority_id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS remove_priority_with_task_trigger ON public.tasks;
CREATE TRIGGER remove_priority_with_task_trigger AFTER DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.remove_priority_with_task();

-- The legacy star is now a projection of open priorities, not a manual flag.
CREATE OR REPLACE FUNCTION public.refresh_client_priority_star(p_client_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF p_client_id IS NULL THEN RETURN; END IF;
  UPDATE public.clients AS c SET is_priority = EXISTS (
    SELECT 1 FROM public.priorities AS p
    WHERE p.client_id = p_client_id AND p.status IN ('aberta', 'em_andamento')
  ) WHERE c.id = p_client_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_client_priority_star()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_client_priority_star(OLD.client_id);
  ELSE
    PERFORM public.refresh_client_priority_star(NEW.client_id);
    IF TG_OP = 'UPDATE' AND OLD.client_id IS DISTINCT FROM NEW.client_id THEN
      PERFORM public.refresh_client_priority_star(OLD.client_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_client_priority_star_trigger ON public.priorities;
CREATE TRIGGER sync_client_priority_star_trigger AFTER INSERT OR UPDATE OF client_id, status OR DELETE
  ON public.priorities FOR EACH ROW EXECUTE FUNCTION public.sync_client_priority_star();

UPDATE public.clients AS c SET is_priority = EXISTS (
  SELECT 1 FROM public.priorities p WHERE p.client_id = c.id AND p.status IN ('aberta', 'em_andamento')
);

-- One transaction promotes an existing task without cloning it.
CREATE OR REPLACE FUNCTION public.promote_client_task(
  p_task_id uuid, p_weight integer, p_category text, p_actor text
)
RETURNS public.priorities LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE source public.tasks%ROWTYPE; created public.priorities%ROWTYPE;
BEGIN
  SELECT * INTO source FROM public.tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND OR source.parent_task_id IS NOT NULL OR source.completed THEN
    RAISE EXCEPTION 'Somente uma tarefa principal aberta pode ser promovida.';
  END IF;
  IF source.priority_id IS NOT NULL THEN
    RAISE EXCEPTION 'Esta tarefa já tem prioridade.';
  END IF;
  INSERT INTO public.priorities (
    title, description, client_id, assigned_to, due_date, status, weight,
    category, created_by, source_task_id
  ) VALUES (
    source.title, source.description, source.client_id, source.assigned_to,
    source.due_date, 'aberta', p_weight, p_category, p_actor, source.id
  ) RETURNING * INTO created;
  UPDATE public.tasks SET priority_id = created.id WHERE id = source.id;
  RETURN created;
END;
$$;

GRANT EXECUTE ON FUNCTION public.promote_client_task(uuid, integer, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.finish_priority_task(p_task_id uuid, p_finish_children boolean)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE source public.tasks%ROWTYPE; open_count integer; descendant_id uuid;
BEGIN
  SELECT * INTO source FROM public.tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Tarefa não encontrada.'; END IF;
  SELECT count(*) INTO open_count FROM (
    WITH RECURSIVE descendants AS (
      SELECT id, completed, status, 1 AS depth FROM public.tasks WHERE parent_task_id = p_task_id
      UNION ALL
      SELECT t.id, t.completed, t.status, d.depth + 1 FROM public.tasks t
      JOIN descendants d ON t.parent_task_id = d.id
    ) SELECT * FROM descendants WHERE NOT completed AND status <> 'cancelada'
  ) AS pending;
  IF open_count > 0 AND NOT p_finish_children THEN
    RAISE EXCEPTION 'Existem % subtarefas abertas.', open_count USING ERRCODE = 'P0001';
  END IF;
  IF p_finish_children THEN
    -- Deepest tasks first so the guard on parent completion remains satisfied.
    FOR descendant_id IN
      WITH RECURSIVE descendants AS (
        SELECT id, 1 AS depth FROM public.tasks WHERE parent_task_id = p_task_id
        UNION ALL
        SELECT t.id, d.depth + 1 FROM public.tasks t
        JOIN descendants d ON t.parent_task_id = d.id
      )
      SELECT id FROM descendants ORDER BY depth DESC
    LOOP
      UPDATE public.tasks SET completed = true, status = 'concluida', completed_at = COALESCE(completed_at, now())
      WHERE id = descendant_id AND NOT completed AND status <> 'cancelada';
    END LOOP;
  END IF;
  UPDATE public.tasks SET completed = true, status = 'concluida', completed_at = COALESCE(completed_at, now())
  WHERE id = p_task_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.finish_priority_task(uuid, boolean) TO anon, authenticated;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM public.priorities
    WHERE client_id IS NOT NULL AND status IN ('aberta', 'em_andamento')
      AND source_task_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Existem prioridades abertas com cliente sem tarefa vinculada';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.priorities AS p
    JOIN public.tasks AS t ON t.id = p.source_task_id
    WHERE t.priority_id IS DISTINCT FROM p.id
  ) THEN
    RAISE EXCEPTION 'Existem vínculos prioridade-tarefa divergentes';
  END IF;
END $$;
