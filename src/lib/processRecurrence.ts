import type { Database } from '@/integrations/supabase/types';
import type { Priority } from '@/types/priority';
import type { Task, TaskPriority } from '@/types/task';
import { getNextRecurrenceDate } from '@/lib/taskOperations';

export type ProcessRecurrence =
  | { unit: 'days'; interval: number; startDate: string }
  | { unit: 'months'; interval: number; startDate: string; dayOfMonth: number };

function parseDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error('Data invalida. Use AAAA-MM-DD.');
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (date.toISOString().slice(0, 10) !== value) throw new Error('Data invalida.');
  return date;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function occurrenceDate(rule: ProcessRecurrence, index: number): string {
  if (!Number.isSafeInteger(index) || index < 0) throw new Error('Indice invalido.');
  if (!Number.isSafeInteger(rule.interval) || rule.interval < 1) throw new Error('Intervalo invalido.');
  const start = parseDate(rule.startDate);

  if (rule.unit === 'days') {
    start.setUTCDate(start.getUTCDate() + index * rule.interval);
    return formatDate(start);
  }

  if (!Number.isSafeInteger(rule.dayOfMonth) || rule.dayOfMonth < 1 || rule.dayOfMonth > 31) {
    throw new Error('Dia do mes invalido.');
  }
  const targetMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index * rule.interval, 1));
  const lastDay = new Date(Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth() + 1, 0)).getUTCDate();
  targetMonth.setUTCDate(Math.min(rule.dayOfMonth, lastDay));
  return formatDate(targetMonth);
}

export function dueOccurrences(rule: ProcessRecurrence, throughDate: string, limit = 120): string[] {
  const through = parseDate(throughDate).getTime();
  if (!Number.isSafeInteger(limit) || limit < 1) throw new Error('Limite invalido.');
  const dates: string[] = [];
  for (let index = 0; index < limit; index += 1) {
    const date = occurrenceDate(rule, index);
    if (parseDate(date).getTime() > through) break;
    if (parseDate(date).getTime() >= parseDate(rule.startDate).getTime()) dates.push(date);
  }
  return dates;
}

/** Maps a priority weight (1-5) to the task urgency scale. */
export function taskUrgencyForWeight(weight: number): TaskPriority {
  if (weight >= 4) return 'urgente';
  if (weight === 3) return 'alta';
  if (weight === 2) return 'normal';
  return 'baixa';
}

export interface NextProcessOccurrence {
  dueDate: string;
  task: Database['public']['Tables']['tasks']['Insert'];
  priority: Database['public']['Tables']['priorities']['Insert'] | null;
}

/**
 * When a repeating process is finished, the next period starts as a fresh
 * process with the same client, people and content. The planning date moves by
 * the same distance as the due date, so "plan two days before" is kept.
 * Every occurrence points to the first one (recurrence_origin_id); the database
 * accepts a single occurrence per origin and due date, so repeating the call is safe.
 */
export type RecurringRoot = Pick<Task,
  'id' | 'client_id' | 'title' | 'description' | 'external_url' | 'assigned_to' | 'due_date' | 'scheduled_for'
  | 'priority' | 'modality' | 'recurrence' | 'recurrence_origin_id' | 'parent_task_id'>;

export function buildNextProcessOccurrence(
  root: RecurringRoot,
  priority: Priority | null,
  createdBy: string | null,
  now = new Date(),
): NextProcessOccurrence | null {
  if (root.recurrence === 'none' || root.parent_task_id) return null;
  const baseDue = priority?.due_date || root.due_date;
  const dueDate = getNextRecurrenceDate(baseDue, root.recurrence, now);
  if (!dueDate) return null;

  let scheduledFor: string | null = null;
  if (root.scheduled_for && baseDue) {
    const shift = Date.parse(`${dueDate}T12:00:00Z`) - Date.parse(`${baseDue}T12:00:00Z`);
    scheduledFor = new Date(Date.parse(`${root.scheduled_for}T12:00:00Z`) + shift).toISOString().slice(0, 10);
  }

  const assignees = (priority?.assigned_to.length ? priority.assigned_to : root.assigned_to).slice(0, 1);
  const task: Database['public']['Tables']['tasks']['Insert'] = {
    client_id: root.client_id,
    title: priority?.title || root.title,
    description: priority?.description ?? root.description,
    external_url: root.external_url ?? null,
    assigned_to: assignees,
    due_date: dueDate,
    scheduled_for: scheduledFor,
    priority: priority ? taskUrgencyForWeight(priority.weight) : root.priority,
    modality: root.modality,
    status: 'pendente',
    completed: false,
    recurrence: root.recurrence,
    recurrence_origin_id: root.recurrence_origin_id || root.id,
    created_by: createdBy,
  };

  const nextPriority = priority ? {
    title: priority.title,
    description: priority.description,
    client_id: root.client_id,
    assigned_to: assignees,
    due_date: dueDate,
    status: 'aberta',
    weight: priority.weight,
    category: priority.category,
    created_by: createdBy,
  } satisfies Database['public']['Tables']['priorities']['Insert'] : null;

  return { dueDate, task, priority: nextPriority };
}
