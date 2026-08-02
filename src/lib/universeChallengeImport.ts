import type { Collaborator } from "@/types/collaborator";
import type { Client } from "@/types/client";
import type { ChallengeCompletionConditionInput, ChallengeCompletionMode, ChallengeKind } from "@/types/challenge";

export interface MasterChallengeRow {
  masterId: string;
  unitName: string;
  suggestedResponsible: string;
  title: string;
  description: string;
  successCriteria: string;
  expectedDeliverable: string;
  evidenceRequirements: string;
  challengeType: string;
  maturity: string;
  applicationStatus: string;
  rewardStars: string;
  penaltyStars: string;
  completionMode: string;
  checklistItems: string;
}

export interface ImportIssue {
  field: string;
  message: string;
}

export interface PreparedChallengeImport {
  row: MasterChallengeRow;
  unit: Client | null;
  collaborator: Collaborator | null;
  kind: ChallengeKind;
  completionMode: ChallengeCompletionMode;
  conditions: ChallengeCompletionConditionInput[];
  issues: ImportIssue[];
}

const normalize = (value: string) => value
  .toLocaleLowerCase("pt-BR")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const valueAt = (row: Record<string, unknown>, header: string) => String(row[header] ?? "").trim();

export function parseMasterRows(records: Array<Record<string, unknown>>): MasterChallengeRow[] {
  return records.map((record) => ({
    masterId: valueAt(record, "ID mestre"),
    unitName: valueAt(record, "Unidade/Setor"),
    suggestedResponsible: valueAt(record, "Responsável sugerido"),
    title: valueAt(record, "Título"),
    description: valueAt(record, "Descrição"),
    successCriteria: valueAt(record, "Condições de conclusão"),
    expectedDeliverable: valueAt(record, "Entregável esperado"),
    evidenceRequirements: valueAt(record, "Evidências necessárias"),
    challengeType: valueAt(record, "Tipo de desafio"),
    maturity: valueAt(record, "Estado de maturidade"),
    applicationStatus: valueAt(record, "Status no aplicativo"),
    rewardStars: valueAt(record, "Recompensa em estrelas"),
    penaltyStars: valueAt(record, "Penalidade em estrelas"),
    completionMode: valueAt(record, "Modo de conclusão") || valueAt(record, "Modo de conclusao"),
    checklistItems: valueAt(record, "Itens do checklist"),
  }));
}

export function splitCompletionConditions(value: string): ChallengeCompletionConditionInput[] {
  return value
    .split(/[;\n]/)
    .map((item) => item.replace(/^[\-•\d.\s]+/, "").trim())
    .filter(Boolean)
    .map((title) => ({ title, isRequired: true }));
}

// The Master Bank keeps long technical guidance under "Condições de conclusão".
// It must never become a checklist unless the sheet explicitly asks for it.
export function resolveCompletionMode(value: string): ChallengeCompletionMode {
  const normalized = normalize(value);
  if (normalized === "checklist") return "checklist";
  if (normalized === "misto" || normalized === "mixed") return "mixed";
  return "guidance";
}

