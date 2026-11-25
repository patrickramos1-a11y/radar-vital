import { describe, expect, it } from 'vitest';
import type { Task } from '@/types/task';
import { buildProcesses, compareProcesses, maximumWeightProcesses, processesForAssignee } from './processModel';
import { normalizeProcessWeight, urgencyForWeight, weightForUrgency } from './processWeight';

const task = (id: string, overrides: Partial<Task> = {}) => ({
  id, client_id: 'client-1', title: id, description: null, assigned_to: ['Patrick'],
  parent_task_id: null, priority_id: null, priority: 'normal', weight: 2, modality: 'levantamento',
  status: 'pendente', completed: false, created_at: '2026-11-01T00:00:00Z',
  completed_at: null, due_date: null, scheduled_for: null, external_url: null, sort_order: 0,
  ...overrides,
}) as Task;

describe('processos v2', () => {
  it('turns each root task into a process and its subtasks into steps', () => {
    const processes = buildProcesses([
      task('root', { weight: 5 }),
      task('step-b', { parent_task_id: 'root', sort_order: 2 }),
      task('step-a', { parent_task_id: 'root', sort_order: 1, completed: true, status: 'concluida' }),
      task('deep', { parent_task_id: 'step-b' }),
    ]);
    expect(processes).toHaveLength(1);
    expect(processes[0]).toMatchObject({ id: 'root', weight: 5 });
    expect(processes[0].steps.map(step => step.id)).toEqual(['step-a', 'step-b']);
    expect(processes[0].descendants.map(step => step.id)).toEqual(expect.arrayContaining(['step-a', 'step-b', 'deep']));
    expect(processes[0].openSteps).toBe(2);
  });

  it('keeps an orphan step visible as its own process', () => {
    const processes = buildProcesses([task('orphan', { parent_task_id: 'missing' })]);
    expect(processes.map(process => process.id)).toEqual(['orphan']);
  });

  it('falls back to the urgency when the weight is missing', () => {
    const [process] = buildProcesses([task('old', { weight: undefined as unknown as number, priority: 'urgente' })]);
    expect(process.weight).toBe(4);
  });

  it('shows the process when a step belongs to another assignee', () => {
    const processes = buildProcesses([
      task('parent'),
      task('child', { parent_task_id: 'parent', assigned_to: ['Junior'] }),
      task('other', { assigned_to: ['Maria'] }),
    ]);
    expect(processesForAssignee(processes, 'júnior').map(process => process.id)).toEqual(['parent']);
  });

  it('lists only open Máxima processes on the panel, most urgent first', () => {
    const processes = buildProcesses([
      task('late', { weight: 5, due_date: '2026-12-10' }),
      task('soon', { weight: 5, due_date: '2026-12-01' }),
      task('done', { weight: 5, completed: true, status: 'concluida' }),
      task('cancelled', { weight: 5, status: 'cancelada' }),
      task('normal', { weight: 3 }),
    ]);
    expect(maximumWeightProcesses(processes).map(process => process.id)).toEqual(['soon', 'late']);
  });

  it('sorts by weight, then due date, then age', () => {
    const processes = buildProcesses([
      task('light', { weight: 1 }),
      task('no-date', { weight: 4 }),
      task('dated', { weight: 4, due_date: '2026-12-01' }),
    ]);
    expect([...processes].sort(compareProcesses).map(process => process.id)).toEqual(['dated', 'no-date', 'light']);
  });
});

describe('peso do processo', () => {
  it('matches the database maps between weight and urgency', () => {
    expect(['baixa', 'normal', 'alta', 'urgente'].map(value => weightForUrgency(value as Task['priority']))).toEqual([1, 2, 3, 4]);
    expect([1, 2, 3, 4, 5].map(urgencyForWeight)).toEqual(['baixa', 'normal', 'alta', 'urgente', 'urgente']);
  });

  it('keeps any value between 1 and 5', () => {
    expect([0, 7, 2.6, 'x', null].map(value => normalizeProcessWeight(value))).toEqual([1, 5, 3, 2, 2]);
  });
});
