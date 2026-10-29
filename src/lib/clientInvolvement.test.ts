import { describe, expect, it } from 'vitest';
import { getActiveCollaboratorIdsForClient } from './clientInvolvement';
import type { Collaborator } from '@/types/collaborator';
import type { Task } from '@/types/task';

const collaborator = (id: string, name: string, initials: string, color: string): Collaborator => ({
  id, name, initials, color, isActive: true, email: null, userId: null, role: 'colaborador',
  isCentralOnly: false, photoUrl: null, createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z',
});
const collaborators = [collaborator('c1', 'Celine', 'CE', '#0f766e'), collaborator('c2', 'Patrick', 'PA', '#2563eb')];

const task = {
  id: 'task-1', client_id: 'client-1', title: 'Entrega', description: null,
  completed: false, status: 'pendente', assigned_to: ['Celine'],
  created_at: '2026-10-29T10:00:00.000Z', completed_at: null, due_date: null,
  scheduled_for: null, priority: 'normal', modality: 'levantamento',
  parent_task_id: null, sort_order: 0, source_comment_id: null,
  recurrence: 'none', recurrence_origin_id: null, updated_at: '2026-10-29T10:00:00.000Z',
} as Task;

describe('getActiveCollaboratorIdsForClient', () => {
  it('derives involvement from assignees on open tasks', () => {
    expect(getActiveCollaboratorIdsForClient('client-1', [task], collaborators)).toEqual(['c1']);
  });

  it('removes involvement after the last task is completed', () => {
    expect(getActiveCollaboratorIdsForClient('client-1', [{ ...task, completed: true, status: 'concluida' }], collaborators)).toEqual([]);
  });

  it('combines assignees from tasks and priority root tasks without duplicates', () => {
    const priorityRoot = { ...task, id: 'task-2', priority_id: 'priority-1', assigned_to: ['Patrick'] };
    expect(getActiveCollaboratorIdsForClient('client-1', [task, priorityRoot], collaborators)).toEqual(['c1', 'c2']);
  });
});
