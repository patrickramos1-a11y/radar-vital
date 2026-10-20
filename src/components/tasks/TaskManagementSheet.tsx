import { useMemo, useState } from 'react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import {
  ArrowUpDown,
  Building2,
  CalendarDays,
  CalendarPlus,
  CalendarX2,
  BadgeCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Flag,
  FilterX,
  Eye,
  Loader2,
  PenLine,
  Rows3,
  Search,
  Settings2,
  Shapes,
  Ungroup,
  User,
  UserRoundX,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { normalizeAssignee } from '@/lib/taskAssignee';
import { Client } from '@/types/client';
import { Collaborator } from '@/types/collaborator';
import {
  PRIORITY_CONFIG,
  TASK_MODALITY_CONFIG,
  TASK_STATUS_CONFIG,
  Task,
  TaskModality,
  TaskPriority,
} from '@/types/task';

type StatusFilter = 'pending' | 'scheduled' | 'completed' | 'all';
type DeadlineFilter = 'all' | 'overdue' | 'today' | 'next7' | 'no_date';
type SortKey = 'title' | 'assignees' | 'modality' | 'priority' | 'createdAt' | 'daysOpen' | 'dueDate';
type SortDirection = 'asc' | 'desc';
type BulkTaskUpdate = Partial<Pick<Task, 'assigned_to' | 'priority' | 'modality' | 'scheduled_for'>>;

interface Props {
  tasks: Task[];
  clients: Client[];
  collaborators: Collaborator[];
  isLoading: boolean;
  error: string | null;
  getDaysOpen: (task: Task) => number;
  onToggleComplete: (taskId: string, clientName?: string) => Promise<boolean>;
  onUpdateTask: (taskId: string, data: Partial<Task>) => Promise<boolean>;
  onBulkUpdateTasks: (taskIds: string[], data: BulkTaskUpdate) => Promise<boolean>;
}

const priorityOptions = Object.keys(PRIORITY_CONFIG) as TaskPriority[];
const modalityOptions = Object.keys(TASK_MODALITY_CONFIG) as TaskModality[];
const modalityIcons: Record<TaskModality, typeof Search> = {
  levantamento: Search,
  elaboracao: PenLine,
  regularizacao: BadgeCheck,
  acompanhamento: Eye,
  execucao_operacional: Settings2,
};
const modalityClasses: Record<TaskModality, string> = {
  levantamento: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  elaboracao: 'border-blue-200 bg-blue-50 text-blue-700',
  regularizacao: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  acompanhamento: 'border-violet-200 bg-violet-50 text-violet-700',
  execucao_operacional: 'border-amber-200 bg-amber-50 text-amber-800',
};

