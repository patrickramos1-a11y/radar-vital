
ALTER TABLE public.tasks 
ALTER COLUMN assigned_to TYPE text[] 
USING CASE 
  WHEN assigned_to IS NOT NULL THEN ARRAY[assigned_to] 
  ELSE '{}'::text[] 
END;

ALTER TABLE public.tasks ALTER COLUMN assigned_to SET DEFAULT '{}'::text[];
ALTER TABLE public.tasks ALTER COLUMN assigned_to SET NOT NULL;
