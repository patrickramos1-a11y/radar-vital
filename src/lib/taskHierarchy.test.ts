import { describe, expect, it } from 'vitest';
import type { Task } from '@/types/task';
import { descendantsOf, priorityTaskTreeIds, taskRoot } from './taskHierarchy';

const task = (id: string, parent: string | null = null, priorityId: string | null = null): Task => ({
  id,
  client_id: 'client-1',
  title: id,
  description: null,
  completed: false,
  status: 'pendente',
  assigned_to: [],
  created_at: '2026-10-29T00:00:00.000Z',
  completed_at: null,
  due_date: null,
  scheduled_for: null,
  priority: 'normal',
  modality: 'levantamento',
  priority_id: priorityId,
  parent_task_id: parent,
  sort_order: 0,
  source_comment_id: null,
  recurrence: 'none',
  recurrence_origin_id: null,
  updated_at: '2026-10-29T00:00:00.000Z',
});

describe('taskHierarchy', () => {
  const tasks = [task('root', null, 'priority-1'), task('child', 'root'), task('grandchild', 'child'), task('ordinary')];

  it('keeps an entire promoted tree out of ordinary task views', () => {
    expect([...priorityTaskTreeIds(tasks)].sort()).toEqual(['child', 'grandchild', 'root']);
  });

  it('finds the root even when a subtask has a different assignee', () => {
    expect(taskRoot(tasks[2], new Map(tasks.map((item) => [item.id, item]))).id).toBe('root');
  });

  it('returns nested descendants', () => {
    expect(descendantsOf('root', tasks).map((item) => item.id).sort()).toEqual(['child', 'grandchild']);
  });
});
