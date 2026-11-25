import type { Database } from '@/integrations/supabase/types';
import type { Priority } from '@/types/priority';
import type { Task, TaskPriority, TaskRecurrenceUnit } from '@/types/task';
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

// ---------------------------------------------------------------------------
// Processos v2 (D-025): processo-mãe recorrente.
// O processo que se repete fica aberto; a cada período nasce uma etapa dentro
// dele, com o vencimento daquele período. A etapa aponta para a mãe em
// `parent_task_id` e em `recurrence_origin_id`; o banco aceita uma única
// etapa por mãe e data (índice tasks_recurring_occurrence_unique).
// ---------------------------------------------------------------------------

export type RecurringMother = Pick<Task,
  'id' | 'client_id' | 'title' | 'assigned_to' | 'due_date' | 'created_at' | 'priority' | 'modality'
  | 'recurrence' | 'recurrence_interval' | 'recurrence_unit' | 'parent_task_id' | 'completed' | 'status'>;

/** Opções do formulário. Quinzenal e trimestral gravam como intervalo livre. */
export type RecurrenceChoice = 'none' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'every-days' | 'every-months';

export interface RecurrenceSetting {
  recurrence: Task['recurrence'];
  recurrence_interval: number | null;
  recurrence_unit: TaskRecurrenceUnit | null;
}

export const RECURRENCE_CHOICE_LABELS: Record<RecurrenceChoice, string> = {
  none: 'Não repetir',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  'every-days': 'A cada N dias',
  'every-months': 'A cada N meses',
};

export function recurrenceSetting(choice: RecurrenceChoice, every = 1): RecurrenceSetting {
  const interval = Math.min(366, Math.max(1, Math.round(every) || 1));
  switch (choice) {
    case 'weekly': return { recurrence: 'weekly', recurrence_interval: null, recurrence_unit: null };
    case 'monthly': return { recurrence: 'monthly', recurrence_interval: null, recurrence_unit: null };
    case 'biweekly': return { recurrence: 'custom', recurrence_interval: 14, recurrence_unit: 'days' };
    case 'quarterly': return { recurrence: 'custom', recurrence_interval: 3, recurrence_unit: 'months' };
    case 'every-days': return { recurrence: 'custom', recurrence_interval: interval, recurrence_unit: 'days' };
    case 'every-months': return { recurrence: 'custom', recurrence_interval: interval, recurrence_unit: 'months' };
    default: return { recurrence: 'none', recurrence_interval: null, recurrence_unit: null };
  }
}

/** Caminho inverso, para abrir o formulário de um processo já gravado. */
export function recurrenceChoiceFor(task: Pick<Task, 'recurrence' | 'recurrence_interval' | 'recurrence_unit'>): { choice: RecurrenceChoice; every: number } {
  if (task.recurrence === 'weekly') return { choice: 'weekly', every: 1 };
  if (task.recurrence === 'monthly') return { choice: 'monthly', every: 1 };
  if (task.recurrence === 'custom' && task.recurrence_interval) {
    if (task.recurrence_unit === 'days') return task.recurrence_interval === 14 ? { choice: 'biweekly', every: 14 } : { choice: 'every-days', every: task.recurrence_interval };
    if (task.recurrence_unit === 'months') return task.recurrence_interval === 3 ? { choice: 'quarterly', every: 3 } : { choice: 'every-months', every: task.recurrence_interval };
  }
  return { choice: 'none', every: 1 };
}

export function recurrenceLabel(task: Pick<Task, 'recurrence' | 'recurrence_interval' | 'recurrence_unit'>): string | null {
  const { choice, every } = recurrenceChoiceFor(task);
  if (choice === 'none') return null;
  if (choice === 'every-days') return `A cada ${every} dias`;
  if (choice === 'every-months') return `A cada ${every} meses`;
  return RECURRENCE_CHOICE_LABELS[choice];
}

