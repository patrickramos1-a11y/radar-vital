ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS scheduled_for date;

CREATE INDEX IF NOT EXISTS tasks_scheduled_for_idx
  ON public.tasks(scheduled_for)
  WHERE completed = false AND scheduled_for IS NOT NULL;