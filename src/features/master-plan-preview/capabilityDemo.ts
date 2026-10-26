import {
  capabilityCatalogue, criteriaFor, newApplication, submitApplication,
  type CapabilityLevel, type CriterionReview, type CriterionResponse,
  type JourneyStore, type LevelApplication,
} from "./capabilityJourney";
import sourceCatalog from "../../../docs/roadmap/UNIVERSO_RAMOS_RESPONSABILIDADES_CURADAS.json";

export const DEMO_PERSON_ID = "colaborador-exemplo";
export const DEMO_PERSON_NAME = "Colaborador de exemplo";
export const REVIEW_PERSON_ID = "avaliacao-exemplo";

export type SourceResponsibility = (typeof sourceCatalog.responsibilities)[number];

export function sourceLines(value: string): string[] {
  return value.split(/\r?\n/).map((line) => line.replace(/^\s*•\s*/, "").trim()).filter(Boolean);
}

export function responsibilitiesFor(code: string): SourceResponsibility[] {
  return sourceCatalog.responsibilities.filter((responsibility) =>
    responsibility.requiredCapabilities.some((required) => required.capabilityCode === code));
}

export function createDemoStore(): JourneyStore {
  const example = capabilityCatalogue.find((item) => item.code === "F04")!;
  const submitted = newApplication(REVIEW_PERSON_ID, example.code, 1, new Date().toISOString(), "00000000-0000-4000-8000-000000000004");
  submitted.responses = Object.fromEntries(criteriaFor(example, 1).map((criterion) => [criterion.id, {
    complete: true,
    explanation: "Descrição ilustrativa para testar a avaliação deste critério.",
    evidenceName: criterion.kind === "evidence" ? "Calendário demonstrativo" : "",
    reference: criterion.kind === "evidence" ? "Referência demonstrativa, sem arquivo enviado" : "",
    files: [],
  }]));
  const reviewExample = submitApplication(submitted, criteriaFor(example, 1));

  const previous = newApplication(DEMO_PERSON_ID, "T04", 1, new Date().toISOString(), "00000000-0000-4000-8000-000000000104");
  const previousCapability = capabilityCatalogue.find((item) => item.code === "T04")!;
  for (const criterion of criteriaFor(previousCapability, 1)) {
    previous.responses[criterion.id] = {
      complete: true,
      explanation: "Atuação ilustrativa validada neste cenário de demonstração.",
      evidenceName: criterion.kind === "evidence" ? "Registro demonstrativo" : "",
      reference: criterion.kind === "evidence" ? "Registro demonstrativo" : "",
      files: [],
    };
    previous.reviews[criterion.id] = { decision: "accepted", note: "", at: new Date().toISOString() };
  }
  return { version: 1, assessments: [], applications: [
    reviewExample,
    { ...previous, status: "approved", approvedAt: new Date().toISOString() },
  ] };
}

export function changeResponse(application: LevelApplication, criterionId: string, patch: Partial<CriterionResponse>): LevelApplication {
  const current = application.responses[criterionId] ?? { complete: false, explanation: "", evidenceName: "", reference: "", files: [] };
  return { ...application, responses: { ...application.responses, [criterionId]: { ...current, ...patch } } };
}

export function changeReview(application: LevelApplication, criterionId: string, review: CriterionReview): LevelApplication {
  return { ...application, reviews: { ...application.reviews, [criterionId]: review } };
}

export function updateApplication(store: JourneyStore, updated: LevelApplication): JourneyStore {
  return { ...store, applications: store.applications.map((application) => application.id === updated.id ? updated : application) };
}

export function nextTargetLevel(certifiedLevel: number): CapabilityLevel | null {
  return certifiedLevel >= 3 ? null : (Math.max(1, certifiedLevel + 1) as CapabilityLevel);
}
