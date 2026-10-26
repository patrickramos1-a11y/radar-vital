import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(readFileSync(resolve(root, "docs/roadmap/UNIVERSO_RAMOS_RESPONSABILIDADES_CURADAS.json"), "utf8"));
const output = process.argv[2];
if (!output) throw new Error("Provide the destination migration path.");
if (source.capabilities.length !== 28 || source.responsibilities.length !== 56) {
  throw new Error("The curated library count changed; review the import before generating SQL.");
}

const literal = (value) => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
const text = (value) => `'${value.replaceAll("'", "''")}'`;
const bullets = (value) => value.split(/\s*•\s*/).map((part) => part.trim()).filter(Boolean);
const criteriaFor = (capability) => {
  const performance = bullets(capability.detail.performanceCriteria).map((item, index) => {
    const [title, verification] = item.split(/Como se comprova:\s*/i);
    return {
      id: `performance-${index + 1}`, level: 0, text: title.trim(), kind: "performance",
      guidance: verification?.trim(), reviewCheck: verification?.trim(),
    };
  });
  const structuredEvidence = capability.detail.certificationEvidence
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.match(/^(ASSISTIDO|AUTÔNOMO|MULTIPLICADOR)\s*\r?\nO que entregar:\s*([\s\S]*?)\r?\nComo é avaliado:\s*([\s\S]*?)\r?\nAprovado quando:\s*([\s\S]*)$/i));
  if (structuredEvidence.length === 3 && structuredEvidence.every(Boolean)) {
    return [...performance, ...structuredEvidence.map((match, index) => ({
      id: `level-${index + 1}-1`, level: index + 1, kind: "evidence",
      text: match[2].trim(), guidance: match[3].trim(), reviewCheck: match[4].trim(),
    }))];
  }
  const prefixes = ["Assistido:", "Autônomo:", "Multiplicador:"];
  const evidence = bullets(capability.detail.certificationEvidence).flatMap((item) => {
    const levelIndex = prefixes.findIndex((prefix) => item.startsWith(prefix));
    if (levelIndex < 0) return [];
    const level = levelIndex + 1;
    return item.slice(prefixes[levelIndex].length).split(/\s+\+\s+/).map((part, index) => ({
      id: `level-${level}-${index + 1}`, level, text: part.trim(), kind: "evidence",
    }));
  });
  return [...performance, ...evidence];
};

const sha = text(source.source.sha256);
const lines = [
  "-- Generated from UNIVERSO_RAMOS_RESPONSABILIDADES_CURADAS.json. Re-run the generator after source review.",
  "BEGIN;",
  "INSERT INTO public.master_plan_capability_library (code, payload, criteria, source_sha256) VALUES",
  source.capabilities.map((capability) =>
    `  (${text(capability.code)}, ${literal(capability)}, ${literal(criteriaFor(capability))}, ${sha})`
  ).join(",\n") + "\nON CONFLICT (code) DO NOTHING;",
  "INSERT INTO public.master_plan_responsibility_library (source_id, payload, source_sha256) VALUES",
  source.responsibilities.map((responsibility) =>
    `  (${text(responsibility.sourceId)}, ${literal(responsibility)}, ${sha})`
  ).join(",\n") + "\nON CONFLICT (source_id) DO NOTHING;",
  `INSERT INTO public.master_plan_library_metadata (library_key, payload, source_sha256) VALUES ('responsabilidades-2026', ${literal({
    schemaVersion: source.schemaVersion,
    source: source.source,
    levels: source.levels,
    selfAssessmentPolicy: source.selfAssessmentPolicy,
    sourceSectors: source.sourceSectors,
    sectorMappingStatus: "pending_validation",
  })}, ${sha}) ON CONFLICT (library_key) DO NOTHING;`,
  "COMMIT;",
];
writeFileSync(resolve(root, output), lines.join("\n\n") + "\n", "utf8");
console.log(`Generated ${source.capabilities.length} capabilities, ${source.responsibilities.length} responsibilities, and ${source.capabilities.reduce((count, capability) => count + criteriaFor(capability).length, 0)} criteria.`);
