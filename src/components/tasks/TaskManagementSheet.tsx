import { useMemo, useState } from 'react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowDownAZ,
  ArrowUpDown,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  FilterX,
  Loader2,
  Search,
  UserRoundX,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { normalizeAssignee } from '@/lib/taskAssignee';
import { Client } from '@/types/client';
import { Collaborator } from '@/types/collaborator';
import { PRIORITY_CONFIG, Task, TaskPriority } from '@/types/task';

type StatusFilter = 'pending' | 'completed' | 'all';
type SortKey = 'title' | 'client' | 'assignees' | 'priority' | 'createdAt' | 'daysOpen' | 'dueDate' | 'status';
type SortDirection = 'asc' | 'desc';

interface Props {
  tasks: Task[];
  clients: Client[];
  collaborators: Collaborator[];
  isLoading: boolean;
  error: string | null;
  getDaysOpen: (task: Task) => number;
  onToggleComplete: (taskId: string, clientName?: string) => Promise<boolean>;
  onUpdateTask: (taskId: string, data: Partial<Task>) => Promise<boolean>;
}

const priorityOptions = Object.keys(PRIORITY_CONFIG) as TaskPriority[];

export function TaskManagementSheet({
  tasks,
  clients,
  collaborators,
  isLoading,
  error,
  getDaysOpen,
  onToggleComplete,
  onUpdateTask,
}: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [clientFilter, setClientFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const clientById = useMemo(() => new Map(clients.map(client => [client.id, client])), [clients]);
  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [clients],
  );
  const sortedCollaborators = useMemo(
    () => [...collaborators].filter(item => item.isActive).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [collaborators],
  );

  const pendingTasks = useMemo(() => tasks.filter(task => !task.completed), [tasks]);
  const unassignedCount = useMemo(
    () => pendingTasks.filter(task => task.assigned_to.length === 0).length,
    [pendingTasks],
  );
  const oldestDays = useMemo(
    () => pendingTasks.reduce((oldest, task) => Math.max(oldest, getDaysOpen(task)), 0),
    [pendingTasks, getDaysOpen],
  );

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
    const direction = sortDirection === 'asc' ? 1 : -1;

    return tasks
      .filter(task => {
        if (statusFilter === 'pending' && task.completed) return false;
        if (statusFilter === 'completed' && !task.completed) return false;
        if (clientFilter !== 'all' && task.client_id !== clientFilter) return false;
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
        if (assigneeFilter === 'unassigned' && task.assigned_to.length > 0) return false;
        if (assigneeFilter !== 'all' && assigneeFilter !== 'unassigned') {
          const matches = task.assigned_to.some(name => normalizeAssignee(name) === normalizeAssignee(assigneeFilter));
          if (!matches) return false;
        }
        if (!normalizedSearch) return true;
        const clientName = clientById.get(task.client_id)?.name ?? '';
        return [task.title, clientName, ...task.assigned_to]
          .some(value => value.toLocaleLowerCase('pt-BR').includes(normalizedSearch));
      })
      .sort((a, b) => {
        const text = (left: string, right: string) => left.localeCompare(right, 'pt-BR');
        const nullableDate = (value: string | null) => value ? parseISO(value).getTime() : Number.MAX_SAFE_INTEGER;
        const comparisons: Record<SortKey, number> = {
          title: text(a.title, b.title),
          client: text(clientById.get(a.client_id)?.name ?? '', clientById.get(b.client_id)?.name ?? ''),
          assignees: text(a.assigned_to.join(', '), b.assigned_to.join(', ')),
          priority: PRIORITY_CONFIG[a.priority].order - PRIORITY_CONFIG[b.priority].order,
          createdAt: parseISO(a.created_at).getTime() - parseISO(b.created_at).getTime(),
          daysOpen: getDaysOpen(a) - getDaysOpen(b),
          dueDate: nullableDate(a.due_date) - nullableDate(b.due_date),
          status: Number(a.completed) - Number(b.completed),
        };
        const result = comparisons[sortKey];
        if (result !== 0) return result * direction;
        return parseISO(a.created_at).getTime() - parseISO(b.created_at).getTime();
      });
  }, [assigneeFilter, clientById, clientFilter, getDaysOpen, priorityFilter, search, sortDirection, sortKey, statusFilter, tasks]);

  const update = async (task: Task, data: Partial<Task>) => {
    setUpdatingTaskId(task.id);
    try {
      await onUpdateTask(task.id, data);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDirection(key === 'daysOpen' ? 'desc' : 'asc');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('pending');
    setClientFilter('all');
    setAssigneeFilter('all');
    setPriorityFilter('all');
    setSortKey('createdAt');
    setSortDirection('asc');
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="border-b bg-muted/20 px-3 py-3 sm:px-6">
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <SummaryItem icon={CheckCircle2} value={pendingTasks.length} label="Pendentes" tone="text-amber-700" />
          <SummaryItem icon={UserRoundX} value={unassignedCount} label="Sem responsável" tone="text-red-700" />
          <SummaryItem icon={Clock3} value={`${oldestDays}d`} label="Mais antiga" tone="text-slate-700" />
          <span className="hidden text-xs text-muted-foreground sm:ml-auto sm:block">
            Edite responsáveis, prioridade e prazo diretamente na lista.
          </span>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1.4fr)_repeat(4,minmax(145px,0.8fr))_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar tarefa, cliente ou responsável" className="h-9 pl-9" />
          </label>
          <FilterSelect value={statusFilter} onChange={value => setStatusFilter(value as StatusFilter)} ariaLabel="Filtrar por status">
            <option value="pending">Pendentes</option>
            <option value="completed">Concluídas</option>
            <option value="all">Todos os status</option>
          </FilterSelect>
          <FilterSelect value={clientFilter} onChange={setClientFilter} ariaLabel="Filtrar por cliente">
            <option value="all">Todos os clientes</option>
            {sortedClients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
          </FilterSelect>
          <FilterSelect value={assigneeFilter} onChange={setAssigneeFilter} ariaLabel="Filtrar por responsável">
            <option value="all">Todos os responsáveis</option>
            <option value="unassigned">Sem responsável</option>
            {sortedCollaborators.map(collaborator => <option key={collaborator.id} value={collaborator.name}>{collaborator.name}</option>)}
          </FilterSelect>
          <FilterSelect value={priorityFilter} onChange={setPriorityFilter} ariaLabel="Filtrar por prioridade">
            <option value="all">Todas as prioridades</option>
            {priorityOptions.map(priority => <option key={priority} value={priority}>{PRIORITY_CONFIG[priority].label}</option>)}
          </FilterSelect>
          <Button variant="outline" size="sm" className="h-9 gap-2" onClick={resetFilters} title="Limpar filtros">
            <FilterX className="h-4 w-4" />
            <span className="lg:hidden xl:inline">Limpar</span>
          </Button>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <ArrowDownAZ className="h-3.5 w-3.5" />
          <span>{filteredTasks.length} tarefa(s) em exibição</span>
          <span>•</span>
          <span>{sortDirection === 'asc' ? 'ordem crescente' : 'ordem decrescente'}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando tarefas...
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-destructive">{error}</div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-muted-foreground">
          <FilterX className="mb-3 h-10 w-10 opacity-40" />
          <p className="font-medium text-foreground">Nenhuma tarefa encontrada</p>
          <p className="mt-1 text-sm">Ajuste os filtros para ampliar a consulta.</p>
        </div>
      ) : (
        <>
          <div className="hidden min-h-0 flex-1 overflow-auto md:block">
            <table className="w-full min-w-[1120px] table-fixed text-sm">
              <thead className="sticky top-0 z-10 border-b bg-muted/95 text-[11px] uppercase text-muted-foreground backdrop-blur">
                <tr>
                  <th className="w-11 px-3 py-2" aria-label="Concluir tarefa" />
                  <SortHeader label="Tarefa" sortKey="title" width="w-[29%]" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                  <SortHeader label="Cliente" sortKey="client" width="w-[18%]" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                  <SortHeader label="Responsáveis" sortKey="assignees" width="w-[15%]" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                  <SortHeader label="Prioridade" sortKey="priority" width="w-[11%]" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                  <SortHeader label="Criada" sortKey="createdAt" width="w-[9%]" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                  <SortHeader label="Tempo" sortKey="daysOpen" width="w-[8%]" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                  <SortHeader label="Prazo" sortKey="dueDate" width="w-[10%]" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    client={clientById.get(task.client_id)}
                    collaborators={sortedCollaborators}
                    daysOpen={getDaysOpen(task)}
                    updating={updatingTaskId === task.id}
                    onToggleComplete={() => onToggleComplete(task.id, clientById.get(task.client_id)?.name)}
                    onUpdate={data => update(task, data)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 md:hidden">
            {filteredTasks.map(task => (
              <TaskMobileCard
                key={task.id}
                task={task}
                client={clientById.get(task.client_id)}
                collaborators={sortedCollaborators}
                daysOpen={getDaysOpen(task)}
                updating={updatingTaskId === task.id}
                onToggleComplete={() => onToggleComplete(task.id, clientById.get(task.client_id)?.name)}
                onUpdate={data => update(task, data)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function SummaryItem({ icon: Icon, value, label, tone }: { icon: typeof Clock3; value: string | number; label: string; tone: string }) {
  return (
    <div className="flex min-h-[58px] min-w-0 items-center gap-2 rounded border bg-card px-2.5 py-2 sm:min-w-[145px]">
      <Icon className={cn('h-4 w-4 shrink-0', tone)} />
      <div className="min-w-0">
        <div className={cn('text-base font-bold leading-none', tone)}>{value}</div>
        <div className="mt-1 text-[9px] uppercase leading-tight text-muted-foreground sm:text-[10px]">{label}</div>
      </div>
    </div>
  );
}

function FilterSelect({ value, onChange, ariaLabel, children }: { value: string; onChange: (value: string) => void; ariaLabel: string; children: React.ReactNode }) {
  return (
    <select value={value} onChange={event => onChange(event.target.value)} aria-label={ariaLabel} className="h-9 min-w-0 rounded-md border bg-background px-2 text-xs">
      {children}
    </select>
  );
}

function SortHeader({ label, sortKey, width, activeKey, direction, onSort }: {
  label: string;
  sortKey: SortKey;
  width: string;
  activeKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === sortKey;
  return (
    <th className={cn('px-3 py-2 text-left font-medium', width)}>
      <button type="button" onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 hover:text-foreground" title={`Ordenar por ${label}`}>
        {label}
        <ArrowUpDown className={cn('h-3 w-3', active ? 'text-foreground' : 'opacity-40')} />
        {active && <span className="text-[9px]">{direction === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  );
}

function TaskRow({ task, client, collaborators, daysOpen, updating, onToggleComplete, onUpdate }: TaskItemProps) {
  const overdue = isOverdue(task);
  const priority = PRIORITY_CONFIG[task.priority];
  return (
    <tr className={cn('transition-colors hover:bg-muted/30', task.completed && 'opacity-55', overdue && 'bg-red-50/40')}>
      <td className="px-3 py-2 text-center">
        <button type="button" onClick={onToggleComplete} className="rounded p-1 hover:bg-muted" title={task.completed ? 'Reabrir tarefa' : 'Concluir tarefa'}>
          {task.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
        </button>
      </td>
      <td className="px-3 py-2 align-top">
        <div className="flex gap-2">
          <span className="w-1 shrink-0 rounded-full" style={{ backgroundColor: priority.color }} />
          <div className="min-w-0">
            <p className={cn('break-words font-medium leading-snug', task.completed && 'line-through')}>{task.title}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{task.completed ? 'Concluída' : 'Pendente'}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 align-top font-medium">{client?.name ?? 'Cliente não encontrado'}</td>
      <td className="px-3 py-2 align-top"><AssigneeEditor task={task} collaborators={collaborators} disabled={updating} onUpdate={onUpdate} /></td>
      <td className="px-3 py-2 align-top"><PriorityEditor task={task} disabled={updating} onUpdate={onUpdate} /></td>
      <td className="px-3 py-2 align-top text-xs text-muted-foreground">{format(parseISO(task.created_at), 'dd/MM/yy', { locale: ptBR })}</td>
      <td className="px-3 py-2 align-top"><AgeBadge days={daysOpen} completed={task.completed} /></td>
      <td className="px-3 py-2 align-top"><DueDateEditor task={task} disabled={updating} onUpdate={onUpdate} /></td>
    </tr>
  );
}

function TaskMobileCard({ task, client, collaborators, daysOpen, updating, onToggleComplete, onUpdate }: TaskItemProps) {
  const priority = PRIORITY_CONFIG[task.priority];
  return (
    <article className={cn('border bg-card p-3', task.completed && 'opacity-55', isOverdue(task) && 'border-red-300 bg-red-50/40')}>
      <div className="flex items-start gap-2">
        <button type="button" onClick={onToggleComplete} className="mt-0.5 shrink-0" title={task.completed ? 'Reabrir tarefa' : 'Concluir tarefa'}>
          {task.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={cn('break-words font-medium leading-snug', task.completed && 'line-through')}>{task.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{client?.name ?? 'Cliente não encontrado'}</p>
        </div>
        {updating ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <AgeBadge days={daysOpen} completed={task.completed} />}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">Responsáveis</p>
          <AssigneeEditor task={task} collaborators={collaborators} disabled={updating} onUpdate={onUpdate} />
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">Prioridade</p>
          <PriorityEditor task={task} disabled={updating} onUpdate={onUpdate} />
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">Criada</p>
          <p className="h-8 border px-2 py-1.5 text-xs">{format(parseISO(task.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
        </div>
        <div>
          <p className="mb-1 text-[10px] uppercase text-muted-foreground">Prazo</p>
          <DueDateEditor task={task} disabled={updating} onUpdate={onUpdate} />
        </div>
      </div>
      <div className="mt-2 h-1" style={{ backgroundColor: priority.color }} />
    </article>
  );
}

interface TaskItemProps {
  task: Task;
  client?: Client;
  collaborators: Collaborator[];
  daysOpen: number;
  updating: boolean;
  onToggleComplete: () => void;
  onUpdate: (data: Partial<Task>) => Promise<void>;
}

function AssigneeEditor({ task, collaborators, disabled, onUpdate }: { task: Task; collaborators: Collaborator[]; disabled: boolean; onUpdate: (data: Partial<Task>) => Promise<void> }) {
  const toggle = (name: string) => {
    const selected = task.assigned_to.some(item => normalizeAssignee(item) === normalizeAssignee(name));
    const assignedTo = selected
      ? task.assigned_to.filter(item => normalizeAssignee(item) !== normalizeAssignee(name))
      : [...task.assigned_to, name];
    void onUpdate({ assigned_to: assignedTo });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" disabled={disabled} className="flex min-h-8 w-full items-center gap-1 rounded border bg-background px-2 text-left text-xs hover:bg-muted disabled:opacity-50" title="Adicionar ou trocar responsáveis">
          {task.assigned_to.length === 0 ? (
            <><Users className="h-3.5 w-3.5" /><span className="text-muted-foreground">Sem responsável</span></>
          ) : (
            <span className="line-clamp-2">{task.assigned_to.join(', ')}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <p className="mb-2 text-xs font-semibold">Vincular colaboradores</p>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {collaborators.map(collaborator => {
            const selected = task.assigned_to.some(item => normalizeAssignee(item) === normalizeAssignee(collaborator.name));
            return (
              <button key={collaborator.id} type="button" onClick={() => toggle(collaborator.name)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: collaborator.color }}>{collaborator.initials}</span>
                <span className="flex-1">{collaborator.name}</span>
                {selected && <Check className="h-4 w-4 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PriorityEditor({ task, disabled, onUpdate }: { task: Task; disabled: boolean; onUpdate: (data: Partial<Task>) => Promise<void> }) {
  const config = PRIORITY_CONFIG[task.priority];
  return (
    <select
      value={task.priority}
      disabled={disabled}
      onChange={event => void onUpdate({ priority: event.target.value as TaskPriority })}
      className="h-8 w-full rounded border bg-background px-2 text-xs font-medium disabled:opacity-50"
      style={{ color: config.color }}
      aria-label={`Prioridade da tarefa ${task.title}`}
    >
      {priorityOptions.map(priority => <option key={priority} value={priority}>{PRIORITY_CONFIG[priority].label}</option>)}
    </select>
  );
}

function DueDateEditor({ task, disabled, onUpdate }: { task: Task; disabled: boolean; onUpdate: (data: Partial<Task>) => Promise<void> }) {
  return (
    <Input
      type="date"
      value={task.due_date ?? ''}
      disabled={disabled}
      onChange={event => void onUpdate({ due_date: event.target.value || null })}
      className={cn('h-8 min-w-[125px] px-2 text-xs', isOverdue(task) && 'border-red-300 text-red-700')}
      aria-label={`Prazo da tarefa ${task.title}`}
    />
  );
}

function AgeBadge({ days, completed }: { days: number; completed: boolean }) {
  return (
    <span className={cn(
      'inline-flex min-w-10 items-center justify-center rounded px-1.5 py-1 text-xs font-bold',
      completed ? 'bg-muted text-muted-foreground' : days >= 45 ? 'bg-red-100 text-red-700' : days >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700',
    )}>{days}d</span>
  );
}

function isOverdue(task: Task) {
  if (task.completed || !task.due_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInCalendarDays(parseISO(task.due_date), today) < 0;
}
