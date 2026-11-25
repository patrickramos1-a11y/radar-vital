import type { Task, TaskStatus } from '@/types/task';
import { isMaximumWeight, normalizeProcessWeight, weightForUrgency, type ProcessWeight } from '@/lib/processWeight';
import { isPeriodStep, isRecurringMother } from '@/lib/processRecurrence';

/**
 * Processos v2 (D-025): processo é a tarefa principal (sem pai); etapas são as
 * subtarefas dela. O peso fica na própria tarefa. A tabela de prioridades é só
 * histórico e não entra no modelo.
 */
export interface Process {
  id: string;
  task: Task;
  clientId: string;
  title: string;
  description: string | null;
  assignees: string[];
  weight: ProcessWeight;
  status: TaskStatus;
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
  dueDate: string | null;
  scheduledFor: string | null;
  /** Etapas diretas, na ordem definida pelo usuário. */
  steps: Task[];
  /** Todas as etapas abaixo do processo, em qualquer nível. */
  descendants: Task[];
  openSteps: number;
  /** Processo-mãe que se repete; as etapas de período ficam em `periodSteps`. */
  isRecurring: boolean;
  periodSteps: Task[];
}

export function isProcessOpen(process: Pick<Process, 'completed' | 'status'>): boolean {
  return !process.completed && process.status !== 'cancelada';
}

function bySortOrder(a: Task, b: Task): number {
  return (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.created_at.localeCompare(b.created_at);
}

export function buildProcesses(tasks: Task[]): Process[] {
  const taskIds = new Set(tasks.map(task => task.id));
  const childrenByParent = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.parent_task_id || !taskIds.has(task.parent_task_id)) continue;
    const siblings = childrenByParent.get(task.parent_task_id) ?? [];
    siblings.push(task);
    childrenByParent.set(task.parent_task_id, siblings);
  }

  const collectDescendants = (rootId: string): Task[] => {
    const result: Task[] = [];
    const visited = new Set<string>([rootId]);
    const queue = [...(childrenByParent.get(rootId) ?? [])];
    while (queue.length) {
      const task = queue.shift()!;
      if (visited.has(task.id)) continue;
      visited.add(task.id);
      result.push(task);
      queue.push(...(childrenByParent.get(task.id) ?? []));
    }
    return result;
  };

  return tasks
    // Uma etapa cujo processo não veio na consulta vira processo próprio,
    // para nunca sumir da tela.
    .filter(task => !task.parent_task_id || !taskIds.has(task.parent_task_id))
    .map(task => {
      const steps = [...(childrenByParent.get(task.id) ?? [])].sort(bySortOrder);
      const descendants = collectDescendants(task.id);
      const isRecurring = isRecurringMother(task);
      const periodSteps = steps.filter(isPeriodStep);
      // Na mãe, o vencimento que importa é o do período aberto mais antigo.
      const nextPeriodDue = periodSteps
        .filter(step => !step.completed && step.status !== 'cancelada' && step.due_date)
        .map(step => step.due_date!)
        .sort()[0];
      return {
        id: task.id,
        task,
        clientId: task.client_id,
        title: task.title,
        description: task.description,
        assignees: task.assigned_to,
        weight: normalizeProcessWeight(task.weight, weightForUrgency(task.priority)),
        status: task.status,
        completed: task.completed,
        createdAt: task.created_at,
        completedAt: task.completed_at,
        dueDate: isRecurring && nextPeriodDue ? nextPeriodDue : task.due_date,
        scheduledFor: task.scheduled_for,
        steps,
        descendants,
        openSteps: descendants.filter(step => !step.completed && step.status !== 'cancelada').length,
        isRecurring,
        periodSteps,
      } satisfies Process;
    });
}

/** Maior peso primeiro; depois o vencimento mais próximo; depois o mais antigo. */
export function compareProcesses(a: Process, b: Process): number {
  if (a.weight !== b.weight) return b.weight - a.weight;
  if (a.dueDate !== b.dueDate) {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  }
  return a.createdAt.localeCompare(b.createdAt);
}

/** Painel: processos abertos de peso Máxima. */
export function maximumWeightProcesses(processes: Process[]): Process[] {
  return processes.filter(process => isProcessOpen(process) && isMaximumWeight(process.weight)).sort(compareProcesses);
}

function sameName(a: string, b: string): boolean {
  return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }) === 0;
}

/** Processos do responsável: os dele e aqueles em que ele tem alguma etapa aberta. */
export function processesForAssignee(processes: Process[], assignee: string): Process[] {
  return processes.filter(process =>
    process.assignees.some(name => sameName(name, assignee))
    || process.descendants.some(step => !step.completed && step.status !== 'cancelada'
      && step.assigned_to.some(name => sameName(name, assignee))));
}
