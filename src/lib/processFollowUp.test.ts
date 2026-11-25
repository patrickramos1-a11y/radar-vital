import { describe, expect, it } from 'vitest';
import type { Task } from '@/types/task';
import { buildProcesses } from './processModel';
import { commentsByProcess, followUpWeeks, staleBucketFor, staleProcesses, type ProcessComment } from './processFollowUp';

const task = (id: string, overrides: Partial<Task> = {}): Task => ({
  id, client_id: 'client-1', title: id, description: null, completed: false, status: 'pendente',
  assigned_to: ['Celine'], created_at: '2026-06-01T12:00:00.000Z', completed_at: null, due_date: null,
  scheduled_for: null, priority: 'normal', weight: 2, modality: 'levantamento', priority_id: null,
  parent_task_id: null, sort_order: 0, source_comment_id: null, recurrence: 'none',
  recurrence_origin_id: null, updated_at: '2026-06-01T12:00:00.000Z', ...overrides,
});

const comment = (id: string, taskId: string, createdAt: string, text = id): ProcessComment => ({
  id, taskId, clientId: 'client-1', authorName: 'Patrick', text, createdAt,
});

// Quarta-feira, 25/11/2026. A semana atual começa na segunda, 23/11.
const now = new Date('2026-11-25T15:00:00');

describe('acompanhamento dos processos', () => {
  it('counts a comment on a step for its process, newest first', () => {
    const processes = buildProcesses([task('root'), task('step', { parent_task_id: 'root' })]);
    const byProcess = commentsByProcess(processes, [
      comment('old', 'root', '2026-11-02T10:00:00'),
      comment('new', 'step', '2026-11-24T10:00:00'),
      comment('lost', 'other-task', '2026-11-24T10:00:00'),
    ]);
    expect(byProcess.get('root')!.map(item => item.id)).toEqual(['new', 'old']);
    expect(byProcess.has('other-task')).toBe(false);
  });

  it('lists the last five weeks with the processes commented in each', () => {
    const processes = buildProcesses([task('a'), task('b'), task('done', { completed: true, status: 'concluida' })]);
    const byProcess = commentsByProcess(processes, [
      comment('a1', 'a', '2026-11-23T09:00:00'),
      comment('a2', 'a', '2026-11-24T09:00:00', 'último da semana'),
      comment('b1', 'b', '2026-11-17T09:00:00'),
      comment('d1', 'done', '2026-11-10T09:00:00'),
      comment('too-old', 'b', '2026-10-20T09:00:00'),
    ]);
    const weeks = followUpWeeks(processes, byProcess, now);
    expect(weeks).toHaveLength(5);
    expect(weeks[0].key).toBe('2026-11-23');
    expect(weeks[0].items.map(item => [item.process.id, item.lastComment?.text, item.count])).toEqual([['a', 'último da semana', 2]]);
    expect(weeks[1].items.map(item => item.process.id)).toEqual(['b']);
    expect(weeks[2].items.map(item => item.process.id)).toEqual(['done']);
    expect(weeks[4].key).toBe('2026-10-26');
    expect(weeks.flatMap(week => week.items).some(item => item.lastComment?.id === 'too-old')).toBe(false);
  });

  it('groups open processes without recent comments by days since the last one', () => {
    const processes = buildProcesses([
      task('recent'),
      task('d40', { weight: 3 }),
      task('d70'),
      task('d120'),
      task('never', { weight: 5 }),
      task('closed', { completed: true, status: 'concluida' }),
    ]);
    const byProcess = commentsByProcess(processes, [
      comment('r', 'recent', '2026-11-20T09:00:00'),
      comment('c40', 'd40', '2026-10-16T09:00:00'),
      comment('c70', 'd70', '2026-09-16T09:00:00'),
      comment('c120', 'd120', '2026-07-28T09:00:00'),
    ]);
    const stale = staleProcesses(processes, byProcess, now);
    expect(stale['30']).toEqual([]);
    expect(stale['60'].map(item => [item.process.id, item.daysSince])).toEqual([['d40', 40]]);
    expect(stale['90'].map(item => item.process.id)).toEqual(['d70']);
    // Peso maior primeiro; nunca comentado entra em "mais de 90 dias".
    expect(stale.over90.map(item => [item.process.id, item.daysSince])).toEqual([['never', null], ['d120', 120]]);
  });

  it('puts processes commented just before the window in the 30-day group', () => {
    // Segunda-feira: a janela de 5 semanas começa 28 dias antes.
    const monday = new Date('2026-11-23T10:00:00');
    const processes = buildProcesses([task('p')]);
    const byProcess = commentsByProcess(processes, [comment('c', 'p', '2026-10-24T10:00:00')]);
    expect(staleProcesses(processes, byProcess, monday)['30'].map(item => item.daysSince)).toEqual([30]);
  });

  it('uses 30, 60 and 90 days as the limits', () => {
    expect([0, 30, 31, 60, 61, 90, 91, null].map(staleBucketFor)).toEqual(['30', '30', '60', '60', '90', '90', 'over90', 'over90']);
  });
});
