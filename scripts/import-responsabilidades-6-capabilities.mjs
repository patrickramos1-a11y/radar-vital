import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const source = process.argv[2];
if (!source) throw new Error("Informe o caminho da planilha RESPOSABILIDADES 6.xlsx.");

const workbook = XLSX.readFile(source);
const rows = (sheet) => XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { defval: "" });
const levelNumber = { Assistido: 1, "Autônomo": 2, Multiplicador: 3 };
const target = path.resolve("src/features/master-plan-preview/capabilityAssessmentMatrix.json");
const matrix = JSON.parse(fs.readFileSync(target, "utf8"));
const sourceLabel = "RESPOSABILIDADES 6.xlsx";
const newCodes = ["F19", "F20", "F21", "T11", "F22", "F23"];

for (const code of newCodes) {
  delete matrix.capabilities[code];
  delete matrix.levels[code];
  delete matrix.requests[code];
  delete matrix.criteria[code];
}

for (const row of rows("Níveis Novas Capacidades")) {
  const code = row.Código;
  const level = levelNumber[row.Nível];
  if (!code || !level) continue;

  matrix.capabilities[code] ??= { nature: row.Natureza, title: row.Capacidade };
  matrix.levels[code] ??= {};
  matrix.levels[code][level] = {
    points: Number(row.Pontos),
    description: row["Descrição detalhada do nível"],
    practice: row["O que se espera na prática"],
    autonomy: row["Autonomia e decisões esperadas"],
    observable: row["Resultados/comportamentos observáveis"],
    limits: row["Limites do nível"],
    difference: row["Diferença em relação ao nível anterior"],
    responsibilityReference: "Capacidade cadastrada a partir da matriz RESPOSABILIDADES 6.",
  };
}

for (const row of rows("Solicitação (Novas Capacidades)")) {
  const code = row.Código;
  const level = levelNumber[row["Nível solicitado"]];
  if (!code || !level) continue;

  matrix.requests[code] ??= {};
  matrix.requests[code][level] = {
    title: row["Título da solicitação"],
    introduction: row["Texto introdutório ao colaborador"],
    narrativePrompt: row["Orientação para o relato"],
    demonstrate: row["O que o colaborador deve demonstrar"],
    realFacts: row["Fatos reais que deve relatar"],
    evidence: row["Evidências mais adequadas"],
    operationalReferences: row["Evidências que podem ser referenciadas no SISRAMOS/operação"],
    insufficientEvidence: row["O que não comprova esse nível sozinho"],
    declaration: row["Declaração final sugerida"],
  };
}

for (const row of rows("Critérios (Novas Capacidades)")) {
  const code = row.Código;
  const level = levelNumber[row.Nível];
  if (!code || !level) continue;

  matrix.criteria[code] ??= {};
  matrix.criteria[code][level] ??= [];
  matrix.criteria[code][level].push({
    id: row["ID do critério"],
    title: row["Critério de aprovação"],
    verify: row["O que o avaliador deve verificar"],
    signals: row["Sinais de domínio esperado"],
    evidence: row["Evidências que fortalecem a comprovação"],
    insufficientEvidence: row["O que NÃO comprova este critério sozinho"],
    reviewerAlert: row["Limite/alerta para o avaliador"],
    question: row["Pergunta de checagem, se necessária"],
    decisions: row["Possíveis decisões"],
  });
}

