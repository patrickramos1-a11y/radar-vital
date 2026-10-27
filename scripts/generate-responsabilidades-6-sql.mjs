import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const source = readJson("docs/roadmap/UNIVERSO_RAMOS_RESPONSABILIDADES_CURADAS.json");
const matrix = readJson("src/features/master-plan-preview/capabilityAssessmentMatrix.json");
const composition = readJson("src/features/master-plan-preview/competencyComposition.json");
const compositionByKey = new Map(composition.competencies.map((item) => [`${item.sector}|${item.title}`, item]));
const compositionByTitle = new Map(composition.competencies.map((item) => [item.title, item]));

const importedCapabilities = Object.entries(matrix.capabilities)
  .filter(([code]) => !source.capabilities.some((capability) => capability.code === code))
  .map(([code, metadata]) => {
    const level = (position) => matrix.levels[code]?.[String(position)];
    const request = matrix.requests[code]?.["1"];
    const criteria = Object.values(matrix.criteria[code] ?? {}).flat().map((item) => `${item.title}. Como se comprova: ${item.verify}`).join("\n• ");
    return {
      code, nature: metadata.nature, title: metadata.title,
      summary: metadata.summary ?? level(1)?.practice ?? level(1)?.description ?? "Capacidade em configuração.",
      originLabel: "Matriz de capacidades e competências — out/2026", sourceVersion: "RESPOSABILIDADES 6 — out/2026",
      detail: {
        statement: level(2)?.description ?? level(1)?.description ?? "", scope: `• ${(level(1)?.practice ?? "").replace(/;\s*/g, "\n• ")}`,
        performanceCriteria: criteria ? `• ${criteria}` : "", assisted: level(1)?.description ?? "", autonomous: level(2)?.description ?? "",
        multiplier: level(3)?.description ?? "", certificationEvidence: request?.evidence ?? "", prerequisites: "Consulte a matriz de formação da competência.",
        limits: level(2)?.limits ?? level(1)?.limits ?? "", relatedCapabilitiesText: "",
      },
      selfAssessmentQuestions: [
        { number: 1, dimension: "Compreensão dos requisitos", question: `Você entende o que é esperado para atuar em ${metadata.title}?`, sourceRef: "RESPOSABILIDADES 6.xlsx" },
        { number: 2, dimension: "Execução", question: `Você já executa na prática as atividades de ${metadata.title}?`, sourceRef: "RESPOSABILIDADES 6.xlsx" },
        { number: 3, dimension: "Julgamento e decisão", question: "Você reconhece o que pode decidir e quando deve escalar uma situação?", sourceRef: "RESPOSABILIDADES 6.xlsx" },
        { number: 4, dimension: "Qualidade e consistência", question: "Seus resultados já podem ser verificados em casos reais?", sourceRef: "RESPOSABILIDADES 6.xlsx" },
      ],
    };
  });

