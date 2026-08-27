import { useState, useMemo } from 'react';
import { Task, TaskFormData, TaskPriority, PRIORITY_CONFIG } from '@/types/task';
import { Priority, PriorityFormData } from '@/types/priority';
import { Client } from '@/types/client';
import { assigneeMatches } from '@/lib/taskAssignee';
import { Star, CheckCircle2, AlertCircle, ArrowUpDown, Plus, Circle, Search, Users } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PriorityModal } from './PriorityModal';
import { ClientCell } from './ClientCell';
import { CollaboratorAvatar } from './CollaboratorAvatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { normalizeAssignee } from '@/lib/taskAssignee';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface RespOption { name: string; color: string; initials: string; }

interface Props {
  collaborator: string;
  color: string;
  isTeamView: boolean;
  tasks: Task[];
  priorities: Priority[];
  clients: Client[];
  responsibleList: RespOption[];
  onPromote: (taskId: string, taskTitle: string, data: PriorityFormData, clientName?: string) => Promise<Priority | null>;
  onToggleComplete: (taskId: string, clientName?: string) => Promise<boolean>;
  onCreateTask: (clientId: string, data: TaskFormData, clientName?: string) => Promise<boolean>;
  onUpdateTask: (taskId: string, data: Partial<Task>) => Promise<boolean>;
  getDaysOpen: (t: Task) => number;
}

type TaskSortKey = 'title' | 'client' | 'assignees' | 'dueDate' | 'daysOpen' | 'priority';

