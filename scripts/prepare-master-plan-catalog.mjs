import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  throw new Error("Usage: node scripts/prepare-master-plan-catalog.mjs <source.xlsx> <output.json>");
}

const sourceBytes = readFileSync(inputPath);
const workbook = XLSX.read(sourceBytes, { type: "buffer" });
const requiredSheets = [
  "Responsabilidades por Setor",
  "Níveis",
  "Catálogo de Capacidades",
  "Fichas de Capacidade",
  "Autoavaliação",
  "Perfil por Responsabilidade",
];
for (const name of requiredSheets) {
  if (!workbook.Sheets[name]) throw new Error(`Missing worksheet: ${name}`);
}

const rowsOf = (name) => XLSX.utils.sheet_to_json(workbook.Sheets[name], {
  header: 1, range: 0, defval: null, blankrows: true, raw: true,
});
const cell = (value, reference) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing text at ${reference}`);
  }
  return value.trim();
};
const sourceRef = (sheet, column, row) => {
  const [first, last] = column.split(":");
  return `${sheet}!${first}${row}${last ? `:${last}${row}` : ""}`;
};
const levelsSheet = "Níveis";
const catalogueSheet = "Catálogo de Capacidades";
const detailSheet = "Fichas de Capacidade";
const questionSheet = "Autoavaliação";
const responsibilitySheet = "Responsabilidades por Setor";
const profileSheet = "Perfil por Responsabilidade";

const levels = rowsOf(levelsSheet).slice(4).map((row, index) => ({
  value: row[0],
  label: cell(row[1], sourceRef(levelsSheet, "B", index + 5)),
  definition: cell(row[2], sourceRef(levelsSheet, "C", index + 5)),
  selfAssessmentAnswer: cell(row[3], sourceRef(levelsSheet, "D", index + 5)),
  sourceRow: index + 5,
})).filter((level) => Number.isInteger(level.value));
const levelByLabel = new Map(levels.map((level) => [level.label, level.value]));
if (levels.length !== 4 || levels.some((level, index) => level.value !== index)) {
  throw new Error("Expected capability levels 0 through 3");
}

const catalogueRows = rowsOf(catalogueSheet);
const detailRows = rowsOf(detailSheet);
const questionRows = rowsOf(questionSheet);
const profileRows = rowsOf(profileSheet);
const detailByCode = new Map();
for (let rowNumber = 5; rowNumber <= detailRows.length; rowNumber += 1) {
  const row = detailRows[rowNumber - 1];
  if (!row?.[0]) continue;
  const code = cell(row[0], sourceRef(detailSheet, "A", rowNumber));
  if (detailByCode.has(code)) throw new Error(`Duplicate detail: ${code}`);
  detailByCode.set(code, { row, rowNumber });
}

const questionsByCode = new Map();
for (let rowNumber = 5; rowNumber <= questionRows.length; rowNumber += 1) {
  const row = questionRows[rowNumber - 1];
  if (!row?.[0]) continue;
  const code = cell(row[0], sourceRef(questionSheet, "A", rowNumber));
  const questions = questionsByCode.get(code) ?? [];
  questions.push({
    number: row[2],
    dimension: cell(row[3], sourceRef(questionSheet, "D", rowNumber)),
    question: cell(row[4], sourceRef(questionSheet, "E", rowNumber)),
    sourceRef: sourceRef(questionSheet, "A:E", rowNumber),
  });
  questionsByCode.set(code, questions);
}

const capabilities = [];
for (let rowNumber = 5; rowNumber <= catalogueRows.length; rowNumber += 1) {
  const row = catalogueRows[rowNumber - 1];
  if (!row?.[0]) continue;
  const code = cell(row[0], sourceRef(catalogueSheet, "A", rowNumber));
  const detail = detailByCode.get(code);
  const questions = questionsByCode.get(code) ?? [];
  if (!detail) throw new Error(`Missing capacity sheet for ${code}`);
  if (questions.length !== 4 || questions.some((question, index) => question.number !== index + 1)) {
    throw new Error(`Expected four ordered questions for ${code}`);
  }
  const d = detail.row;
  const dRow = detail.rowNumber;
  capabilities.push({
    code,
    nature: cell(row[1], sourceRef(catalogueSheet, "B", rowNumber)),
    title: cell(row[2], sourceRef(catalogueSheet, "C", rowNumber)),
    summary: cell(row[3], sourceRef(catalogueSheet, "D", rowNumber)),
    originLabel: cell(d[3], sourceRef(detailSheet, "D", dRow)),
    sourceVersion: cell(d[4], sourceRef(detailSheet, "E", dRow)),
    detail: {
      statement: cell(d[5], sourceRef(detailSheet, "F", dRow)),
      scope: cell(d[7], sourceRef(detailSheet, "H", dRow)),
      performanceCriteria: cell(d[8], sourceRef(detailSheet, "I", dRow)),
      assisted: cell(d[9], sourceRef(detailSheet, "J", dRow)),
      autonomous: cell(d[10], sourceRef(detailSheet, "K", dRow)),
      multiplier: cell(d[11], sourceRef(detailSheet, "L", dRow)),
      certificationEvidence: cell(d[12], sourceRef(detailSheet, "M", dRow)),
      prerequisites: cell(d[13], sourceRef(detailSheet, "N", dRow)),
      limits: cell(d[14], sourceRef(detailSheet, "O", dRow)),
      relatedCapabilitiesText: cell(d[15], sourceRef(detailSheet, "P", dRow)),
    },
    selfAssessmentQuestions: questions,
    sourceRefs: [sourceRef(catalogueSheet, "A:D", rowNumber), sourceRef(detailSheet, "A:P", dRow)],
  });
}
const capabilityCodes = new Set(capabilities.map((capability) => capability.code));
if (capabilityCodes.size !== capabilities.length || detailByCode.size !== capabilities.length || questionsByCode.size !== capabilities.length) {
  throw new Error("Capacity catalogue, sheets and question bank must have identical unique codes");
}
const assessmentDimensions = capabilities[0]?.selfAssessmentQuestions.map((question) => question.dimension);
if (!assessmentDimensions || capabilities.some((capability) =>
  capability.selfAssessmentQuestions.some((question, index) => question.dimension !== assessmentDimensions[index])
)) {
  throw new Error("Self-assessment dimensions differ across capacities");
}

const responsibilityRows = rowsOf(responsibilitySheet);
const responsibilitiesByKey = new Map();
const keyFor = (sector, title) => `${sector}\u0000${title}`;
for (let rowNumber = 4; rowNumber <= responsibilityRows.length; rowNumber += 1) {
  const row = responsibilityRows[rowNumber - 1];
  if (!row?.[0]) continue;
  const sourceSector = cell(row[0], sourceRef(responsibilitySheet, "A", rowNumber));
  const title = cell(row[1], sourceRef(responsibilitySheet, "B", rowNumber));
  const key = keyFor(sourceSector, title);
  let responsibility = responsibilitiesByKey.get(key);
  if (!responsibility) {
    responsibility = {
      sourceId: `resp-${createHash("sha256").update(key).digest("hex").slice(0, 16)}`,
      sourceSector,
      title,
      activities: [],
      requiredCapabilities: [],
      sourceRows: [],
    };
    responsibilitiesByKey.set(key, responsibility);
  }
  responsibility.activities.push({
    text: cell(row[2], sourceRef(responsibilitySheet, "C", rowNumber)),
    originLabel: cell(row[3], sourceRef(responsibilitySheet, "D", rowNumber)),
    sourceRef: sourceRef(responsibilitySheet, "C:D", rowNumber),
  });
  responsibility.sourceRows.push(rowNumber);
}

const profileKeys = new Set();
for (let rowNumber = 5; rowNumber <= profileRows.length; rowNumber += 1) {
  const row = profileRows[rowNumber - 1];
  if (!row?.[0]) continue;
  const sector = cell(row[0], sourceRef(profileSheet, "A", rowNumber));
  const title = cell(row[1], sourceRef(profileSheet, "B", rowNumber));
  const code = cell(row[2], sourceRef(profileSheet, "C", rowNumber));
  const label = cell(row[5], sourceRef(profileSheet, "F", rowNumber));
  const responsibility = responsibilitiesByKey.get(keyFor(sector, title));
  if (!responsibility || !capabilityCodes.has(code) || !levelByLabel.has(label)) {
    throw new Error(`Invalid responsibility/capacity/level at ${profileSheet}!${rowNumber}`);
  }
  const key = `${sector}\u0000${title}\u0000${code}`;
  if (profileKeys.has(key)) throw new Error(`Duplicate requirement at ${profileSheet}!${rowNumber}`);
  profileKeys.add(key);
  responsibility.requiredCapabilities.push({
    capabilityCode: code,
    minimumLevel: levelByLabel.get(label),
    minimumLevelLabel: label,
    sourceRef: sourceRef(profileSheet, "A:F", rowNumber),
  });
}

const responsibilities = [...responsibilitiesByKey.values()];
const sourceSectors = [...new Set(responsibilities.map((responsibility) => responsibility.sourceSector))];
const unlinked = responsibilities.filter((responsibility) => !responsibility.requiredCapabilities.length);
const catalog = {
  schemaVersion: 1,
  publicationStatus: "review_only_not_imported",
  source: {
    fileName: basename(inputPath),
    sha256: createHash("sha256").update(sourceBytes).digest("hex"),
    worksheets: workbook.SheetNames,
  },
  terminology: {
    responsibility: "O que o setor precisa garantir continuamente.",
    activity: "Acao ou escopo descrito dentro de uma responsabilidade; nao e uma tarefa cadastrada.",
    capability: "O que uma pessoa precisa ser capaz de fazer.",
    minimumLevel: "Nivel exigido pela responsabilidade, nao nivel comprovado de uma pessoa.",
  },
  levels,
  selfAssessmentPolicy: {
    dimensions: assessmentDimensions,
    indicatedLevelRule: "lowest_answered_dimension",
    commentRequired: true,
    certificationEffect: "none_without_separate_review_and_evidence",
    sourceRefs: ["Ficha de Capacidade!B43", "Ficha de Capacidade!A49", "Ficha de Capacidade!A50"],
  },
  sourceSectors,
  capabilities,
  responsibilities,
  review: {
    unlinkedResponsibilityIds: unlinked.map((responsibility) => responsibility.sourceId),
    sectorMappingStatus: "pending_human_review",
    personAssignmentsPresent: false,
    certificationRecordsPresent: false,
    existingChallengesChanged: false,
    directImportIntoMasterPlanV1Supported: false,
  },
  counts: {
    capabilities: capabilities.length,
    responsibilities: responsibilities.length,
    activities: responsibilities.reduce((sum, responsibility) => sum + responsibility.activities.length, 0),
    requirements: profileKeys.size,
    selfAssessmentQuestions: capabilities.reduce((sum, capability) => sum + capability.selfAssessmentQuestions.length, 0),
    unlinkedResponsibilities: unlinked.length,
  },
};

writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(JSON.stringify(catalog.counts));
