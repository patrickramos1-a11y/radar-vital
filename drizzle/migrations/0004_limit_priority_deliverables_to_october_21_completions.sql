-- Deliverables generated from priorities start with completions recorded on
-- 21 October 2026. Historical priorities remain in their own history and are
-- not sent back to the delivery evaluation queue.

CREATE OR REPLACE FUNCTION public.sync_completed_priority_deliverable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  target_deliverable_id uuid;
  should_create_deliverable boolean := false;
BEGIN
  IF NEW.status = 'concluida'
    AND COALESCE(NEW.completed_at, clock_timestamp()) >= TIMESTAMPTZ '2026-10-21 00:00:00-03' THEN
    IF TG_OP = 'INSERT' THEN
      should_create_deliverable := true;
    ELSIF OLD.status IS DISTINCT FROM 'concluida' THEN
      should_create_deliverable := true;
    END IF;

    IF should_create_deliverable THEN
      INSERT INTO public.deliverables (
        name, description, client_id, assigned_to, due_date, status,
        created_by, created_at, updated_at, completed_at, source_priority_id
      )
      VALUES (
        NEW.title, NEW.description, NEW.client_id, NEW.assigned_to,
        NEW.due_date, 'concluido', NEW.created_by, NEW.created_at,
        NEW.updated_at, COALESCE(NEW.completed_at, clock_timestamp()), NEW.id
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
    END IF;
  ELSIF TG_OP = 'UPDATE'
    AND OLD.status = 'concluida'
    AND NEW.status IS DISTINCT FROM 'concluida' THEN
    DELETE FROM public.deliverables
    WHERE source_priority_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;