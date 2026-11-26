import { useMemo, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, CircleSlash, Flag, Pause, Pencil, Play, Plus, Repeat, Search, Square, X } from '@/components/icones';
import type { Client } from '@/types/client';
import type { Task } from '@/types/task';
import { today as todayIso, weightVisual } from '@/lib/processDisplay';
import { brDate, describeFollowUp, isFollowUpStep, summarizeFollowUp, type FollowUpStatus, type FollowUpSummary, type FollowUpTimelineItem } from '@/lib/recurringFollowUp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { FollowUpModal, type CreateFollowUp } from './FollowUpModal';
import type { RespOption, ToggleTask, UpdateTask } from './processParts';

interface Props {
  tasks: Task[];
  clients: Client[];
  responsibleList: RespOption[];
  currentUser: string;
  onCreateFollowUp: CreateFollowUp;
  onAddSteps: (mother: Task, dates: string[]) => Promise<boolean>;
  onClose: (motherId: string) => Promise<boolean>;
  onToggleTask: ToggleTask;
  onUpdateTask: UpdateTask;
}

interface Row { mother: Task; client: Client | undefined; summary: FollowUpSummary }

const STATUS_BADGE: Record<FollowUpStatus, { label: string; className: string }> = {
  ativo: { label: 'Em dia', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pausado: { label: 'Pausado', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  encerrado: { label: 'Encerrado', className: 'bg-slate-100 text-slate-500 border-slate-200' },
  'para-encerrar': { label: 'Sem próximas datas', className: 'bg-amber-50 text-amber-800 border-amber-200' },
};

const CHIP: Record<FollowUpTimelineItem['state'], { label: string; className: string; icon: typeof Check }> = {
  feita: { label: 'Feita', className: 'border-emerald-300 bg-emerald-50 text-emerald-800', icon: Check },
  atrasada: { label: 'Atrasada', className: 'border-red-300 bg-red-50 text-red-700', icon: AlertTriangle },
  aberta: { label: 'Aberta', className: 'border-sky-300 bg-sky-50 text-sky-800', icon: Square },
  dispensada: { label: 'Dispensada', className: 'border-slate-200 bg-slate-50 text-slate-400 line-through', icon: CircleSlash },
  'nao-conta': { label: 'Não conta', className: 'border-dashed border-slate-300 bg-white text-slate-400', icon: X },
  prevista: { label: 'Prevista', className: 'border-dashed border-sky-300 bg-white text-sky-700', icon: Repeat },
};

function TimelineChip({ item, mother, onAddSteps, onToggleTask, onUpdateTask }: { item: FollowUpTimelineItem; mother: Task } & Pick<Props, 'onAddSteps' | 'onToggleTask' | 'onUpdateTask'>) {
  const [open, setOpen] = useState(false);
  const chip = CHIP[item.state];
  const Icon = chip.icon;
  const run = async (action: () => Promise<boolean>) => { if (await action()) setOpen(false); };
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <button type="button" className={cn('inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs font-medium tabular-nums', chip.className)} aria-label={`${brDate(item.date)}: ${chip.label}`} title={`${brDate(item.date)} · ${chip.label}`}>
        <Icon className="h-3.5 w-3.5" aria-hidden />{brDate(item.date).slice(0, 5)}<span className="hidden text-[10px] opacity-70 sm:inline">/{item.date.slice(2, 4)}</span>
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-60 space-y-1 p-2">
      <p className="px-1 pb-1 text-xs font-semibold">{brDate(item.date)} · {chip.label}</p>
      {item.step && !item.step.completed && item.step.status !== 'cancelada' && <>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => void run(() => onToggleTask(item.step!.id))}><Check className="mr-2 h-4 w-4 text-emerald-600" />Marcar como feita</Button>
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => void run(() => onUpdateTask(item.step!.id, { status: 'cancelada' }))}><CircleSlash className="mr-2 h-4 w-4" />Dispensar (não conta)</Button>
      </>}
      {item.step?.completed && <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => void run(() => onToggleTask(item.step!.id))}><Square className="mr-2 h-4 w-4" />Reabrir</Button>}
      {item.step && item.step.status === 'cancelada' && <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => void run(() => onUpdateTask(item.step!.id, { status: 'pendente' }))}><Repeat className="mr-2 h-4 w-4" />Voltar a contar</Button>}
      {!item.step && item.state === 'nao-conta' && <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => void run(() => onAddSteps(mother, [item.date]))}><Plus className="mr-2 h-4 w-4" />Lançar (entra atrasada)</Button>}
      {!item.step && item.state === 'prevista' && <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => void run(() => onAddSteps(mother, [item.date]))}><Plus className="mr-2 h-4 w-4" />Criar a etapa agora</Button>}
    </PopoverContent>
  </Popover>;
}

