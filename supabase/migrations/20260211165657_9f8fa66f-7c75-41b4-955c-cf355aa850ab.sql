
-- Add new columns to client_comments for SISRAMOS
ALTER TABLE public.client_comments
  ADD COLUMN IF NOT EXISTS comment_type text NOT NULL DEFAULT 'informativo',
  ADD COLUMN IF NOT EXISTS required_readers text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS read_timestamps jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_closed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS closed_by text,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;

-- Add pending_ciencia_count to clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS pending_ciencia_count integer NOT NULL DEFAULT 0;

-- Create function to recalculate pending_ciencia_count
CREATE OR REPLACE FUNCTION public.recalculate_pending_ciencia(p_client_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.client_comments
  WHERE client_id = p_client_id
    AND comment_type = 'ciencia'
    AND is_closed = false
    AND EXISTS (
      SELECT 1 FROM unnest(required_readers) AS r
      WHERE NOT (read_timestamps ? r)
    );

  UPDATE public.clients
  SET pending_ciencia_count = COALESCE(v_count, 0)
  WHERE id = p_client_id;
END;
$$;

-- Create trigger function for auto-updating pending_ciencia_count
CREATE OR REPLACE FUNCTION public.update_pending_ciencia_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.comment_type = 'ciencia' THEN
      PERFORM public.recalculate_pending_ciencia(OLD.client_id);
    END IF;
    RETURN OLD;
  END IF;

  -- For INSERT or UPDATE
  IF NEW.comment_type = 'ciencia' OR (TG_OP = 'UPDATE' AND OLD.comment_type = 'ciencia') THEN
    PERFORM public.recalculate_pending_ciencia(NEW.client_id);
  END IF;

  -- If client_id changed on UPDATE, recalculate old client too
  IF TG_OP = 'UPDATE' AND OLD.client_id IS DISTINCT FROM NEW.client_id AND OLD.comment_type = 'ciencia' THEN
    PERFORM public.recalculate_pending_ciencia(OLD.client_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_update_pending_ciencia ON public.client_comments;
CREATE TRIGGER trg_update_pending_ciencia
AFTER INSERT OR UPDATE OR DELETE ON public.client_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_pending_ciencia_trigger();
