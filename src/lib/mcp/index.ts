import { defineMcp } from "@lovable.dev/mcp-js";
import listClients from "./tools/list-clients";
import listCollaborators from "./tools/list-collaborators";
import listTasks from "./tools/list-tasks";

export default defineMcp({
  name: "painel-de-clientes-sisramos",
  title: "PAINEL DE CLIENTES - SISRAMOS",
  version: "0.1.0",
  instructions: "Consulta somente leitura do Radar: clientes, colaboradores ativos e tarefas.",
  tools: [listClients, listCollaborators, listTasks],
});