function FollowUpCard({ row, expanded, onToggle, onEdit, ...actions }: { row: Row; expanded: boolean; onToggle: () => void; onEdit: () => void } & Pick<Props, 'onAddSteps' | 'onClose' | 'onToggleTask' | 'onUpdateTask'>) {
  const { mother, summary } = row;
  const weight = weightVisual(mother.weight);
  const WeightIcon = weight.icon;
  const badge = summary.overdue > 0 && summary.status === 'ativo'
    ? { label: `${summary.overdue} ${summary.overdue === 1 ? 'atrasada' : 'atrasadas'}`, className: 'bg-red-50 text-red-700 border-red-200' }
    : STATUS_BADGE[summary.status];
  const closed = summary.status === 'encerrado';
  const close = async () => {
    if (!window.confirm(`Encerrar "${mother.title}"? As datas em aberto ficam dispensadas e não nascem novas.`)) return;
    await actions.onClose(mother.id);
  };
  return <article className={cn('rounded-lg border bg-white', closed && 'opacity-70')}>
    <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex w-full items-start gap-3 p-3 text-left">
      <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border', weight.className)} title={`Peso ${weight.weight}: ${weight.label}`}><WeightIcon className="h-4 w-4" aria-hidden /></span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-slate-900">{mother.title}</span>
          <span className={cn('rounded border px-1.5 py-0.5 text-[10px] font-semibold', badge.className)}>{badge.label}</span>
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{describeFollowUp(summary.rule)}</span>
        {mother.recurrence_anchor_label && <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500"><Flag className="h-3 w-3" />{mother.recurrence_anchor_label} · {brDate(summary.rule.anchorDate)}</span>}
        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
          {summary.next && !closed && <span className={cn('font-semibold', summary.next < todayIso() ? 'text-red-700' : 'text-sky-800')}>{summary.next < todayIso() ? 'Atrasada desde ' : 'Próxima '}{brDate(summary.next)}</span>}
          <span>{mother.assigned_to[0] ?? 'Sem responsável'}</span>
          <span>{summary.done} {summary.done === 1 ? 'feita' : 'feitas'}</span>
        </span>
      </span>
      <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform', expanded && 'rotate-180')} aria-hidden />
    </button>
    {expanded && <div className="space-y-3 border-t px-3 pb-3 pt-2.5">
      <div className="flex flex-wrap gap-1.5" aria-label="Linha do tempo">
        {summary.timeline.map(item => <TimelineChip key={item.date} item={item} mother={mother} onAddSteps={actions.onAddSteps} onToggleTask={actions.onToggleTask} onUpdateTask={actions.onUpdateTask} />)}
      </div>
      <p className="text-[11px] text-muted-foreground">Toque numa data para marcar como feita, dispensar ou lançar.</p>
      {!closed && <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onEdit}><Pencil className="mr-1.5 h-3.5 w-3.5" />Editar</Button>
        {mother.recurrence_paused_at
          ? <Button type="button" variant="outline" size="sm" onClick={() => void actions.onUpdateTask(mother.id, { recurrence_paused_at: null })}><Play className="mr-1.5 h-3.5 w-3.5" />Retomar</Button>
          : <Button type="button" variant="outline" size="sm" onClick={() => void actions.onUpdateTask(mother.id, { recurrence_paused_at: new Date().toISOString() })}><Pause className="mr-1.5 h-3.5 w-3.5" />Pausar</Button>}
        <Button type="button" variant="outline" size="sm" className="text-red-700 hover:text-red-800" onClick={() => void close()}><X className="mr-1.5 h-3.5 w-3.5" />Encerrar</Button>
      </div>}
    </div>}
  </article>;
}

