-- Add new check field for additional flag
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS is_checked boolean NOT NULL DEFAULT false;