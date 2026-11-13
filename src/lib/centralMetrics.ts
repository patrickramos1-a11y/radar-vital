import type { Priority } from '@/types/priority';
import type { Task } from '@/types/task';
import { assigneeMatches } from '@/lib/taskAssignee';
import { priorityTaskTreeIds } from '@/lib/taskHierarchy';

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
