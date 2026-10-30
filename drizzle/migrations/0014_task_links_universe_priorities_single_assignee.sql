alter table public.tasks
  add column if not exists external_url text;

alter table public.priorities
  add column if not exists universe_item_id text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_single_assignee_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_single_assignee_check
      check (coalesce(cardinality(assigned_to), 0) <= 1);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'priorities_single_assignee_check'
      and conrelid = 'public.priorities'::regclass
  ) then
    alter table public.priorities
      add constraint priorities_single_assignee_check
      check (coalesce(cardinality(assigned_to), 0) <= 1);
  end if;

  if to_regclass('public.master_plan_manual_items') is not null
    and not exists (
      select 1
      from pg_constraint
      where conname = 'priorities_universe_item_id_fkey'
        and conrelid = 'public.priorities'::regclass
    ) then
    alter table public.priorities
      add constraint priorities_universe_item_id_fkey
      foreign key (universe_item_id)
      references public.master_plan_manual_items(id)
      on delete set null;
  end if;
end
$$;

create index if not exists priorities_universe_item_id_idx
  on public.priorities (universe_item_id)
  where universe_item_id is not null;

comment on column public.tasks.external_url is
  'Link externo opcional da tarefa ou subtarefa.';

comment on column public.priorities.universe_item_id is
  'Item opcional do catálogo manual do Universo Ramos vinculado à prioridade.';