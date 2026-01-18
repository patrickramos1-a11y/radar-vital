-- Add read status columns for each collaborator to track who has read the comment
ALTER TABLE public.client_comments
ADD COLUMN IF NOT EXISTS read_celine BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS read_gabi BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS read_darley BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS read_vanessa BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS read_patrick BOOLEAN NOT NULL DEFAULT false;