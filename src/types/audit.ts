export type AuditStatus = "draft" | "active" | "closed" | "cancelled";
export type AuditClientStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "validated";

export interface Audit {
  id: string;
  title: string;
  description: string | null;
  objective: string | null;
  status: AuditStatus;
  startsAt: string;
  dueAt: string | null;
  closedAt: string | null;
  createdBy: string;
  validatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditClientItem {
  id: string;
  auditId: string;
  clientId: string;
  status: AuditClientStatus;
  assigneeId: string | null;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  validatedAt: string | null;
  validatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditCriterion {
  id: string;
  auditId: string;
  title: string;
  description: string | null;
  displayOrder: number;
  createdAt: string;
}

export type AuditCriterionResultStatus =
  | "pending"
  | "ok"
  | "not_ok"
  | "not_applicable";

export interface AuditClientResult {
  id: string;
  auditClientItemId: string;
  auditCriterionId: string;
  result: AuditCriterionResultStatus;
  notes: string | null;
  evidenceUrl: string | null;
  evaluatedAt: string | null;
  evaluatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditFormData {
  title: string;
  description?: string;
  objective?: string;
  startsAt?: string;
  dueAt?: string;
  criteria: string[];
}

export interface AuditSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  validated: number;
  progress: number;
}
