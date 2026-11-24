import { describe, expect, it } from 'vitest';
import type { Priority } from '@/types/priority';
import type { Task } from '@/types/task';
import { processesForAssignee, reconcileProcesses } from './processModel';

const task = (id: string, overrides: Partial<Task> = {}) => ({
  id, client_id: 'client-1', title: id, description: null, assigned_to: ['Patrick'],
  parent_task_id: null, priority_id: null, priority: 'normal', modality: 'levantamento',
  status: 'pendente', completed: false, created_at: '2026-11-01T00:00:00Z',
  completed_at: null, due_date: null, scheduled_for: null, external_url: null,
  ...overrides,
}) as Task;

const priority = (id: string, overrides: Partial<Priority> = {}) => ({
  id, title: id, description: null, client_id: 'client-1', universe_item_id: null,
  assigned_to: ['Patrick'], due_date: null, status: 'aberta', weight: 5,
  category: 'levantamento', created_at: '2026-11-01T00:00:00Z',
  completed_at: null, source_task_id: null,
  ...overrides,
}) as Priority;

describe('process reconciliation', () => {
  it('collapses a linked task and priority into one process', () => {
    const result = reconcileProcesses([task('task-1', { priority_id: 'priority-1' })],
      [priority('priority-1', { source_task_id: 'task-1' })]);
    expect(result.processes).toHaveLength(1);
    expect(result.processes[0]).toMatchObject({ taskId: 'task-1', priorityId: 'priority-1', weight: 5 });
    expect(result.conflicts).toEqual([]);
  });

  it('keeps standalone records and flags broken links', () => {
    const result = reconcileProcesses([task('task-1')], [priority('priority-1', { source_task_id: 'missing' })]);
    expect(result.processes).toHaveLength(2);
    expect(result.conflicts).toHaveLength(1);
  });

  it('shows a parent process when a child belongs to another assignee', () => {
    const processes = reconcileProcesses([
      task('parent'),
      task('child', { parent_task_id: 'parent', assigned_to: ['Junior'] }),
    ], []).processes;
    expect(processesForAssignee(processes, 'Junior').map(item => item.key))
      .toEqual(['task:parent', 'task:child']);
  });
});
