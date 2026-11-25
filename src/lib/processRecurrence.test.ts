import { describe, expect, it } from 'vitest';
import type { Priority } from '@/types/priority';
import type { Task } from '@/types/task';
import { buildNextProcessOccurrence, dueOccurrences, occurrenceDate, taskUrgencyForWeight } from './processRecurrence';

describe('process recurrence', () => {
  it('distinguishes calendar months from 30-day intervals', () => {
    expect(occurrenceDate({ unit: 'months', interval: 1, startDate: '2027-01-01', dayOfMonth: 1 }, 1)).toBe('2027-02-01');
    expect(occurrenceDate({ unit: 'days', interval: 30, startDate: '2027-01-01' }, 1)).toBe('2027-01-31');
  });

  it('clamps the day for shorter months without drifting subsequent occurrences', () => {
    const rule = { unit: 'months' as const, interval: 1, startDate: '2027-01-31', dayOfMonth: 31 };
    expect(occurrenceDate(rule, 1)).toBe('2027-02-28');
    expect(occurrenceDate(rule, 2)).toBe('2027-03-31');
  });

  it('lists every due period regardless of whether earlier periods were completed', () => {
    expect(dueOccurrences({ unit: 'months', interval: 1, startDate: '2027-01-01', dayOfMonth: 1 }, '2027-03-02'))
      .toEqual(['2027-01-01', '2027-02-01', '2027-03-01']);
  });

  it('rejects invalid dates and intervals', () => {
    expect(() => occurrenceDate({ unit: 'days', interval: 0, startDate: '2027-01-01' }, 1)).toThrow();
    expect(() => occurrenceDate({ unit: 'days', interval: 30, startDate: '2027-02-30' }, 1)).toThrow();
  });
});

const baseTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'root-1',
  client_id: 'client-1',
  title: 'Relatório mensal',
  description: 'Enviar ao órgão',
  completed: true,
  status: 'concluida',
  assigned_to: ['Gabi'],
  created_at: '2027-01-01T00:00:00.000Z',
  completed_at: '2027-01-30T00:00:00.000Z',
  due_date: '2027-01-31',
  scheduled_for: '2027-01-29',
  priority: 'normal',
  weight: 2,
  modality: 'acompanhamento',
  priority_id: null,
  parent_task_id: null,
  sort_order: 0,
  source_comment_id: null,
  recurrence: 'monthly',
  recurrence_origin_id: null,
  updated_at: '2027-01-30T00:00:00.000Z',
  ...overrides,
});

const basePriority = (overrides: Partial<Priority> = {}): Priority => ({
  id: 'priority-1',
  title: 'Relatório mensal ao órgão',
  description: null,
  client_id: 'client-1',
  assigned_to: ['Celine'],
  due_date: '2027-01-31',
  status: 'concluida',
  weight: 4,
  category: 'acompanhamento',
  created_by: 'Patrick',
  created_at: '2027-01-01T00:00:00.000Z',
  updated_at: '2027-01-30T00:00:00.000Z',
  completed_at: '2027-01-30T00:00:00.000Z',
  source_task_id: 'root-1',
  ...overrides,
});

describe('next process occurrence', () => {
  it('does nothing for processes that do not repeat or for subtasks', () => {
    expect(buildNextProcessOccurrence(baseTask({ recurrence: 'none' }), null, 'Patrick')).toBeNull();
    expect(buildNextProcessOccurrence(baseTask({ parent_task_id: 'other' }), null, 'Patrick')).toBeNull();
  });

  it('opens the next period of a repeating task and keeps the planning distance', () => {
    const next = buildNextProcessOccurrence(baseTask(), null, 'Patrick')!;
    expect(next.priority).toBeNull();
    expect(next.task).toMatchObject({
      client_id: 'client-1', title: 'Relatório mensal', assigned_to: ['Gabi'],
      due_date: next.dueDate, recurrence: 'monthly', recurrence_origin_id: 'root-1',
      status: 'pendente', completed: false,
    });
    const gapDays = (Date.parse(`${next.dueDate}T12:00:00Z`) - Date.parse(`${next.task.scheduled_for}T12:00:00Z`)) / 86_400_000;
    expect(gapDays).toBe(2);
  });

  it('keeps every occurrence pointing to the first one', () => {
    const next = buildNextProcessOccurrence(baseTask({ id: 'third', recurrence_origin_id: 'first' }), null, 'Patrick')!;
    expect(next.task.recurrence_origin_id).toBe('first');
  });

  it('repeats a priority as a new open priority with the same weight and responsible', () => {
    const next = buildNextProcessOccurrence(baseTask({ priority_id: 'priority-1' }), basePriority(), 'Patrick')!;
    expect(next.priority).toMatchObject({
      title: 'Relatório mensal ao órgão', client_id: 'client-1', assigned_to: ['Celine'],
      due_date: next.dueDate, status: 'aberta', weight: 4, created_by: 'Patrick',
    });
    expect(next.task).toMatchObject({ title: 'Relatório mensal ao órgão', assigned_to: ['Celine'], priority: 'urgente' });
  });

  it('maps priority weights to task urgency', () => {
    expect([1, 2, 3, 4, 5].map(taskUrgencyForWeight)).toEqual(['baixa', 'normal', 'alta', 'urgente', 'urgente']);
  });
});
