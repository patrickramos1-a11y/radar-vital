import { useEffect, useRef, useState } from 'react';
import { CalendarClock, Check, Circle, Clock3, ExternalLink, Link2, Plus, Repeat, X } from 'lucide-react';
import type { Client } from '@/types/client';
import type { Task } from '@/types/task';
import { recurrenceLabel } from '@/lib/processRecurrence';
import { PROCESS_WEIGHTS, type ProcessWeight } from '@/lib/processWeight';
import { colorWithAlpha, daysOpen, formatDay, today, weightVisual } from '@/lib/processDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface RespOption { name: string; color: string; initials: string }
export type UpdateTask = (taskId: string, data: Partial<Task>) => Promise<boolean>;
export type ToggleTask = (taskId: string, clientName?: string) => Promise<boolean>;

export function RecurrenceBadge({ task }: { task: Pick<Task, 'recurrence' | 'recurrence_interval' | 'recurrence_unit'> }) {
  const label = recurrenceLabel(task);
  if (!label) return null;
  return <span className="inline-flex items-center gap-1 bg-violet-50 px-1.5 py-0.5 font-medium text-violet-700" title={`Repete: ${label.toLocaleLowerCase('pt-BR')}`} aria-label={`Repete: ${label.toLocaleLowerCase('pt-BR')}`}><Repeat className="h-3 w-3" />{label}</span>;
}

/** Botões de peso de 1 a 5, usados no formulário e no seletor da linha. */
export function WeightOptions({ value, onSelect }: { value: number; onSelect: (weight: ProcessWeight) => void }) {
  return <div className="space-y-1">
    {PROCESS_WEIGHTS.map(weight => {
      const config = weightVisual(weight);
      const Icon = config.icon;
      return <button key={weight} type="button" aria-label={`Peso ${weight}: ${config.label}`} aria-pressed={value === weight} className={cn('flex h-9 w-full items-center gap-2 border px-2 text-left text-xs font-semibold', config.className, value === weight && 'ring-2 ring-primary')} onClick={() => onSelect(weight)}>
        <Icon className="h-3.5 w-3.5" />
        <span className="flex-1">{config.label}</span>
        <span className="text-[10px] font-medium opacity-70">peso {weight}</span>
      </button>;
    })}
  </div>;
}

