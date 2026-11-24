import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "list_collaborators",
  title: "Listar colaboradores",
  description: "Lista os colaboradores ativos do Radar (nome, função).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const { data, error } = await supabaseAnon()
      .from("collaborators")
      .select("id, name, role")
      .eq("is_active", true)
      .order("name");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = (data ?? []).map((c) => ({ id: c.id, name: c.name, role: c.role }));
    return { content: [{ type: "text", text: JSON.stringify(rows) }], structuredContent: { collaborators: rows } };
  },
});
