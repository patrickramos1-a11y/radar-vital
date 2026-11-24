import type { Priority } from '@/types/priority';
import type { Task } from '@/types/task';

export interface UnifiedProcess {
  key: string;
  taskId: string | null;
  priorityId: string | null;
  parentKey: string | null;
  clientId: string | null;
  universeItemId: string | null;
  title: string;
  description: string | null;
  assignees: string[];
  modality: string | null;
  weight: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
  dueDate: string | null;
  scheduledFor: string | null;
  externalUrl: string | null;
}

export interface ProcessReconciliation {
  processes: UnifiedProcess[];
  conflicts: string[];
}

const taskWeight = { baixa: 1, normal: 2, alta: 3, urgente: 4 } as const;

export function reconcileProcesses(tasks: Task[], priorities: Priority[]): ProcessReconciliation {
  const conflicts: string[] = [];
  const taskById = new Map(tasks.map(task => [task.id, task]));
  const priorityById = new Map(priorities.map(priority => [priority.id, priority]));
  const priorityBySourceTask = new Map(priorities
    .filter(priority => priority.source_task_id)
    .map(priority => [priority.source_task_id!, priority]));
  const pairedPriorityIds = new Set<string>();

  const processes = tasks.map(task => {
    const linked = task.priority_id ? priorityById.get(task.priority_id) : undefined;
    const bySource = priorityBySourceTask.get(task.id);
    if (linked && bySource && linked.id !== bySource.id) {
      conflicts.push(`Tarefa ${task.id} aponta para prioridades diferentes.`);
    }
    const priority = bySource || (linked && (!linked.source_task_id || linked.source_task_id === task.id) ? linked : undefined);
    if (priority) {
      pairedPriorityIds.add(priority.id);
      if (priority.client_id && priority.client_id !== task.client_id) {
        conflicts.push(`Cliente divergente entre tarefa ${task.id} e prioridade ${priority.id}.`);
      }
      if ((priority.status === 'concluida') !== task.completed) {
        conflicts.push(`Conclusao divergente entre tarefa ${task.id} e prioridade ${priority.id}.`);
      }
    }

    return {
      key: `task:${task.id}`,
      taskId: task.id,
      priorityId: priority?.id || null,
      parentKey: task.parent_task_id && taskById.has(task.parent_task_id) ? `task:${task.parent_task_id}` : null,
      clientId: task.client_id,
      universeItemId: priority?.universe_item_id || null,
      title: priority?.title || task.title,
      description: priority?.description || task.description,
      assignees: task.assigned_to.length ? task.assigned_to : priority?.assigned_to || [],
      modality: task.modality || priority?.category || null,
      weight: priority?.weight ?? taskWeight[task.priority],
      status: priority?.status === 'concluida' ? 'concluida' : task.status,
      createdAt: priority && priority.created_at < task.created_at ? priority.created_at : task.created_at,
      completedAt: priority?.completed_at || task.completed_at,
      dueDate: priority?.due_date || task.due_date,
      scheduledFor: task.scheduled_for,
      externalUrl: task.external_url || null,
    } satisfies UnifiedProcess;
  });

  for (const priority of priorities) {
    if (pairedPriorityIds.has(priority.id)) continue;
    if (priority.source_task_id && !taskById.has(priority.source_task_id)) {
      conflicts.push(`Prioridade ${priority.id} aponta para tarefa ausente ${priority.source_task_id}.`);
    }
    processes.push({
      key: `priority:${priority.id}`,
      taskId: null,
      priorityId: priority.id,
      parentKey: null,
      clientId: priority.client_id,
      universeItemId: priority.universe_item_id || null,
      title: priority.title,
      description: priority.description,
      assignees: priority.assigned_to,
      modality: priority.category,
      weight: priority.weight,
      status: priority.status,
      createdAt: priority.created_at,
      completedAt: priority.completed_at,
      dueDate: priority.due_date,
      scheduledFor: null,
      externalUrl: null,
    });
  }

  return { processes, conflicts };
}

export function processesForAssignee(processes: UnifiedProcess[], assignee: string): UnifiedProcess[] {
  const ownKeys = new Set(processes
    .filter(process => process.assignees.some(name => name.localeCompare(assignee, 'pt-BR', { sensitivity: 'base' }) === 0))
    .map(process => process.key));
  const byKey = new Map(processes.map(process => [process.key, process]));
  for (const key of [...ownKeys]) {
    let parent = byKey.get(key)?.parentKey;
    const visited = new Set<string>();
    while (parent && !visited.has(parent)) {
      visited.add(parent);
      ownKeys.add(parent);
      parent = byKey.get(parent)?.parentKey;
    }
  }
  return processes.filter(process => ownKeys.has(process.key));
}