const levelLabels = { 1: "Assistido", 2: "Autônomo", 3: "Multiplicador" };
const levelPrefix = { 1: "AS", 2: "AU", 3: "MU" };
for (const code of newCodes) {
  const capability = matrix.capabilities[code];
  if (!capability) continue;
  for (const level of [1, 2, 3]) {
    const definition = matrix.levels[code]?.[level];
    if (!definition) continue;
    const label = levelLabels[level];

    // Only T11 has authored request and review sheets in RESPOSABILIDADES 6.
    // The remaining new capacities receive a transparent baseline derived from
    // their approved level descriptions until their editorial sheets are supplied.
    matrix.requests[code] ??= {};
    matrix.requests[code][level] ??= {
      title: `Solicitação de certificação — ${code} ${capability.title} — ${label}`,
      introduction: `Você está solicitando certificação como ${label.toUpperCase()} em ${capability.title}. ${definition.description}`,
      narrativePrompt: `Relate uma situação real em que você atuou em ${capability.title}. Explique o contexto, o que fez, quais decisões tomou, o resultado produzido e onde o avaliador pode verificar os registros. ${level > 1 ? `Mostre também como sua atuação supera o nível anterior: ${definition.difference}` : ""}`,
      demonstrate: definition.observable,
      realFacts: definition.practice,
      evidence: "Registros, entregas, controles ou resultados reais que permitam verificar a atuação relatada.",
      operationalReferences: "Cards, documentos, controles, comunicações ou registros operacionais relacionados ao caso relatado.",
      insufficientEvidence: "Conhecimento teórico, participação sem papel definido, tempo de empresa ou autodeclaração sem fato verificável não comprovam este nível sozinhos.",
      declaration: `Declaro que os fatos relatados são verdadeiros e correspondem à minha atuação no nível ${label} em ${capability.title}.`,
    };

    matrix.criteria[code] ??= {};
    matrix.criteria[code][level] ??= [
      {
        id: `${code}-${levelPrefix[level]}-01`, title: "Executa a prática esperada neste nível", verify: definition.practice,
        signals: definition.observable, evidence: "Entrega, registro ou resultado real relacionado ao caso relatado.",
        insufficientEvidence: "Relato sem registro verificável ou atividade executada integralmente por outra pessoa.", reviewerAlert: definition.limits,
        question: "Qual situação real demonstra essa atuação e onde ela pode ser verificada?", decisions: "APROVADO: prática real e verificável. COMPLEMENTAÇÃO NECESSÁRIA: há indícios, mas falta fato ou registro. NÃO COMPROVADO: não há demonstração prática.",
      },
      {
        id: `${code}-${levelPrefix[level]}-02`, title: "Atua com a autonomia compatível", verify: definition.autonomy,
        signals: definition.difference, evidence: "Relato do caso, decisão tomada e registro da orientação ou escalonamento quando aplicável.",
        insufficientEvidence: "Atuação com supervisão acima do previsto para o nível solicitado.", reviewerAlert: definition.limits,
        question: "O que você decidiu, o que escalou e por quê?", decisions: "APROVADO: autonomia compatível. COMPLEMENTAÇÃO NECESSÁRIA: é preciso detalhar decisões. NÃO COMPROVADO: a autonomia não corresponde ao nível.",
      },
      {
        id: `${code}-${levelPrefix[level]}-03`, title: "Respeita os limites e produz resultado observável", verify: definition.limits,
        signals: definition.observable, evidence: "Resultado entregue, controle atualizado ou confirmação verificável de quem recebeu a entrega.",
        insufficientEvidence: "Resultado alegado sem evidência ou atuação fora dos limites definidos.", reviewerAlert: definition.limits,
        question: "Qual foi o resultado verificável e como os limites do seu papel foram respeitados?", decisions: "APROVADO: resultado verificável e limites respeitados. COMPLEMENTAÇÃO NECESSÁRIA: falta evidência do resultado. NÃO COMPROVADO: resultado ou limites não foram demonstrados.",
      },
    ];
  }
}

for (const [code, capability] of Object.entries(matrix.capabilities)) {
  if (!newCodes.includes(code)) continue;
  const levels = matrix.levels[code];
  capability.summary = levels?.[1]?.practice ?? levels?.[1]?.description ?? capability.title;
}

matrix.source = { fileName: sourceLabel, version: "RESPOSABILIDADES 6" };
fs.writeFileSync(target, `${JSON.stringify(matrix, null, 2)}\n`);
console.log(`Imported ${newCodes.filter((code) => matrix.capabilities[code]).length} new capabilities; catalogue now has ${Object.keys(matrix.capabilities).length}.`);
