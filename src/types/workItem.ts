/**
 * Processos v2 (D-025): o item "task" é o processo (tarefa raiz). O tipo
 * "priority" só continua aqui para telas antigas que ainda abrem a Central
 * pela aba de prioridades; nenhuma lista gera mais itens desse tipo e a
 * Central trata essa visão como a de processos.
 */
export type WorkItemKind =
  | "task"
  /** @deprecated prioridades viraram processos (D-025); use "task". */
  | "priority"
  | "deliverable"
  | "audit"
  | "challenge"
  | "comment";

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

/** Visão que a Central realmente mostra: prioridade antiga abre os processos. */
export function normalizeWorkItemFilter(filter: WorkItemFilter): WorkItemFilter {
  return filter === "priority" ? "task" : filter;
}

export const WORK_ITEM_LABELS: Record<WorkItemKind, string> = {
  task: "Processo",
  priority: "Processo",
  deliverable: "Entregável",
  audit: "Auditoria",
  challenge: "Desafio",
  comment: "Comentário",
};
