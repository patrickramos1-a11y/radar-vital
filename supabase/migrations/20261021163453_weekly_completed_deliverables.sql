-- Deliverables now represent completed work only. Pending legacy deliverables
-- are returned to the priorities workflow, and completed priorities create a
-- single automatic deliverable.

ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_priority_id uuid REFERENCES public.priorities(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'deliverables_source_priority_id_key'
      AND conrelid = 'public.deliverables'::regclass
  ) THEN
    ALTER TABLE public.deliverables
      ADD CONSTRAINT deliverables_source_priority_id_key UNIQUE (source_priority_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_deliverables_completed_at
  ON public.deliverables (completed_at DESC)
  WHERE status = 'concluido';

CREATE INDEX IF NOT EXISTS idx_deliverables_client_id
  ON public.deliverables (client_id);

-- Recover the client from a linked priority or task for legacy deliveries.
UPDATE public.deliverables AS deliverable
SET client_id = (
  SELECT COALESCE(priority.client_id, task.client_id) AS client_id
  FROM public.deliverable_items AS item
  LEFT JOIN public.priorities AS priority
    ON item.item_type = 'priority' AND priority.id = item.item_id
  LEFT JOIN public.tasks AS task
    ON item.item_type = 'task' AND task.id = item.item_id
  WHERE item.deliverable_id = deliverable.id
    AND COALESCE(priority.client_id, task.client_id) IS NOT NULL
  ORDER BY item.created_at
  LIMIT 1
)
WHERE deliverable.client_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.deliverable_items AS item
    LEFT JOIN public.priorities AS priority
      ON item.item_type = 'priority' AND priority.id = item.item_id
    LEFT JOIN public.tasks AS task
      ON item.item_type = 'task' AND task.id = item.item_id
    WHERE item.deliverable_id = deliverable.id
      AND COALESCE(priority.client_id, task.client_id) IS NOT NULL
  );

-- Historic completed rows did not always receive completed_at. Their last
-- recorded update is the closest available date to delivery.
UPDATE public.deliverables
SET completed_at = COALESCE(completed_at, updated_at, created_at)
WHERE status = 'concluido'
  AND completed_at IS NULL;

CREATE OR REPLACE FUNCTION public.ensure_completed_deliverable_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'concluido' AND NEW.completed_at IS NULL THEN
    NEW.completed_at := COALESCE(NEW.updated_at, NEW.created_at, clock_timestamp());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_completed_deliverable_date_trigger
  ON public.deliverables;

CREATE TRIGGER ensure_completed_deliverable_date_trigger
BEFORE INSERT OR UPDATE OF status, completed_at
ON public.deliverables
FOR EACH ROW
EXECUTE FUNCTION public.ensure_completed_deliverable_date();

-- Open/in-progress deliverables return to the priority workflow.
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
  created_at,
  updated_at,
  completed_at
)
SELECT
  deliverable.name,
  deliverable.description,
  deliverable.client_id,
  deliverable.assigned_to,
  deliverable.due_date,
  CASE
    WHEN deliverable.status = 'em_andamento' THEN 'em_andamento'
    ELSE 'aberta'
  END,
  3,
  'entregavel_migrado',
  deliverable.created_by,
  deliverable.created_at,
  deliverable.updated_at,
  NULL
FROM public.deliverables AS deliverable
WHERE deliverable.status IN ('aberto', 'em_andamento');

DELETE FROM public.deliverables
WHERE status IN ('aberto', 'em_andamento');