const capabilities = [...source.capabilities, ...importedCapabilities];
const responsibilities = source.responsibilities.map((responsibility) => {
  const imported = compositionByKey.get(`${responsibility.sourceSector}|${responsibility.title}`) ?? compositionByTitle.get(responsibility.title);
  return imported ? { ...responsibility, requiredCapabilities: imported.requirements } : responsibility;
});
const sourceSha = crypto.createHash("sha256").update(JSON.stringify({ source: matrix.source, capabilities, responsibilities, composition: composition.competencies })).digest("hex");
const jsonb = (value) => `$$${JSON.stringify(value)}$$::jsonb`;
const values = (items, mapper) => items.map(mapper).join(",\n");
const metadata = {
  schemaVersion: 3,
  source: matrix.source,
  importedAt: "2026-10-27",
  counts: { capabilities: capabilities.length, competencies: responsibilities.length, levels: Object.keys(matrix.levels).length * 3 },
  worksheets: ["Níveis das Capacidades", "Solicitação e Evidências", "Critérios de Avaliação", "Composição de Competências", "Novas Capacidades", "Níveis Novas Capacidades", "Solicitação (Novas Capacidades)", "Critérios (Novas Capacidades)"],
  certificationRule: "A competência é consolidada automaticamente quando todas as capacidades da composição atingirem o nível mínimo exigido.",
};
const capabilityCriteria = (code) => ([1, 2, 3]).flatMap((level) =>
  (matrix.criteria[code]?.[String(level)] ?? []).map((criterion) => ({
    id: criterion.id, level, text: criterion.title, kind: "evidence", guidance: criterion.verify,
    reviewCheck: criterion.signals, supportingEvidence: criterion.evidence,
    insufficientEvidence: criterion.insufficientEvidence, reviewerAlert: criterion.reviewerAlert,
    reviewQuestion: criterion.question, possibleDecisions: criterion.decisions,
  })),
);
const capabilityValues = values(capabilities, (capability) => `  ('${capability.code}', ${jsonb(capability)}, ${jsonb(capabilityCriteria(capability.code))}, '${sourceSha}')`);
const responsibilityValues = values(responsibilities, (responsibility) => `  ('${responsibility.sourceId}', ${jsonb(responsibility)}, '${sourceSha}')`);
const sql = `-- Generated from RESPOSABILIDADES 6.xlsx. Do not hand-edit the payloads.\nBEGIN;\n\nINSERT INTO public.master_plan_capability_library (code, payload, criteria, source_sha256)\nVALUES\n${capabilityValues}\nON CONFLICT (code) DO UPDATE SET\n  payload = EXCLUDED.payload,\n  criteria = EXCLUDED.criteria,\n  source_sha256 = EXCLUDED.source_sha256;\n\nINSERT INTO public.master_plan_responsibility_library (source_id, payload, source_sha256)\nVALUES\n${responsibilityValues}\nON CONFLICT (source_id) DO UPDATE SET\n  payload = EXCLUDED.payload,\n  source_sha256 = EXCLUDED.source_sha256;\n\nINSERT INTO public.master_plan_library_metadata (library_key, payload, source_sha256)\nVALUES ('responsabilidades-2026', ${jsonb(metadata)}, '${sourceSha}')\nON CONFLICT (library_key) DO UPDATE SET\n  payload = EXCLUDED.payload,\n  source_sha256 = EXCLUDED.source_sha256;\n\nCOMMIT;\n\nSELECT\n  (SELECT count(*) FROM public.master_plan_capability_library) AS capabilities_published,\n  (SELECT count(*) FROM public.master_plan_responsibility_library) AS competencies_published,\n  (SELECT count(*) FROM public.master_plan_capability_library WHERE source_sha256 = '${sourceSha}') AS capabilities_at_current_version,\n  (SELECT count(*) FROM public.master_plan_responsibility_library WHERE source_sha256 = '${sourceSha}') AS competencies_at_current_version;\n`;

const migrationTarget = path.join(root, "supabase/migrations/20261027213000_responsabilidades_6_new_capabilities.sql");
fs.writeFileSync(migrationTarget, sql);
const promptTarget = path.join(root, "docs/roadmap/PROMPT_APLICAR_RESPONSABILIDADES_6_SQL.md");
fs.writeFileSync(promptTarget, `# Prompt para aplicar a matriz RESPOSABILIDADES 6\n\nExecute o SQL abaixo integralmente em uma única transação. O objetivo é publicar 39 capacidades, mantendo as 56 competências atuais e adicionando F19, F20, F21, T11, F22 e F23 com níveis, critérios e roteiros de solicitação.\n\nNão apague certificações, solicitações, autoavaliações ou histórico de colaboradores. Considere sucesso somente se a consulta final retornar 39 capacidades e 56 competências na versão atual.\n\n\`\`\`sql\n${sql}\`\`\`\n`);
console.log(JSON.stringify({ migrationTarget, promptTarget, sourceSha, capabilities: capabilities.length, competencies: responsibilities.length }, null, 2));
