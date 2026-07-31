import { describe, expect, it } from "vitest";
import { getAuditElapsedDays, summarizeAudit } from "@/lib/audit";
import type { Audit, AuditClientItem, AuditClientStatus } from "@/types/audit";

function item(status: AuditClientStatus): AuditClientItem {
  return {
    id: crypto.randomUUID(),
    auditId: "audit-1",
    clientId: crypto.randomUUID(),
    status,
    assigneeId: null,
    notes: null,
    startedAt: null,
    completedAt: null,
    validatedAt: null,
    validatedBy: null,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
}

describe("audit helpers", () => {
  it("summarizes client states and uses validation as campaign progress", () => {
    expect(
      summarizeAudit([
        item("pending"),
        item("in_progress"),
        item("completed"),
        item("validated"),
      ]),
    ).toEqual({
      total: 4,
      pending: 1,
      inProgress: 1,
      completed: 1,
      validated: 1,
      progress: 25,
    });
  });

  it("uses the closed date when calculating elapsed time", () => {
    const audit: Audit = {
      id: "audit-1",
      title: "Atendimento",
      description: null,
      objective: null,
      status: "closed",
      startsAt: "2026-07-01T00:00:00.000Z",
      dueAt: null,
      closedAt: "2026-07-06T00:00:00.000Z",
      createdBy: "user-1",
      validatedBy: "user-1",
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-06T00:00:00.000Z",
    };

    expect(getAuditElapsedDays(audit, new Date("2026-07-30"))).toBe(5);
  });
});