CREATE OR REPLACE FUNCTION public.sync_completed_priority_deliverable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  target_deliverable_id uuid;
BEGIN
  IF NEW.status = 'concluida' THEN
    -- A legacy completed deliverable linked to this priority already satisfies
    -- the rule and must not be duplicated.
    SELECT deliverable.id
    INTO target_deliverable_id
    FROM public.deliverables AS deliverable
    WHERE deliverable.status = 'concluido'
      AND (
        deliverable.source_priority_id = NEW.id
        OR EXISTS (
          SELECT 1
          FROM public.deliverable_items AS item
          WHERE item.deliverable_id = deliverable.id
            AND item.item_type = 'priority'
            AND item.item_id = NEW.id
        )
      )
    ORDER BY (deliverable.source_priority_id = NEW.id) DESC, deliverable.created_at
    LIMIT 1;

    IF target_deliverable_id IS NULL THEN
      INSERT INTO public.deliverables (
        name,
        description,
        client_id,
        assigned_to,
        due_date,
        status,
        created_by,
        created_at,
        updated_at,
        completed_at,
        source_priority_id
      )
      VALUES (
        NEW.title,
        NEW.description,
        NEW.client_id,
        NEW.assigned_to,
        NEW.due_date,
        'concluido',
        NEW.created_by,
        NEW.created_at,
        NEW.updated_at,
        COALESCE(NEW.completed_at, clock_timestamp()),
        NEW.id
      )
      ON CONFLICT (source_priority_id) DO UPDATE
      SET name = EXCLUDED.name,
          description = EXCLUDED.description,
          client_id = EXCLUDED.client_id,
          assigned_to = EXCLUDED.assigned_to,
          due_date = EXCLUDED.due_date,
          status = 'concluido',
          updated_at = EXCLUDED.updated_at,
          completed_at = EXCLUDED.completed_at
      RETURNING id INTO target_deliverable_id;

      INSERT INTO public.deliverable_items (deliverable_id, item_type, item_id)
      SELECT target_deliverable_id, 'priority', NEW.id
      WHERE NOT EXISTS (
        SELECT 1
        FROM public.deliverable_items
        WHERE deliverable_id = target_deliverable_id
          AND item_type = 'priority'
          AND item_id = NEW.id
      );
    ELSIF EXISTS (
      SELECT 1
      FROM public.deliverables
      WHERE id = target_deliverable_id
        AND source_priority_id = NEW.id
    ) THEN
      UPDATE public.deliverables
      SET name = NEW.title,
          description = NEW.description,
          client_id = NEW.client_id,
          assigned_to = NEW.assigned_to,
          due_date = NEW.due_date,
          status = 'concluido',
          updated_at = NEW.updated_at,
          completed_at = COALESCE(NEW.completed_at, completed_at, clock_timestamp())
      WHERE id = target_deliverable_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'concluida' THEN
    DELETE FROM public.deliverables
    WHERE source_priority_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_completed_priority_deliverable_trigger
  ON public.priorities;

CREATE TRIGGER sync_completed_priority_deliverable_trigger
AFTER INSERT OR UPDATE OF
  status,
  title,
  description,
  client_id,
  assigned_to,
  due_date,
  completed_at
ON public.priorities
FOR EACH ROW
EXECUTE FUNCTION public.sync_completed_priority_deliverable();

-- Backfill completed priorities that are not represented by a legacy
-- completed deliverable. source_priority_id keeps this operation idempotent.
INSERT INTO public.deliverables (
  name,
  description,
  client_id,
  assigned_to,
  due_date,
  status,
  created_by,
  created_at,
  updated_at,
  completed_at,
  source_priority_id
)
SELECT
  priority.title,
  priority.description,
  priority.client_id,
  priority.assigned_to,
  priority.due_date,
  'concluido',
  priority.created_by,
  priority.created_at,
  priority.updated_at,
  COALESCE(priority.completed_at, priority.updated_at, priority.created_at),
  priority.id
FROM public.priorities AS priority
WHERE priority.status = 'concluida'
  AND NOT EXISTS (
    SELECT 1
    FROM public.deliverables AS deliverable
    WHERE deliverable.status = 'concluido'
      AND (
        deliverable.source_priority_id = priority.id
        OR EXISTS (
          SELECT 1
          FROM public.deliverable_items AS item
          WHERE item.deliverable_id = deliverable.id
            AND item.item_type = 'priority'
            AND item.item_id = priority.id
        )
      )
  )
ON CONFLICT (source_priority_id) DO NOTHING;

INSERT INTO public.deliverable_items (deliverable_id, item_type, item_id)
SELECT deliverable.id, 'priority', deliverable.source_priority_id
FROM public.deliverables AS deliverable
WHERE deliverable.source_priority_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.deliverable_items AS item
    WHERE item.deliverable_id = deliverable.id
      AND item.item_type = 'priority'
      AND item.item_id = deliverable.source_priority_id
  );

ALTER TABLE public.deliverables
  ALTER COLUMN status SET DEFAULT 'concluido';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'deliverables_completed_only'
      AND conrelid = 'public.deliverables'::regclass
  ) THEN
    ALTER TABLE public.deliverables
      ADD CONSTRAINT deliverables_completed_only CHECK (status = 'concluido');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'deliverables_completed_date_required'
      AND conrelid = 'public.deliverables'::regclass
  ) THEN
    ALTER TABLE public.deliverables
      ADD CONSTRAINT deliverables_completed_date_required CHECK (completed_at IS NOT NULL);
  END IF;
END
$$;

COMMENT ON COLUMN public.deliverables.completed_at IS
  'Date used to group completed deliveries by week.';

COMMENT ON COLUMN public.deliverables.source_priority_id IS
  'Priority that automatically generated this completed delivery. NULL for manual and legacy deliveries.';
