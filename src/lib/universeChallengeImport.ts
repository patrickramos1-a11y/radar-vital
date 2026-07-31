import type { ChallengeKind } from "@/types/challenge";
import type { Client, UniversoRamosCategory } from "@/types/client";
import type { Collaborator } from "@/types/collaborator";

export interface UniverseChallengeImportRow {
  rowNumber: number;
  title: string;
  originName: string;
  originCategory: UniversoRamosCategory | "";
  kind: ChallengeKind | "";
  description: string;
  successCriteria: string;
  expectedDeliverable: string;
  evidenceRequirements: string;
  participantNames: string[];
  dueAt: string | null;
  rewardSuperstars: number;
  penaltyStars: number;
  status: "draft" | "open" | "accepted" | "";
  errors: string[];
  clientId: string | null;
  participantIds: string[];
  importKey: string;
}

const headers = ["titulo", "origem_nome", "origem_categoria", "tipo", "descricao", "condicoes_conclusao", "entregavel_esperado", "evidencia_necessaria", "responsavel_inicial", "participantes", "prazo", "recompensa_estrelas", "recompensa_super_estrelas", "penalidade_estrelas", "status_inicial", "observacoes_administrador"];

function normalized(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR"); }
function csvLine(line: string) { const cells: string[] = []; let cell = ""; let quoted = false; for (let index = 0; index < line.length; index += 1) { const char = line[index]; if (char === '"') { if (quoted && line[index + 1] === '"') { cell += '"'; index += 1; } else quoted = !quoted; } else if (char === "," && !quoted) { cells.push(cell.trim()); cell = ""; } else cell += char; } cells.push(cell.trim()); return cells; }
function safeNumber(value: string) { const parsed = Number(value || 0); return Number.isFinite(parsed) ? parsed : Number.NaN; }

export function parseUniverseChallengeCsv(csv: string, units: Client[], collaborators: Collaborator[]): UniverseChallengeImportRow[] {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const columns = csvLine(lines[0]).map(normalized);
  const validHeader = headers.every((header) => columns.includes(header));
  if (!validHeader) return [{ rowNumber: 1, title: "", originName: "", originCategory: "", kind: "", description: "", successCriteria: "", expectedDeliverable: "", evidenceRequirements: "", participantNames: [], dueAt: null, rewardSuperstars: 0, penaltyStars: 0, status: "", errors: ["Cabeçalho inválido. Use o arquivo-modelo de desafios."], clientId: null, participantIds: [], importKey: "" }];
  const byHeader = (cells: string[], header: string) => cells[columns.indexOf(header)] ?? "";
  return lines.slice(1).map((line, offset) => {
    const cells = csvLine(line); const title = byHeader(cells, "titulo"); const originName = byHeader(cells, "origem_nome");
    const originCategory = byHeader(cells, "origem_categoria").toUpperCase() as UniversoRamosCategory;
    const kind = byHeader(cells, "tipo") as ChallengeKind; const due = byHeader(cells, "prazo"); const reward = safeNumber(byHeader(cells, "recompensa_super_estrelas")); const penalty = safeNumber(byHeader(cells, "penalidade_estrelas"));
    const participantNames = [byHeader(cells, "responsavel_inicial"), ...byHeader(cells, "participantes").split(";")].map((item) => item.trim()).filter(Boolean);
    const unit = units.find((item) => normalized(item.name) === normalized(originName));
    const participantIds = participantNames.map((name) => collaborators.find((person) => normalized(person.name) === normalized(name))?.id).filter((id): id is string => Boolean(id));
    const errors: string[] = [];
    if (!title) errors.push("Título obrigatório"); if (!originName || !unit) errors.push("Origem inexistente");
    if (!originCategory || !["EMPRESA", "SETOR", "COLABORADOR", "PROJETO"].includes(originCategory)) errors.push("Categoria de origem inválida");
    if (unit && unit.universeCategory !== originCategory) errors.push("Categoria diferente do cadastro da origem");
    if (!kind || !["company", "sector", "project", "individual_goal", "company_general"].includes(kind)) errors.push("Tipo inválido");
    if (!byHeader(cells, "condicoes_conclusao")) errors.push("Condições de conclusão obrigatórias");
    if (Number.isNaN(reward) || reward < 0 || Number.isNaN(penalty) || penalty < 0) errors.push("Valores de estrelas inválidos");
    const dueDate = due ? new Date(`${due}T12:00:00`) : null;
    if (dueDate && Number.isNaN(dueDate.getTime())) errors.push("Prazo inválido");
    if (participantIds.length !== participantNames.length) errors.push("Colaborador não encontrado");
    const status = byHeader(cells, "status_inicial") as UniverseChallengeImportRow["status"];
    if (status && !["draft", "open", "accepted"].includes(status)) errors.push("Status inicial inválido");
    return { rowNumber: offset + 2, title, originName, originCategory, kind, description: byHeader(cells, "descricao"), successCriteria: byHeader(cells, "condicoes_conclusao"), expectedDeliverable: byHeader(cells, "entregavel_esperado"), evidenceRequirements: byHeader(cells, "evidencia_necessaria"), participantNames, dueAt: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate.toISOString() : null, rewardSuperstars: Number.isNaN(reward) ? 0 : reward, penaltyStars: Number.isNaN(penalty) ? 0 : penalty, status, errors, clientId: unit?.id ?? null, participantIds, importKey: `${normalized(originName)}:${normalized(title)}` };
  });
}