function findUnit(units: Client[], name: string): Client | null {
  const target = normalize(name);
  const exact = units.find((unit) => normalize(unit.name) === target);
  if (exact) return exact;

  const targetWords = new Set(target.split(" ").filter((word) => word.length > 2));
  const candidates = units
    .map((unit) => ({ unit, words: new Set(normalize(unit.name).split(" ").filter((word) => word.length > 2)) }))
    .map(({ unit, words }) => ({ unit, score: [...targetWords].filter((word) => words.has(word)).length }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score);

  return candidates.length === 1 || (candidates[0]?.score && candidates[0].score > (candidates[1]?.score ?? 0))
    ? candidates[0]?.unit ?? null
    : null;
}

function findCollaborator(collaborators: Collaborator[], name: string): Collaborator | null {
  if (!name) return null;
  const target = normalize(name);
  return collaborators.find((collaborator) => normalize(collaborator.name) === target)
    ?? collaborators.find((collaborator) => normalize(collaborator.name).includes(target) || target.includes(normalize(collaborator.name)))
    ?? null;
}

function kindFor(unit: Client | null, challengeType: string): ChallengeKind {
  if (normalize(challengeType) === "meta individual") return "individual_goal";
  if (unit?.universeCategory === "SETOR") return "sector";
  if (unit?.universeCategory === "PROJETO") return "project";
  if (unit?.universeCategory === "EMPRESA") return "company";
  return "company_general";
}

export function prepareChallengeImport(row: MasterChallengeRow, units: Client[], collaborators: Collaborator[]): PreparedChallengeImport {
  const issues: ImportIssue[] = [];
  const unit = findUnit(units, row.unitName);
  const collaborator = findCollaborator(collaborators, row.suggestedResponsible);
  const completionMode = resolveCompletionMode(row.completionMode);
  const conditions = completionMode === "guidance" ? [] : splitCompletionConditions(row.checklistItems);

  if (!row.masterId) issues.push({ field: "ID mestre", message: "Informe o identificador mestre para impedir duplicidade." });
  if (!row.title) issues.push({ field: "Título", message: "Informe o título do desafio." });
  if (!row.description) issues.push({ field: "Descrição", message: "Informe o contexto do desafio." });
  if (!row.unitName || !unit) issues.push({ field: "Unidade/Setor", message: `Não foi possível relacionar “${row.unitName || "vazio"}” a um card do Universo Ramos.` });
  if (!row.successCriteria) issues.push({ field: "Condições de conclusão", message: "Informe as orientações de conclusão do desafio." });
  if (completionMode !== "guidance" && !conditions.length) issues.push({ field: "Itens do checklist", message: "Modo checklist ou misto exige itens do checklist preenchidos." });
  if (!row.expectedDeliverable) issues.push({ field: "Entregável esperado", message: "Informe o entregável esperado." });
  if (!row.evidenceRequirements) issues.push({ field: "Evidências necessárias", message: "Informe a evidência necessária." });
  if (row.suggestedResponsible && !collaborator) issues.push({ field: "Responsável sugerido", message: `Não encontrei o colaborador “${row.suggestedResponsible}”.` });
  if (normalize(row.challengeType) === "direcionado" && !collaborator) issues.push({ field: "Responsável sugerido", message: "Desafio direcionado exige um colaborador mapeado." });
  if ([row.rewardStars, row.penaltyStars].some((value) => value && Number(value) !== 0)) {
    issues.push({ field: "Valores", message: "A primeira carga deve entrar sem recompensa ou penalidade; configure valores depois no rascunho." });
  }

  return { row, unit, collaborator, kind: kindFor(unit, row.challengeType), completionMode, conditions, issues };
}

export function isReadyForDraft(row: MasterChallengeRow): boolean {
  return normalize(row.maturity) === "pronto para rascunho" && normalize(row.applicationStatus) === "nao enviado";
}

export interface UniverseChallengeImportRow {
  rowNumber: number;
  title: string;
  originName: string;
  originCategory: "EMPRESA" | "SETOR" | "COLABORADOR" | "PROJETO" | "";
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

const csvHeaders = ["titulo", "origem_nome", "origem_categoria", "tipo", "descricao", "condicoes_conclusao", "entregavel_esperado", "evidencia_necessaria", "responsavel_inicial", "participantes", "prazo", "recompensa_estrelas", "recompensa_super_estrelas", "penalidade_estrelas", "status_inicial", "observacoes_administrador"];

function csvLine(line: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { cell += '"'; index += 1; } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else cell += char;
  }
  cells.push(cell.trim());
  return cells;
}

function safeNumber(value: string) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

// Maintains compatibility with the original CSV template documented in the roadmap.
export function parseUniverseChallengeCsv(csv: string, units: Client[], collaborators: Collaborator[]): UniverseChallengeImportRow[] {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const columns = csvLine(lines[0]).map(normalize);
  if (!csvHeaders.every((header) => columns.includes(header))) {
    return [{ rowNumber: 1, title: "", originName: "", originCategory: "", kind: "", description: "", successCriteria: "", expectedDeliverable: "", evidenceRequirements: "", participantNames: [], dueAt: null, rewardSuperstars: 0, penaltyStars: 0, status: "", errors: ["Cabeçalho inválido. Use o arquivo-modelo de desafios."], clientId: null, participantIds: [], importKey: "" }];
  }
  const valueFor = (cells: string[], header: string) => cells[columns.indexOf(header)] ?? "";
  return lines.slice(1).map((line, offset) => {
    const cells = csvLine(line);
    const title = valueFor(cells, "titulo");
    const originName = valueFor(cells, "origem_nome");
    const originCategory = valueFor(cells, "origem_categoria").toUpperCase() as UniverseChallengeImportRow["originCategory"];
    const kind = valueFor(cells, "tipo") as UniverseChallengeImportRow["kind"];
    const reward = safeNumber(valueFor(cells, "recompensa_super_estrelas"));
    const penalty = safeNumber(valueFor(cells, "penalidade_estrelas"));
    const due = valueFor(cells, "prazo");
    const dueDate = due ? new Date(`${due}T12:00:00`) : null;
    const participantNames = [valueFor(cells, "responsavel_inicial"), ...valueFor(cells, "participantes").split(";")].map((item) => item.trim()).filter(Boolean);
    const unit = units.find((item) => normalize(item.name) === normalize(originName));
    const participantIds = participantNames.map((name) => findCollaborator(collaborators, name)?.id).filter((id): id is string => Boolean(id));
    const errors: string[] = [];
    if (!title) errors.push("Título obrigatório");
    if (!originName || !unit) errors.push("Origem inexistente");
    if (!originCategory || !["EMPRESA", "SETOR", "COLABORADOR", "PROJETO"].includes(originCategory)) errors.push("Categoria de origem inválida");
    if (unit && unit.universeCategory !== originCategory) errors.push("Categoria diferente do cadastro da origem");
    if (!kind || !["company", "sector", "project", "individual_goal", "company_general"].includes(kind)) errors.push("Tipo inválido");
    if (!valueFor(cells, "condicoes_conclusao")) errors.push("Condições de conclusão obrigatórias");
    if (Number.isNaN(reward) || reward < 0 || Number.isNaN(penalty) || penalty < 0) errors.push("Valores de estrelas inválidos");
    if (dueDate && Number.isNaN(dueDate.getTime())) errors.push("Prazo inválido");
    if (participantIds.length !== participantNames.length) errors.push("Colaborador não encontrado");
    const status = valueFor(cells, "status_inicial") as UniverseChallengeImportRow["status"];
    if (status && !["draft", "open", "accepted"].includes(status)) errors.push("Status inicial inválido");
    return { rowNumber: offset + 2, title, originName, originCategory, kind, description: valueFor(cells, "descricao"), successCriteria: valueFor(cells, "condicoes_conclusao"), expectedDeliverable: valueFor(cells, "entregavel_esperado"), evidenceRequirements: valueFor(cells, "evidencia_necessaria"), participantNames, dueAt: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate.toISOString() : null, rewardSuperstars: Number.isNaN(reward) ? 0 : reward, penaltyStars: Number.isNaN(penalty) ? 0 : penalty, status, errors, clientId: unit?.id ?? null, participantIds, importKey: `${normalize(originName)}:${normalize(title)}` };
  });
}
