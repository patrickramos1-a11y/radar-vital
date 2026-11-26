import { describe, expect, it } from 'vitest';
import type { Task } from '@/types/task';
import {
  buildFollowUpStep, describeFollowUp, followUpDates, nextFollowUpDate, projectFollowUp,
  ruleFromTask, ruleToStorage, summarizeFollowUp, type FollowUpRule,
} from './recurringFollowUp';

const laudo: FollowUpRule = { anchorDate: '2026-09-15', every: 180, unit: 'days', first: 'after_interval' };

const mother = (overrides: Partial<Task> = {}) => ({
  id: 'mae', client_id: 'cliente', title: 'Laudo da caixa SAO', description: null, assigned_to: ['Patrick'],
  parent_task_id: null, priority: 'normal', weight: 3, modality: 'acompanhamento', status: 'pendente',
  completed: false, created_at: '2026-11-26T10:00:00Z', completed_at: null, due_date: null, scheduled_for: null,
  sort_order: 0, source_comment_id: null, recurrence_origin_id: null, updated_at: '2026-11-26T10:00:00Z',
  ...ruleToStorage(laudo, { label: 'Emissão da LO' }),
  ...overrides,
}) as Task;

const step = (date: string, overrides: Partial<Task> = {}) => ({
  ...mother(), id: `etapa-${date}`, parent_task_id: 'mae', recurrence: 'none', recurrence_origin_id: 'mae',
  recurrence_interval: null, recurrence_unit: null, due_date: date, ...overrides,
}) as Task;

describe('datas do acompanhamento', () => {
  it('counts from the license date, one period later', () => {
    expect(followUpDates(laudo, { limit: 3 })).toEqual(['2027-03-14', '2027-09-10', '2028-03-08']);
    expect(describeFollowUp(laudo)).toBe('Começa em 14/03/2027 e repete a cada 180 dias.');
  });

  it('starts on the date itself for a plain monthly visit', () => {
    const visita: FollowUpRule = { anchorDate: '2026-01-31', every: 1, unit: 'months', first: 'anchor' };
    expect(followUpDates(visita, { limit: 3 })).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
  });

  it('stops at the end date and at the number of times', () => {
    const semestral: FollowUpRule = { anchorDate: '2026-09-15', every: 6, unit: 'months', first: 'after_interval', endDate: '2028-03-15' };
    expect(followUpDates(semestral)).toEqual(['2027-03-15', '2027-09-15', '2028-03-15']);
    expect(followUpDates({ ...semestral, endDate: null, maxCount: 2 })).toEqual(['2027-03-15', '2027-09-15']);
    expect(describeFollowUp({ ...semestral, endDate: null, maxCount: 2 })).toBe('Começa em 15/03/2027 e repete a cada 6 meses, 2 vezes no total.');
  });

  it('splits past and upcoming dates around today', () => {
    const antigo: FollowUpRule = { anchorDate: '2026-05-01', every: 2, unit: 'months', first: 'anchor' };
    const projection = projectFollowUp(antigo, '2026-11-26', 2);
    expect(projection.past).toEqual(['2026-05-01', '2026-07-01', '2026-09-01', '2026-11-01']);
    expect(projection.upcoming).toEqual(['2027-01-01', '2027-03-01']);
    expect(projection.ended).toBe(false);
  });

  it('stores weeks as days and years as months, and reads them back', () => {
    const anual: FollowUpRule = { anchorDate: '2026-09-15', every: 1, unit: 'years', first: 'after_interval' };
    expect(ruleToStorage(anual)).toMatchObject({ recurrence: 'custom', recurrence_interval: 12, recurrence_unit: 'months' });
    expect(ruleFromTask(mother(ruleToStorage(anual)))).toMatchObject({ every: 1, unit: 'years', first: 'after_interval' });
    const semanas: FollowUpRule = { anchorDate: '2026-11-26', every: 2, unit: 'weeks', first: 'anchor' };
    expect(ruleFromTask(mother(ruleToStorage(semanas)))).toMatchObject({ every: 2, unit: 'weeks' });
  });

  it('reads old processes without a landmark from the due date', () => {
    expect(ruleFromTask(mother({ recurrence: 'monthly', recurrence_interval: null, recurrence_unit: null, recurrence_anchor_date: null, due_date: '2026-12-05' })))
      .toMatchObject({ anchorDate: '2026-12-05', every: 1, unit: 'months', first: 'anchor' });
  });
});

describe('próxima etapa', () => {
  it('creates the next date when nothing is open from today on', () => {
    expect(nextFollowUpDate(mother(), [], '2026-11-26')).toBe('2027-03-14');
  });

  it('waits while an upcoming step is open', () => {
    expect(nextFollowUpDate(mother(), [step('2027-03-14')], '2026-11-26')).toBeNull();
  });

  it('moves on after the open step is done early, never repeating a date', () => {
    expect(nextFollowUpDate(mother(), [step('2027-03-14', { completed: true, status: 'concluida' })], '2026-11-26')).toBe('2027-09-10');
  });

  it('does not bring back past dates left out at registration', () => {
    const antigo = mother(ruleToStorage({ anchorDate: '2026-05-01', every: 2, unit: 'months', first: 'anchor' }));
    expect(nextFollowUpDate(antigo, [], '2026-11-26')).toBe('2027-01-01');
  });

  it('stops when paused, finished or past the end', () => {
    expect(nextFollowUpDate(mother({ recurrence_paused_at: '2026-11-26T00:00:00Z' }), [], '2026-11-26')).toBeNull();
    expect(nextFollowUpDate(mother({ completed: true, status: 'concluida' }), [], '2026-11-26')).toBeNull();
    expect(nextFollowUpDate(mother({ recurrence_end_date: '2027-01-01' }), [], '2026-11-26')).toBeNull();
  });

  it('plans the step ahead of time when asked', () => {
    const insert = buildFollowUpStep(mother({ recurrence_lead_days: 15 }), '2027-03-14', 'Patrick');
    expect(insert).toMatchObject({ title: 'Laudo da caixa SAO · 14/03/2027', due_date: '2027-03-14', scheduled_for: '2027-02-27', parent_task_id: 'mae', recurrence_origin_id: 'mae', weight: 3 });
  });
});

describe('linha do tempo', () => {
  it('shows what happened, what is late and what is coming', () => {
    const antigo = mother(ruleToStorage({ anchorDate: '2026-05-01', every: 2, unit: 'months', first: 'anchor' }));
    const summary = summarizeFollowUp(antigo, [
      step('2026-07-01', { completed: true, status: 'concluida' }),
      step('2026-09-01', { status: 'cancelada' }),
      step('2026-11-01'),
    ], '2026-11-26', 2)!;
    expect(summary.timeline.map(item => `${item.date}:${item.state}`)).toEqual([
      '2026-05-01:nao-conta', '2026-07-01:feita', '2026-09-01:dispensada', '2026-11-01:atrasada',
      '2027-01-01:prevista', '2027-03-01:prevista',
    ]);
    expect(summary).toMatchObject({ status: 'ativo', next: '2026-11-01', overdue: 1, done: 1 });
  });

  it('asks to close when the last date is behind', () => {
    const curto = mother(ruleToStorage({ anchorDate: '2026-01-10', every: 1, unit: 'months', first: 'anchor', maxCount: 2 }));
    const summary = summarizeFollowUp(curto, [step('2026-01-10', { completed: true, status: 'concluida' }), step('2026-02-10', { completed: true, status: 'concluida' })], '2026-11-26')!;
    expect(summary.status).toBe('para-encerrar');
  });
});
