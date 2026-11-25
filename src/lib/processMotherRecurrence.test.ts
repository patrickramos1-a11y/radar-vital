import { describe, expect, it } from 'vitest';
import type { Task } from '@/types/task';
import {
  MAX_PAST_PERIODS, buildPeriodStep, isPeriodStep, missingPeriodDates, pendingPeriodSteps,
  recurrenceChoiceFor, recurrenceLabel, recurrenceSetting,
} from './processRecurrence';
import { buildProcesses } from './processModel';

const task = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  client_id: 'client-1',
  title: 'Relatório mensal',
  description: null,
  completed: false,
  status: 'pendente',
  assigned_to: ['Celine'],
  created_at: '2026-11-01T12:00:00.000Z',
  completed_at: null,
  due_date: null,
  scheduled_for: null,
  priority: 'normal',
  weight: 2,
  modality: 'levantamento',
  priority_id: null,
  parent_task_id: null,
  sort_order: 0,
  source_comment_id: null,
  recurrence: 'none',
  recurrence_interval: null,
  recurrence_unit: null,
  recurrence_origin_id: null,
  updated_at: '2026-11-01T12:00:00.000Z',
  ...overrides,
});

describe('processo-mãe recorrente', () => {
  it('creates the overdue periods up to today plus the next one', () => {
    const mother = task('mother', { recurrence: 'monthly', due_date: '2026-09-10' });
    expect(missingPeriodDates(mother, [], '2026-11-25')).toEqual(['2026-09-10', '2026-10-10', '2026-11-10', '2026-12-10']);
  });

  it('only creates the first period when it is still ahead', () => {
    const mother = task('mother', { recurrence: 'weekly', due_date: '2026-12-01' });
    expect(missingPeriodDates(mother, [], '2026-11-25')).toEqual(['2026-12-01']);
  });

  it('starts on the creation day when the process has no due date', () => {
    const mother = task('mother', { recurrence: 'custom', recurrence_interval: 10, recurrence_unit: 'days', created_at: '2026-11-20T09:00:00.000Z' });
    expect(missingPeriodDates(mother, [], '2026-11-25')).toEqual(['2026-11-20', '2026-11-30']);
  });

  it('never repeats a period that already has a step', () => {
    const mother = task('mother', { recurrence: 'monthly', due_date: '2026-10-10' });
    expect(missingPeriodDates(mother, ['2026-10-10', '2026-11-10'], '2026-11-25')).toEqual(['2026-12-10']);
  });

  it('limits how many old periods are created at once', () => {
    const mother = task('mother', { recurrence: 'weekly', due_date: '2025-01-01' });
    const dates = missingPeriodDates(mother, [], '2026-11-25');
    expect(dates).toHaveLength(MAX_PAST_PERIODS + 1);
    expect(dates.at(-1)! > '2026-11-25').toBe(true);
  });

  it('stops generating once the mother is finished', () => {
    const mother = task('mother', { recurrence: 'weekly', due_date: '2026-11-01', completed: true, status: 'concluida' });
    expect(missingPeriodDates(mother, [], '2026-11-25')).toEqual([]);
  });

  it('builds a step inside the mother, linked to it, in date order', () => {
    const mother = task('mother', { recurrence: 'monthly', due_date: '2026-12-10', priority: 'alta' });
    expect(buildPeriodStep(mother, '2026-12-10', 'Patrick')).toMatchObject({
      client_id: 'client-1',
      title: 'Relatório mensal · 10/12/2026',
      parent_task_id: 'mother',
      recurrence_origin_id: 'mother',
      recurrence: 'none',
      due_date: '2026-12-10',
      assigned_to: ['Celine'],
      priority: 'alta',
      sort_order: 20261210,
      created_by: 'Patrick',
    });
  });

  it('collects the missing steps of every open mother, ignoring fixed steps', () => {
    const tasks = [
      task('mother', { recurrence: 'monthly', due_date: '2026-11-10' }),
      task('fixed', { parent_task_id: 'mother', due_date: '2026-12-10' }),
      task('period', { parent_task_id: 'mother', recurrence_origin_id: 'mother', due_date: '2026-11-10' }),
      task('plain', {}),
    ];
    expect(pendingPeriodSteps(tasks, '2026-11-25', null).map(step => step.due_date)).toEqual(['2026-12-10']);
    expect(isPeriodStep(tasks[1])).toBe(false);
    expect(isPeriodStep(tasks[2])).toBe(true);
  });

  it('shows the oldest open period as the due date of the mother', () => {
    const [process] = buildProcesses([
      task('mother', { recurrence: 'monthly', due_date: '2026-09-10' }),
      task('sep', { parent_task_id: 'mother', recurrence_origin_id: 'mother', due_date: '2026-09-10', completed: true, status: 'concluida' }),
      task('oct', { parent_task_id: 'mother', recurrence_origin_id: 'mother', due_date: '2026-10-10' }),
      task('nov', { parent_task_id: 'mother', recurrence_origin_id: 'mother', due_date: '2026-11-10' }),
    ]);
    expect(process.isRecurring).toBe(true);
    expect(process.dueDate).toBe('2026-10-10');
    expect(process.periodSteps.map(step => step.id)).toEqual(['sep', 'oct', 'nov']);
  });
});

describe('repetição no formulário', () => {
  it('saves biweekly and quarterly as free intervals', () => {
    expect(recurrenceSetting('biweekly')).toEqual({ recurrence: 'custom', recurrence_interval: 14, recurrence_unit: 'days' });
    expect(recurrenceSetting('quarterly')).toEqual({ recurrence: 'custom', recurrence_interval: 3, recurrence_unit: 'months' });
    expect(recurrenceSetting('monthly')).toEqual({ recurrence: 'monthly', recurrence_interval: null, recurrence_unit: null });
    expect(recurrenceSetting('every-days', 0)).toEqual({ recurrence: 'custom', recurrence_interval: 1, recurrence_unit: 'days' });
    expect(recurrenceSetting('every-months', 999)).toEqual({ recurrence: 'custom', recurrence_interval: 366, recurrence_unit: 'months' });
  });

  it('reads the saved setting back into the form and the badge', () => {
    expect(recurrenceChoiceFor({ recurrence: 'custom', recurrence_interval: 14, recurrence_unit: 'days' })).toEqual({ choice: 'biweekly', every: 14 });
    expect(recurrenceChoiceFor({ recurrence: 'custom', recurrence_interval: 2, recurrence_unit: 'months' })).toEqual({ choice: 'every-months', every: 2 });
    expect(recurrenceLabel({ recurrence: 'custom', recurrence_interval: 10, recurrence_unit: 'days' })).toBe('A cada 10 dias');
    expect(recurrenceLabel({ recurrence: 'custom', recurrence_interval: 3, recurrence_unit: 'months' })).toBe('Trimestral');
    expect(recurrenceLabel({ recurrence: 'none' })).toBeNull();
  });
});