/** Peso em uma fileira só de ícones, da Máxima à Baixa. O nome do peso fica no título e no leitor de tela. */
export function WeightIconOptions({ value, onSelect }: { value: number; onSelect: (weight: ProcessWeight) => void }) {
  return <div role="radiogroup" aria-label="Peso do processo" className="grid grid-cols-5 gap-1.5">
    {PROCESS_WEIGHTS.map(weight => {
      const config = weightVisual(weight);
      const Icon = config.icon;
      const selected = value === weight;
      return <button
        key={weight}
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={`Peso ${weight}: ${config.label}`}
        title={`${config.label} (peso ${weight})`}
        onClick={() => onSelect(weight)}
        className={cn(
          'flex h-11 items-center justify-center rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
          selected
            ? cn(config.className, 'scale-[1.04] shadow-sm ring-2 ring-current ring-offset-1')
            : cn('border-slate-200 bg-white opacity-70 hover:bg-slate-50 hover:opacity-100', config.className.split(' ').find(name => name.startsWith('text-'))),
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </button>;
    })}
  </div>;
}

export function ProcessWeightPicker({ task, onUpdateTask }: { task: Task; onUpdateTask: UpdateTask }) {
  const [open, setOpen] = useState(false);
  const current = weightVisual(task.weight);
  const Icon = current.icon;
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <button type="button" title={`Peso ${current.weight}: ${current.label}. Clique para alterar.`} aria-label={`Peso ${current.weight}: ${current.label}`} className={cn('inline-flex h-5 items-center gap-1 border px-1.5 text-[10px] font-semibold', current.className)}>
        <Icon className="h-3 w-3" />{current.label}
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-56 p-2">
      <p className="px-1 pb-2 text-xs font-semibold">Peso do processo</p>
      <WeightOptions value={current.weight} onSelect={async weight => { if (await onUpdateTask(task.id, { weight })) setOpen(false); }} />
    </PopoverContent>
  </Popover>;
}

export function EditableTitle({ title, ariaLabel, completed = false, expanded, twoLines = false, onToggle, onSave }: {
  title: string;
  ariaLabel: string;
  completed?: boolean;
  expanded?: boolean;
  /** Cartões estreitos (Painel) mostram até duas linhas do título. */
  twoLines?: boolean;
  onToggle: () => void;
  onSave: (title: string) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [saving, setSaving] = useState(false);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setDraft(title), [title]);
  useEffect(() => () => { if (clickTimer.current) clearTimeout(clickTimer.current); }, []);

  const cancelClick = () => {
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = null;
  };
  const save = async () => {
    const nextTitle = draft.trim();
    if (!nextTitle) { setDraft(title); setEditing(false); return; }
    if (nextTitle === title) { setEditing(false); return; }
    setSaving(true);
    const ok = await onSave(nextTitle);
    setSaving(false);
    if (ok) setEditing(false);
  };

  if (editing) return <Input
    autoFocus
    value={draft}
    disabled={saving}
    aria-label={`Editar ${ariaLabel}`}
    className="h-7 min-w-0 border-primary bg-white px-1.5 text-[12px] font-semibold sm:text-[13px]"
    onChange={event => setDraft(event.target.value)}
    onBlur={() => void save()}
    onKeyDown={event => {
      if (event.key === 'Enter') { event.preventDefault(); void save(); }
      if (event.key === 'Escape') { setDraft(title); setEditing(false); }
    }}
  />;

  return <button
    type="button"
    onClick={event => {
      if (event.detail === 0) { onToggle(); return; }
      if (event.detail > 1) { cancelClick(); return; }
      cancelClick();
      clickTimer.current = setTimeout(onToggle, 180);
    }}
    onDoubleClick={() => { cancelClick(); setDraft(title); setEditing(true); }}
    className="block w-full min-w-0 py-0.5 text-left"
    aria-label={ariaLabel}
    aria-expanded={expanded}
    title="Clique para expandir; clique duas vezes para editar"
  >
    <span className={cn('line-clamp-2 text-[11px] font-semibold leading-[1.15] hover:text-primary sm:text-[13px]', !twoLines && 'sm:line-clamp-1', completed && 'line-through text-muted-foreground')}>{title}</span>
  </button>;
}

export function WorkSchedule({ task, onUpdateTask }: { task: Task; onUpdateTask: UpdateTask }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(task.scheduled_for || '');
  const [saving, setSaving] = useState(false);
  const scheduled = Boolean(task.scheduled_for && task.scheduled_for > today());
  useEffect(() => setDate(task.scheduled_for || ''), [task.scheduled_for]);

  const save = async (scheduledFor: string | null) => {
    setSaving(true);
    const ok = await onUpdateTask(task.id, { scheduled_for: scheduledFor });
    setSaving(false);
    if (ok) setOpen(false);
  };

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <button type="button" title={scheduled ? `Planejado para ${formatDay(task.scheduled_for!)}` : 'Planejar quando o processo volta'} aria-label="Planejar processo" className={`p-1.5 hover:bg-violet-50 ${scheduled ? 'text-violet-700' : 'text-muted-foreground'}`}>
        <CalendarClock className="h-4 w-4" />
      </button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-64 p-3">
      <p className="text-xs font-semibold">Quando este processo volta?</p>
      <p className="mt-1 text-[11px] text-muted-foreground">Ele fica fora da lista ativa até a data escolhida.</p>
      <Input type="date" min={today()} value={date} onChange={event => setDate(event.target.value)} className="mt-3 h-8 text-xs" aria-label="Data de retorno do processo" />
      <div className="mt-3 flex items-center justify-end gap-2">
        {scheduled && <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => void save(null)}><X className="mr-1 h-3.5 w-3.5" />Ativar agora</Button>}
        <Button type="button" size="sm" disabled={!date || saving} onClick={() => void save(date)}>Planejar</Button>
      </div>
    </PopoverContent>
  </Popover>;
}

export function AssigneePicker({ task, responsibleList, onUpdateTask, compact = false }: {
  task: Task; responsibleList: RespOption[]; onUpdateTask: UpdateTask; compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = task.assigned_to.join(', ') || 'Sem responsável';
  const person = responsibleList.find(item => task.assigned_to.includes(item.name));
  const kind = task.parent_task_id ? 'etapa' : 'processo';
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      {compact
        ? <button type="button" title={`Transferir ${kind} · ${current}`} aria-label={`Responsável ${current}`} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-sm ring-1 ring-white" style={{ backgroundColor: person?.color || '#64748b' }}>{person?.initials || '?'}</button>
        : <button type="button" title={`Transferir ${kind}`} aria-label={`Responsável ${current}`} className="max-w-32 truncate border-l-2 px-1.5 py-0.5 font-semibold text-slate-800 hover:underline" style={{ borderLeftColor: person?.color || '#94a3b8', backgroundColor: person ? colorWithAlpha(person.color, '1f') : '#f1f5f9' }}>{current}</button>}
    </PopoverTrigger>
    <PopoverContent align="start" className="w-56 p-2">
      <p className="px-2 pb-2 text-xs font-semibold">Transferir {kind}</p>
      <div className="max-h-56 overflow-y-auto">
        {responsibleList.map(item => <button key={item.name} type="button" className="flex w-full items-center gap-2 px-2 py-2 text-left text-xs hover:bg-muted" onClick={async () => {
          if (await onUpdateTask(task.id, { assigned_to: [item.name] })) setOpen(false);
        }}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: item.color }}>{item.initials}</span>
          <span className="min-w-0 flex-1 truncate">{item.name}</span>
          {task.assigned_to.includes(item.name) && <Check className="h-3.5 w-3.5 text-primary" />}
        </button>)}
      </div>
    </PopoverContent>
  </Popover>;
}

