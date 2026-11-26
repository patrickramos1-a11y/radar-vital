import type { Database } from '@/integrations/supabase/types';
import type { FollowUpColumns, Task, TaskRecurrence, TaskRecurrenceFirst, TaskRecurrenceUnit } from '@/types/task';
import { occurrenceDate, type ProcessRecurrence } from '@/lib/processRecurrence';

/**
 * Acompanhamentos recorrentes (docs/roadmap/PROCESSOS_RECORRENTES.md).
 * Um acompanhamento é um processo-mãe aberto; cada data é uma etapa dentro
 * dele. As datas seguem o marco, nunca a data em que a etapa foi feita.
 */

export type FollowUpUnit = 'days' | 'weeks' | 'months' | 'years';

export interface FollowUpRule {
  /** Marco ou data de início (AAAA-MM-DD). */
  anchorDate: string;
  every: number;
  unit: FollowUpUnit;
  first: TaskRecurrenceFirst;
  endDate?: string | null;
  maxCount?: number | null;
}

export const FOLLOW_UP_UNIT_LABELS: Record<FollowUpUnit, { one: string; many: string }> = {
  days: { one: 'dia', many: 'dias' },
  weeks: { one: 'semana', many: 'semanas' },
  months: { one: 'mês', many: 'meses' },
  years: { one: 'ano', many: 'anos' },
};

/** Atalhos do formulário. */
export const FOLLOW_UP_PRESETS: { label: string; every: number; unit: FollowUpUnit }[] = [
  { label: 'Semanal', every: 1, unit: 'weeks' },
  { label: 'Quinzenal', every: 15, unit: 'days' },
  { label: 'Mensal', every: 1, unit: 'months' },
  { label: 'Bimestral', every: 2, unit: 'months' },
  { label: 'Trimestral', every: 3, unit: 'months' },
  { label: 'Semestral', every: 6, unit: 'months' },
  { label: '180 dias', every: 180, unit: 'days' },
  { label: 'Anual', every: 1, unit: 'years' },
];

/** Limite do banco (`recurrence_interval` vai de 1 a 366). */
export const MAX_EVERY: Record<FollowUpUnit, number> = { days: 366, weeks: 52, months: 366, years: 30 };

export function everyLabel(every: number, unit: FollowUpUnit): string {
  if (every === 1) {
    return { days: 'todo dia', weeks: 'toda semana', months: 'todo mês', years: 'todo ano' }[unit];
  }
  return `a cada ${every} ${FOLLOW_UP_UNIT_LABELS[unit].many}`;
}

function toProcessRule(rule: FollowUpRule): ProcessRecurrence {
  const dayOfMonth = Number(rule.anchorDate.slice(8, 10));
  switch (rule.unit) {
    case 'days': return { unit: 'days', interval: rule.every, startDate: rule.anchorDate };
    case 'weeks': return { unit: 'days', interval: rule.every * 7, startDate: rule.anchorDate };
    case 'months': return { unit: 'months', interval: rule.every, startDate: rule.anchorDate, dayOfMonth };
    case 'years': return { unit: 'months', interval: rule.every * 12, startDate: rule.anchorDate, dayOfMonth };
  }
}

export function isValidRule(rule: FollowUpRule | null | undefined): rule is FollowUpRule {
  return Boolean(rule
    && /^\d{4}-\d{2}-\d{2}$/.test(rule.anchorDate)
    && Number.isInteger(rule.every) && rule.every >= 1 && rule.every <= MAX_EVERY[rule.unit]
    && (!rule.maxCount || (Number.isInteger(rule.maxCount) && rule.maxCount >= 1))
    && (!rule.endDate || rule.endDate >= rule.anchorDate));
}

/**
 * Datas do acompanhamento em ordem, respeitando o "até quando".
 * `limit` protege contra laços longos (ex.: todo dia, sem fim).
 */
