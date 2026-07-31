import type { Database } from "@/integrations/supabase/types";
import type {
  Audit,
  AuditClientResult,
  AuditClientItem,
  AuditClientStatus,
  AuditCriterion,
  AuditCriterionResultStatus,
  AuditStatus,
  AuditSummary,
} from "@/types/audit";

type AuditRow = Database["public"]["Tables"]["audits"]["Row"];
type AuditItemRow =
  Database["public"]["Tables"]["audit_client_items"]["Row"];
type AuditCriterionRow =
  Database["public"]["Tables"]["audit_criteria"]["Row"];
type AuditResultRow =
  Database["public"]["Tables"]["audit_client_results"]["Row"];

export function mapAudit(row: AuditRow): Audit {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    objective: row.objective,
    status: row.status as AuditStatus,
    startsAt: row.starts_at,
    dueAt: row.due_at,
    closedAt: row.closed_at,
    createdBy: row.created_by,
    validatedBy: row.validated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAuditClientItem(row: AuditItemRow): AuditClientItem {
  return {
    id: row.id,
    auditId: row.audit_id,
    clientId: row.client_id,
    status: row.status as AuditClientStatus,
    assigneeId: row.assignee_id,
    notes: row.notes,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    validatedAt: row.validated_at,
    validatedBy: row.validated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAuditCriterion(row: AuditCriterionRow): AuditCriterion {
  return {
    id: row.id,
    auditId: row.audit_id,
    title: row.title,
    description: row.description,
    displayOrder: row.display_order,
    createdAt: row.created_at,
  };
}

export function mapAuditClientResult(row: AuditResultRow): AuditClientResult {
  return {
    id: row.id,
    auditClientItemId: row.audit_client_item_id,
    auditCriterionId: row.audit_criterion_id,
    result: row.result as AuditCriterionResultStatus,
    notes: row.notes,
    evidenceUrl: row.evidence_url,
    evaluatedAt: row.evaluated_at,
    evaluatedBy: row.evaluated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function summarizeAudit(items: AuditClientItem[]): AuditSummary {
  const summary = items.reduce(
    (result, item) => {
      if (item.status === "pending") result.pending += 1;
      if (item.status === "in_progress") result.inProgress += 1;
      if (item.status === "completed") result.completed += 1;
      if (item.status === "validated") result.validated += 1;
      result.total += 1;
      return result;
    },
    {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      validated: 0,
      progress: 0,
    },
  );

  summary.progress =
    summary.total === 0
      ? 0
      : Math.round((summary.validated / summary.total) * 100);
  return summary;
}

export function getAuditElapsedDays(audit: Audit, now = new Date()): number {
  const start = new Date(audit.startsAt);
  const end = audit.closedAt ? new Date(audit.closedAt) : now;
  return Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / 86_400_000),
  );
}