export function TasksTab({ collaborator, color, isTeamView, tasks, priorities, clients, responsibleList, onPromote, onToggleComplete, onCreateTask, onUpdateTask, getDaysOpen }: Props) {
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showDone, setShowDone] = useState(false);
  const [sortKey, setSortKey] = useState<TaskSortKey>('daysOpen');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [promotingTask, setPromotingTask] = useState<Task | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  const clientById = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const priorityMap = useMemo(() => new Map(priorities.map(p => [p.id, p])), [priorities]);

  const filtered = useMemo(() => {
    let list = tasks.filter(t => isTeamView ? true : assigneeMatches(t.assigned_to, collaborator));
    if (!showDone) list = list.filter(t => !t.completed);
    if (clientFilter !== 'all') list = list.filter(t => t.client_id === clientFilter);
    if (assigneeFilter === 'unassigned') list = list.filter(t => t.assigned_to.length === 0);
    else if (assigneeFilter !== 'all') list = list.filter(t => assigneeMatches(t.assigned_to, assigneeFilter));

    const query = search.trim().toLocaleLowerCase('pt-BR');
    if (query) list = list.filter(t => {
      const clientName = clientById.get(t.client_id)?.name ?? '';
      return [t.title, clientName, ...t.assigned_to].some(value => value.toLocaleLowerCase('pt-BR').includes(query));
    });

    const compareText = (a: string, b: string) => a.localeCompare(b, 'pt-BR');
    list.sort((a, b) => {
      const aPriority = a.priority_id ? priorityMap.get(a.priority_id)?.title ?? '' : '';
      const bPriority = b.priority_id ? priorityMap.get(b.priority_id)?.title ?? '' : '';
      const values: Record<TaskSortKey, number> = {
        title: compareText(a.title, b.title),
        client: compareText(clientById.get(a.client_id)?.name ?? '', clientById.get(b.client_id)?.name ?? ''),
        assignees: compareText(a.assigned_to.join(', '), b.assigned_to.join(', ')),
        dueDate: (a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER) - (b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER),
        daysOpen: getDaysOpen(a) - getDaysOpen(b),
        priority: compareText(aPriority, bPriority),
      };
      return values[sortKey] * (sortDirection === 'asc' ? 1 : -1);
    });
    return list;
  }, [tasks, collaborator, isTeamView, clientFilter, assigneeFilter, search, showDone, sortKey, sortDirection, getDaysOpen, clientById, priorityMap]);

  const linkedClients = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach(t => { if (isTeamView || assigneeMatches(t.assigned_to, collaborator)) ids.add(t.client_id); });
    return clients.filter(c => ids.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks, clients, collaborator, isTeamView]);

  const toggleSort = (key: TaskSortKey) => {
    if (key === sortKey) setSortDirection(direction => direction === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDirection(key === 'daysOpen' ? 'desc' : 'asc'); }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="px-2 py-1.5 border rounded-md text-xs bg-background">
          <option value="all">Todos os clientes</option>
          {linkedClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)} className="px-2 py-1.5 border rounded-md text-xs bg-background">
          <option value="all">Todos os responsáveis</option>
          <option value="unassigned">Sem responsável</option>
          {responsibleList.map(responsible => <option key={responsible.name} value={responsible.name}>{responsible.name}</option>)}
        </select>
        <div className="relative min-w-[180px] flex-1 sm:flex-none">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Filtrar tabela" className="h-8 pl-7 text-xs" />
        </div>
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          <input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} />
          incluir concluídas
        </label>
        <div className="text-xs text-muted-foreground">{filtered.length} tarefa(s)</div>
        <Button onClick={() => setNewTaskOpen(true)} size="sm" className="ml-auto" style={{ backgroundColor: color }}>
          <Plus className="w-4 h-4 mr-1" /> Nova tarefa
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="max-h-[640px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 w-8"></th>
                <SortHeader label="Tarefa" sortKey="title" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                <SortHeader label="Cliente" sortKey="client" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                <SortHeader label="Responsáveis" sortKey="assignees" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                <SortHeader label="Prazo" sortKey="dueDate" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                <SortHeader label="Dias" sortKey="daysOpen" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} align="center" />
                <SortHeader label="Prioridade vinc." sortKey="priority" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                <th className="px-3 py-2 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma tarefa.</td></tr>
              ) : filtered.map(t => {
                const days = getDaysOpen(t);
                const linkedPriority = t.priority_id ? priorityMap.get(t.priority_id) : null;
                const pcfg = PRIORITY_CONFIG[t.priority];
                const client = clientById.get(t.client_id);
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const dueDate = t.due_date ? new Date(t.due_date) : null;
                const overdue = dueDate && !t.completed && dueDate < today;
                const daysToDue = dueDate ? differenceInCalendarDays(dueDate, today) : null;

                return (
                  <tr
                    key={t.id}
                    className={cn(
                      'hover:bg-muted/30 transition-colors',
                      t.completed && 'opacity-50',
                      overdue && 'bg-red-50/40'
                    )}
                    style={overdue ? { borderLeft: '3px solid #DC2626' } : {}}
                  >
                    <td className="px-3 py-2">
                      <button
                        onClick={() => onToggleComplete(t.id, client?.name)}
                        title={t.completed ? 'Reabrir' : 'Concluir'}
                        className="p-1 rounded hover:bg-muted"
                      >
                        {t.completed
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          : <Circle className="w-5 h-5 text-muted-foreground hover:text-emerald-600" />}
                      </button>
                    </td>
                    <td className="px-3 py-2 max-w-[300px]">
                      <div className="flex items-start gap-2">
                        <span className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: pcfg.color }} />
                        <div className="min-w-0">
                          <div className={cn('font-medium text-sm break-words', t.completed && 'line-through text-muted-foreground')}>{t.title}</div>
                          <div className="text-[10px]" style={{ color: pcfg.color }}>{pcfg.label}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2"><ClientCell client={client} size={22} /></td>
                    <td className="px-3 py-2">
                      <TaskAssigneeEditor task={t} responsibleList={responsibleList} onUpdate={onUpdateTask} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {dueDate ? (
                        <>
                          <div className={overdue ? 'text-red-700 font-semibold' : 'text-muted-foreground'}>
                            {format(dueDate, 'dd/MM/yy', { locale: ptBR })}
                          </div>
                          {daysToDue !== null && !t.completed && (
                            <div className={cn('text-[10px]', overdue ? 'text-red-600' : daysToDue <= 3 ? 'text-amber-600' : 'text-muted-foreground')}>
                              {overdue ? `${Math.abs(daysToDue)}d atrasada` : daysToDue === 0 ? 'hoje' : `em ${daysToDue}d`}
                            </div>
                          )}
                        </>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={cn('font-bold text-sm', !t.completed && days > 30 ? 'text-red-600' : !t.completed && days > 14 ? 'text-amber-600' : 'text-muted-foreground')}>{days}d</span>
                    </td>
                    <td className="px-3 py-2">
                      {linkedPriority ? (
                        <span className="inline-flex max-w-[160px] items-center gap-1 truncate rounded bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700" title={`Prioridade vinculada: ${linkedPriority.title}`}>
                          <Star className="h-3 w-3 flex-shrink-0" /> Prioridade vinculada
                        </span>
                      ) : (t.completed ? (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      ) : (
                        <button
                          onClick={() => setPromotingTask(t)}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border bg-red-50 text-red-700 hover:bg-red-100 border-red-200 font-medium"
                        >
                          <Star className="w-3 h-3" /> Promover
                        </button>
                      ))}
                    </td>
                    <td className="px-3 py-2 text-right text-[11px]">
                      {t.completed ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Concluída</span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-amber-600"><AlertCircle className="w-3 h-3" /> Pendente</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <PriorityModal
        open={!!promotingTask}
        onOpenChange={(v) => { if (!v) setPromotingTask(null); }}
        editing={null}
        defaultAssignee={collaborator}
        presetTitle={promotingTask?.title}
        presetClientId={promotingTask?.client_id}
        clients={clients}
        responsibleList={responsibleList}
        submitLabel="Promover para prioridade"
        onSubmit={async (data) => {
          if (!promotingTask) return;
          const clientName = data.client_id ? clientById.get(data.client_id)?.name : undefined;
          await onPromote(promotingTask.id, promotingTask.title, data, clientName);
          setPromotingTask(null);
        }}
      />

      <NewTaskDialog
        open={newTaskOpen}
        onOpenChange={setNewTaskOpen}
        color={color}
        defaultAssignee={isTeamView ? undefined : collaborator}
        clients={clients}
        responsibleList={responsibleList}
        onSubmit={async (clientId, data) => {
          const clientName = clientById.get(clientId)?.name;
          const ok = await onCreateTask(clientId, data, clientName);
          if (ok) setNewTaskOpen(false);
        }}
      />
    </div>
  );
}

function SortHeader({ label, sortKey, activeKey, direction, onSort, align = 'left' }: {
  label: string;
  sortKey: TaskSortKey;
  activeKey: TaskSortKey;
  direction: 'asc' | 'desc';
  onSort: (key: TaskSortKey) => void;
  align?: 'left' | 'center';
}) {
  const active = sortKey === activeKey;
  return (
    <th className={`px-3 py-2 font-medium ${align === 'center' ? 'text-center' : ''}`}>
      <button type="button" onClick={() => onSort(sortKey)} className={`inline-flex items-center gap-1 hover:text-foreground ${align === 'center' ? 'justify-center' : ''}`} title={`Ordenar por ${label}`}>
        {label}
        <ArrowUpDown className={`h-3 w-3 ${active ? 'text-foreground' : 'text-muted-foreground/60'}`} />
        {active && <span className="text-[9px]">{direction === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  );
}

function TaskAssigneeEditor({ task, responsibleList, onUpdate }: {
  task: Task;
  responsibleList: RespOption[];
  onUpdate: (taskId: string, data: Partial<Task>) => Promise<boolean>;
}) {
  const toggle = (name: string) => {
    const assigned = task.assigned_to.some(value => normalizeAssignee(value) === normalizeAssignee(name))
      ? task.assigned_to.filter(value => normalizeAssignee(value) !== normalizeAssignee(name))
      : [...task.assigned_to, name];
    void onUpdate(task.id, { assigned_to: assigned });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="flex min-h-7 min-w-8 items-center gap-1 rounded border border-transparent px-1 transition-colors hover:border-border hover:bg-muted" title="Adicionar ou alterar responsáveis">
          {task.assigned_to.length > 0 ? (
            <div className="flex -space-x-1.5">
              {task.assigned_to.slice(0, 4).map(name => <CollaboratorAvatar key={name} name={name} size={22} ring />)}
            </div>
          ) : <><Users className="h-4 w-4 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Sem responsável</span></>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <p className="mb-2 text-xs font-medium">Responsáveis</p>
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {responsibleList.map(responsible => {
            const selected = task.assigned_to.some(value => normalizeAssignee(value) === normalizeAssignee(responsible.name));
            return (
              <label key={responsible.name} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1.5 text-xs hover:bg-muted">
                <input type="checkbox" checked={selected} onChange={() => toggle(responsible.name)} />
                <CollaboratorAvatar name={responsible.name} size={20} />
                <span>{responsible.name}</span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NewTaskDialog({
  open, onOpenChange, color, defaultAssignee, clients, responsibleList, onSubmit
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  color: string;
  defaultAssignee?: string;
  clients: Client[];
  responsibleList: RespOption[];
  onSubmit: (clientId: string, data: TaskFormData) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [assigned, setAssigned] = useState<string[]>(defaultAssignee ? [defaultAssignee] : []);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setTitle(''); setClientId(''); setDueDate(''); setPriority('normal');
      setAssigned(defaultAssignee ? [defaultAssignee] : []);
    }
    onOpenChange(nextOpen);
  };

  const toggle = (name: string) => setAssigned(prev => prev.some(a => normalizeAssignee(a) === normalizeAssignee(name))
    ? prev.filter(a => normalizeAssignee(a) !== normalizeAssignee(name))
    : [...prev, name]);

  const submit = async () => {
    if (!title.trim() || !clientId) return;
    await onSubmit(clientId, { title: title.trim(), assigned_to: assigned, due_date: dueDate || undefined, priority });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova tarefa</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Enviar relatório..." autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cliente *</Label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full px-2 py-2 border rounded-md bg-background text-sm">
                <option value="">— Selecione —</option>
                {clients.filter(c => c.isActive).sort((a, b) => a.name.localeCompare(b.name)).map(c =>
                  <option key={c.id} value={c.id}>{c.name}</option>
                )}
              </select>
            </div>
            <div>
              <Label>Prazo</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Prioridade</Label>
            <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className="w-full px-2 py-2 border rounded-md bg-background text-sm">
              {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map(p => (
                <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Responsáveis</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {responsibleList.map(r => {
                const sel = assigned.some(a => normalizeAssignee(a) === normalizeAssignee(r.name));
                return (
                  <button key={r.name} type="button" onClick={() => toggle(r.name)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${sel ? 'text-white' : 'bg-background hover:bg-muted'}`}
                    style={sel ? { backgroundColor: r.color, borderColor: r.color } : {}}>
                    {r.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!title.trim() || !clientId} style={{ backgroundColor: color }}>Criar tarefa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
