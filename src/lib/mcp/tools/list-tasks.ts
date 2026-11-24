import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "list_tasks",
  title: "Listar tarefas",
  description: "Lista tarefas do Radar, com filtros opcionais por cliente, responsável e situação.",
  inputSchema: {
    client_id: z.string().uuid().optional().describe("ID do cliente."),
    assignee: z.string().optional().describe("Nome do responsável (ex.: Patrick)."),
    include_completed: z.boolean().optional().describe("Incluir tarefas concluídas (padrão: não)."),
    limit: z.number().int().min(1).max(200).optional().describe("Máximo de tarefas (padrão 100)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ client_id, assignee, include_completed, limit }) => {
    let q = supabaseAnon()
      .from("tasks")
      .select("id, title, client_id, assigned_to, priority, status, completed, due_date, scheduled_for, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 100);
    if (!include_completed) q = q.eq("completed", false);
    if (client_id) q = q.eq("client_id", client_id);
    if (assignee) q = q.contains("assigned_to", [assignee]);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = (data ?? []).map((t) => ({
      id: t.id, title: t.title, client_id: t.client_id, assigned_to: t.assigned_to ?? [],
      priority: t.priority, status: t.status, completed: t.completed,
      due_date: t.due_date, scheduled_for: t.scheduled_for, created_at: t.created_at,
    }));
    return { content: [{ type: "text", text: JSON.stringify(rows) }], structuredContent: { tasks: rows } };
  },
});
