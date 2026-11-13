import { describe, expect, it } from 'vitest';
import type { Priority } from '@/types/priority';
import type { Task } from '@/types/task';
import { isPastDue, ordinaryTasks, workloadFor } from './centralMetrics';
import { isInPeriod, periodStart } from './period';

const task = (overrides: Partial<Task>): Task => ({
  id: 't',
  client_id: 'c1',
  title: 'Tarefa',
  completed: false,
  assigned_to: ['Patrick'],
  due_date: null,
  priority_id: null,
  parent_task_id: null,
  created_at: '2026-11-01T12:00:00Z',
  completed_at: null,
  sort_order: 0,
  ...overrides,
} as Task);

const priority = (overrides: Partial<Priority>): Priority => ({
  id: 'p',
  client_id: 'c1',
  title: 'Prioridade',
  status: 'pendente',
  assigned_to: ['Patrick'],
  due_date: null,
  created_at: '2026-11-01T12:00:00Z',
  completed_at: null,
  ...overrides,
} as Priority);

const today = new Date(2026, 10, 12);

describe('isPastDue', () => {
  it('does not mark a task due today as late, whatever the time zone', () => {
    expect(isPastDue('2026-11-12', today)).toBe(false);
    expect(isPastDue('2026-11-11', today)).toBe(true);
    expect(isPastDue(null, today)).toBe(false);
  });
});

describe('workloadFor', () => {
  const tasks = ordinaryTasks([
    task({ id: 'a', due_date: '2026-11-10' }),
    task({ id: 'b' }),
    task({ id: 'c', completed: true, due_date: '2026-11-01' }),
    task({ id: 'd', assigned_to: ['Celine'], due_date: '2026-11-01' }),
    task({ id: 'root', priority_id: 'p1', due_date: '2026-11-01' }),
    task({ id: 'child', parent_task_id: 'root' }),
  ]);
  const priorities = [
    priority({ id: 'p1', due_date: '2026-11-05' }),
    priority({ id: 'p2', status: 'concluida', due_date: '2026-11-05' }),
    priority({ id: 'p3', assigned_to: ['Celine'] }),
  ];

  it('excludes tasks inside a priority tree, as the Tasks tab does', () => {
    expect(tasks.map(item => item.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('counts one collaborator', () => {
    expect(workloadFor('Patrick', tasks, priorities, today)).toEqual({
      openTasks: 2, openPriorities: 1, scheduledPriorities: 0, overdueTasks: 1, overduePriorities: 1, overdue: 2,
    });
  });

  it('counts the whole team when no name is given', () => {
    expect(workloadFor(null, tasks, priorities, today)).toEqual({
      openTasks: 3, openPriorities: 2, scheduledPriorities: 0, overdueTasks: 2, overduePriorities: 1, overdue: 3,
    });
  });

  it('sets planned priorities apart, as the priorities list does', () => {
    const allTasks = [task({ id: 'root', priority_id: 'p1', scheduled_for: '2026-12-01' })];
    expect(workloadFor('Patrick', [], priorities, today, allTasks)).toMatchObject({
      openPriorities: 0, scheduledPriorities: 1, overduePriorities: 0,
    });
  });
});

describe('period', () => {
  const now = new Date(2026, 10, 12, 15);

  it('starts this month and this year on the first day', () => {
    expect(periodStart('month', now)).toBe(new Date(2026, 10, 1).getTime());
    expect(periodStart('year', now)).toBe(new Date(2026, 0, 1).getTime());
    expect(periodStart('all', now)).toBeNull();
  });

  it('keeps records without a date and drops older ones', () => {
    expect(isInPeriod(null, '30d', now)).toBe(true);
    expect(isInPeriod(new Date(2026, 9, 20).toISOString(), '30d', now)).toBe(true);
    expect(isInPeriod(new Date(2026, 8, 1).toISOString(), '30d', now)).toBe(false);
  });
});
