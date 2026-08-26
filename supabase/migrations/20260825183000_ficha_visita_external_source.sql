-- Support idempotent imports from Ficha de Visita.
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS external_source text,
  ADD COLUMN IF NOT EXISTS external_source_item_id text,
  ADD COLUMN IF NOT EXISTS source_visit_id uuid,
  ADD COLUMN IF NOT EXISTS source_visit_title text,
  ADD COLUMN IF NOT EXISTS source_visit_date timestamptz;

ALTER TABLE public.client_comments
  ADD COLUMN IF NOT EXISTS external_source text,
  ADD COLUMN IF NOT EXISTS external_source_item_id text,
  ADD COLUMN IF NOT EXISTS source_visit_id uuid,
  ADD COLUMN IF NOT EXISTS source_visit_title text,
  ADD COLUMN IF NOT EXISTS source_visit_date timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS tasks_external_source_item_unique
  ON public.tasks (external_source, external_source_item_id);

CREATE UNIQUE INDEX IF NOT EXISTS client_comments_external_source_item_unique
  ON public.client_comments (external_source, external_source_item_id);

CREATE INDEX IF NOT EXISTS tasks_source_visit_idx
  ON public.tasks (source_visit_id);

CREATE INDEX IF NOT EXISTS client_comments_source_visit_idx
  ON public.client_comments (source_visit_id);
