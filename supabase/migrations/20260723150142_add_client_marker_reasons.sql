alter table public.clients
  add column if not exists priority_reason text,
  add column if not exists bo_reason text;

comment on column public.clients.priority_reason is 'Motivo curto informado ao marcar o cliente como prioridade.';
comment on column public.clients.bo_reason is 'Motivo curto informado ao marcar o cliente como Pode dar BO.';