export function isRecurringMother(task: Pick<Task, 'recurrence' | 'parent_task_id'>): boolean {
  return task.recurrence !== 'none' && !task.parent_task_id;
}

/** A regra de datas da mãe. O primeiro período é o vencimento; sem ele, o dia do cadastro. */
export function recurrenceRuleFor(mother: RecurringMother): ProcessRecurrence | null {
  if (!isRecurringMother(mother)) return null;
  const startDate = mother.due_date || mother.created_at.slice(0, 10);
  const dayOfMonth = Number(startDate.slice(8, 10));
  if (mother.recurrence === 'weekly') return { unit: 'days', interval: 7, startDate };
  if (mother.recurrence === 'monthly') return { unit: 'months', interval: 1, startDate, dayOfMonth };
  if (mother.recurrence === 'custom' && mother.recurrence_interval && mother.recurrence_interval >= 1) {
    if (mother.recurrence_unit === 'days') return { unit: 'days', interval: mother.recurrence_interval, startDate };
    if (mother.recurrence_unit === 'months') return { unit: 'months', interval: mother.recurrence_interval, startDate, dayOfMonth };
  }
  return null;
}

/** Quantos períodos já vencidos, no máximo, são criados de uma vez. */
export const MAX_PAST_PERIODS = 12;

/**
 * Datas de etapas que faltam criar: os períodos vencidos até hoje (os mais
 * recentes, até MAX_PAST_PERIODS) mais o próximo período.
 */
export function missingPeriodDates(mother: RecurringMother, existingDates: Iterable<string>, today: string, maxPast = MAX_PAST_PERIODS): string[] {
  if (mother.completed || mother.status === 'cancelada') return [];
  const rule = recurrenceRuleFor(mother);
  if (!rule) return [];
  const past: string[] = [];
  let next: string | null = null;
  for (let index = 0; index < 5000; index += 1) {
    const date = occurrenceDate(rule, index);
    if (date > today) { next = date; break; }
    past.push(date);
  }
  const existing = new Set(existingDates);
  return [...past.slice(-maxPast), ...(next ? [next] : [])].filter(date => !existing.has(date));
}

function brDate(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
}

export function buildPeriodStep(mother: RecurringMother, dueDate: string, createdBy: string | null): Database['public']['Tables']['tasks']['Insert'] {
  return {
    client_id: mother.client_id,
    title: `${mother.title} · ${brDate(dueDate)}`,
    assigned_to: mother.assigned_to.slice(0, 1),
    due_date: dueDate,
    priority: mother.priority,
    modality: mother.modality,
    status: 'pendente',
    completed: false,
    parent_task_id: mother.id,
    recurrence: 'none',
    recurrence_origin_id: mother.id,
    // AAAAMMDD: as etapas de período ficam em ordem de data, depois das etapas fixas.
    sort_order: Number(dueDate.replace(/-/g, '')),
    created_by: createdBy,
  };
}

/** Etapas de período que faltam para todas as mães abertas da lista. */
export function pendingPeriodSteps(tasks: Task[], today: string, createdBy: string | null): Database['public']['Tables']['tasks']['Insert'][] {
  const datesByMother = new Map<string, string[]>();
  for (const task of tasks) {
    if (!task.recurrence_origin_id || task.parent_task_id !== task.recurrence_origin_id || !task.due_date) continue;
    datesByMother.set(task.parent_task_id, [...(datesByMother.get(task.parent_task_id) ?? []), task.due_date]);
  }
  return tasks
    .filter(isRecurringMother)
    .flatMap(mother => missingPeriodDates(mother, datesByMother.get(mother.id) ?? [], today)
      .map(date => buildPeriodStep(mother, date, createdBy)));
}

/** Etapa criada pela repetição (e não uma etapa fixa do processo). */
export function isPeriodStep(task: Pick<Task, 'parent_task_id' | 'recurrence_origin_id'>): boolean {
  return Boolean(task.parent_task_id && task.recurrence_origin_id === task.parent_task_id);
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
