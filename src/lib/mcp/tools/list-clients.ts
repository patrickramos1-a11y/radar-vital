import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "list_clients",
  title: "Listar clientes",
  description: "Lista os clientes do Radar (nome, tipo AC/AV, municípios, status).",
  inputSchema: {
    only_active: z.boolean().optional().describe("Se verdadeiro, retorna apenas clientes ativos."),
    search: z.string().optional().describe("Filtro por parte do nome."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ only_active, search }) => {
    let q = supabaseAnon()
      .from("clients")
      .select("id, name, client_type, is_active, municipios, universe_category")
      .order("name")
      .limit(200);
    if (only_active) q = q.eq("is_active", true);
    if (search) q = q.ilike("name", `%${search}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = (data ?? []).map((c) => ({
      id: c.id, name: c.name, client_type: c.client_type, is_active: c.is_active,
      municipios: c.municipios ?? [], universe_category: c.universe_category,
    }));
    return { content: [{ type: "text", text: JSON.stringify(rows) }], structuredContent: { clients: rows } };
  },
});
