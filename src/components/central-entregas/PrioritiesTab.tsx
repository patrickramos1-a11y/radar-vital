import { useEffect, useMemo, useState } from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { Check, ChevronDown, ChevronRight, Circle, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import type { Client } from '@/types/client';
import type { Priority, PriorityFormData } from '@/types/priority';
import type { Task, TaskFormData } from '@/types/task';
import { assigneeMatches } from '@/lib/taskAssignee';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  initialClientId?: string | null;
  onCreate: (data: PriorityFormData, clientName?: string) => Promise<Priority | null>;
  onCreateMany: (data: PriorityFormData, clientIds: string[]) => Promise<Priority[]>;
  onUpdate: (id: string, data: Partial<PriorityFormData>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onCreateSubtask: (clientId: string, data: TaskFormData, clientName?: string) => Promise<boolean>;
  onToggleTask: (taskId: string, clientName?: string) => Promise<boolean>;
  onRefreshTasks: () => Promise<void>;
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

function PriorityItem({ priority, client, tasks, onUpdate, onDelete, onCreateSubtask, onToggleTask, onEdit, onRefreshTasks }: {
  priority: Priority; client?: Client; tasks: Task[];
  onUpdate: Props['onUpdate']; onDelete: Props['onDelete'];
  onCreateSubtask: Props['onCreateSubtask']; onToggleTask: Props['onToggleTask'];
  onEdit: () => void; onRefreshTasks: Props['onRefreshTasks'];
}) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const root = tasks.find(task => task.id === priority.source_task_id)
    || tasks.find(task => task.priority_id === priority.id && !task.parent_task_id);
  const children = root ? tasks.filter(task => task.parent_task_id === root.id) : [];
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

  return <article className={`border-b bg-white last:border-b-0 ${overdue ? 'border-l-2 border-l-red-500' : ''}`}>
    <div className="flex min-w-0 items-start gap-2 px-3 py-3">
      <button type="button" onClick={() => setExpanded(value => !value)} className="mt-0.5 shrink-0 p-1 text-muted-foreground" aria-label={expanded ? 'Recolher subtarefas' : 'Mostrar subtarefas'} aria-expanded={expanded}>
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      <Star className={`mt-1 h-4 w-4 shrink-0 ${closed ? 'text-slate-400' : 'fill-amber-400 text-amber-500'}`} />
      <div className="min-w-0 flex-1">
        <button type="button" onClick={() => setExpanded(value => !value)} className="block max-w-full text-left text-sm font-semibold leading-snug hover:text-primary">{priority.title}</button>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span>{closed ? `${age}d de duração` : `Aberta há ${age}d`}</span>
          {priority.due_date && <span className={overdue ? 'font-semibold text-red-700' : ''}>{overdue ? 'Atrasada · ' : 'Prazo '}{new Date(`${priority.due_date}T12:00:00`).toLocaleDateString('pt-BR')}</span>}
          <span>Peso {priority.weight}</span>
          {priority.category && <span>{priority.category}</span>}
          {!!children.length && <span>{children.filter(task => task.completed).length}/{children.length} subtarefas</span>}
          {!!priority.assigned_to.length && <span>{priority.assigned_to.join(', ')}</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!closed && <button type="button" onClick={async () => { if (await onUpdate(priority.id, { status: 'concluida' })) await onRefreshTasks(); }} title="Concluir prioridade" aria-label="Concluir prioridade" className="p-1.5 text-emerald-700 hover:bg-emerald-50"><Check className="h-4 w-4" /></button>}
        <button type="button" onClick={onEdit} title="Editar prioridade" aria-label="Editar prioridade" className="p-1.5 text-muted-foreground hover:bg-muted"><Pencil className="h-4 w-4" /></button>
        <button type="button" onClick={async () => { if (window.confirm('Excluir esta prioridade? A tarefa continuará no cliente.')) { await onDelete(priority.id); await onRefreshTasks(); } }} title="Excluir prioridade" aria-label="Excluir prioridade" className="p-1.5 text-muted-foreground hover:bg-muted"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
    {expanded && <div className="px-4 pb-3 pl-10 sm:pl-12">
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

export function PrioritiesTab({ collaborator, color, isTeamView, priorities, tasks, clients, responsibleList, initialClientId, onCreate, onCreateMany, onUpdate, onDelete, onCreateSubtask, onToggleTask, onRefreshTasks }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Priority | null>(null);
  const [presetClientId, setPresetClientId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState(initialClientId || 'all');
  useEffect(() => setClientFilter(initialClientId || 'all'), [initialClientId]);
  const clientById = useMemo(() => new Map(clients.map(client => [client.id, client])), [clients]);
  const filtered = useMemo(() => priorities.filter(priority =>
    (isTeamView || Boolean(initialClientId) || assigneeMatches(priority.assigned_to, collaborator))
    && (showAll || (priority.status !== 'concluida' && priority.status !== 'cancelada'))
    && (clientFilter === 'all' || priority.client_id === clientFilter)
    && (!search.trim() || `${priority.title} ${priority.description || ''} ${clientById.get(priority.client_id || '')?.name || ''}`.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')))
  ).sort((a, b) => {
    const today = new Date().toISOString().slice(0, 10);
    const aOverdue = a.due_date && a.due_date < today && a.status !== 'concluida' ? 1 : 0;
    const bOverdue = b.due_date && b.due_date < today && b.status !== 'concluida' ? 1 : 0;
    return b.weight - a.weight || bOverdue - aOverdue
      || (a.due_date || '9999-12-31').localeCompare(b.due_date || '9999-12-31')
      || a.created_at.localeCompare(b.created_at);
  }), [priorities, isTeamView, initialClientId, collaborator, showAll, clientFilter, search, clientById]);
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
      <label className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={showAll} onChange={event => setShowAll(event.target.checked)} />Concluídas</label>
      <Button size="sm" onClick={() => { setEditing(null); setPresetClientId(clientFilter === 'all' ? null : clientFilter); setModalOpen(true); }} style={{ backgroundColor: color }}><Plus className="mr-1 h-4 w-4" />Nova prioridade</Button>
    </div>
    <p className="text-xs text-muted-foreground">{filtered.length} prioridades em {groups.length} clientes</p>
    {groups.length === 0 && <div className="border px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma prioridade para este filtro.</div>}
    {groups.map(([clientId, items]) => {
      const client = clientById.get(clientId);
      return <section key={clientId} className="border-t-2 border-primary/70">
        <div className="flex items-center justify-between gap-2 py-2"><h3 className="min-w-0 truncate text-sm font-semibold">{client?.name || 'Sem cliente'} <span className="ml-1 text-xs font-normal text-muted-foreground">{items.length}</span></h3>
          {client && <button type="button" onClick={() => { setEditing(null); setPresetClientId(client.id); setModalOpen(true); }} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary"><Plus className="h-3.5 w-3.5" />Prioridade</button>}</div>
        <div className="border-x border-t">{items.map(priority => <PriorityItem key={priority.id} priority={priority} client={client} tasks={tasks} onUpdate={onUpdate} onDelete={onDelete} onCreateSubtask={onCreateSubtask} onToggleTask={onToggleTask} onRefreshTasks={onRefreshTasks} onEdit={() => { setEditing(priority); setPresetClientId(priority.client_id); setModalOpen(true); }} />)}</div>
      </section>;
    })}
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
