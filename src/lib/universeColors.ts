import type { Client } from "@/types/client";
import type { Collaborator } from "@/types/collaborator";

/** Sector colors used across desktop and mobile Universo Ramos cards. */
export const universeSectorColors: Record<string, string> = {
  MARKETING: "#EF4444",
  "ADMINISTRAÇÃO": "#2563EB",
  "MANUTENÇÃO": "#F97316",
  "SETOR DE PROJETOS": "#2563EB",
  "LICENCIAMENTO E PROCESSOS": "#06B6D4",
  "GESTÃO E PLANEJAMENTO": "#8B5CF6",
  "SUPRIMENTOS E COMPRAS": "#F97316",
  "PESSOAS E CULTURA": "#EC4899",
  TREINAMENTOS: "#06B6D4",
  "IA E AUTOMAÇÃO": "#6366F1",
};

/**
 * Sector cards use their own color everywhere (border, header, name).
 * Collaborator cards stay institutional, using the profile color only for
 * the name and small accents. Empresa/Projeto stay neutral.
 */
export function getUniverseAccentColor(client: Client, collaborators: Collaborator[]): string | null {
  if (client.clientType !== "UNIVERSO_RAMOS") return null;
  if (client.universeCategory === "COLABORADOR") {
    return collaborators.find((item) => item.id === client.universeCollaboratorId)?.color ?? "#0F766E";
  }
  if (client.universeCategory === "SETOR") {
    return universeSectorColors[client.name.trim().toLocaleUpperCase("pt-BR")] ?? "#0F766E";
  }
  return null;
}

/** True when the accent color should only tint text/small details. */
export function isTextOnlyAccent(client: Client): boolean {
  return client.universeCategory === "COLABORADOR";
}
