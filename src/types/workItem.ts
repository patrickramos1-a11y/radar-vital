export type WorkItemKind =
  | "task"
  | "priority"
  | "deliverable"
  | "audit"
  | "challenge";

export type WorkItemStatus =
  | "open"
  | "in_progress"
  | "pending_validation"
  | "completed"
  | "cancelled";

export interface WorkItem {
  id: string;
  sourceId: string;
  kind: WorkItemKind;
  clientId: string;
  title: string;
  description: string | null;
  status: WorkItemStatus;
  createdAt: string;
  dueDate: string | null;
  completedAt: string | null;
  assignees: string[];
  sourcePath: string | null;
}

export type WorkItemFilter = "all" | WorkItemKind;

export const WORK_ITEM_LABELS: Record<WorkItemKind, string> = {
  task: "Tarefa",
  priority: "Prioridade",
  deliverable: "Entregável",
  audit: "Auditoria",
  challenge: "Desafio",
};
