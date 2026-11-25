import type { Deliverable } from "@/types/deliverable";
import type { Task } from "@/types/task";
import type { ClientComment } from "@/types/comment";
import type {
  WorkItem,
  WorkItemKind,
  WorkItemStatus,
} from "@/types/workItem";

const deliverableStatus: Record<Deliverable["status"], WorkItemStatus> = {
  aberto: "open",
  em_andamento: "in_progress",
  concluido: "completed",
  cancelado: "cancelled",
};

/** Processo = tarefa raiz (D-025). As etapas aparecem dentro do processo. */
export function taskToWorkItem(task: Task): WorkItem {
  return {
    id: `task:${task.id}`,
    sourceId: task.id,
    kind: "task",
    clientId: task.client_id,
    title: task.title,
    description: task.description,
    status:
      task.status === "concluida"
        ? "completed"
        : task.status === "cancelada"
          ? "cancelled"
          : task.status === "em_andamento" || task.status === "em_validacao"
            ? "in_progress"
            : "open",
    createdAt: task.created_at,
    dueDate: task.due_date,
    completedAt: task.completed_at,
    assignees: task.assigned_to,
    sourcePath: null,
  };
}

export function commentToWorkItem(comment: ClientComment): WorkItem {
  return {
    id: `comment:${comment.id}`,
    sourceId: comment.id,
    kind: "comment",
    clientId: comment.clientId,
    title: `Comentário de ${comment.authorName}`,
    description: comment.commentText,
    status: comment.isClosed || comment.isArchived ? "completed" : "open",
    createdAt: comment.createdAt,
    dueDate: null,
    completedAt: comment.closedAt ?? comment.archivedAt ?? null,
    assignees: comment.requiredReaders,
    sourcePath: "/comentarios",
  };
}

/**
 * Clientes de um entregável: o cliente gravado nele e os clientes dos
 * processos vinculados. Itens antigos ligados a prioridades são só histórico.
 */
export function getDeliverableClientIds(
  deliverable: Deliverable,
  tasks: Task[],
): Set<string> {
  const taskClientById = new Map(
    tasks.map((task) => [task.id, task.client_id]),
  );
  const clientIds = new Set<string>();
  if (deliverable.client_id) clientIds.add(deliverable.client_id);
  deliverable.items.forEach((item) => {
    if (item.item_type !== "task") return;
    const clientId = taskClientById.get(item.item_id);
    if (clientId) clientIds.add(clientId);
  });
  return clientIds;
}

export function deliverableToWorkItem(
  deliverable: Deliverable,
  clientId: string,
  tasks: Task[],
): WorkItem | null {
  if (!getDeliverableClientIds(deliverable, tasks).has(clientId)) {
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
  deliverables: Deliverable[],
  futureSources: FutureWorkItemSource[] = [],
  comments: ClientComment[] = [],
): WorkItem[] {
  const processItems = tasks
    .filter((task) => task.client_id === clientId && !task.parent_task_id)
    .map(taskToWorkItem);
  const deliverableItems = deliverables
    .map((deliverable) => deliverableToWorkItem(deliverable, clientId, tasks))
    .filter((item): item is WorkItem => Boolean(item));
  const futureItems = futureSources
    .filter((source) => source.clientId === clientId)
    .map(futureSourceToWorkItem);
  const commentItems = comments
    .filter((comment) => comment.clientId === clientId)
    .map(commentToWorkItem);

  return [...processItems, ...deliverableItems, ...futureItems, ...commentItems]
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
