import { useEffect, useMemo, useRef, useState } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import { ArrowDownWideNarrow, CalendarClock, Check, Circle, Clock3, Gauge, LayoutGrid, List, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
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

type SortMode = 'weight-time' | 'oldest';
const today = () => format(new Date(), 'yyyy-MM-dd');
const weightClasses: Record<number, string> = {
  1: 'border-slate-300 bg-slate-50 text-slate-700',
  2: 'border-sky-300 bg-sky-50 text-sky-700',
  3: 'border-amber-300 bg-amber-50 text-amber-800',
  4: 'border-orange-300 bg-orange-50 text-orange-800',
  5: 'border-red-300 bg-red-50 text-red-700',
};

function rootTaskFor(priority: Priority, tasks: Task[]) {
  return tasks.find(task => task.id === priority.source_task_id)
    || tasks.find(task => task.priority_id === priority.id && !task.parent_task_id);
}

function colorWithAlpha(color: string, alpha: string) {
  return /^#[0-9a-f]{6}$/i.test(color) ? `${color}${alpha}` : 'rgba(15, 118, 110, 0.08)';
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
      <button type="button" title="Alterar peso" aria-label={`Peso ${priority.weight}`} className={`inline-flex h-5 items-center gap-1 border px-1.5 text-[10px] font-semibold ${weightClasses[priority.weight] || weightClasses[1]}`}>
        <Gauge className="h-3 w-3" />P{priority.weight}
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-48 p-2">
      <p className="px-1 pb-2 text-xs font-semibold">Peso da prioridade</p>
      <div className="grid grid-cols-5 gap-1">
        {[5, 4, 3, 2, 1].map(weight => <button key={weight} type="button" aria-label={`Definir peso ${weight}`} className={`h-8 border text-xs font-semibold ${priority.weight === weight ? 'ring-2 ring-primary' : ''} ${weightClasses[weight]}`} onClick={async () => { if (await onUpdate(priority.id, { weight })) setOpen(false); }}>{weight}</button>)}
      </div>
    </PopoverContent>
  </Popover>;
}

function PriorityAssignee({ priority, root, responsibleList, onUpdate, onUpdateTask, onRefreshTasks }: {
  priority: Priority; root?: Task; responsibleList: RespOption[];
  onUpdate: Props['onUpdate']; onUpdateTask: Props['onUpdateTask']; onRefreshTasks: Props['onRefreshTasks'];
}) {
  const [open, setOpen] = useState(false);
  const current = priority.assigned_to.join(', ') || 'Sem responsável';
  const transfer = async (person: RespOption) => {
    const updated = await onUpdate(priority.id, { assigned_to: [person.name] });
    if (!updated) return;
    if (root) await onUpdateTask(root.id, { assigned_to: [person.name] });
    await onRefreshTasks();
    setOpen(false);
  };

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <button type="button" title="Transferir prioridade" aria-label={`Responsável ${current}`} className="max-w-32 truncate font-medium text-slate-600 underline-offset-2 hover:text-primary hover:underline">{current}</button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-56 p-2">
      <p className="px-2 pb-2 text-xs font-semibold">Transferir prioridade</p>
      <div className="max-h-56 overflow-y-auto">
        {responsibleList.map(person => <button key={person.name} type="button" className="flex w-full items-center gap-2 px-2 py-2 text-left text-xs hover:bg-muted" onClick={() => void transfer(person)}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: person.color }}>{person.initials}</span>
          <span className="min-w-0 flex-1 truncate">{person.name}</span>
          {priority.assigned_to.includes(person.name) && <Check className="h-3.5 w-3.5 text-primary" />}
        </button>)}
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