export function TaskManagementSheet({
  tasks,
  clients,
  collaborators,
  isLoading,
  error,
  getDaysOpen,
  onToggleComplete,
  onUpdateTask,
  onBulkUpdateTasks,
}: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [clientFilter, setClientFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [modalityFilter, setModalityFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [groupByClient, setGroupByClient] = useState(true);
  const [expandedClientIds, setExpandedClientIds] = useState<Set<string>>(() => new Set());
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const clientById = useMemo(() => new Map(clients.map(client => [client.id, client])), [clients]);
  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [clients],
  );
  const sortedCollaborators = useMemo(
    () => [...collaborators].filter(item => item.isActive).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [collaborators],
  );

  const pendingTasks = useMemo(() => tasks.filter(task => !task.completed && !isScheduled(task)), [tasks]);
  const scheduledTasks = useMemo(() => tasks.filter(isScheduled), [tasks]);
  const overdueCount = useMemo(() => pendingTasks.filter(isOverdue).length, [pendingTasks]);
  const nextSevenDaysCount = useMemo(
    () => pendingTasks.filter(task => {
      const days = daysUntilDue(task);
      return days !== null && days >= 0 && days <= 7;
    }).length,
    [pendingTasks],
  );
  const unassignedCount = useMemo(
    () => pendingTasks.filter(task => task.assigned_to.length === 0).length,
    [pendingTasks],
  );

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
    const direction = sortDirection === 'asc' ? 1 : -1;

    return tasks
      .filter(task => {
        if (statusFilter === 'pending' && (task.completed || isScheduled(task))) return false;
        if (statusFilter === 'scheduled' && !isScheduled(task)) return false;
        if (statusFilter === 'completed' && !task.completed) return false;
        if (clientFilter !== 'all' && task.client_id !== clientFilter) return false;
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
        if (modalityFilter !== 'all' && task.modality !== modalityFilter) return false;
        if (assigneeFilter === 'unassigned' && task.assigned_to.length > 0) return false;
        if (assigneeFilter !== 'all' && assigneeFilter !== 'unassigned') {
          const matches = task.assigned_to.some(name => normalizeAssignee(name) === normalizeAssignee(assigneeFilter));
          if (!matches) return false;
        }
        const daysToDue = daysUntilDue(task);
        if (deadlineFilter === 'overdue' && !isOverdue(task)) return false;
        if (deadlineFilter === 'today' && daysToDue !== 0) return false;
        if (deadlineFilter === 'next7' && (daysToDue === null || daysToDue < 0 || daysToDue > 7)) return false;
        if (deadlineFilter === 'no_date' && task.due_date) return false;
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
          assignees: text(a.assigned_to.join(', '), b.assigned_to.join(', ')),
          modality: text(TASK_MODALITY_CONFIG[a.modality].label, TASK_MODALITY_CONFIG[b.modality].label),
          priority: PRIORITY_CONFIG[a.priority].order - PRIORITY_CONFIG[b.priority].order,
          createdAt: parseISO(a.created_at).getTime() - parseISO(b.created_at).getTime(),
          daysOpen: getDaysOpen(a) - getDaysOpen(b),
          dueDate: nullableDate(a.due_date) - nullableDate(b.due_date),
        };
        const result = comparisons[sortKey];
        if (result !== 0) return result * direction;
        return parseISO(a.created_at).getTime() - parseISO(b.created_at).getTime();
      });
  }, [assigneeFilter, clientById, clientFilter, deadlineFilter, getDaysOpen, modalityFilter, priorityFilter, search, sortDirection, sortKey, statusFilter, tasks]);

  const groupedTasks = useMemo(() => {
    const grouped = new Map<string, Task[]>();
    filteredTasks.forEach(task => grouped.set(task.client_id, [...(grouped.get(task.client_id) ?? []), task]));
    return [...grouped.entries()]
      .map(([clientId, clientTasks]) => ({ clientId, client: clientById.get(clientId), tasks: clientTasks }))
      .sort((a, b) => (a.client?.name ?? '').localeCompare(b.client?.name ?? '', 'pt-BR'));
  }, [clientById, filteredTasks]);

  const visibleIds = useMemo(() => filteredTasks.map(task => task.id), [filteredTasks]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some(id => selectedIds.has(id));

  const update = async (task: Task, data: Partial<Task>) => {
    setUpdatingTaskId(task.id);
    try {
      await onUpdateTask(task.id, data);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const applyBulkUpdate = async (data: BulkTaskUpdate) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setIsBulkUpdating(true);
    try {
      await onBulkUpdateTasks(ids, data);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const toggleSelection = (taskIds: string[], checked: boolean) => {
    setSelectedIds(current => {
      const next = new Set(current);
      taskIds.forEach(id => checked ? next.add(id) : next.delete(id));
      return next;
    });
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
    setModalityFilter('all');
    setPriorityFilter('all');
    setDeadlineFilter('all');
    setSortKey('dueDate');
    setSortDirection('asc');
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="border-b bg-muted/20 px-3 py-3 sm:px-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <SummaryItem icon={CheckCircle2} value={pendingTasks.length} label="Pendentes" tone="text-amber-700" />
          <SummaryItem icon={CalendarClock} value={overdueCount} label="Atrasadas" tone="text-red-700" />
          <SummaryItem icon={Clock3} value={nextSevenDaysCount} label="Próximos 7 dias" tone="text-blue-700" />
          <SummaryItem icon={UserRoundX} value={unassignedCount} label="Sem responsável" tone="text-slate-700" />
          <SummaryItem icon={CalendarDays} value={scheduledTasks.length} label="Agendadas" tone="text-violet-700" />
        </div>

        <div className="mt-3">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar tarefa, cliente ou responsável" className="h-9 pl-9" />
          </label>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="inline-flex h-9 items-center border bg-background p-0.5">
              {([
                { value: 'pending', label: 'Pendentes' },
                { value: 'scheduled', label: 'Agendadas' },
                { value: 'completed', label: 'Concluídas' },
                { value: 'all', label: 'Todas' },
              ] as { value: StatusFilter; label: string }[]).map(option => (
                <Button
                  key={option.value}
                  type="button"
                  variant={statusFilter === option.value ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 rounded-sm px-3 text-xs"
                  onClick={() => setStatusFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <FilterPopover
              icon={<Building2 className="h-3.5 w-3.5" />}
              value={clientFilter}
              defaultValue="all"
              ariaLabel="Filtrar por cliente"
              options={[{ value: 'all', label: 'Todos os clientes' }, ...sortedClients.map(client => ({ value: client.id, label: client.name }))]}
              onChange={setClientFilter}
              searchable
            />
            <FilterPopover
              icon={<Users className="h-3.5 w-3.5" />}
              value={assigneeFilter}
              defaultValue="all"
              ariaLabel="Filtrar por responsável"
              options={[
                { value: 'all', label: 'Todos os responsáveis' },
                { value: 'unassigned', label: 'Sem responsável' },
                ...sortedCollaborators.map(collaborator => ({ value: collaborator.name, label: collaborator.name })),
              ]}
              onChange={setAssigneeFilter}
            />
            <FilterPopover
              icon={<Shapes className="h-3.5 w-3.5" />}
              value={modalityFilter}
              defaultValue="all"
              ariaLabel="Filtrar por modalidade"
              options={[{ value: 'all', label: 'Todas as modalidades' }, ...modalityOptions.map(modality => ({ value: modality, label: TASK_MODALITY_CONFIG[modality].label }))]}
              onChange={setModalityFilter}
            />
            <FilterPopover
              icon={<Flag className="h-3.5 w-3.5" />}
              value={priorityFilter}
              defaultValue="all"
              ariaLabel="Filtrar por prioridade"
              options={[{ value: 'all', label: 'Todas as prioridades' }, ...priorityOptions.map(priority => ({ value: priority, label: PRIORITY_CONFIG[priority].label }))]}
              onChange={setPriorityFilter}
            />
            <FilterPopover
              icon={<CalendarClock className="h-3.5 w-3.5" />}
              value={deadlineFilter}
              defaultValue="all"
              ariaLabel="Filtrar por prazo"
              options={[
                { value: 'all', label: 'Todos os prazos' },
                { value: 'overdue', label: 'Atrasadas' },
                { value: 'today', label: 'Vencem hoje' },
                { value: 'next7', label: 'Próximos 7 dias' },
                { value: 'no_date', label: 'Sem prazo' },
              ]}
              onChange={value => setDeadlineFilter(value as DeadlineFilter)}
            />
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={resetFilters} title="Limpar filtros" aria-label="Limpar filtros"><FilterX className="h-4 w-4" /></Button>
            <Button
              variant={groupByClient ? 'outline' : 'default'}
              size="sm"
              className="h-9 gap-2 px-3 text-xs"
              onClick={() => setGroupByClient(current => !current)}
              title={groupByClient ? 'Desagrupar todas as empresas' : 'Agrupar por empresa'}
            >
              {groupByClient ? <Ungroup className="h-4 w-4" /> : <Rows3 className="h-4 w-4" />}
              {groupByClient ? 'Desagrupar' : 'Agrupar'}
            </Button>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{filteredTasks.length} tarefa(s) em {groupedTasks.length} cliente(s)</span>
          <span>{sortDirection === 'asc' ? 'Ordem crescente' : 'Ordem decrescente'}</span>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          collaborators={sortedCollaborators}
          disabled={isBulkUpdating}
          onAssign={name => void applyBulkUpdate({ assigned_to: name ? [name] : [] })}
          onModality={modality => void applyBulkUpdate({ modality })}
          onPriority={priority => void applyBulkUpdate({ priority })}
          onSchedule={date => void applyBulkUpdate({ scheduled_for: date || null })}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Carregando tarefas...</div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-destructive">{error}</div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-muted-foreground">
          <FilterX className="mb-3 h-10 w-10 opacity-40" /><p className="font-medium text-foreground">Nenhuma tarefa encontrada</p><p className="mt-1 text-sm">Ajuste os filtros para ampliar a consulta.</p>
        </div>
      ) : (
        <TaskResults
          groups={groupedTasks}
          tasks={filteredTasks}
          clientById={clientById}
          grouped={groupByClient}
          expandedClientIds={expandedClientIds}
          visibleIds={visibleIds}
          selectedIds={selectedIds}
          allVisibleSelected={allVisibleSelected}
          someVisibleSelected={someVisibleSelected}
          collaborators={sortedCollaborators}
          sortKey={sortKey}
          sortDirection={sortDirection}
          updatingTaskId={updatingTaskId}
          getDaysOpen={getDaysOpen}
          onToggleSort={toggleSort}
          onToggleSelection={toggleSelection}
          onToggleComplete={onToggleComplete}
          onUpdate={update}
          onToggleClient={(clientId) => setExpandedClientIds(current => {
            const next = new Set(current);
            if (next.has(clientId)) next.delete(clientId);
            else next.add(clientId);
            return next;
          })}
        />
      )}
    </section>
  );
}

interface TaskGroup { clientId: string; client?: Client; tasks: Task[] }

function TaskResults({ groups, tasks, clientById, grouped, expandedClientIds, visibleIds, selectedIds, allVisibleSelected, someVisibleSelected, collaborators, sortKey, sortDirection, updatingTaskId, getDaysOpen, onToggleSort, onToggleSelection, onToggleComplete, onUpdate, onToggleClient }: {
  groups: TaskGroup[];
  tasks: Task[];
  clientById: Map<string, Client>;
  grouped: boolean;
  expandedClientIds: Set<string>;
  visibleIds: string[];
  selectedIds: Set<string>;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  collaborators: Collaborator[];
  sortKey: SortKey;
  sortDirection: SortDirection;
  updatingTaskId: string | null;
  getDaysOpen: (task: Task) => number;
  onToggleSort: (key: SortKey) => void;
  onToggleSelection: (taskIds: string[], checked: boolean) => void;
  onToggleComplete: (taskId: string, clientName?: string) => Promise<boolean>;
  onUpdate: (task: Task, data: Partial<Task>) => Promise<void>;
  onToggleClient: (clientId: string) => void;
}) {
  return (
    <>
      <div className="hidden min-h-0 flex-1 overflow-auto md:block">
        <table className="w-full min-w-[1080px] table-fixed text-sm">
          <thead className="sticky top-0 z-20 border-b bg-muted/95 text-[11px] uppercase text-muted-foreground backdrop-blur">
            <tr>
              <th className="w-11 px-3 py-2"><Checkbox checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false} onCheckedChange={checked => onToggleSelection(visibleIds, checked === true)} aria-label="Selecionar todas as tarefas visíveis" /></th>
              {!grouped && <th className="w-[15%] px-3 py-2 text-left font-medium">Empresa</th>}
              <SortHeader label="Tarefa" sortKey="title" width={grouped ? 'w-[40%]' : 'w-[27%]'} activeKey={sortKey} direction={sortDirection} onSort={onToggleSort} />
              <SortHeader label="Responsáveis" sortKey="assignees" width="w-[13%]" activeKey={sortKey} direction={sortDirection} onSort={onToggleSort} />
              <SortHeader label="Modalidade" sortKey="modality" width="w-[12%]" activeKey={sortKey} direction={sortDirection} onSort={onToggleSort} />
              <SortHeader label="Criada" sortKey="createdAt" width="w-[9%]" activeKey={sortKey} direction={sortDirection} onSort={onToggleSort} />
              <SortHeader label="Prazo" sortKey="dueDate" width="w-[13%]" activeKey={sortKey} direction={sortDirection} onSort={onToggleSort} />
              <SortHeader label="Tempo / ações" sortKey="daysOpen" width="w-[12%]" activeKey={sortKey} direction={sortDirection} onSort={onToggleSort} />
            </tr>
          </thead>
          {grouped ? groups.map(group => {
            const groupIds = group.tasks.map(task => task.id);
            const allGroupSelected = groupIds.every(id => selectedIds.has(id));
            const someGroupSelected = groupIds.some(id => selectedIds.has(id));
            const expanded = expandedClientIds.has(group.clientId);
            return (
              <tbody key={group.clientId} className="divide-y border-b-2">
                <tr className="sticky top-[33px] z-10 border-y bg-slate-50/95">
                  <td className="px-3 py-2"><Checkbox checked={allGroupSelected ? true : someGroupSelected ? 'indeterminate' : false} onCheckedChange={checked => onToggleSelection(groupIds, checked === true)} aria-label={`Selecionar tarefas de ${group.client?.name ?? 'cliente'}`} /></td>
                  <td colSpan={6} className="p-0">
                    <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-100" onClick={() => onToggleClient(group.clientId)} aria-expanded={expanded}>
                      {expanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                      <ClientGroupHeader client={group.client} tasks={group.tasks} />
                    </button>
                  </td>
                </tr>
                {expanded && group.tasks.map(task => (
                  <TaskRow key={task.id} task={task} client={group.client} collaborators={collaborators} daysOpen={getDaysOpen(task)} selected={selectedIds.has(task.id)} updating={updatingTaskId === task.id} onSelect={checked => onToggleSelection([task.id], checked)} onToggleComplete={() => void onToggleComplete(task.id, group.client?.name)} onUpdate={data => onUpdate(task, data)} />
                ))}
              </tbody>
            );
          }) : (
            <tbody className="divide-y border-b-2">
              {tasks.map(task => {
                const client = clientById.get(task.client_id);
                return <TaskRow key={task.id} task={task} client={client} showClient collaborators={collaborators} daysOpen={getDaysOpen(task)} selected={selectedIds.has(task.id)} updating={updatingTaskId === task.id} onSelect={checked => onToggleSelection([task.id], checked)} onToggleComplete={() => void onToggleComplete(task.id, client?.name)} onUpdate={data => onUpdate(task, data)} />;
              })}
            </tbody>
          )}
        </table>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto md:hidden">
        {grouped ? groups.map(group => {
          const expanded = expandedClientIds.has(group.clientId);
          return (
          <section key={group.clientId} className="border-b">
            <div className="sticky top-0 z-10 flex items-center gap-3 border-y bg-slate-50/95 px-3 py-2">
              <Checkbox checked={group.tasks.every(task => selectedIds.has(task.id))} onCheckedChange={checked => onToggleSelection(group.tasks.map(task => task.id), checked === true)} aria-label={`Selecionar tarefas de ${group.client?.name ?? 'cliente'}`} />
              <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => onToggleClient(group.clientId)} aria-expanded={expanded}>
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <ClientGroupHeader client={group.client} tasks={group.tasks} />
              </button>
            </div>
            {expanded && <div className="space-y-2 p-3">
              {group.tasks.map(task => (
                <TaskMobileCard key={task.id} task={task} client={group.client} collaborators={collaborators} daysOpen={getDaysOpen(task)} selected={selectedIds.has(task.id)} updating={updatingTaskId === task.id} onSelect={checked => onToggleSelection([task.id], checked)} onToggleComplete={() => void onToggleComplete(task.id, group.client?.name)} onUpdate={data => onUpdate(task, data)} />
              ))}
            </div>}
          </section>
          );
        }) : (
          <div className="space-y-2 p-3">
            {tasks.map(task => {
              const client = clientById.get(task.client_id);
              return <TaskMobileCard key={task.id} task={task} client={client} showClient collaborators={collaborators} daysOpen={getDaysOpen(task)} selected={selectedIds.has(task.id)} updating={updatingTaskId === task.id} onSelect={checked => onToggleSelection([task.id], checked)} onToggleComplete={() => void onToggleComplete(task.id, client?.name)} onUpdate={data => onUpdate(task, data)} />;
            })}
          </div>
        )}
      </div>
    </>
  );
}

function BulkActionBar({ count, collaborators, disabled, onAssign, onModality, onPriority, onSchedule, onClear }: {
  count: number;
  collaborators: Collaborator[];
  disabled: boolean;
  onAssign: (name: string) => void;
  onModality: (modality: TaskModality) => void;
  onPriority: (priority: TaskPriority) => void;
  onSchedule: (date: string) => void;
  onClear: () => void;
}) {
  const [scheduleDate, setScheduleDate] = useState('');
  return (
    <div className="z-30 flex flex-wrap items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-3 py-2 sm:px-6">
      <span className="mr-1 text-sm font-semibold text-emerald-900">{count} selecionada(s)</span>
      <ActionSelect ariaLabel="Atribuir responsável em massa" disabled={disabled} onChange={onAssign} placeholder="Atribuir responsável">
        <option value="">Sem responsável</option>
        {collaborators.map(collaborator => <option key={collaborator.id} value={collaborator.name}>{collaborator.name}</option>)}
      </ActionSelect>
      <ActionSelect ariaLabel="Alterar modalidade em massa" disabled={disabled} onChange={value => onModality(value as TaskModality)} placeholder="Alterar modalidade">
        {modalityOptions.map(modality => <option key={modality} value={modality}>{TASK_MODALITY_CONFIG[modality].label}</option>)}
      </ActionSelect>
      <ActionSelect ariaLabel="Alterar prioridade em massa" disabled={disabled} onChange={value => onPriority(value as TaskPriority)} placeholder="Alterar prioridade">
        {priorityOptions.map(priority => <option key={priority} value={priority}>{PRIORITY_CONFIG[priority].label}</option>)}
      </ActionSelect>
      <div className="flex h-8 items-center border border-violet-300 bg-white pl-2">
        <CalendarPlus className="h-3.5 w-3.5 text-violet-700" />
        <input
          type="date"
          value={scheduleDate}
          min={format(new Date(), 'yyyy-MM-dd')}
          onChange={event => setScheduleDate(event.target.value)}
          className="h-7 bg-transparent px-2 text-xs outline-none"
          aria-label="Data do replanejamento em massa"
          disabled={disabled}
        />
        <Button
          type="button"
          size="sm"
          className="h-7 rounded-none bg-violet-600 px-2 text-[10px] hover:bg-violet-700"
          disabled={disabled || !scheduleDate}
          onClick={() => onSchedule(scheduleDate)}
        >
          Replanejar
        </Button>
      </div>
      {disabled && <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />}
      <Button type="button" variant="ghost" size="sm" className="ml-auto h-8" onClick={onClear} disabled={disabled}>Limpar seleção</Button>
    </div>
  );
}

function ActionSelect({ ariaLabel, disabled, onChange, placeholder, children }: {
  ariaLabel: string;
  disabled: boolean;
  onChange: (value: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value="__placeholder__"
      disabled={disabled}
      aria-label={ariaLabel}
      className="h-8 min-w-[170px] rounded border border-emerald-300 bg-white px-2 text-xs font-medium disabled:opacity-60"
      onChange={event => onChange(event.target.value)}
    >
      <option value="__placeholder__" disabled>{placeholder}</option>
      {children}
    </select>
  );
}

function ClientGroupHeader({ client, tasks }: { client?: Client; tasks: Task[] }) {
  const pending = tasks.filter(task => !task.completed).length;
  const overdue = tasks.filter(isOverdue).length;
  return (
    <div className="flex min-w-0 items-center gap-2">
      {client?.logoUrl ? (
        <img src={client.logoUrl} alt="" className="h-7 w-7 shrink-0 object-contain" />
      ) : (
        <span className="grid h-7 w-7 shrink-0 place-items-center border bg-white text-[9px] font-bold text-muted-foreground">{client?.initials ?? '?'}</span>
      )}
      <span className="truncate font-semibold text-foreground">{client?.name ?? 'Cliente não encontrado'}</span>
      <span className="text-xs text-muted-foreground">{tasks.length} tarefa(s)</span>
      {pending > 0 && <span className="text-xs font-medium text-amber-700">{pending} pendente(s)</span>}
      {overdue > 0 && <span className="text-xs font-semibold text-red-700">{overdue} atrasada(s)</span>}
    </div>
  );
}

function SummaryItem({ icon: Icon, value, label, tone }: { icon: typeof Clock3; value: string | number; label: string; tone: string }) {
  return (
    <div className="flex min-h-[54px] min-w-0 items-center gap-2 border bg-card px-2.5 py-2">
      <Icon className={cn('h-4 w-4 shrink-0', tone)} />
      <div className="min-w-0">
        <div className={cn('text-base font-bold leading-none', tone)}>{value}</div>
        <div className="mt-1 text-[9px] uppercase leading-tight text-muted-foreground sm:text-[10px]">{label}</div>
      </div>
    </div>
  );
}

function FilterPopover({ icon, value, defaultValue, ariaLabel, options, onChange, searchable = false }: {
  icon: React.ReactNode;
  value: string;
  defaultValue: string;
  ariaLabel: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedLabel = options.find(option => option.value === value)?.label ?? options[0]?.label ?? ariaLabel;
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
  const visibleOptions = normalizedQuery
    ? options.filter(option => option.label.toLocaleLowerCase('pt-BR').includes(normalizedQuery))
    : options;
  const active = value !== defaultValue;

  return (
    <Popover open={open} onOpenChange={nextOpen => {
      setOpen(nextOpen);
      if (!nextOpen) setQuery('');
    }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={ariaLabel}
          className={cn(
            'h-9 max-w-[220px] gap-2 px-3 text-xs',
            active && 'border-primary bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
          )}
        >
          {icon}
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        {searchable && (
          <label className="relative mb-2 block">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar cliente" className="h-8 pl-8 text-xs" autoFocus />
          </label>
        )}
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {visibleOptions.map(option => (
            <button
              key={option.value}
              type="button"
              className={cn(
                'flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs hover:bg-muted',
                option.value === value && 'bg-primary/10 font-semibold text-primary',
              )}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
                setQuery('');
              }}
            >
              <span className="flex-1 truncate">{option.label}</span>
              {option.value === value && <Check className="h-4 w-4 shrink-0" />}
            </button>
          ))}
          {visibleOptions.length === 0 && <p className="px-2 py-3 text-center text-xs text-muted-foreground">Nenhuma opção encontrada</p>}
        </div>
      </PopoverContent>
    </Popover>
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
        {label}<ArrowUpDown className={cn('h-3 w-3', active ? 'text-foreground' : 'opacity-40')} />
        {active && <span className="text-[9px]">{direction === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  );
}

function TaskRow({ task, client, showClient = false, collaborators, daysOpen, selected, updating, onSelect, onToggleComplete, onUpdate }: TaskItemProps) {
  const overdue = isOverdue(task);
  return (
    <tr className={cn('transition-colors hover:bg-muted/30', selected && 'bg-emerald-50/60', task.completed && 'opacity-55', overdue && !selected && 'bg-red-50/40', isScheduled(task) && 'bg-violet-50/50')}>
      <td className="px-3 py-2 text-center"><Checkbox checked={selected} onCheckedChange={checked => onSelect(checked === true)} aria-label={`Selecionar ${task.title}`} /></td>
      {showClient && <td className="px-3 py-2 align-top"><ClientCompactLabel client={client} /></td>}
      <td className="px-3 py-2 align-top">
        <div className="flex gap-2">
          <button type="button" onClick={onToggleComplete} className="mt-0.5 shrink-0 rounded p-0.5 hover:bg-muted" title={task.completed ? 'Reabrir tarefa' : 'Concluir tarefa'}>
            {task.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
          </button>
          <PriorityRail task={task} disabled={updating} onUpdate={onUpdate} />
          <div className="min-w-0">
            <p className={cn('break-words font-medium leading-snug', task.completed && 'line-through')}>{task.title}</p>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
              <span>{TASK_STATUS_CONFIG[task.status].label}{task.parent_task_id ? ' · Subtarefa' : ''}</span>
              {isScheduled(task) && <span className="inline-flex items-center gap-1 font-semibold text-violet-700"><CalendarClock className="h-3 w-3" /> Volta em {format(parseISO(task.scheduled_for!), 'dd/MM/yy')}</span>}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 align-top"><AssigneeEditor task={task} collaborators={collaborators} disabled={updating} onUpdate={onUpdate} /></td>
      <td className="px-3 py-2 align-top"><ModalityEditor task={task} disabled={updating} onUpdate={onUpdate} /></td>
      <td className="px-3 py-2 align-top text-xs text-muted-foreground">{format(parseISO(task.created_at), 'dd/MM/yy')}</td>
      <td className="px-3 py-2 align-top"><DueDateEditor task={task} disabled={updating} onUpdate={onUpdate} /></td>
      <td className="px-3 py-2 align-top">
        <div className="flex items-center gap-1">
          {updating ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <AgeBadge days={daysOpen} completed={task.completed} />}
          <ReplanEditor task={task} disabled={updating} onUpdate={onUpdate} />
        </div>
      </td>
    </tr>
  );
}

function TaskMobileCard({ task, client, showClient = false, collaborators, daysOpen, selected, updating, onSelect, onToggleComplete, onUpdate }: TaskItemProps) {
  const priority = PRIORITY_CONFIG[task.priority];
  return (
    <article className={cn('border bg-card p-3', selected && 'border-emerald-400 bg-emerald-50/50', task.completed && 'opacity-55', isOverdue(task) && !selected && 'border-red-300 bg-red-50/40')}>
      {showClient && <div className="mb-2 border-b pb-2"><ClientCompactLabel client={client} /></div>}
      <div className="flex items-start gap-2">
        <Checkbox checked={selected} onCheckedChange={checked => onSelect(checked === true)} aria-label={`Selecionar ${task.title}`} className="mt-0.5" />
        <button type="button" onClick={onToggleComplete} className="mt-0.5 shrink-0" title={task.completed ? 'Reabrir tarefa' : 'Concluir tarefa'}>
          {task.completed ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
        </button>
        <div className="min-w-0 flex-1"><p className={cn('break-words font-medium leading-snug', task.completed && 'line-through')}>{task.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{TASK_STATUS_CONFIG[task.status].label}</p></div>
        {updating ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <AgeBadge days={daysOpen} completed={task.completed} />}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <EditorField label="Responsáveis"><AssigneeEditor task={task} collaborators={collaborators} disabled={updating} onUpdate={onUpdate} /></EditorField>
        <EditorField label="Modalidade"><ModalityEditor task={task} disabled={updating} onUpdate={onUpdate} /></EditorField>
        <EditorField label="Prioridade"><PriorityEditor task={task} disabled={updating} onUpdate={onUpdate} /></EditorField>
        <EditorField label="Prazo"><DueDateEditor task={task} disabled={updating} onUpdate={onUpdate} /></EditorField>
      </div>
      <div className="mt-2 flex items-center gap-2 border-t pt-2">
        <div className="h-1 flex-1" style={{ backgroundColor: priority.color }} />
        <ReplanEditor task={task} disabled={updating} onUpdate={onUpdate} />
      </div>
    </article>
  );
}

function EditorField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="mb-1 text-[10px] uppercase text-muted-foreground">{label}</p>{children}</div>;
}

interface TaskItemProps {
  task: Task;
  client?: Client;
  showClient?: boolean;
  collaborators: Collaborator[];
  daysOpen: number;
  selected: boolean;
  updating: boolean;
  onSelect: (checked: boolean) => void;
  onToggleComplete: () => void;
  onUpdate: (data: Partial<Task>) => Promise<void>;
}

function AssigneeEditor({ task, collaborators, disabled, onUpdate }: { task: Task; collaborators: Collaborator[]; disabled: boolean; onUpdate: (data: Partial<Task>) => Promise<void> }) {
  const toggle = (name: string) => {
    const selected = task.assigned_to.some(item => normalizeAssignee(item) === normalizeAssignee(name));
    const assignedTo = selected ? task.assigned_to.filter(item => normalizeAssignee(item) !== normalizeAssignee(name)) : [...task.assigned_to, name];
    void onUpdate({ assigned_to: assignedTo });
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" disabled={disabled} className="flex h-8 w-full items-center gap-1.5 border bg-background px-2 text-left text-xs hover:bg-muted disabled:opacity-50" title="Adicionar ou trocar responsáveis">
          {task.assigned_to.length === 0 ? (
            <><User className="h-3.5 w-3.5 text-muted-foreground" /><span className="truncate text-muted-foreground">Sem responsável</span></>
          ) : (
            <>
              <span className="flex -space-x-1">
                {task.assigned_to.slice(0, 3).map(name => {
                  const collaborator = collaborators.find(item => normalizeAssignee(item.name) === normalizeAssignee(name));
                  return <span key={name} className="grid h-5 w-5 place-items-center rounded-full border border-white text-[8px] font-bold text-white" style={{ backgroundColor: collaborator?.color || '#64748B' }}>{name.charAt(0).toUpperCase()}</span>;
                })}
              </span>
              <span className="truncate">{task.assigned_to.length === 1 ? task.assigned_to[0] : `${task.assigned_to.length} responsáveis`}</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <p className="mb-2 text-xs font-semibold">Vincular colaboradores</p>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {collaborators.map(collaborator => {
            const selected = task.assigned_to.some(item => normalizeAssignee(item) === normalizeAssignee(collaborator.name));
            return <button key={collaborator.id} type="button" onClick={() => toggle(collaborator.name)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: collaborator.color }}>{collaborator.initials}</span><span className="flex-1">{collaborator.name}</span>{selected && <Check className="h-4 w-4 text-emerald-600" />}</button>;
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ModalityEditor({ task, disabled, onUpdate }: { task: Task; disabled: boolean; onUpdate: (data: Partial<Task>) => Promise<void> }) {
  const Icon = modalityIcons[task.modality];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" disabled={disabled} className={cn('flex h-8 w-full items-center gap-1.5 border px-2 text-xs font-medium disabled:opacity-50', modalityClasses[task.modality])} aria-label={`Modalidade da tarefa ${task.title}`}>
          <Icon className="h-3.5 w-3.5" />
          <span className="truncate">{TASK_MODALITY_CONFIG[task.modality].shortLabel}</span>
          <ChevronDown className="ml-auto h-3 w-3 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1.5">
        {modalityOptions.map(modality => {
          const OptionIcon = modalityIcons[modality];
          return <button key={modality} type="button" onClick={() => void onUpdate({ modality })} className={cn('mb-1 flex w-full items-center gap-2 border px-2 py-2 text-left text-xs last:mb-0', modalityClasses[modality], task.modality === modality && 'ring-1 ring-current')}><OptionIcon className="h-4 w-4" /><span className="flex-1">{TASK_MODALITY_CONFIG[modality].label}</span>{task.modality === modality && <Check className="h-3.5 w-3.5" />}</button>;
        })}
      </PopoverContent>
    </Popover>
  );
}

function PriorityEditor({ task, disabled, onUpdate }: { task: Task; disabled: boolean; onUpdate: (data: Partial<Task>) => Promise<void> }) {
  const config = PRIORITY_CONFIG[task.priority];
  return (
    <Popover>
      <PopoverTrigger asChild><button type="button" disabled={disabled} className="flex h-8 w-full items-center gap-2 border bg-background px-2 text-xs font-semibold disabled:opacity-50" style={{ color: config.color }} aria-label={`Prioridade da tarefa ${task.title}`}><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: config.color }} /><span>{config.label}</span></button></PopoverTrigger>
      <PriorityOptions value={task.priority} onChange={priority => void onUpdate({ priority })} />
    </Popover>
  );
}

function PriorityRail({ task, disabled, onUpdate }: { task: Task; disabled: boolean; onUpdate: (data: Partial<Task>) => Promise<void> }) {
  const config = PRIORITY_CONFIG[task.priority];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" disabled={disabled} className="w-1.5 shrink-0 self-stretch transition-[width] hover:w-3 disabled:opacity-50" style={{ backgroundColor: config.color }} title={`Prioridade: ${config.label}. Clique para alterar.`} aria-label={`Alterar prioridade da tarefa ${task.title}. Atual: ${config.label}`} />
      </PopoverTrigger>
      <PriorityOptions value={task.priority} onChange={priority => void onUpdate({ priority })} />
    </Popover>
  );
}

function PriorityOptions({ value, onChange }: { value: TaskPriority; onChange: (priority: TaskPriority) => void }) {
  return (
    <PopoverContent align="start" className="w-44 p-1.5">
      {priorityOptions.map(priority => {
        const config = PRIORITY_CONFIG[priority];
        return <button key={priority} type="button" onClick={() => onChange(priority)} className={cn('flex w-full items-center gap-2 px-2 py-2 text-left text-xs hover:bg-muted', value === priority && 'bg-muted font-semibold')}><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: config.color }} /><span className="flex-1">{config.label}</span>{value === priority && <Check className="h-3.5 w-3.5" />}</button>;
      })}
    </PopoverContent>
  );
}

function DueDateEditor({ task, disabled, onUpdate }: { task: Task; disabled: boolean; onUpdate: (data: Partial<Task>) => Promise<void> }) {
  return <Input type="date" value={task.due_date ?? ''} disabled={disabled} onChange={event => void onUpdate({ due_date: event.target.value || null })} className={cn('h-8 min-w-[125px] px-2 text-xs', isOverdue(task) && 'border-red-300 text-red-700')} aria-label={`Prazo da tarefa ${task.title}`} />;
}

function ReplanEditor({ task, disabled, onUpdate }: { task: Task; disabled: boolean; onUpdate: (data: Partial<Task>) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(task.scheduled_for ?? '');
  const scheduled = isScheduled(task);

  return (
    <Popover open={open} onOpenChange={nextOpen => {
      setOpen(nextOpen);
      if (nextOpen) setDate(task.scheduled_for ?? '');
    }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled || task.completed}
          className={cn('grid h-7 w-7 shrink-0 place-items-center border transition-colors disabled:opacity-40', scheduled ? 'border-violet-300 bg-violet-100 text-violet-700' : 'bg-background text-muted-foreground hover:border-violet-300 hover:text-violet-700')}
          title={scheduled ? `Replanejada para ${format(parseISO(task.scheduled_for!), 'dd/MM/yyyy')}` : 'Replanejar tarefa'}
          aria-label={`Replanejar tarefa ${task.title}`}
        >
          <CalendarPlus className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <p className="text-sm font-semibold">Replanejar tarefa</p>
        <p className="mt-1 text-xs text-muted-foreground">A demanda ficará em Agendadas e voltará às Pendentes na data escolhida.</p>
        <Input type="date" value={date} min={format(new Date(), 'yyyy-MM-dd')} onChange={event => setDate(event.target.value)} className="mt-3 h-9 text-xs" aria-label={`Nova data para ${task.title}`} />
        <div className="mt-3 flex items-center gap-2">
          {task.scheduled_for && <Button type="button" variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => { void onUpdate({ scheduled_for: null }); setOpen(false); }}><CalendarX2 className="h-3.5 w-3.5" /> Ativar agora</Button>}
          <Button type="button" size="sm" className="ml-auto h-8 bg-violet-600 text-xs hover:bg-violet-700" disabled={!date} onClick={() => { void onUpdate({ scheduled_for: date }); setOpen(false); }}>Replanejar</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ClientCompactLabel({ client }: { client?: Client }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {client?.logoUrl ? <img src={client.logoUrl} alt="" className="h-6 w-6 shrink-0 object-contain" /> : <span className="grid h-6 w-6 shrink-0 place-items-center border bg-white text-[8px] font-bold text-muted-foreground">{client?.initials ?? '?'}</span>}
      <span className="truncate text-xs font-semibold">{client?.name ?? 'Cliente não encontrado'}</span>
    </div>
  );
}

function AgeBadge({ days, completed }: { days: number; completed: boolean }) {
  return <span className={cn('inline-flex min-w-10 items-center justify-center px-1.5 py-1 text-xs font-bold', completed ? 'bg-muted text-muted-foreground' : days >= 45 ? 'bg-red-100 text-red-700' : days >= 30 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700')}>{days}d</span>;
}

function daysUntilDue(task: Task) {
  if (!task.due_date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInCalendarDays(parseISO(task.due_date), today);
}

function isOverdue(task: Task) {
  const days = daysUntilDue(task);
  return !task.completed && days !== null && days < 0;
}

function isScheduled(task: Task) {
  if (task.completed || !task.scheduled_for) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseISO(task.scheduled_for).getTime() > today.getTime();
}
