import type { Task, TaskRecurrence } from '@/types/task';

export function getNextRecurrenceDate(
  dueDate: string | null,
  recurrence: TaskRecurrence,
  now = new Date(),
) {
  if (recurrence === 'none') return null;

  const base = dueDate ? new Date(`${dueDate}T12:00:00`) : new Date(now);
  if (recurrence === 'weekly') base.setDate(base.getDate() + 7);
  if (recurrence === 'monthly') base.setMonth(base.getMonth() + 1);

  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildTaskHierarchy(tasks: Task[]) {
  const childrenByParent = new Map<string, Task[]>();
  const roots: Task[] = [];

  tasks.forEach((task) => {
    if (!task.parent_task_id) {
      roots.push(task);
      return;
    }
    const children = childrenByParent.get(task.parent_task_id) ?? [];
    children.push(task);
    childrenByParent.set(task.parent_task_id, children);
  });

  childrenByParent.forEach((children) => {
    children.sort((left, right) => left.sort_order - right.sort_order || left.created_at.localeCompare(right.created_at));
  });

  return { roots, childrenByParent };
}

export function getTaskProgress(taskId: string, tasks: Task[]) {
  const children = tasks.filter((task) => task.parent_task_id === taskId);
  const completed = children.filter((task) => task.completed || task.status === 'concluida').length;
  return { completed, total: children.length };
}

export function canCompleteTask(taskId: string, tasks: Task[]) {
  return !tasks.some(
    (task) => task.parent_task_id === taskId && task.status !== 'concluida' && task.status !== 'cancelada',
  );
}
