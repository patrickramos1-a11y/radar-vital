
-- Remove legacy CHECK constraint blocking dynamic collaborator names
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_check;
