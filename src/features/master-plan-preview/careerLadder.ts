import type { CapabilityLevel } from "./capabilityJourney";
import type { SourceResponsibility } from "./capabilityDemo";
import type { Library } from "./journeyRemote";
import type { ResponsibilityClaim } from "./responsibilityJourney";

export type CareerStepId = "operador_junior" | "operador_pleno" | "operador_master";

export type CareerLadderStep = {
  id: CareerStepId;
  title: string;
  function: string;
  responsibilityIds: string[];
};

export type CareerLadder = {
  id: string;
  title: string;
  sector: string;
  summary: string;
  steps: CareerLadderStep[];
};

// A classificação é organizacional: ela não é inferida do maior nível técnico exigido.
export const processosEOrgaosLadder: CareerLadder = {
  id: "processos-e-orgaos",
  title: "Escada padrão · Processos e Órgãos",
  sector: "Processos e Órgãos",
  summary: "Piloto para transformar responsabilidades reais em uma evolução linear de operação.",
  steps: [
    {
      id: "operador_junior",
      title: "Operador Júnior",
      function: "Execução documental e cadastral supervisionada",
      responsibilityIds: ["resp-c68df2f40518fac4", "resp-4dd92f1c60eda23a", "resp-7ee340a49d0a642d"],
    },
    {
      id: "operador_pleno",
      title: "Operador Pleno",
      function: "Execução regulatória autônoma",
      responsibilityIds: ["resp-b181ab438992374a", "resp-3376143e484680cd", "resp-5739697c18dc0409", "resp-c8acd5b15614702d", "resp-528f059535ff98fe", "resp-8331ab727331f248"],
    },
    {
      id: "operador_master",
      title: "Operador Master",
      function: "Referência técnica e coordenação regulatória",
      responsibilityIds: ["resp-0fa4b35b63f9e668", "resp-f94c2de51a67dde6", "resp-a00d80a50f58c7c4"],
    },
  ],
};

export type PacRequirement = { capabilityCode: string; minimumLevel: CapabilityLevel };

export function cumulativeResponsibilityIds(ladder: CareerLadder, stepId: CareerStepId) {
  const targetIndex = ladder.steps.findIndex((step) => step.id === stepId);
  return ladder.steps.slice(0, targetIndex + 1).flatMap((step) => step.responsibilityIds);
}

export function responsibilitiesForCareerStep(library: Library, ladder: CareerLadder, stepId: CareerStepId): SourceResponsibility[] {
  const ids = new Set(cumulativeResponsibilityIds(ladder, stepId));
  return library.responsibilities.filter((responsibility) => ids.has(responsibility.sourceId));
}

export function pacForCareerStep(library: Library, ladder: CareerLadder, stepId: CareerStepId): PacRequirement[] {
  const requirements = new Map<string, CapabilityLevel>();
  responsibilitiesForCareerStep(library, ladder, stepId).forEach((responsibility) => {
    responsibility.requiredCapabilities.forEach((requirement) => {
      const current = requirements.get(requirement.capabilityCode) ?? 0;
      requirements.set(requirement.capabilityCode, Math.max(current, requirement.minimumLevel) as CapabilityLevel);
    });
  });
  return [...requirements.entries()]
    .map(([capabilityCode, minimumLevel]) => ({ capabilityCode, minimumLevel }))
    .sort((a, b) => a.capabilityCode.localeCompare(b.capabilityCode));
}

export function careerStepReadiness(library: Library, ladder: CareerLadder, stepId: CareerStepId, levels: Map<string, number>, claims: ResponsibilityClaim[], collaboratorId: string) {
  const responsibilities = responsibilitiesForCareerStep(library, ladder, stepId);
  const pac = pacForCareerStep(library, ladder, stepId);
  const grantedIds = new Set(claims.filter((claim) => claim.collaborator_id === collaboratorId && claim.status === "approved").map((claim) => claim.responsibility_source_id));
  const completedCapabilities = pac.filter((requirement) => (levels.get(requirement.capabilityCode) ?? 0) >= requirement.minimumLevel).length;
  const grantedResponsibilities = responsibilities.filter((responsibility) => grantedIds.has(responsibility.sourceId)).length;
  const missingCapabilities = pac.filter((requirement) => (levels.get(requirement.capabilityCode) ?? 0) < requirement.minimumLevel);
  const missingResponsibilities = responsibilities.filter((responsibility) => !grantedIds.has(responsibility.sourceId));
  return {
    responsibilities,
    pac,
    completedCapabilities,
    grantedResponsibilities,
    missingCapabilities,
    missingResponsibilities,
    capabilityPercent: pac.length ? Math.round(completedCapabilities / pac.length * 1000) / 10 : 100,
    responsibilityPercent: responsibilities.length ? Math.round(grantedResponsibilities / responsibilities.length * 1000) / 10 : 100,
    eligible: missingCapabilities.length === 0 && missingResponsibilities.length === 0,
  };
}
