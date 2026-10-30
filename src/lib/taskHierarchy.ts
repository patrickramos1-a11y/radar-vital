import type { Task } from '@/types/task';

export function taskChildrenByParent(tasks: Task[]) {
  const children = new Map<string, Task[]>();
  tasks.forEach((task) => {
    if (!task.parent_task_id) return;
    children.set(task.parent_task_id, [...(children.get(task.parent_task_id) ?? []), task]);
  });
  children.forEach((items) => items.sort(
    (left, right) => left.sort_order - right.sort_order || left.created_at.localeCompare(right.created_at),
  ));
  return children;
}

export function collectTaskTreeIds(tasks: Task[], rootIds: Iterable<string>) {
  const children = taskChildrenByParent(tasks);
  const collected = new Set<string>();
  const queue = [...rootIds];

  while (queue.length > 0) {
    const taskId = queue.shift()!;
    if (collected.has(taskId)) continue;
    collected.add(taskId);
    (children.get(taskId) ?? []).forEach((task) => queue.push(task.id));
  }

  return collected;
}

export function priorityTaskTreeIds(tasks: Task[]) {
  return collectTaskTreeIds(
    tasks,
    tasks.filter((task) => Boolean(task.priority_id)).map((task) => task.id),
  );
}

export function taskRoot(task: Task, taskById: Map<string, Task>) {
  let current = task;
  const visited = new Set<string>();

  while (current.parent_task_id && !visited.has(current.id)) {
    visited.add(current.id);
    const parent = taskById.get(current.parent_task_id);
    if (!parent) break;
    current = parent;
  }

  return current;
}

export function descendantsOf(taskId: string, tasks: Task[]) {
  const treeIds = collectTaskTreeIds(tasks, [taskId]);
  treeIds.delete(taskId);
  return tasks.filter((task) => treeIds.has(task.id));
}
