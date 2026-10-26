import { z } from "zod";
import sourceCatalog from "../../../docs/roadmap/UNIVERSO_RAMOS_RESPONSABILIDADES_CURADAS.json";
import { guidanceFor } from "./criterionGuidance";

export const JOURNEY_STORAGE_KEY = "radar-vital:plano-mestre:jornada-capacidades:local:v1";

export type CapabilityLevel = 1 | 2 | 3;
export type Criterion = { id: string; level: 0 | CapabilityLevel; text: string; kind: "performance" | "evidence"; guidance?: string; reviewCheck?: string };
export type CapabilityRecord = (typeof sourceCatalog.capabilities)[number];
export type CriterionResponse = {
  complete: boolean;
  explanation: string;
  evidenceName?: string;
  reference: string;
  files: Array<{ id: string; name: string; size: number }>;
};
export type CriterionReview = { decision: "accepted" | "changes_requested"; note: string; at: string };
export type SelfAssessment = {
  id: string;
  personId: string;
  capabilityCode: string;
  at: string;
  answers: [number, number, number, number];
  comment: string;
  indicatedLevel: number;
};
export type Submission = { at: string; responses: Record<string, CriterionResponse> };
export type LevelApplication = {
  id: string;
  personId: string;
  capabilityCode: string;
  targetLevel: CapabilityLevel;
  status: "draft" | "submitted" | "changes_requested" | "approved";
  createdAt: string;
  approvedAt?: string;
  responses: Record<string, CriterionResponse>;
  reviews: Record<string, CriterionReview>;
  submissions: Submission[];
};
export type JourneyStore = { version: 1; assessments: SelfAssessment[]; applications: LevelApplication[] };

const text = z.string().max(20_000);
const identifier = z.string().min(1).max(200);
const responseSchema = z.object({
  complete: z.boolean(), explanation: text, evidenceName: text.optional(), reference: text,
  files: z.array(z.object({ id: identifier, name: text, size: z.number().nonnegative() })).max(10),
});
const responsesSchema = z.record(responseSchema);
const reviewSchema = z.object({ decision: z.enum(["accepted", "changes_requested"]), note: text, at: identifier });
const assessmentSchema = z.object({
  id: identifier, personId: identifier, capabilityCode: identifier, at: identifier,
  answers: z.tuple([z.number().int().min(0).max(3), z.number().int().min(0).max(3), z.number().int().min(0).max(3), z.number().int().min(0).max(3)]),
  comment: text.min(1), indicatedLevel: z.number().int().min(0).max(3),
});
const applicationSchema = z.object({
  id: identifier, personId: identifier, capabilityCode: identifier,
  targetLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  status: z.enum(["draft", "submitted", "changes_requested", "approved"]),
  createdAt: identifier, approvedAt: identifier.optional(),
  responses: responsesSchema, reviews: z.record(reviewSchema),
  submissions: z.array(z.object({ at: identifier, responses: responsesSchema })).max(100),
});
const storeSchema = z.object({
  version: z.literal(1),
  assessments: z.array(assessmentSchema).max(10_000),
  applications: z.array(applicationSchema).max(5_000),
});

export const capabilityCatalogue = sourceCatalog.capabilities as CapabilityRecord[];
export const capabilityLevelNames = ["Não capacitado", "Assistido", "Autônomo", "Multiplicador"] as const;
export const emptyJourneyStore = (): JourneyStore => ({ version: 1, assessments: [], applications: [] });

export function parseJourneyStore(value: unknown): JourneyStore {
  return storeSchema.parse(value) as JourneyStore;
}

export function loadJourneyStore(): JourneyStore {
  const raw = window.localStorage.getItem(JOURNEY_STORAGE_KEY);
  return raw ? parseJourneyStore(JSON.parse(raw)) : emptyJourneyStore();
}

export function saveJourneyStore(store: JourneyStore): JourneyStore {
  const parsed = parseJourneyStore(store);
  window.localStorage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify(parsed));
  return parsed;
}

function bullets(value: string): string[] {
  return value.split(/\s*•\s*/).map((part) => part.trim()).filter(Boolean);
}

export function criteriaFor(capability: CapabilityRecord, targetLevel: CapabilityLevel): Criterion[] {
  const performance = bullets(capability.detail.performanceCriteria).map((item, index) => {
    const [title, verification] = item.split(/Como se comprova:\s*/i);
    const fallback = guidanceFor(capability.code, "performance", 0, index);
    return { id: `performance-${index + 1}`, level: 0 as const, text: title.trim(), kind: "performance" as const,
      guidance: verification?.trim() || fallback?.submitter, reviewCheck: verification?.trim() || fallback?.reviewer };
  });
  const structuredEvidence = capability.detail.certificationEvidence
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.match(/^(ASSISTIDO|AUTÔNOMO|MULTIPLICADOR)\s*\r?\nO que entregar:\s*([\s\S]*?)\r?\nComo é avaliado:\s*([\s\S]*?)\r?\nAprovado quando:\s*([\s\S]*)$/i));
  if (structuredEvidence.length === 3 && structuredEvidence.every(Boolean)) {
    const evidence = structuredEvidence.flatMap((match, index) => {
      const level = (index + 1) as CapabilityLevel;
      if (level > targetLevel || !match) return [];
      return [{
        id: `level-${level}-1`, level, kind: "evidence" as const,
        text: match[2].trim(), guidance: match[3].trim(), reviewCheck: match[4].trim(),
      }];
    });
    return [...performance, ...evidence];
  }
  const levelPrefixes = ["Assistido:", "Autônomo:", "Multiplicador:"];
  const evidence = bullets(capability.detail.certificationEvidence).flatMap((item) => {
    const levelIndex = levelPrefixes.findIndex((prefix) => item.startsWith(prefix));
    if (levelIndex < 0 || levelIndex + 1 > targetLevel) return [];
    const level = (levelIndex + 1) as CapabilityLevel;
    return item.slice(levelPrefixes[levelIndex].length).split(/\s+\+\s+/).map((part, index) => {
      const guidance = guidanceFor(capability.code, "evidence", level);
      return { id: `level-${level}-${index + 1}`, level, text: part.trim(), kind: "evidence" as const,
        guidance: guidance?.submitter, reviewCheck: guidance?.reviewer };
    });
  });
  return [...performance, ...evidence];
}