export function TaskLinkAction({ task, onUpdateTask }: { task: Task; onUpdateTask: UpdateTask }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(task.external_url || '');
  const [saving, setSaving] = useState(false);
  useEffect(() => setUrl(task.external_url || ''), [task.external_url]);

  const normalizedUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };
  const save = async (nextValue: string) => {
    setSaving(true);
    const ok = await onUpdateTask(task.id, { external_url: normalizedUrl(nextValue) || null });
    setSaving(false);
    if (ok) setOpen(false);
  };

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <button type="button" title={task.external_url ? 'Abrir ou editar link' : 'Adicionar link'} aria-label={task.external_url ? `Link de ${task.title}` : `Adicionar link a ${task.title}`} className={cn('p-1.5 hover:bg-sky-50', task.external_url ? 'text-sky-700' : 'text-muted-foreground')}>
        <Link2 className="h-4 w-4" />
      </button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-72 p-3">
      <p className="text-xs font-semibold">Link</p>
      <Input autoFocus value={url} onChange={event => setUrl(event.target.value)} placeholder="https://..." className="mt-2 h-8 text-xs" aria-label={`URL de ${task.title}`} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void save(url); } }} />
      <div className="mt-3 flex items-center justify-end gap-2">
        {task.external_url && <>
          <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => void save('')}>Remover</Button>
          <Button type="button" size="sm" variant="outline" asChild>
            <a href={normalizedUrl(task.external_url)} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-3.5 w-3.5" />Abrir</a>
          </Button>
        </>}
        <Button type="button" size="sm" disabled={!url.trim() || saving} onClick={() => void save(url)}>Salvar</Button>
      </div>
    </PopoverContent>
  </Popover>;
}