export function followUpDates(rule: FollowUpRule, options: { through?: string; limit?: number } = {}): string[] {
  if (!isValidRule(rule)) return [];
  const limit = options.limit ?? 400;
  const base = toProcessRule(rule);
  const offset = rule.first === 'after_interval' ? 1 : 0;
  const dates: string[] = [];
  for (let index = 0; dates.length < limit; index += 1) {
    if (rule.maxCount && index >= rule.maxCount) break;
    const date = occurrenceDate(base, index + offset);
    if (rule.endDate && date > rule.endDate) break;
    if (options.through && date > options.through) break;
    dates.push(date);
  }
  return dates;
}

export interface FollowUpProjection {
  /** Datas que já passaram (antes de hoje). */
  past: string[];
  /** Próximas datas, de hoje em diante, até `upcomingCount`. */
  upcoming: string[];
  /** true quando não há mais datas depois das listadas. */
  ended: boolean;
}

export function projectFollowUp(rule: FollowUpRule, today: string, upcomingCount = 6, maxPast = 60): FollowUpProjection {
  const past: string[] = [];
  const upcoming: string[] = [];
  const all = followUpDates(rule, { limit: 5000 });
  for (const date of all) {
    if (date < today) past.push(date);
    else if (upcoming.length < upcomingCount) upcoming.push(date);
    else break;
  }
  const last = upcoming[upcoming.length - 1] ?? past[past.length - 1];
  const ended = !last || all[all.length - 1] === last;
  return { past: past.slice(-maxPast), upcoming, ended };
}

export function brDate(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
}

/** Frase que confirma a regra no formulário e no cartão. */
export function describeFollowUp(rule: FollowUpRule): string {
  if (!isValidRule(rule)) return 'Preencha a data e a frequência para ver as datas.';
  const [first] = followUpDates(rule, { limit: 1 });
  if (!first) return 'Nenhuma data cabe nesse período.';
  const parts = [`Começa em ${brDate(first)} e repete ${everyLabel(rule.every, rule.unit)}`];
  if (rule.endDate) parts.push(`até ${brDate(rule.endDate)}`);
  if (rule.maxCount) parts.push(`${rule.maxCount === 1 ? 'uma vez' : `${rule.maxCount} vezes`} no total`);
  return `${parts.join(', ')}.`;
}

// ---------------------------------------------------------------------------
// Gravação: como a regra fica nas colunas da tarefa.
// ---------------------------------------------------------------------------

export type FollowUpStorage = {
  recurrence: TaskRecurrence;
  recurrence_interval: number | null;
  recurrence_unit: TaskRecurrenceUnit | null;
} & Required<Pick<FollowUpColumns,
  'recurrence_anchor_date' | 'recurrence_anchor_label' | 'recurrence_first'
  | 'recurrence_end_date' | 'recurrence_max_count' | 'recurrence_lead_days'>>;

/** Semanas viram dias e anos viram meses; o banco só conhece dias e meses. */
export function ruleToStorage(rule: FollowUpRule, extra: { label?: string | null; leadDays?: number } = {}): FollowUpStorage {
  const days = rule.unit === 'days' || rule.unit === 'weeks';
  const interval = rule.unit === 'weeks' ? rule.every * 7 : rule.unit === 'years' ? rule.every * 12 : rule.every;
  return {
    recurrence: 'custom',
    recurrence_interval: interval,
    recurrence_unit: days ? 'days' : 'months',
    recurrence_anchor_date: rule.anchorDate,
    recurrence_anchor_label: extra.label?.trim() || null,
    recurrence_first: rule.first,
    recurrence_end_date: rule.endDate || null,
    recurrence_max_count: rule.maxCount || null,
    recurrence_lead_days: Math.max(0, Math.min(365, Math.round(extra.leadDays ?? 0))),
  };
}

export type FollowUpMother = Pick<Task,
  'recurrence' | 'recurrence_interval' | 'recurrence_unit' | 'due_date' | 'created_at' | 'parent_task_id'>
  & FollowUpColumns;

