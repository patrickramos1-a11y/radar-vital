import { describe, expect, it } from 'vitest';
import { buildTaskHierarchy, canCompleteTask, getNextRecurrenceDate, getTaskProgress } from '@/lib/taskOperations';
import type { Task } from '@/types/task';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    client_id: 'client-1',
    title: 'Tarefa principal',
    description: null,
    completed: false,
    status: 'pendente',
    assigned_to: [],
    created_at: '2026-10-01T12:00:00.000Z',
    completed_at: null,
    due_date: null,
    scheduled_for: null,
    priority: 'normal',

    parent_task_id: null,
    sort_order: 0,
    source_comment_id: null,
    recurrence: 'none',
    recurrence_origin_id: null,
    updated_at: '2026-10-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('task operational rules', () => {
  it('builds an ordered parent and subtask hierarchy', () => {
    const parent = makeTask();
    const later = makeTask({ id: 'sub-2', parent_task_id: parent.id, sort_order: 2 });
    const first = makeTask({ id: 'sub-1', parent_task_id: parent.id, sort_order: 1 });

    const hierarchy = buildTaskHierarchy([later, parent, first]);

    expect(hierarchy.roots).toEqual([parent]);
    expect(hierarchy.childrenByParent.get(parent.id)?.map((task) => task.id)).toEqual(['sub-1', 'sub-2']);
  });

  it('tracks subtask progress and blocks completion while work remains open', () => {
    const parent = makeTask();
    const completed = makeTask({ id: 'sub-1', parent_task_id: parent.id, completed: true, status: 'concluida' });
    const open = makeTask({ id: 'sub-2', parent_task_id: parent.id });

    expect(getTaskProgress(parent.id, [parent, completed, open])).toEqual({ completed: 1, total: 2 });
    expect(canCompleteTask(parent.id, [parent, completed, open])).toBe(false);
    expect(canCompleteTask(parent.id, [parent, completed, { ...open, status: 'cancelada' }])).toBe(true);
  });

  it('calculates weekly and monthly recurrence dates', () => {
    expect(getNextRecurrenceDate('2026-10-18', 'weekly')).toBe('2026-10-25');
    expect(getNextRecurrenceDate('2026-10-18', 'monthly')).toBe('2026-11-18');
    expect(getNextRecurrenceDate('2026-10-18', 'none')).toBeNull();
  });
});
