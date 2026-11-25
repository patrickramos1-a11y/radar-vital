import type { Priority } from '@/types/priority';
import type { Task } from '@/types/task';
import { assigneeMatches } from '@/lib/taskAssignee';
import { priorityTaskTreeIds } from '@/lib/taskHierarchy';
import { buildProcesses, isProcessOpen, processesForAssignee } from '@/lib/processModel';
import { isMaximumWeight, normalizeProcessWeight, weightForUrgency, type ProcessWeight } from '@/lib/processWeight';
import type { Deliverable } from '@/types/deliverable';

/**
 * Single source for the workload numbers shown in the Central (KPI strip,
 * collaborator picker and Performance), so the same label never shows two
 * different values.
 *
 * - "Tarefas" are ordinary tasks: tasks inside a priority tree are counted
 *   under the priority, exactly as the Tasks tab lists them.
 * - "Atrasos" counts open ordinary tasks plus open priorities whose due date
 *   is before today (a task due today is not late).
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses a due date; date-only strings are read as local dates, not UTC. */
export function parseDueDate(value: string): Date {
  const match = DATE_ONLY.exec(value);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Date(value);
}

export function startOfToday(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isPastDue(
  dueDate: string | null | undefined,
  today: Date = startOfToday(),
): boolean {
  if (!dueDate) return false;
  const due = parseDueDate(dueDate);
  return !Number.isNaN(due.getTime()) && due.getTime() < today.getTime();
}

export function isOpenPriority(priority: Pick<Priority, 'status'>): boolean {
  return priority.status !== 'concluida' && priority.status !== 'cancelada';
}

/** Tasks that are not part of a priority tree (what the Tasks tab lists). */
export function ordinaryTasks(tasks: Task[]): Task[] {
  const inPriorityTree = priorityTaskTreeIds(tasks);
  return tasks.filter(task => !inPriorityTree.has(task.id));
}

/** The task a priority was promoted from (its root in the task tree). */
export function rootTaskFor(priority: Priority, tasks: Task[]): Task | undefined {
  return tasks.find(task => task.id === priority.source_task_id)
    || tasks.find(task => task.priority_id === priority.id && !task.parent_task_id);
}

const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * A planned priority was parked until a future date ("Planejadas"); the
 * priorities list hides it by default, so the counts do too.
 */
export function isScheduledPriority(
  priority: Priority,
  allTasks: Task[],
  today: Date = startOfToday(),
): boolean {
  const scheduledFor = rootTaskFor(priority, allTasks)?.scheduled_for;
  return Boolean(scheduledFor && scheduledFor > dateKey(today));
}

export interface Workload {
  openTasks: number;
  /** Open priorities that are active now (planned ones excluded). */
  openPriorities: number;
  /** Open priorities parked until a future date. */
  scheduledPriorities: number;
  overdueTasks: number;
  overduePriorities: number;
  overdue: number;
}

/**
 * Open and overdue counts for one collaborator, or for the whole team when
 * `name` is null. `tasks` must already be ordinary tasks; `allTasks` (every
 * task, including priority trees) is needed to know which priorities are planned.
 */
export function workloadFor(
  name: string | null,
  tasks: Task[],
  priorities: Priority[],
  today: Date = startOfToday(),
  allTasks: Task[] = tasks,
): Workload {
  const mine = <T extends { assigned_to: string[] }>(item: T) =>
    name === null || assigneeMatches(item.assigned_to, name);
  const openTasks = tasks.filter(task => !task.completed && mine(task));
  const open = priorities.filter(priority => isOpenPriority(priority) && mine(priority));
  const activePriorities = open.filter(priority => !isScheduledPriority(priority, allTasks, today));
  const overdueTasks = openTasks.filter(task => isPastDue(task.due_date, today)).length;
  const overduePriorities = activePriorities.filter(priority => isPastDue(priority.due_date, today)).length;
  return {
    openTasks: openTasks.length,
    openPriorities: activePriorities.length,
    scheduledPriorities: open.length - activePriorities.length,
    overdueTasks,
    overduePriorities,
    overdue: overdueTasks + overduePriorities,
  };
}

export interface ProcessWorkload {
  /** Processos abertos ativos agora (os planejados para depois ficam à parte). */
  openProcesses: number;
  /** Processos abertos de peso Máxima, ativos agora. */
  maximumProcesses: number;
  /** Processos abertos planejados para uma data futura. */
  plannedProcesses: number;
  /** Processos abertos ativos com vencimento antes de hoje. */
  overdue: number;
}

/**
 * Processos v2 (D-025): os números da Central contam processos (tarefas
 * principais), do mesmo jeito que a aba Processos lista. Para um colaborador,
 * contam os processos dele e aqueles em que ele tem etapa aberta.
 */
export function processWorkloadFor(
  name: string | null,
  tasks: Task[],
  today: Date = startOfToday(),
): ProcessWorkload {
  const all = buildProcesses(tasks).filter(isProcessOpen);
  const mine = name === null ? all : processesForAssignee(all, name);
  const todayKey = dateKey(today);
  const planned = mine.filter(process => Boolean(process.scheduledFor && process.scheduledFor > todayKey));
  const active = mine.filter(process => !(process.scheduledFor && process.scheduledFor > todayKey));
  return {
    openProcesses: active.length,
    maximumProcesses: active.filter(process => isMaximumWeight(process.weight)).length,
    plannedProcesses: planned.length,
    overdue: active.filter(process => isPastDue(process.dueDate, today)).length,
  };
}

/**
 * Peso de um entregável para o ranking: o peso do processo que o gerou (ou da
 * prioridade antiga). Entregável manual, sem processo, vale 1.
 */
export function deliverableWeight(
  deliverable: Pick<Deliverable, 'source_task_id' | 'source_priority_id'>,
  taskById: Map<string, Pick<Task, 'weight' | 'priority'>>,
  priorityById: Map<string, Pick<Priority, 'weight'>>,
): ProcessWeight {
  const task = deliverable.source_task_id ? taskById.get(deliverable.source_task_id) : undefined;
  if (task) return normalizeProcessWeight(task.weight, weightForUrgency(task.priority));
  const priority = deliverable.source_priority_id ? priorityById.get(deliverable.source_priority_id) : undefined;
  if (priority) return normalizeProcessWeight(priority.weight, 1);
  return 1;
}
