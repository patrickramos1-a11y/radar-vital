import { describe, expect, it } from "vitest";
import type { Deliverable } from "@/types/deliverable";
import type { ClientComment } from "@/types/comment";
import type { Task } from "@/types/task";
import {
  buildClientWorkItems,
  futureSourceToWorkItem,
} from "@/lib/workItemAdapters";
import { WORK_ITEM_LABELS, normalizeWorkItemFilter } from "@/types/workItem";

const task: Task = {
  id: "task-1",
  client_id: "client-1",
  title: "Conferir licença",
  description: "Revisar validade, condicionantes e dados da empresa.",
  completed: false,
  status: "em_andamento",
  assigned_to: ["Celine"],
  created_at: "2026-07-01T10:00:00.000Z",
  completed_at: null,
  due_date: "2026-07-10",
  scheduled_for: null,
  priority: "alta",
  weight: 3,

  modality: "levantamento",
  parent_task_id: null,
  sort_order: 0,
  source_comment_id: null,
  recurrence: "none",
  recurrence_origin_id: null,
  updated_at: "2026-07-01T10:00:00.000Z",
};

const step: Task = {
  ...task,
  id: "task-1-step",
  title: "Pedir documentos",
  parent_task_id: task.id,
  due_date: "2026-07-05",
};

const comment: ClientComment = {
  id: "comment-1",
  clientId: "client-1",
  authorName: "Patrick",
  commentText: "Cliente confirmou o envio dos documentos.",
  createdAt: "2026-07-02T10:00:00.000Z",
  isPinned: false,
  readStatus: { celine: true, gabi: false, darley: false, vanessa: false, patrick: true },
  commentType: "informativo",
  requiredReaders: [],
  readTimestamps: {},
  isClosed: false,
  isEdited: false,
  isArchived: false,
};

const deliverable: Deliverable = {
  id: "deliverable-1",
  name: "Entrega mensal",
  description: null,
  client_id: null,
  source_priority_id: null,
  assigned_to: ["Celine"],
  requester: "Patrick",
  due_date: "2026-07-15",
  status: "aberto",
  created_by: "Patrick",
  created_at: "2026-07-01T08:00:00.000Z",
  updated_at: "2026-07-01T08:00:00.000Z",
  completed_at: null,
  items: [
    {
      id: "item-1",
      deliverable_id: "deliverable-1",
      item_type: "task",
      item_id: "task-1",
      created_at: "2026-07-01T08:00:00.000Z",
    },
  ],
};

describe("work item adapters", () => {
  it("combines source records without changing their identities", () => {
    const items = buildClientWorkItems("client-1", [task], [deliverable]);

    expect(items.map((item) => item.id)).toEqual([
      "task:task-1",
      "deliverable:deliverable-1",
    ]);
    expect(new Set(items.map((item) => item.sourceId)).size).toBe(2);
  });

  it("lists only root tasks as processes, without their steps", () => {
    const items = buildClientWorkItems("client-1", [task, step], []);

    expect(items.map((item) => item.id)).toEqual(["task:task-1"]);
    expect(WORK_ITEM_LABELS[items[0].kind]).toBe("Processo");
  });

  it("does not expose a linked deliverable to another client", () => {
    expect(buildClientWorkItems("client-2", [task], [deliverable])).toEqual([]);
  });

  it("shows a deliverable by its own client even without linked processes", () => {
    const items = buildClientWorkItems(
      "client-2",
      [],
      [{ ...deliverable, client_id: "client-2", items: [] }],
    );

    expect(items.map((item) => item.id)).toEqual(["deliverable:deliverable-1"]);
  });

  it("opens the old priorities view as the processes view", () => {
    expect(normalizeWorkItemFilter("priority")).toBe("task");
    expect(normalizeWorkItemFilter("deliverable")).toBe("deliverable");
  });

  it("already supports audit and challenge adapters", () => {
    const item = futureSourceToWorkItem({
      id: "audit-client-1",
      kind: "audit",
      clientId: "client-1",
      title: "Auditoria de atendimento",
      status: "open",
      createdAt: "2026-07-01T00:00:00.000Z",
    });

    expect(item.id).toBe("audit:audit-client-1");
    expect(item.kind).toBe("audit");
  });

  it("includes comments in the client history and preserves archived state", () => {
    const activeItems = buildClientWorkItems("client-1", [task], [], [], [comment]);
    const activeComment = activeItems.find((item) => item.id === "comment:comment-1");

    expect(activeComment?.kind).toBe("comment");
    expect(activeComment?.status).toBe("open");
    expect(activeComment?.description).toContain("documentos");

    const archivedItems = buildClientWorkItems(
      "client-1",
      [],
      [],
      [],
      [{ ...comment, isArchived: true, archivedAt: "2026-07-03T10:00:00.000Z" }],
    );
    expect(archivedItems[0].status).toBe("completed");
    expect(archivedItems[0].completedAt).toBe("2026-07-03T10:00:00.000Z");
  });
});
