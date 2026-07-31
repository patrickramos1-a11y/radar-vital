import type { Deliverable } from "@/types/deliverable";
import type { Priority } from "@/types/priority";
import type { Task } from "@/types/task";
import type {
  WorkItem,
  WorkItemKind,
  WorkItemStatus,
} from "@/types/workItem";

const priorityStatus: Record<Priority["status"], WorkItemStatus> = {
  aberta: "open",
  em_andamento: "in_progress",
  concluida: "completed",
  cancelada: "cancelled",
};

const deliverableStatus: Record<Deliverable["status"], WorkItemStatus> = {
  aberto: "open",
  em_andamento: "in_progress",
  concluido: "completed",
  cancelado: "cancelled",
};

export function taskToWorkItem(task: Task): WorkItem {
  return {
    id: `task:${task.id}`,
    sourceId: task.id,
    kind: "task",
    clientId: task.client_id,
    title: task.title,
    description: null,
    status: task.completed ? "completed" : "open",
    createdAt: task.created_at,
    dueDate: task.due_date,
    completedAt: task.completed_at,
    assignees: task.assigned_to,
    sourcePath: null,
  };
}

export function priorityToWorkItem(priority: Priority): WorkItem | null {
  if (!priority.client_id) return null;

  return {
    id: `priority:${priority.id}`,
    sourceId: priority.id,
    kind: "priority",
    clientId: priority.client_id,
    title: priority.title,
    description: priority.description,
    status: priorityStatus[priority.status],
    createdAt: priority.created_at,
    dueDate: priority.due_date,
    completedAt: priority.completed_at,
    assignees: priority.assigned_to,
    sourcePath: "/central-entregas?tab=priorities",
  };
}

export function getDeliverableClientIds(
  deliverable: Deliverable,
  tasks: Task[],
  priorities: Priority[],
): Set<string> {
  const taskClientById = new Map(
    tasks.map((task) => [task.id, task.client_id]),
  );
  const priorityClientById = new Map(
    priorities
      .filter((priority) => priority.client_id)
      .map((priority) => [priority.id, priority.client_id as string]),
  );

  return new Set(
    deliverable.items.flatMap((item) => {
      const clientId =
        item.item_type === "task"
          ? taskClientById.get(item.item_id)
          : priorityClientById.get(item.item_id);
      return clientId ? [clientId] : [];
    }),
  );
}

export function deliverableToWorkItem(
  deliverable: Deliverable,
  clientId: string,
  tasks: Task[],
  priorities: Priority[],
): WorkItem | null {
  if (!getDeliverableClientIds(deliverable, tasks, priorities).has(clientId)) {
    return null;
  }

  return {
    id: `deliverable:${deliverable.id}`,
    sourceId: deliverable.id,
    kind: "deliverable",
    clientId,
    title: deliverable.name,
    description: deliverable.description,
    status: deliverableStatus[deliverable.status],
    createdAt: deliverable.created_at,
    dueDate: deliverable.due_date,
    completedAt: deliverable.completed_at,
    assignees: deliverable.assigned_to,
    sourcePath: "/central-entregas?tab=deliverables",
  };
}

export interface FutureWorkItemSource {
  id: string;
  kind: Extract<WorkItemKind, "audit" | "challenge">;
  clientId: string;
  title: string;
  description?: string | null;
  status: WorkItemStatus;
  createdAt: string;
  dueDate?: string | null;
  completedAt?: string | null;
  assignees?: string[];
  sourcePath?: string | null;
}

export function futureSourceToWorkItem(source: FutureWorkItemSource): WorkItem {
  return {
    id: `${source.kind}:${source.id}`,
    sourceId: source.id,
    kind: source.kind,
    clientId: source.clientId,
    title: source.title,
    description: source.description ?? null,
    status: source.status,
    createdAt: source.createdAt,
    dueDate: source.dueDate ?? null,
    completedAt: source.completedAt ?? null,
    assignees: source.assignees ?? [],
    sourcePath: source.sourcePath ?? null,
  };
}

export function buildClientWorkItems(
  clientId: string,
  tasks: Task[],
  priorities: Priority[],
  deliverables: Deliverable[],
  futureSources: FutureWorkItemSource[] = [],
): WorkItem[] {
  const taskItems = tasks
    .filter((task) => task.client_id === clientId)
    .map(taskToWorkItem);
  const priorityItems = priorities
    .map(priorityToWorkItem)
    .filter(
      (item): item is WorkItem => Boolean(item?.clientId === clientId),
    );
  const deliverableItems = deliverables
    .map((deliverable) =>
      deliverableToWorkItem(deliverable, clientId, tasks, priorities),
    )
    .filter((item): item is WorkItem => Boolean(item));
  const futureItems = futureSources
    .filter((source) => source.clientId === clientId)
    .map(futureSourceToWorkItem);

  return [...taskItems, ...priorityItems, ...deliverableItems, ...futureItems]
    .sort((left, right) => {
      const leftDone =
        left.status === "completed" || left.status === "cancelled";
      const rightDone =
        right.status === "completed" || right.status === "cancelled";
      if (leftDone !== rightDone) return leftDone ? 1 : -1;

      const leftDate = left.dueDate ?? left.createdAt;
      const rightDate = right.dueDate ?? right.createdAt;
      return new Date(leftDate).getTime() - new Date(rightDate).getTime();
    });
}