export function pendingCriteria(capability: CapabilityRecord, targetLevel: CapabilityLevel, certifiedLevel: number): Criterion[] {
  return criteriaFor(capability, targetLevel).filter((criterion) =>
    certifiedLevel === 0 || (criterion.level !== 0 && criterion.level > certifiedLevel));
}

export function certifiedLevelFor(store: JourneyStore, personId: string, capabilityCode: string): number {
  return store.applications.reduce((level, application) =>
    application.personId === personId && application.capabilityCode === capabilityCode && application.status === "approved"
      ? Math.max(level, application.targetLevel) : level, 0);
}

export function latestAssessmentFor(store: JourneyStore, personId: string, capabilityCode: string): SelfAssessment | undefined {
  return store.assessments.filter((assessment) => assessment.personId === personId && assessment.capabilityCode === capabilityCode)
    .sort((a, b) => b.at.localeCompare(a.at))[0];
}

export function createAssessment(
  store: JourneyStore, personId: string, capabilityCode: string,
  answers: [number, number, number, number], comment: string, at = new Date().toISOString(), id = crypto.randomUUID(),
): JourneyStore {
  if (!comment.trim() || answers.some((answer) => !Number.isInteger(answer) || answer < 0 || answer > 3)) {
    throw new Error("Responda as quatro dimensões e explique sua autoavaliação.");
  }
  return parseJourneyStore({ ...store, assessments: [...store.assessments, {
    id, personId, capabilityCode, at, answers, comment: comment.trim(), indicatedLevel: Math.min(...answers),
  }] });
}

export function newApplication(personId: string, capabilityCode: string, targetLevel: CapabilityLevel,
  at = new Date().toISOString(), id = crypto.randomUUID()): LevelApplication {
  return { id, personId, capabilityCode, targetLevel, status: "draft", createdAt: at, responses: {}, reviews: {}, submissions: [] };
}

export function canSubmitApplication(application: LevelApplication, criteria: Criterion[]): boolean {
  return criteria.length > 0 && criteria.every((criterion) => {
    const response = application.responses[criterion.id];
    return response?.complete && response.explanation.trim()
      && (criterion.kind === "performance" || (response.evidenceName?.trim() && response.reference.trim()));
  });
}

export function submitApplication(application: LevelApplication, criteria: Criterion[], at = new Date().toISOString()): LevelApplication {
  if (!canSubmitApplication(application, criteria)) throw new Error("Complete os critérios e as evidências antes de enviar.");
  if (application.status !== "draft" && application.status !== "changes_requested") throw new Error("Esta solicitação não pode ser reenviada.");
  const snapshot = structuredClone(application.responses);
  return {
    ...application, status: "submitted", reviews: {},
    submissions: [...application.submissions, { at, responses: snapshot }],
  };
}

export function canApproveApplication(application: LevelApplication, criteria: Criterion[]): boolean {
  return application.status === "submitted" && criteria.length > 0
    && criteria.every((criterion) => application.reviews[criterion.id]?.decision === "accepted");
}

export function printDeclaration(application: LevelApplication, capability: CapabilityRecord, personName: string): void {
  const escape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const items = criteriaFor(capability, application.targetLevel).filter((criterion) => application.responses[criterion.id]?.complete)
    .map((criterion) => {
      const response = application.responses[criterion.id];
      const references = [response.evidenceName, response.reference].filter(Boolean).join(" · ");
      return `<li><strong>${escape(criterion.text)}</strong><p>${escape(response.explanation)}</p>${references ? `<small>Evidência: ${escape(references)}</small>` : ""}</li>`;
    }).join("");
  const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Declaração de critérios - ${escape(capability.code)}</title><style>body{font:15px/1.5 Arial,sans-serif;max-width:800px;margin:48px auto;color:#172522}h1{font-size:24px}li{margin:20px 0}p{margin:6px 0}small{color:#52635e}.notice{padding:12px;border-left:4px solid #b67516;background:#fff8e9}</style><h1>Declaração de critérios realizados</h1><p><strong>Colaborador:</strong> ${escape(personName)}</p><p><strong>Capacidade:</strong> ${escape(capability.code)} · ${escape(capability.title)}</p><p><strong>Nível pretendido:</strong> ${escape(capabilityLevelNames[application.targetLevel])}</p><p><strong>Gerada em:</strong> ${escape(new Date().toLocaleString("pt-BR"))}</p><p class="notice">Autodeclaração demonstrativa. Não é certificação, habilitação profissional ou decisão da Ramos Engenharia.</p><ol>${items}</ol></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `declaracao-${capability.code}-${new Date().toISOString().slice(0, 10)}.html`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