function PriorityItem({ priority, client, tasks, rowIndex, responsibleList, onUpdate, onDelete, onCreateSubtask, onToggleTask, onUpdateTask, onEdit, onRefreshTasks }: {
  priority: Priority; client?: Client; tasks: Task[]; rowIndex: number; responsibleList: RespOption[];
  onUpdate: Props['onUpdate']; onDelete: Props['onDelete']; onCreateSubtask: Props['onCreateSubtask'];
  onToggleTask: Props['onToggleTask']; onUpdateTask: Props['onUpdateTask']; onEdit: () => void; onRefreshTasks: Props['onRefreshTasks'];
}) {
  const root = rootTaskFor(priority, tasks);
  const children = root ? tasks.filter(task => task.parent_task_id === root.id) : [];
  const [expanded, setExpanded] = useState(children.length > 0);
  const [manuallyToggled, setManuallyToggled] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [swiped, setSwiped] = useState(false);
  const touchStart = useRef<number | null>(null);
  const touchMoved = useRef(false);
  const closed = priority.status === 'concluida' || priority.status === 'cancelada';
  const age = Math.max(0, differenceInCalendarDays(new Date(priority.completed_at || new Date()), new Date(priority.created_at)));
  const overdue = !closed && Boolean(priority.due_date && priority.due_date < new Date().toISOString().slice(0, 10));
  const addSubtask = async () => {
    if (!root || !client || !draft.trim()) return;
    setSaving(true);
    const ok = await onCreateSubtask(client.id, { title: draft.trim(), assigned_to: root.assigned_to, parent_task_id: root.id, priority: root.priority, modality: root.modality }, client.name);
    setSaving(false);
    if (ok) setDraft('');
  };
  const remove = async () => {
    if (window.confirm('Excluir esta prioridade? A tarefa continuará no cliente.')) {
      await onDelete(priority.id);
      await onRefreshTasks();
    }
  };
  const toggleExpanded = () => {
    if (touchMoved.current) { touchMoved.current = false; return; }
    if (swiped) { setSwiped(false); return; }
    setManuallyToggled(true);
    setExpanded(value => !value);
  };
  const weightColor = priority.weight >= 5 ? 'border-l-red-500' : priority.weight === 4 ? 'border-l-orange-400' : priority.weight === 3 ? 'border-l-amber-400' : priority.weight === 2 ? 'border-l-sky-400' : 'border-l-slate-300';
  const scheduled = Boolean(root?.scheduled_for && root.scheduled_for > today());
  useEffect(() => { if (!manuallyToggled && children.length > 0) setExpanded(true); }, [children.length, manuallyToggled]);

  return <article className={`relative overflow-hidden border-b border-l-2 last:border-b-0 ${overdue ? 'border-l-red-600' : weightColor}`}>
    <div className={`absolute right-0 top-0 h-12 w-24 items-stretch sm:hidden ${swiped ? 'flex' : 'hidden'}`} aria-hidden={!swiped}>
      <button type="button" onClick={onEdit} className="flex w-12 items-center justify-center bg-sky-600 text-white" title="Editar prioridade" aria-label="Editar prioridade"><Pencil className="h-4 w-4" /></button>
      <button type="button" onClick={() => void remove()} className="flex w-12 items-center justify-center bg-red-600 text-white" title="Excluir prioridade" aria-label="Excluir prioridade"><Trash2 className="h-4 w-4" /></button>
    </div>
    <div className={`relative flex min-w-0 items-center gap-1.5 px-2 py-1.5 transition-transform duration-200 ${rowIndex % 2 ? 'bg-slate-50' : 'bg-white'} ${swiped ? '-translate-x-24' : 'translate-x-0'}`}
      onTouchStart={event => { touchStart.current = event.touches[0]?.clientX ?? null; touchMoved.current = false; }}
      onTouchEnd={event => {
        if (touchStart.current === null) return;
        const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
        if (delta < -45) { setSwiped(true); touchMoved.current = true; }
        if (delta > 35) { setSwiped(false); touchMoved.current = true; }
        touchStart.current = null;
      }}>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={toggleExpanded} className="block w-full min-w-0 py-0.5 text-left" aria-label={`${expanded ? 'Recolher' : 'Expandir'} prioridade ${priority.title}`} aria-expanded={expanded}>
          <span className="line-clamp-2 text-[11px] font-semibold leading-[1.15] hover:text-primary sm:line-clamp-1 sm:text-[13px]">{priority.title}</span>
        </button>
        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
          <span>{closed ? `${age}d de duração` : `Aberta há ${age}d`}</span>
          {priority.due_date && <span className={overdue ? 'font-semibold text-red-700' : ''}>{overdue ? 'Atrasada · ' : 'Prazo '}{new Date(`${priority.due_date}T12:00:00`).toLocaleDateString('pt-BR')}</span>}
          {scheduled && <span className="font-medium text-violet-700">Volta em {new Date(`${root?.scheduled_for}T12:00:00`).toLocaleDateString('pt-BR')}</span>}
          {priority.category && <span className="hidden lg:inline">{priority.category}</span>}
          {!!children.length && <span>{children.filter(task => task.completed).length}/{children.length} subtarefas</span>}
          <PriorityAssignee priority={priority} root={root} responsibleList={responsibleList} onUpdate={onUpdate} onUpdateTask={onUpdateTask} onRefreshTasks={onRefreshTasks} />
          {!closed && <PriorityWeight priority={priority} onUpdate={onUpdate} />}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {!closed && <PrioritySchedule task={root} onUpdateTask={onUpdateTask} />}
        {!closed && <button type="button" onClick={async () => { if (await onUpdate(priority.id, { status: 'concluida' })) await onRefreshTasks(); }} title="Concluir prioridade" aria-label="Concluir prioridade" className="p-1.5 text-emerald-700 hover:bg-emerald-50"><Check className="h-4 w-4" /></button>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button type="button" title="Mais ações" aria-label="Mais ações da prioridade" className="hidden p-1.5 text-muted-foreground hover:bg-muted sm:block"><MoreHorizontal className="h-4 w-4" /></button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}><Pencil className="mr-2 h-4 w-4" />Editar prioridade</DropdownMenuItem>
            <DropdownMenuItem className="text-red-700 focus:text-red-700" onSelect={() => void remove()}><Trash2 className="mr-2 h-4 w-4" />Excluir prioridade</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    {expanded && <div className="bg-white px-3 pb-3 sm:px-4">
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

function QuickPriorityInput({ client, assignee, color, onCreate, onRefreshTasks, onClose }: {
  client: Client; assignee: string; color: string; onCreate: Props['onCreate']; onRefreshTasks: Props['onRefreshTasks']; onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  return <form className="flex min-w-0 flex-1 items-center gap-1 px-1" onSubmit={async event => {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const created = await onCreate({ title: title.trim(), client_id: client.id, assigned_to: [assignee], status: 'aberta', weight: 3 }, client.name);
    if (created) { await onRefreshTasks(); onClose(); }
    setSaving(false);
  }}>
    <Input autoFocus value={title} onChange={event => setTitle(event.target.value)} aria-label={`Nova prioridade para ${client.name}`} placeholder="Descreva a nova prioridade" className="h-7 min-w-0 flex-1 border-0 bg-white/90 text-[11px] shadow-none focus-visible:ring-1" />
    <button type="submit" disabled={!title.trim() || saving} title="Adicionar prioridade" aria-label="Adicionar prioridade" className="flex h-7 w-7 shrink-0 items-center justify-center text-white disabled:opacity-40" style={{ backgroundColor: color }}><Plus className="h-4 w-4" /></button>
    <button type="button" onClick={onClose} title="Cancelar" aria-label="Cancelar nova prioridade" className="flex h-7 w-7 shrink-0 items-center justify-center text-slate-500 hover:bg-white"><X className="h-4 w-4" /></button>
  </form>;
}

export function PrioritiesTab({ collaborator, color, isTeamView, priorities, tasks, clients, responsibleList, allowCollaboratorFilter = false, initialClientId, onCreate, onCreateMany, onUpdate, onDelete, onCreateSubtask, onToggleTask, onUpdateTask, onRefreshTasks }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Priority | null>(null);
  const [presetClientId, setPresetClientId] = useState<string | null>(null);
  const [quickClientId, setQuickClientId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showScheduled, setShowScheduled] = useState(false);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState(initialClientId || 'all');
  const [collaboratorFilter, setCollaboratorFilter] = useState(collaborator);
  const [viewMode, setViewMode] = useState<'list' | 'panel'>('list');
  const [sortMode, setSortMode] = useState<SortMode>('weight-time');
  useEffect(() => setClientFilter(initialClientId || 'all'), [initialClientId]);
  useEffect(() => setCollaboratorFilter(collaborator), [collaborator]);
  const clientById = useMemo(() => new Map(clients.map(client => [client.id, client])), [clients]);
  const filtered = useMemo(() => priorities.filter(priority =>
    (isTeamView || collaboratorFilter === 'all' || Boolean(initialClientId) || assigneeMatches(priority.assigned_to, collaboratorFilter))
    && (showAll || (priority.status !== 'concluida' && priority.status !== 'cancelada'))
    && (showScheduled || !(() => { const root = rootTaskFor(priority, tasks); return Boolean(root?.scheduled_for && root.scheduled_for > today()); })())
    && (clientFilter === 'all' || priority.client_id === clientFilter)
    && (!search.trim() || `${priority.title} ${priority.description || ''} ${clientById.get(priority.client_id || '')?.name || ''}`.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')))
  ).sort((a, b) => sortMode === 'oldest'
    ? a.created_at.localeCompare(b.created_at) || b.weight - a.weight
    : b.weight - a.weight || a.created_at.localeCompare(b.created_at)), [priorities, tasks, isTeamView, initialClientId, collaboratorFilter, showAll, showScheduled, clientFilter, search, clientById, sortMode]);
  const groups = useMemo(() => {
    const byClient = new Map<string, Priority[]>();
    filtered.forEach(priority => { const key = priority.client_id || 'sem-cliente'; byClient.set(key, [...(byClient.get(key) || []), priority]); });
    return [...byClient].sort(([a, aItems], [b, bItems]) => bItems[0].weight - aItems[0].weight
      || aItems[0].created_at.localeCompare(bItems[0].created_at)
      || (clientById.get(a)?.name || 'Sem cliente').localeCompare(clientById.get(b)?.name || 'Sem cliente', 'pt-BR'));
  }, [filtered, clientById]);

  return <div className="space-y-3">
    <div className="border bg-white p-2 shadow-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex h-8 items-center border bg-slate-50" role="group" aria-label="Ordenar prioridades">
          <span className="hidden px-2 text-[10px] text-muted-foreground lg:inline">Ordenar</span>
          <button type="button" aria-pressed={sortMode === 'weight-time'} onClick={() => setSortMode('weight-time')} title="Maior peso e depois maior tempo em aberto" className={`flex h-8 w-8 items-center justify-center ${sortMode === 'weight-time' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-white'}`}><ArrowDownWideNarrow className="h-4 w-4" /></button>
          <button type="button" aria-pressed={sortMode === 'oldest'} onClick={() => setSortMode('oldest')} title="Mais antigas primeiro" className={`flex h-8 w-8 items-center justify-center ${sortMode === 'oldest' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-white'}`}><Clock3 className="h-4 w-4" /></button>
        </div>
        <div className="relative min-w-[190px] flex-1"><Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" /><Input className="h-8 pl-8 text-xs" placeholder="Buscar prioridade ou cliente" value={search} onChange={event => setSearch(event.target.value)} /></div>
        <select aria-label="Filtrar cliente" value={clientFilter} onChange={event => setClientFilter(event.target.value)} className="h-8 max-w-[190px] border bg-white px-2 text-xs"><option value="all">Todos os clientes</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select>
        {allowCollaboratorFilter && <select aria-label="Filtrar colaborador" value={collaboratorFilter} onChange={event => setCollaboratorFilter(event.target.value)} className="h-8 max-w-[190px] border bg-white px-2 text-xs"><option value="all">Todos os colaboradores</option>{responsibleList.map(person => <option key={person.name} value={person.name}>{person.name}</option>)}</select>}
        <label className="flex h-8 items-center gap-1 border px-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={showAll} onChange={event => setShowAll(event.target.checked)} />Concluídas</label>
        <label className="flex h-8 items-center gap-1 border px-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={showScheduled} onChange={event => setShowScheduled(event.target.checked)} />Planejadas</label>
        <Button size="sm" className="h-8" onClick={() => { setEditing(null); setPresetClientId(clientFilter === 'all' ? null : clientFilter); setModalOpen(true); }} style={{ backgroundColor: color }}><Plus className="mr-1 h-4 w-4" />Nova prioridade</Button>
      </div>
    </div>
    <div className="flex items-center justify-between gap-3 border-b pb-2">
      <p className="text-xs text-muted-foreground">{filtered.length} prioridades em {groups.length} clientes</p>
      <div className="flex border" role="group" aria-label="Modo de visualização">
        <button type="button" aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')} className={`inline-flex h-8 items-center gap-1 px-2 text-xs ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}><List className="h-3.5 w-3.5" />Lista</button>
        <button type="button" aria-pressed={viewMode === 'panel'} onClick={() => setViewMode('panel')} className={`inline-flex h-8 items-center gap-1 border-l px-2 text-xs ${viewMode === 'panel' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}><LayoutGrid className="h-3.5 w-3.5" />Painel</button>
      </div>
    </div>
    {groups.length === 0 && <div className="border px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma prioridade para este filtro.</div>}
    <div className={viewMode === 'panel' ? 'grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4' : 'space-y-3'}>{groups.map(([clientId, items]) => {
      const client = clientById.get(clientId);
      const colors = [...new Set(items.flatMap(item => item.assigned_to).map(name => responsibleList.find(person => person.name === name)?.color).filter(Boolean))] as string[];
      const headerBackground = colors.length > 1 ? `linear-gradient(90deg, ${colors.map((item, index) => `${colorWithAlpha(item, '22')} ${Math.round(index * 100 / Math.max(1, colors.length - 1))}%`).join(', ')})` : colorWithAlpha(colors[0] || color, '18');
      const quickOpen = quickClientId === clientId;
      const quickAssignee = collaboratorFilter !== 'all' ? collaboratorFilter : collaborator;
      return <section key={clientId} className="client-card-compact min-w-0 overflow-hidden border-t-2 bg-white" style={{ borderTopColor: colors[0] || color }}>
        <header className="flex h-11 min-w-0 items-center border-b px-2" style={{ background: headerBackground }}>
          {quickOpen && client ? <QuickPriorityInput client={client} assignee={quickAssignee} color={color} onCreate={onCreate} onRefreshTasks={onRefreshTasks} onClose={() => setQuickClientId(null)} /> : <button type="button" onClick={() => client && setQuickClientId(client.id)} disabled={!client} title={client ? `Adicionar prioridade para ${client.name}` : 'Sem cliente'} aria-label={client ? `Adicionar prioridade para ${client.name}` : 'Sem cliente'} className="flex h-full min-w-0 flex-1 items-center gap-2 text-left">
            {client?.logoUrl ? <img src={client.logoUrl} alt={`Logo ${client.name}`} className="h-8 w-12 shrink-0 object-contain" /> : null}
            <span className={`min-w-0 flex-1 truncate font-bold text-slate-800 ${client?.logoUrl ? 'text-xs' : 'text-sm'}`}>{client?.name || 'Sem cliente'}</span>
            <span className="shrink-0 bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{items.length}</span>
            <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />
          </button>}
        </header>
        <div className="min-w-0">{items.map((priority, rowIndex) => <PriorityItem key={priority.id} priority={priority} client={client} tasks={tasks} rowIndex={rowIndex} responsibleList={responsibleList} onUpdate={onUpdate} onDelete={onDelete} onCreateSubtask={onCreateSubtask} onToggleTask={onToggleTask} onUpdateTask={onUpdateTask} onRefreshTasks={onRefreshTasks} onEdit={() => { setEditing(priority); setPresetClientId(priority.client_id); setModalOpen(true); }} />)}</div>
      </section>;
    })}</div>
    <PriorityModal open={modalOpen} onOpenChange={setModalOpen} editing={editing} defaultAssignee={isTeamView ? undefined : collaborator} presetClientId={presetClientId} allowMultipleClients={!editing && !presetClientId} lockClientId={Boolean(editing?.client_id)} clients={clients} responsibleList={responsibleList} onSubmit={async data => {
      if (editing) { if (await onUpdate(editing.id, data)) { await onRefreshTasks(); setModalOpen(false); } }
      else if (data.client_ids?.length && !presetClientId) { const created = await onCreateMany(data, data.client_ids); if (created.length) { await onRefreshTasks(); setModalOpen(false); } }
      else { const created = await onCreate(data, data.client_id ? clientById.get(data.client_id)?.name : undefined); if (created) { await onRefreshTasks(); setModalOpen(false); } }
    }} />
  </div>;
}
