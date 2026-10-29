import { useEffect, useMemo, useState } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import { CalendarClock, Check, Circle, Gauge, LayoutGrid, List, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import type { Client } from '@/types/client';
import type { Priority, PriorityFormData } from '@/types/priority';
import type { Task, TaskFormData } from '@/types/task';
import { assigneeMatches } from '@/lib/taskAssignee';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PriorityModal } from './PriorityModal';

interface RespOption { name: string; color: string; initials: string }
interface Props {
  collaborator: string;
  color: string;
  isTeamView: boolean;
  priorities: Priority[];
  tasks: Task[];
  clients: Client[];
  responsibleList: RespOption[];
  allowCollaboratorFilter?: boolean;
  initialClientId?: string | null;
  onCreate: (data: PriorityFormData, clientName?: string) => Promise<Priority | null>;
  onCreateMany: (data: PriorityFormData, clientIds: string[]) => Promise<Priority[]>;
  onUpdate: (id: string, data: Partial<PriorityFormData>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onCreateSubtask: (clientId: string, data: TaskFormData, clientName?: string) => Promise<boolean>;
  onToggleTask: (taskId: string, clientName?: string) => Promise<boolean>;
  onUpdateTask: (taskId: string, data: Partial<Task>) => Promise<boolean>;
  onRefreshTasks: () => Promise<void>;
}

const today = () => format(new Date(), 'yyyy-MM-dd');

function rootTaskFor(priority: Priority, tasks: Task[]) {
  return tasks.find(task => task.id === priority.source_task_id)
    || tasks.find(task => task.priority_id === priority.id && !task.parent_task_id);
}

function PrioritySchedule({ task, onUpdateTask }: { task?: Task; onUpdateTask: Props['onUpdateTask'] }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(task?.scheduled_for || '');
  const [saving, setSaving] = useState(false);
  const scheduled = Boolean(task?.scheduled_for && task.scheduled_for > today());

  useEffect(() => setDate(task?.scheduled_for || ''), [task?.scheduled_for]);
  if (!task) return null;

  const save = async (scheduledFor: string | null) => {
    setSaving(true);
    const ok = await onUpdateTask(task.id, { scheduled_for: scheduledFor });
    setSaving(false);
    if (ok) setOpen(false);
  };

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <button type="button" title={scheduled ? `Planejada para ${new Date(`${task.scheduled_for}T12:00:00`).toLocaleDateString('pt-BR')}` : 'Planejar quando a prioridade volta'} aria-label="Planejar prioridade" className={`p-1.5 hover:bg-violet-50 ${scheduled ? 'text-violet-700' : 'text-muted-foreground'}`}>
        <CalendarClock className="h-4 w-4" />
      </button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-64 p-3">
      <p className="text-xs font-semibold">Quando esta prioridade volta?</p>
      <p className="mt-1 text-[11px] text-muted-foreground">Ela ficará fora da lista ativa até a data escolhida.</p>
      <Input type="date" min={today()} value={date} onChange={event => setDate(event.target.value)} className="mt-3 h-8 text-xs" aria-label="Data de retorno da prioridade" />
      <div className="mt-3 flex items-center justify-end gap-2">
        {scheduled && <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => void save(null)}><X className="mr-1 h-3.5 w-3.5" />Ativar agora</Button>}
        <Button type="button" size="sm" disabled={!date || saving} onClick={() => void save(date)}>Planejar</Button>
      </div>
    </PopoverContent>
  </Popover>;
}

function PriorityWeight({ priority, onUpdate }: { priority: Priority; onUpdate: Props['onUpdate'] }) {
  const [open, setOpen] = useState(false);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <button type="button" title="Alterar peso" aria-label={`Peso ${priority.weight}`} className="inline-flex h-7 min-w-9 items-center justify-center gap-1 border px-1.5 text-[11px] font-semibold text-slate-700 hover:border-primary hover:text-primary">
        <Gauge className="h-3.5 w-3.5" />{priority.weight}
      </button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-48 p-2">
      <p className="px-1 pb-2 text-xs font-semibold">Peso da prioridade</p>
      <div className="grid grid-cols-5 gap-1">
        {[5, 4, 3, 2, 1].map(weight => <button key={weight} type="button" aria-label={`Definir peso ${weight}`} className={`h-8 border text-xs font-semibold ${priority.weight === weight ? 'border-primary bg-primary text-primary-foreground' : 'bg-white hover:bg-muted'}`} onClick={async () => { if (await onUpdate(priority.id, { weight })) setOpen(false); }}>{weight}</button>)}
      </div>
    </PopoverContent>
  </Popover>;
}

