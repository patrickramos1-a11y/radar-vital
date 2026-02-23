ALTER TABLE public.client_comments
  ADD COLUMN is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN archived_by text,
  ADD COLUMN archived_at timestamptz;