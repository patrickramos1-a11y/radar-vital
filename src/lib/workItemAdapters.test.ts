import { describe, expect, it } from "vitest";
import type { Deliverable } from "@/types/deliverable";
import type { Priority } from "@/types/priority";
import type { Task } from "@/types/task";
import {
  buildClientWorkItems,
  futureSourceToWorkItem,
} from "@/lib/workItemAdapters";

const task: Task = {
  id: "task-1",
  client_id: "client-1",
  title: "Conferir licença",
  completed: false,
  assigned_to: ["Celine"],
  created_at: "2026-07-01T10:00:00.000Z",
  completed_at: null,
  due_date: "2026-07-10",
  priority: "alta",
};

const priority: Priority = {
  id: "priority-1",
  title: "Regularização",
  description: null,
  client_id: "client-1",
  assigned_to: ["Celine"],
  due_date: "2026-07-08",
  status: "em_andamento",
  weight: 3,
  category: null,
  created_by: "Patrick",
  created_at: "2026-07-01T09:00:00.000Z",
  updated_at: "2026-07-01T09:00:00.000Z",
  completed_at: null,
};

const deliverable: Deliverable = {
  id: "deliverable-1",
  name: "Entrega mensal",
  description: null,
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
    const items = buildClientWorkItems(
      "client-1",
      [task],
      [priority],
      [deliverable],
    );

    expect(items.map((item) => item.id)).toEqual([
      "priority:priority-1",
      "task:task-1",
      "deliverable:deliverable-1",
    ]);
    expect(new Set(items.map((item) => item.sourceId)).size).toBe(3);
  });

  it("does not expose a linked deliverable to another client", () => {
    expect(
      buildClientWorkItems("client-2", [task], [priority], [deliverable]),
    ).toEqual([]);
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
});