function Subtasks({ parentId, tasks, clientName, onToggle, depth = 0 }: {
  parentId: string; tasks: Task[]; clientName: string; onToggle: Props['onToggleTask']; depth?: number;
}) {
  return <>{tasks.filter(task => task.parent_task_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at))
    .map(task => <div key={task.id}>
      <div className="flex items-center gap-2 border-t py-2 text-xs" style={{ paddingLeft: `${Math.min(depth, 5) * 14}px` }}>
        <button type="button" onClick={() => void onToggle(task.id, clientName)} aria-label={task.completed ? `Reabrir ${task.title}` : `Concluir ${task.title}`} className="shrink-0 text-emerald-700">
          {task.completed ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4 text-slate-400" />}
        </button>
        <span className={task.completed ? 'line-through text-muted-foreground' : ''}>{task.title}</span>
      </div>
      <Subtasks parentId={task.id} tasks={tasks} clientName={clientName} onToggle={onToggle} depth={depth + 1} />
    </div>)}</>;
}

function PriorityItem({ priority, client, tasks, rowIndex, onUpdate, onDelete, onCreateSubtask, onToggleTask, onUpdateTask, onEdit, onRefreshTasks }: {
  priority: Priority; client?: Client; tasks: Task[];
  rowIndex: number;
  onUpdate: Props['onUpdate']; onDelete: Props['onDelete'];
  onCreateSubtask: Props['onCreateSubtask']; onToggleTask: Props['onToggleTask'];
  onUpdateTask: Props['onUpdateTask'];
  onEdit: () => void; onRefreshTasks: Props['onRefreshTasks'];
}) {
  const root = rootTaskFor(priority, tasks);
  const children = root ? tasks.filter(task => task.parent_task_id === root.id) : [];
  const [expanded, setExpanded] = useState(children.length > 0);
  const [manuallyToggled, setManuallyToggled] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const closed = priority.status === 'concluida' || priority.status === 'cancelada';
  const age = Math.max(0, differenceInCalendarDays(new Date(priority.completed_at || new Date()), new Date(priority.created_at)));
  const overdue = !closed && Boolean(priority.due_date && priority.due_date < new Date().toISOString().slice(0, 10));
  const addSubtask = async () => {
    if (!root || !client || !draft.trim()) return;
    setSaving(true);
    const ok = await onCreateSubtask(client.id, {
      title: draft.trim(), assigned_to: root.assigned_to, parent_task_id: root.id,
      priority: root.priority, modality: root.modality,
    }, client.name);
    setSaving(false);
    if (ok) setDraft('');
  };

  const weightColor = priority.weight >= 5 ? 'border-l-red-500' : priority.weight === 4 ? 'border-l-orange-400' : priority.weight === 3 ? 'border-l-amber-400' : priority.weight === 2 ? 'border-l-sky-400' : 'border-l-slate-300';
  const scheduled = Boolean(root?.scheduled_for && root.scheduled_for > today());

  useEffect(() => {
    if (!manuallyToggled && children.length > 0) setExpanded(true);
  }, [children.length, manuallyToggled]);

  return <article className={`border-b border-l-2 last:border-b-0 ${rowIndex % 2 ? 'bg-slate-50/80' : 'bg-white'} ${overdue ? 'border-l-red-600' : weightColor}`}>
    <div className="flex min-w-0 items-center gap-1.5 px-2 py-1.5">
      <button type="button" onClick={() => { setManuallyToggled(true); setExpanded(value => !value); }} className="min-w-0 flex-1 py-0.5 text-left" aria-label={`${expanded ? 'Recolher' : 'Expandir'} prioridade ${priority.title}`} aria-expanded={expanded}>
        <span className="block max-w-full truncate text-[13px] font-semibold leading-tight hover:text-primary">{priority.title}</span>
        <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
          <span>{closed ? `${age}d de duração` : `Aberta há ${age}d`}</span>
          {priority.due_date && <span className={overdue ? 'font-semibold text-red-700' : ''}>{overdue ? 'Atrasada · ' : 'Prazo '}{new Date(`${priority.due_date}T12:00:00`).toLocaleDateString('pt-BR')}</span>}
          {scheduled && <span className="font-medium text-violet-700">Volta em {new Date(`${root?.scheduled_for}T12:00:00`).toLocaleDateString('pt-BR')}</span>}
          {priority.category && <span>{priority.category}</span>}
          {!!children.length && <span>{children.filter(task => task.completed).length}/{children.length} subtarefas</span>}
          {!!priority.assigned_to.length && <span>{priority.assigned_to.join(', ')}</span>}
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        {!closed && <PriorityWeight priority={priority} onUpdate={onUpdate} />}
        {!closed && <PrioritySchedule task={root} onUpdateTask={onUpdateTask} />}
        {!closed && <button type="button" onClick={async () => { if (await onUpdate(priority.id, { status: 'concluida' })) await onRefreshTasks(); }} title="Concluir prioridade" aria-label="Concluir prioridade" className="p-1.5 text-emerald-700 hover:bg-emerald-50"><Check className="h-4 w-4" /></button>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button type="button" title="Mais ações" aria-label="Mais ações da prioridade" className="p-1.5 text-muted-foreground hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}><Pencil className="mr-2 h-4 w-4" />Editar prioridade</DropdownMenuItem>
            <DropdownMenuItem className="text-red-700 focus:text-red-700" onSelect={async () => { if (window.confirm('Excluir esta prioridade? A tarefa continuará no cliente.')) { await onDelete(priority.id); await onRefreshTasks(); } }}><Trash2 className="mr-2 h-4 w-4" />Excluir prioridade</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    {expanded && <div className="px-3 pb-3 sm:px-4">
      {priority.description && <p className="mb-2 text-xs text-muted-foreground">{priority.description}</p>}
      {root ? <>
        <Subtasks parentId={root.id} tasks={tasks} clientName={client?.name || 'Cliente'} onToggle={onToggleTask} />
        {!closed && <form className="mt-2 flex gap-2" onSubmit={event => { event.preventDefault(); void addSubtask(); }}>
          <Input value={draft} onChange={event => setDraft(event.target.value)} placeholder="Nova subtarefa" aria-label="Nova subtarefa" className="h-8 text-xs" />
          <Button type="submit" size="sm" variant="outline" disabled={!draft.trim() || saving} title="Adicionar subtarefa"><Plus className="h-4 w-4" /></Button>
        </form>}
      </> : <p className="text-xs text-amber-700">Esta prioridade ainda não tem tarefa vinculada. Verifique a migração.</p>}
    </div>}
  </article>;
}

export function PrioritiesTab({ collaborator, color, isTeamView, priorities, tasks, clients, responsibleList, allowCollaboratorFilter = false, initialClientId, onCreate, onCreateMany, onUpdate, onDelete, onCreateSubtask, onToggleTask, onUpdateTask, onRefreshTasks }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Priority | null>(null);
  const [presetClientId, setPresetClientId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showScheduled, setShowScheduled] = useState(false);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState(initialClientId || 'all');
  const [collaboratorFilter, setCollaboratorFilter] = useState(collaborator);
  const [viewMode, setViewMode] = useState<'list' | 'panel'>('list');
  useEffect(() => setClientFilter(initialClientId || 'all'), [initialClientId]);
  useEffect(() => setCollaboratorFilter(collaborator), [collaborator]);
  const clientById = useMemo(() => new Map(clients.map(client => [client.id, client])), [clients]);
  const filtered = useMemo(() => priorities.filter(priority =>
    (isTeamView || collaboratorFilter === 'all' || Boolean(initialClientId) || assigneeMatches(priority.assigned_to, collaboratorFilter))
    && (showAll || (priority.status !== 'concluida' && priority.status !== 'cancelada'))
    && (showScheduled || !(() => {
      const root = rootTaskFor(priority, tasks);
      return Boolean(root?.scheduled_for && root.scheduled_for > today());
    })())
    && (clientFilter === 'all' || priority.client_id === clientFilter)
    && (!search.trim() || `${priority.title} ${priority.description || ''} ${clientById.get(priority.client_id || '')?.name || ''}`.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')))
  ).sort((a, b) => {
    const today = new Date().toISOString().slice(0, 10);
    const aOverdue = a.due_date && a.due_date < today && a.status !== 'concluida' ? 1 : 0;
    const bOverdue = b.due_date && b.due_date < today && b.status !== 'concluida' ? 1 : 0;
    return b.weight - a.weight || bOverdue - aOverdue
      || (a.due_date || '9999-12-31').localeCompare(b.due_date || '9999-12-31')
      || a.created_at.localeCompare(b.created_at);
  }), [priorities, tasks, isTeamView, initialClientId, collaboratorFilter, showAll, showScheduled, clientFilter, search, clientById]);
  const groups = useMemo(() => {
    const byClient = new Map<string, Priority[]>();
    filtered.forEach(priority => {
      const key = priority.client_id || 'sem-cliente';
      byClient.set(key, [...(byClient.get(key) || []), priority]);
    });
    return [...byClient].sort(([a], [b]) => (clientById.get(a)?.name || 'Sem cliente').localeCompare(clientById.get(b)?.name || 'Sem cliente', 'pt-BR'));
  }, [filtered, clientById]);

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[180px] flex-1 sm:max-w-xs"><Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" /><Input className="h-8 pl-8 text-xs" placeholder="Buscar prioridade ou cliente" value={search} onChange={event => setSearch(event.target.value)} /></div>
      <select aria-label="Filtrar cliente" value={clientFilter} onChange={event => setClientFilter(event.target.value)} className="h-8 max-w-[180px] border bg-white px-2 text-xs">
        <option value="all">Todos os clientes</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
      </select>
      {allowCollaboratorFilter && <select aria-label="Filtrar colaborador" value={collaboratorFilter} onChange={event => setCollaboratorFilter(event.target.value)} className="h-8 max-w-[180px] border bg-white px-2 text-xs">
        <option value="all">Todos os colaboradores</option>{responsibleList.map(person => <option key={person.name} value={person.name}>{person.name}</option>)}
      </select>}
      <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={showAll} onChange={event => setShowAll(event.target.checked)} />Concluídas</label>
      <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={showScheduled} onChange={event => setShowScheduled(event.target.checked)} />Planejadas</label>
      <Button size="sm" onClick={() => { setEditing(null); setPresetClientId(clientFilter === 'all' ? null : clientFilter); setModalOpen(true); }} style={{ backgroundColor: color }}><Plus className="mr-1 h-4 w-4" />Nova prioridade</Button>
    </div>
    <div className="flex items-center justify-between gap-3 border-b pb-2">
      <p className="text-xs text-muted-foreground">{filtered.length} prioridades em {groups.length} clientes</p>
      <div className="flex border" role="group" aria-label="Modo de visualização">
        <button type="button" aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')} className={`inline-flex h-8 items-center gap-1 px-2 text-xs ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}><List className="h-3.5 w-3.5" />Lista</button>
        <button type="button" aria-pressed={viewMode === 'panel'} onClick={() => setViewMode('panel')} className={`inline-flex h-8 items-center gap-1 border-l px-2 text-xs ${viewMode === 'panel' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}><LayoutGrid className="h-3.5 w-3.5" />Painel</button>
      </div>
    </div>
    {groups.length === 0 && <div className="border px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma prioridade para este filtro.</div>}
    <div className={viewMode === 'panel' ? 'grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>{groups.map(([clientId, items]) => {
      const client = clientById.get(clientId);
      const openClientPriority = () => { if (!client) return; setEditing(null); setPresetClientId(client.id); setModalOpen(true); };
      return <section key={clientId} className={`border-t-2 border-primary/70 bg-white ${viewMode === 'list' ? 'grid grid-cols-[64px_minmax(0,1fr)]' : 'min-w-0 border-x border-b'}`}>
        <button type="button" onClick={openClientPriority} disabled={!client} title={client ? `Adicionar prioridade para ${client.name}` : 'Sem cliente'} aria-label={client ? `Adicionar prioridade para ${client.name}` : 'Sem cliente'} className={`relative flex items-center justify-center bg-slate-100/80 p-2 hover:bg-primary/5 ${viewMode === 'list' ? 'border-b border-l' : 'h-24 w-full border-b'}`}>
          {client?.logoUrl ? <img src={client.logoUrl} alt={`Logo ${client.name}`} className={`${viewMode === 'panel' ? 'h-16 max-w-[75%]' : 'h-11 w-12'} object-contain`} /> : <span className="flex h-11 w-11 items-center justify-center bg-white text-xs font-bold text-slate-600">{client?.initials || 'SC'}</span>}
          <span className="absolute right-1 top-1 min-w-5 bg-white px-1 text-center text-[10px] font-semibold text-slate-600">{items.length}</span>
        </button>
        <div className="min-w-0 border-r border-t">{items.map((priority, rowIndex) => <PriorityItem key={priority.id} priority={priority} client={client} tasks={tasks} rowIndex={rowIndex} onUpdate={onUpdate} onDelete={onDelete} onCreateSubtask={onCreateSubtask} onToggleTask={onToggleTask} onUpdateTask={onUpdateTask} onRefreshTasks={onRefreshTasks} onEdit={() => { setEditing(priority); setPresetClientId(priority.client_id); setModalOpen(true); }} />)}</div>
      </section>;
    })}</div>
    <PriorityModal open={modalOpen} onOpenChange={setModalOpen} editing={editing} defaultAssignee={isTeamView ? undefined : collaborator} presetClientId={presetClientId} allowMultipleClients={!editing && !presetClientId} lockClientId={Boolean(editing?.client_id)} clients={clients} responsibleList={responsibleList} onSubmit={async data => {
      if (editing) {
        if (await onUpdate(editing.id, data)) { await onRefreshTasks(); setModalOpen(false); }
      } else if (data.client_ids?.length && !presetClientId) {
        const created = await onCreateMany(data, data.client_ids);
        if (created.length) { await onRefreshTasks(); setModalOpen(false); }
      } else {
        const created = await onCreate(data, data.client_id ? clientById.get(data.client_id)?.name : undefined);
        if (created) { await onRefreshTasks(); setModalOpen(false); }
      }
    }} />
  </div>;
}
