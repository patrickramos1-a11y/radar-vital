import type { Client } from "@/types/client";
import type { Collaborator } from "@/types/collaborator";

/** Institutional structure used by every Universo Ramos collaborator card. */
export const RAMOS_COLLABORATOR_CARD_COLOR = "#0DD375";
/** Shared structural color for every Projeto/Painel card in Universo Ramos. */
export const SISRAMOS_PROJECT_CARD_COLOR = "#2B4226";

/** Sector colors used across desktop and mobile Universo Ramos cards. */
export const universeSectorColors: Record<string, string> = {
  "ADMINISTRAÇÃO": "#EF6F3C",
  "BRINDES": "#B8CEE8",
  "BRINDES E PAPELARIA": "#B8CEE8",
  "GESTÃO E PLANEJAMENTO": "#876029",
  "IA E AUTOMAÇÃO": "#52A5CE",
  "LICENCIAMENTO E PROCESSOS": "#25533F",
  "MANUTENÇÃO": "#6D1F42",
  MARKETING: "#AFAB23",
  "PESSOAS E CULTURA": "#FF7BAC",
  "SETOR DE PROJETOS": "#EFCE7B",
  "SUPRIMENTOS E COMPRAS": "#D3B6D3",
  TREINAMENTOS: "#F4BEAE",
};

/**
 * Sector cards use their own color everywhere (border, header, name).
 * Collaborator cards always use the Ramos institutional green in their
 * structure. Their profile color is reserved for the name only.
 */
export function getUniverseAccentColor(client: Client, collaborators: Collaborator[]): string | null {
  if (client.clientType !== "UNIVERSO_RAMOS") return null;
  if (client.universeCategory === "COLABORADOR") {
    return RAMOS_COLLABORATOR_CARD_COLOR;
  }
  if (client.universeCategory === "SETOR") {
    return universeSectorColors[client.name.trim().toLocaleUpperCase("pt-BR")] ?? "#0F766E";
  }
  if (client.universeCategory === "PROJETO") {
    return SISRAMOS_PROJECT_CARD_COLOR;
  }
  return null;
}

/** Personal color is intentionally limited to the collaborator name. */
export function getUniverseNameColor(client: Client, collaborators: Collaborator[]): string | null {
  if (client.clientType !== "UNIVERSO_RAMOS" || client.universeCategory !== "COLABORADOR") return null;
  return collaborators.find((item) => item.id === client.universeCollaboratorId)?.color ?? null;
}

/** True when the accent color should only tint text/small details. */
export function isTextOnlyAccent(client: Client): boolean {
  return client.universeCategory === "COLABORADOR";
}