/** Lê a regra gravada. Processos antigos sem marco usam o vencimento (ou o cadastro) como 1ª data. */
export function ruleFromTask(task: FollowUpMother): FollowUpRule | null {
  if (task.recurrence === 'none' || task.parent_task_id) return null;
  const anchorDate = task.recurrence_anchor_date || task.due_date || task.created_at.slice(0, 10);
  const first: TaskRecurrenceFirst = task.recurrence_anchor_date ? task.recurrence_first ?? 'anchor' : 'anchor';
  const common = { anchorDate, first, endDate: task.recurrence_end_date ?? null, maxCount: task.recurrence_max_count ?? null };
  if (task.recurrence === 'weekly') return { ...common, every: 1, unit: 'weeks' };
  if (task.recurrence === 'monthly') return { ...common, every: 1, unit: 'months' };
  if (task.recurrence === 'custom' && task.recurrence_interval) {
    const interval = task.recurrence_interval;
    if (task.recurrence_unit === 'days') {
      return interval % 7 === 0 && interval <= 7 * 52 ? { ...common, every: interval / 7, unit: 'weeks' } : { ...common, every: interval, unit: 'days' };
    }
    if (task.recurrence_unit === 'months') {
      return interval % 12 === 0 ? { ...common, every: interval / 12, unit: 'years' } : { ...common, every: interval, unit: 'months' };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Etapas: uma por data. A data escolhida vira etapa; as demais são projeção.
// ---------------------------------------------------------------------------

export type FollowUpStepMother = Pick<Task,
  'id' | 'client_id' | 'title' | 'assigned_to' | 'priority' | 'weight' | 'modality' | 'recurrence' | 'recurrence_interval'
  | 'recurrence_unit' | 'due_date' | 'created_at' | 'parent_task_id' | 'completed' | 'status'> & FollowUpColumns;

function minusDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

export function buildFollowUpStep(mother: FollowUpStepMother, dueDate: string, createdBy: string | null): Database['public']['Tables']['tasks']['Insert'] {
  const lead = mother.recurrence_lead_days ?? 0;
  return {
    client_id: mother.client_id,
    title: `${mother.title} · ${brDate(dueDate)}`,
    assigned_to: mother.assigned_to.slice(0, 1),
    due_date: dueDate,
    scheduled_for: lead > 0 ? minusDays(dueDate, lead) : null,
    priority: mother.priority,
    weight: mother.weight,
    modality: mother.modality,
    status: 'pendente',
    completed: false,
    parent_task_id: mother.id,
    recurrence: 'none',
    recurrence_origin_id: mother.id,
    // AAAAMMDD: as etapas de data ficam em ordem, depois das etapas fixas.
    sort_order: Number(dueDate.replace(/-/g, '')),
    created_by: createdBy,
  };
}

export type FollowUpStep = Pick<Task, 'due_date' | 'completed' | 'status'>;

/**
 * A próxima data que precisa nascer como etapa: o acompanhamento ativo sempre
 * tem uma etapa aberta de hoje em diante. Datas passadas que não viraram etapa
 * no cadastro não são criadas aqui (ficam como "não conta").
 */
export function nextFollowUpDate(mother: FollowUpStepMother, steps: FollowUpStep[], today: string): string | null {
  if (mother.completed || mother.status === 'cancelada' || mother.recurrence_paused_at) return null;
  const rule = ruleFromTask(mother);
  if (!rule) return null;
  const hasOpenUpcoming = steps.some(step => step.due_date && step.due_date >= today && !step.completed && step.status !== 'cancelada');
  if (hasOpenUpcoming) return null;
  const existing = new Set(steps.map(step => step.due_date).filter(Boolean));
  const lastExisting = [...existing].sort().pop() ?? '';
  const floor = lastExisting >= today ? lastExisting : today;
  for (const date of followUpDates(rule, { limit: 5000 })) {
    if (date < floor || existing.has(date)) continue;
    return date;
  }
  return null;
}

/** Etapas de data de um processo-mãe (e não as etapas fixas dele). */
export function isFollowUpStep(task: Pick<Task, 'parent_task_id' | 'recurrence_origin_id'>): boolean {
  return Boolean(task.parent_task_id && task.recurrence_origin_id === task.parent_task_id);
}

/** A próxima etapa que falta em cada acompanhamento ativo da lista. */
export function pendingFollowUpSteps(tasks: Task[], today: string, createdBy: string | null): Database['public']['Tables']['tasks']['Insert'][] {
  const stepsByMother = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!isFollowUpStep(task)) continue;
    stepsByMother.set(task.parent_task_id!, [...(stepsByMother.get(task.parent_task_id!) ?? []), task]);
  }
  return tasks
    .filter(task => task.recurrence !== 'none' && !task.parent_task_id)
    .flatMap(mother => {
      const date = nextFollowUpDate(mother, stepsByMother.get(mother.id) ?? [], today);
      return date ? [buildFollowUpStep(mother, date, createdBy)] : [];
    });
}

export type FollowUpStatus ='ativo' | 'pausado' | 'encerrado' | 'para-encerrar';

export interface FollowUpTimelineItem {
  date: string;
  state: 'feita' | 'atrasada' | 'aberta' | 'dispensada' | 'nao-conta' | 'prevista';
  step?: Task;
}

export interface FollowUpSummary {
  rule: FollowUpRule;
  status: FollowUpStatus;
  next: string | null;
  overdue: number;
  done: number;
  timeline: FollowUpTimelineItem[];
}

/** Linha do tempo do cartão: passado (com o que aconteceu), aberto e previsto. */
export function summarizeFollowUp(mother: Task, steps: Task[], today: string, upcomingCount = 6): FollowUpSummary | null {
  const rule = ruleFromTask(mother);
  if (!rule) return null;
  const byDate = new Map(steps.filter(step => step.due_date).map(step => [step.due_date!, step]));
  const projection = projectFollowUp(rule, today, upcomingCount);
  const timeline: FollowUpTimelineItem[] = [];
  const seen = new Set<string>();
  for (const date of [...projection.past, ...projection.upcoming]) {
    seen.add(date);
    const step = byDate.get(date);
    if (step) timeline.push({ date, step, state: stepState(step, today) });
    else timeline.push({ date, state: date < today ? 'nao-conta' : 'prevista' });
  }
  // Etapas fora da regra atual (regra editada depois) continuam visíveis.
  for (const [date, step] of byDate) {
    if (!seen.has(date)) timeline.push({ date, step, state: stepState(step, today) });
  }
  timeline.sort((a, b) => a.date.localeCompare(b.date));

  const overdue = timeline.filter(item => item.state === 'atrasada').length;
  const done = timeline.filter(item => item.state === 'feita').length;
  const openItem = timeline.find(item => item.state === 'atrasada' || item.state === 'aberta');
  const next = openItem?.date ?? timeline.find(item => item.state === 'prevista')?.date ?? null;
  const finished = mother.completed || mother.status === 'cancelada';
  const noMoreDates = projection.ended && !timeline.some(item => item.state === 'atrasada' || item.state === 'aberta' || item.state === 'prevista');
  const status: FollowUpStatus = finished ? 'encerrado' : mother.recurrence_paused_at ? 'pausado' : noMoreDates ? 'para-encerrar' : 'ativo';
  return { rule, status, next, overdue, done, timeline };
}

function stepState(step: Task, today: string): FollowUpTimelineItem['state'] {
  if (step.completed) return 'feita';
  if (step.status === 'cancelada') return 'dispensada';
  return step.due_date && step.due_date < today ? 'atrasada' : 'aberta';
}
