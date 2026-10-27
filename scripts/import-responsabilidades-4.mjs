import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const source = process.argv[2];
if (!source) throw new Error("Informe o caminho da planilha RESPOSABILIDADES 4.xlsx.");

const workbook = XLSX.readFile(source);
const rows = (sheet) => XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { defval: "" });
const levelNumber = { Assistido: 1, "Autônomo": 2, Multiplicador: 3 };
const matrix = {
  source: { fileName: path.basename(source), version: "RESPOSABILIDADES 4" },
  levels: {},
  requests: {},
  criteria: {},
  capabilities: {},
};

for (const row of rows("Níveis das Capacidades")) {
  const code = row.Código;
  const level = levelNumber[row.Nível];
  if (!code || !level) continue;
  matrix.capabilities[code] ??= { nature: row.Natureza, title: row.Capacidade };
  matrix.levels[code] ??= {};
  matrix.levels[code][level] = {
    points: Number(row.Pontos), description: row["Descrição detalhada do nível"],
    practice: row["O que se espera na prática"], autonomy: row["Autonomia e decisões esperadas"],
    observable: row["Resultados/comportamentos observáveis"], limits: row["Limites do nível"],
    difference: row["Diferença em relação ao nível anterior"], responsibilityReference: row["Responsabilidades usadas como referência"],
  };
}
for (const row of rows("Solicitação e Evidências")) {
  const code = row.Código;
  const level = levelNumber[row["Nível solicitado"]];
  if (!code || !level) continue;
  matrix.requests[code] ??= {};
  matrix.requests[code][level] = {
    title: row["Título da solicitação"], introduction: row["Texto introdutório ao colaborador"],
    narrativePrompt: row["Orientação para o relato"], demonstrate: row["O que o colaborador deve demonstrar"],
    realFacts: row["Fatos reais que deve relatar"], evidence: row["Evidências mais adequadas"],
    operationalReferences: row["Evidências que podem ser referenciadas no SISRAMOS/operação"],
    insufficientEvidence: row["O que não comprova esse nível sozinho"], declaration: row["Declaração final sugerida"],
  };
}
for (const row of rows("Critérios de Avaliação")) {
  const code = row.Código;
  const level = levelNumber[row.Nível];
  if (!code || !level) continue;
  matrix.criteria[code] ??= {};
  matrix.criteria[code][level] ??= [];
  matrix.criteria[code][level].push({
    id: row["ID do critério"], title: row["Critério de aprovação"], verify: row["O que o avaliador deve verificar"],
    signals: row["Sinais de domínio esperado"], evidence: row["Evidências que fortalecem a comprovação"],
    insufficientEvidence: row["O que NÃO comprova este critério sozinho"], reviewerAlert: row["Limite/alerta para o avaliador"],
    question: row["Pergunta de checagem, se necessária"], decisions: row["Possíveis decisões"],
  });
}

const composition = {};
for (const row of rows("Composição de Competências")) {
  const sector = row.Núcleo;
  const title = row.Competência;
  const level = levelNumber[row["Nível mínimo exigido"]];
  if (!sector || !title || !level) continue;
  const key = `${sector}|${title}`;
  composition[key] ??= { sector, title, minimumPoints: Number(row["Pontos mínimos da competência"]), requirements: [] };
  composition[key].requirements.push({
    capabilityCode: row.Código, minimumLevel: level, minimumLevelLabel: row["Nível mínimo exigido"],
    sourceRef: "RESPOSABILIDADES 4.xlsx · Composição de Competências",
  });
}

const target = path.resolve("src/features/master-plan-preview");
fs.writeFileSync(path.join(target, "capabilityAssessmentMatrix.json"), `${JSON.stringify(matrix, null, 2)}\n`);
fs.writeFileSync(path.join(target, "competencyComposition.json"), `${JSON.stringify({ source: matrix.source, competencies: Object.values(composition) }, null, 2)}\n`);
console.log(`Imported ${Object.keys(matrix.capabilities).length} capabilities and ${Object.keys(composition).length} competencies.`);
