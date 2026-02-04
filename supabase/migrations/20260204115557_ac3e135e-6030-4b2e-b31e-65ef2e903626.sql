-- Create a function to delete activity logs older than 90 days
CREATE OR REPLACE FUNCTION public.cleanup_old_activity_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.activity_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Create a trigger function that runs on INSERT to clean old logs
-- This approach cleans up old logs whenever new logs are inserted
CREATE OR REPLACE FUNCTION public.cleanup_activity_logs_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only run cleanup occasionally (roughly every 100 inserts) to avoid overhead
  IF (SELECT COUNT(*) FROM public.activity_logs WHERE created_at < NOW() - INTERVAL '90 days') > 0 THEN
    DELETE FROM public.activity_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_cleanup_old_activity_logs ON public.activity_logs;
CREATE TRIGGER trigger_cleanup_old_activity_logs
AFTER INSERT ON public.activity_logs
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_activity_logs_on_insert();

-- Add an index on created_at for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs (created_at);