/** Gestão de processos > Recorrentes: os acompanhamentos, a próxima data e a linha do tempo de cada um. */
export function FollowUpBoard({ tasks, clients, responsibleList, currentUser, onCreateFollowUp, onAddSteps, onClose, onToggleTask, onUpdateTask }: Props) {
  const today = todayIso();
  const [search, setSearch] = useState('');
  const [assignee, setAssignee] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const clientById = useMemo(() => new Map(clients.map(client => [client.id, client])), [clients]);

  const rows = useMemo(() => {
    const stepsByMother = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!isFollowUpStep(task)) continue;
      stepsByMother.set(task.parent_task_id!, [...(stepsByMother.get(task.parent_task_id!) ?? []), task]);
    }
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return tasks
      .filter(task => task.recurrence !== 'none' && !task.parent_task_id && clientById.has(task.client_id))
      .map(mother => ({ mother, client: clientById.get(mother.client_id) as Client | undefined, summary: summarizeFollowUp(mother, stepsByMother.get(mother.id) ?? [], today) }))
      .filter((row): row is Row => Boolean(row.summary))
      .filter(row => showClosed || row.summary.status !== 'encerrado')
      .filter(row => !assignee || row.mother.assigned_to.includes(assignee))
      .filter(row => !query || `${row.mother.title} ${row.client?.name ?? ''} ${row.mother.recurrence_anchor_label ?? ''}`.toLocaleLowerCase('pt-BR').includes(query))
      .sort((a, b) => (b.summary.overdue - a.summary.overdue) || (a.summary.next ?? '9999').localeCompare(b.summary.next ?? '9999'));
  }, [tasks, clientById, search, assignee, showClosed, today]);

  const groups = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const row of rows) map.set(row.mother.client_id, [...(map.get(row.mother.client_id) ?? []), row]);
    return [...map.entries()].sort(([a], [b]) => (clientById.get(a)?.name ?? '').localeCompare(clientById.get(b)?.name ?? '', 'pt-BR'));
  }, [rows, clientById]);

  const totals = useMemo(() => {
    const active = rows.filter(row => row.summary.status === 'ativo');
    const in30 = new Date(`${today}T12:00:00Z`);
    in30.setUTCDate(in30.getUTCDate() + 30);
    const limit = in30.toISOString().slice(0, 10);
    return {
      active: active.length,
      late: active.filter(row => row.summary.overdue > 0).length,
      soon: active.filter(row => row.summary.next && row.summary.next >= today && row.summary.next <= limit).length,
    };
  }, [rows, today]);

  const toggle = (id: string) => setExpanded(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return <div className="mx-auto max-w-5xl space-y-3">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Button type="button" className="h-10 shrink-0" onClick={() => { setEditing(null); setModalOpen(true); }}><Plus className="mr-1.5 h-4 w-4" />Novo acompanhamento</Button>
      <div className="luz luz--foco relative min-w-0 flex-1 rounded-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar acompanhamento, cliente ou marco" className="pl-9" aria-label="Buscar acompanhamento" />
      </div>
      <div className="flex gap-2">
        <select aria-label="Filtrar responsável" value={assignee} onChange={event => setAssignee(event.target.value)} className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-base sm:w-40 sm:flex-none sm:text-sm">
          <option value="">Todos os responsáveis</option>
          {responsibleList.map(person => <option key={person.name} value={person.name}>{person.name}</option>)}
        </select>
        <label className="flex h-10 shrink-0 items-center gap-1.5 rounded-md border bg-white px-3 text-xs text-muted-foreground"><input type="checkbox" checked={showClosed} onChange={event => setShowClosed(event.target.checked)} />Encerrados</label>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-lg border bg-white p-2.5"><p className="text-lg font-semibold tabular-nums">{totals.active}</p><p className="text-[11px] text-muted-foreground">ativos</p></div>
      <div className="rounded-lg border bg-white p-2.5"><p className={cn('text-lg font-semibold tabular-nums', totals.late > 0 && 'text-red-700')}>{totals.late}</p><p className="text-[11px] text-muted-foreground">com atraso</p></div>
      <div className="rounded-lg border bg-white p-2.5"><p className="text-lg font-semibold tabular-nums text-sky-800">{totals.soon}</p><p className="text-[11px] text-muted-foreground">nos próximos 30 dias</p></div>
    </div>

    {groups.length === 0
      ? <div className="rounded-lg border border-dashed bg-white p-6 text-center">
        <Repeat className="mx-auto h-6 w-6 text-slate-400" aria-hidden />
        <p className="mt-2 text-sm font-medium">Nenhum acompanhamento {search || assignee ? 'para este filtro' : 'ainda'}.</p>
        <p className="mt-1 text-xs text-muted-foreground">Ex.: visita mensal a um cliente, ou laudo a cada 180 dias depois da licença.</p>
      </div>
      : groups.map(([clientId, items]) => <section key={clientId} className="space-y-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{clientById.get(clientId)?.name ?? 'Cliente'} <span className="font-normal">· {items.length}</span></h3>
        {items.map(row => <FollowUpCard
          key={row.mother.id}
          row={row}
          expanded={expanded.has(row.mother.id)}
          onToggle={() => toggle(row.mother.id)}
          onEdit={() => { setEditing(row.mother); setModalOpen(true); }}
          onAddSteps={onAddSteps}
          onClose={onClose}
          onToggleTask={onToggleTask}
          onUpdateTask={onUpdateTask}
        />)}
      </section>)}

    <FollowUpModal
      open={modalOpen}
      onOpenChange={setModalOpen}
      editing={editing}
      clients={clients}
      responsibleList={responsibleList}
      defaultAssignee={currentUser}
      onCreate={onCreateFollowUp}
      onUpdateTask={onUpdateTask}
    />
  </div>;
}