/** Etapas de um processo, em qualquer nível. Concluídas ficam recolhidas. */
export function StepList({ parentId, tasks, clientName, responsibleList, onToggle, onUpdateTask, depth = 0 }: {
  parentId: string; tasks: Task[]; clientName: string; responsibleList: RespOption[];
  onToggle: ToggleTask; onUpdateTask: UpdateTask; depth?: number;
}) {
  const [showCompleted, setShowCompleted] = useState(false);
  const children = tasks
    .filter(task => task.parent_task_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
  const openSteps = children.filter(task => !task.completed);
  const completedSteps = children.filter(task => task.completed);
  const indent = { paddingLeft: `${Math.min(depth, 5) * 14}px` };

  const renderStep = (task: Task) => <div key={task.id}>
    <div className="flex items-center gap-2 border-t py-2 text-xs" style={indent}>
      <button type="button" onClick={() => void onToggle(task.id, clientName)} aria-label={task.completed ? `Reabrir ${task.title}` : `Concluir ${task.title}`} className="shrink-0 text-emerald-700">
        {task.completed ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4 text-slate-400" />}
      </button>
      <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] text-slate-500" title={`${daysOpen(task)} dias desde o cadastro`}><Clock3 className="h-3 w-3" />{daysOpen(task)}d</span>
      <span className={`min-w-0 flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
      {task.due_date && <span className={`shrink-0 text-[10px] ${!task.completed && task.due_date < today() ? 'font-semibold text-red-700' : 'text-sky-700'}`}>{formatDay(task.due_date)}</span>}
      <AssigneePicker compact task={task} responsibleList={responsibleList} onUpdateTask={onUpdateTask} />
      <TaskLinkAction task={task} onUpdateTask={onUpdateTask} />
    </div>
    <StepList parentId={task.id} tasks={tasks} clientName={clientName} responsibleList={responsibleList} onToggle={onToggle} onUpdateTask={onUpdateTask} depth={depth + 1} />
  </div>;

  return <>
    {openSteps.map(renderStep)}
    {completedSteps.length > 0 && <button type="button" onClick={() => setShowCompleted(value => !value)} aria-expanded={showCompleted} className="flex w-full items-center gap-1.5 border-t py-2 text-left text-[11px] font-medium text-emerald-700 hover:bg-emerald-50" style={indent}>
      <Check className="h-3.5 w-3.5" />
      {completedSteps.length} {completedSteps.length === 1 ? 'etapa concluída' : 'etapas concluídas'}
      <span className="text-emerald-600">{showCompleted ? '· recolher' : '· ver'}</span>
    </button>}
    {showCompleted && completedSteps.map(renderStep)}
  </>;
}

export function ClientSideRail({ client, count, onClick }: { client?: Client; count: number; onClick?: () => void }) {
  const name = client?.name || 'Sem cliente';
  const canCreate = Boolean(client && onClick);
  return <button
    type="button"
    onClick={onClick}
    disabled={!canCreate}
    title={canCreate ? `Novo processo para ${name}` : name}
    aria-label={canCreate ? `Novo processo para ${name}` : name}
    className="relative flex min-h-[58px] w-full flex-col items-center justify-center gap-1 overflow-hidden border-r bg-slate-50 px-1.5 py-2 text-center hover:bg-slate-100 disabled:cursor-default"
  >
    <span className="absolute right-1 top-1 min-w-4 bg-white px-1 text-[9px] font-semibold text-slate-500">{count}</span>
    {client?.logoUrl ? <img src={client.logoUrl} alt={`Logo ${name}`} className="max-h-11 w-full object-contain" /> : <span className="max-w-full break-words text-[10px] font-bold leading-tight text-slate-800 sm:text-[11px]">{name}</span>}
    {canCreate && <Plus className="absolute bottom-1 right-1 h-3 w-3 text-primary" />}
  </button>;
}
