-- Rastreabilidade e idempotência de tarefas/comentários importados da Ficha de Visita.
alter table public.tasks add column if not exists external_source text;
alter table public.tasks add column if not exists external_source_item_id text;
alter table public.tasks add column if not exists source_visit_id uuid;
alter table public.tasks add column if not exists source_visit_title text;
alter table public.tasks add column if not exists source_visit_date timestamptz;

alter table public.client_comments add column if not exists external_source text;
alter table public.client_comments add column if not exists external_source_item_id text;
alter table public.client_comments add column if not exists source_visit_id uuid;
alter table public.client_comments add column if not exists source_visit_title text;
alter table public.client_comments add column if not exists source_visit_date timestamptz;

create unique index if not exists tasks_visit_import_unique
  on public.tasks (external_source, external_source_item_id)
  where external_source is not null and external_source_item_id is not null;
create unique index if not exists client_comments_visit_import_unique
  on public.client_comments (external_source, external_source_item_id)
  where external_source is not null and external_source_item_id is not null;
