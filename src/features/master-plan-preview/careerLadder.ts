import type { CapabilityLevel } from "./capabilityJourney";
import type { SourceResponsibility } from "./capabilityDemo";
import type { Library } from "./journeyRemote";
import { globalCapabilityMaturity, responsibilityReadiness, type ResponsibilityClaim, type ResponsibilityReadiness } from "./responsibilityJourney";

export type CareerStepId =
  | "operador_junior"
  | "operador_pleno"
  | "operador_master"
  | "gestao_junior"
  | "gestao_pleno"
  | "gestao_master"
  | "estrategico_junior"
  | "estrategico_pleno"
  | "estrategico_master";

export type PacRequirement = { capabilityCode: string; minimumLevel: CapabilityLevel };

export type CareerLadderStep = {
  id: CareerStepId;
  title: string;
  function: string;
  capabilityTarget: number;
  responsibilityTarget: number;
  nucleiRequired: number;
  capabilityRequirements: PacRequirement[];
};

export type CareerLadder = {
  id: string;
  title: string;
  scope: string;
  summary: string;
  steps: CareerLadderStep[];
};

const requirements = (...groups: Array<[CapabilityLevel, string[]]>): PacRequirement[] => groups.flatMap(([minimumLevel, codes]) => codes.map((capabilityCode) => ({ capabilityCode, minimumLevel })));

// O PAC abaixo e a trilha recomendada. A promoção mede os pontos certificados reais;
// as responsabilidades elegíveis continuam variando conforme os pré-requisitos de cada pessoa.
const operatorJunior = requirements(
  [2, ["T05", "F05", "F07", "F11"]],
  [1, ["T01", "T02", "T03", "T04", "T06", "T07", "T08", "T09", "F01", "F02", "F03", "F04", "F06", "F08", "F09", "F10", "F12", "F13"]],
);
const operatorPleno = requirements(
  [2, ["T01", "T02", "T03", "T06", "T08", "F01", "F03", "F04", "F09", "F10"]],
  [1, ["T10", "E01", "E02", "E03", "E04", "E05"]],
);
const operatorMaster = requirements(
  [3, ["T05"]],
  [2, ["T04", "T07", "T09", "T10", "F02", "F06", "F08", "F12", "F13", "E01", "E02", "E03"]],
);
const gestaoJunior = requirements([3, ["T02", "F01", "F02", "F07", "F08", "T07", "T08", "T09"]]);
const gestaoPleno = requirements([3, ["F03", "F04", "F06", "F09", "F10", "F11", "F12", "F13", "E02"]]);
const gestaoMaster = requirements([3, ["T01", "T03", "T04", "T06", "T10", "F05", "E01", "E03"]]);
const estrategicoJunior = requirements([3, ["E04", "E05"]]);

// A promoção é única para o Núcleo Técnico. O PAC é comum, enquanto as responsabilidades
// são habilitadas pela combinação de capacidades certificadas de cada colaborador.
export const nucleoTecnicoCareerLadder: CareerLadder = {
  id: "nucleo-tecnico",
  title: "Escada de promoção · Núcleo Técnico",
  scope: "Gestão Interna, Processos e Órgãos, Projetos, Serviços, Visitas e Levantamentos e eixo Transversal",
  summary: "A operação começa com um PAC intenso e poucas responsabilidades. À medida que a maturidade aumenta, cada pessoa passa a assumir mais responsabilidades que suas próprias capacitações habilitam.",
  steps: [
    { id: "operador_junior", title: "Operador Júnior", function: "Operação técnica inicial: execução assistida das rotinas fundamentais.", capabilityTarget: 26, responsibilityTarget: 3, nucleiRequired: 1, capabilityRequirements: operatorJunior },
    { id: "operador_pleno", title: "Operador Pleno", function: "Operação técnica: autonomia nas rotinas, interfaces e entregas de campo.", capabilityTarget: 42, responsibilityTarget: 8, nucleiRequired: 1, capabilityRequirements: operatorPleno },
    { id: "operador_master", title: "Operador Master", function: "Referência técnica: domínio autônomo de processos, projetos e entregas integradas.", capabilityTarget: 55, responsibilityTarget: 16, nucleiRequired: 1, capabilityRequirements: operatorMaster },
    { id: "gestao_junior", title: "Gestão Júnior", function: "Gestão de setor: cobertura, fluxo e desenvolvimento de uma frente.", capabilityTarget: 63, responsibilityTarget: 26, nucleiRequired: 1, capabilityRequirements: gestaoJunior },
    { id: "gestao_pleno", title: "Gestão Pleno", function: "Gestão integrada: coordenação de interfaces e qualidade técnica entre setores.", capabilityTarget: 72, responsibilityTarget: 34, nucleiRequired: 1, capabilityRequirements: gestaoPleno },
    { id: "gestao_master", title: "Gestão Master", function: "Gestão de núcleo: capacidade, método, formação e resultado técnico.", capabilityTarget: 80, responsibilityTarget: 44, nucleiRequired: 1, capabilityRequirements: gestaoMaster },
    { id: "estrategico_junior", title: "Estratégico Júnior", function: "Estratégia do Núcleo Técnico: capacidades multiplicadoras e cobertura integral do escopo.", capabilityTarget: 84, responsibilityTarget: 52, nucleiRequired: 1, capabilityRequirements: estrategicoJunior },
    { id: "estrategico_pleno", title: "Estratégico Pleno", function: "Estratégia integrada: expansão da cobertura para dois núcleos definidos.", capabilityTarget: 84, responsibilityTarget: 52, nucleiRequired: 2, capabilityRequirements: [] },
    { id: "estrategico_master", title: "Estratégico Master", function: "Direção estratégica: expansão da cobertura para três núcleos definidos.", capabilityTarget: 84, responsibilityTarget: 52, nucleiRequired: 3, capabilityRequirements: [] },
  ],
};

export function pacForCareerStep(library: Library, ladder: CareerLadder, stepId: CareerStepId): PacRequirement[] {
  const targetIndex = ladder.steps.findIndex((step) => step.id === stepId);
  const requirementsByCapability = new Map<string, CapabilityLevel>();
  ladder.steps.slice(0, targetIndex + 1).forEach((step) => step.capabilityRequirements.forEach((requirement) => {
    requirementsByCapability.set(requirement.capabilityCode, Math.max(requirementsByCapability.get(requirement.capabilityCode) ?? 0, requirement.minimumLevel) as CapabilityLevel);
  }));
  return [...requirementsByCapability.entries()]
    .map(([capabilityCode, minimumLevel]) => ({ capabilityCode, minimumLevel }))
    .filter((requirement) => library.capabilities.some((capability) => capability.code === requirement.capabilityCode))
    .sort((a, b) => a.capabilityCode.localeCompare(b.capabilityCode));
}

export function newPacRequirementsForCareerStep(library: Library, ladder: CareerLadder, stepId: CareerStepId): PacRequirement[] {
  const targetIndex = ladder.steps.findIndex((step) => step.id === stepId);
  const current = pacForCareerStep(library, ladder, stepId);
  if (targetIndex <= 0) return current;
  const previous = new Map(pacForCareerStep(library, ladder, ladder.steps[targetIndex - 1].id).map((requirement) => [requirement.capabilityCode, requirement.minimumLevel]));
  return current.filter((requirement) => requirement.minimumLevel > (previous.get(requirement.capabilityCode) ?? 0));
}

export function capabilityPoints(requirements: PacRequirement[]) {
  return requirements.reduce((total, requirement) => total + requirement.minimumLevel, 0);
}

export function technicalResponsibilities(library: Library): SourceResponsibility[] {
  return library.responsibilities.filter((responsibility) => responsibility.sourceSector !== "Fora do Núcleo Técnico");
}

/**
 * Each career milestone has its own curated PAC. Its levels define both the
 * capability controls that may be simulated and the responsibility paths that
 * make sense at that stage; unrelated future requirements stay out of view.
 */
export function capabilitiesForCareerStep(library: Library, ladder: CareerLadder, stepId: CareerStepId): PacRequirement[] {
  return pacForCareerStep(library, ladder, stepId);
}

export function responsibilitiesForCareerStep(library: Library, ladder: CareerLadder, stepId: CareerStepId): SourceResponsibility[] {
  const availableLevels = new Map(capabilitiesForCareerStep(library, ladder, stepId).map((requirement) => [requirement.capabilityCode, requirement.minimumLevel]));
  return technicalResponsibilities(library).filter((responsibility) => responsibility.requiredCapabilities.every((requirement) => (availableLevels.get(requirement.capabilityCode) ?? 0) >= requirement.minimumLevel));
}

function responsibilityCandidates(responsibilities: SourceResponsibility[], levels: Map<string, number>, claims: ResponsibilityClaim[], collaboratorId: string): ResponsibilityReadiness[] {
  const ownClaims = claims.filter((claim) => claim.collaborator_id === collaboratorId);
  const rank = (item: ResponsibilityReadiness) => item.status === "concedida" ? 0 : item.status === "solicitada" ? 1 : 2;
  return responsibilities
    .map((responsibility) => responsibilityReadiness(responsibility, levels, ownClaims))
    .filter((item) => item.unmet.length === 0)
    .sort((left, right) => rank(left) - rank(right) || left.pointsRequired - right.pointsRequired || left.responsibility.title.localeCompare(right.responsibility.title, "pt-BR"));
}

export function responsibilityClaimAllowance(library: Library, ladder: CareerLadder, levels: Map<string, number>, claims: ResponsibilityClaim[], collaboratorId: string) {
  const pendingStep = ladder.steps.find((step) => !careerStepReadiness(library, ladder, step.id, levels, claims, collaboratorId).eligible) ?? ladder.steps.at(-1)!;
  const current = responsibilityCandidates(responsibilitiesForCareerStep(library, ladder, pendingStep.id), levels, claims, collaboratorId)
    .filter((item) => item.status === "concedida" || item.status === "solicitada").length;
  return { step: pendingStep, current, limit: pendingStep.responsibilityTarget, allowed: current < pendingStep.responsibilityTarget };
}

export function careerStepReadiness(library: Library, ladder: CareerLadder, stepId: CareerStepId, levels: Map<string, number>, claims: ResponsibilityClaim[], collaboratorId: string) {
  const step = ladder.steps.find((item) => item.id === stepId);
  if (!step) throw new Error(`Cargo não encontrado: ${stepId}`);
  const pac = pacForCareerStep(library, ladder, stepId);
  const maturity = globalCapabilityMaturity(library.capabilities.map((capability) => capability.code), levels);
  const candidates = responsibilityCandidates(responsibilitiesForCareerStep(library, ladder, stepId), levels, claims, collaboratorId);
  const grantedResponsibilities = candidates.filter((item) => item.status === "concedida").length;
  const fullTechnicalMaturity = step.id === "estrategico_junior" || step.id === "estrategico_pleno" || step.id === "estrategico_master"
    ? library.capabilities.every((capability) => (levels.get(capability.code) ?? 0) >= 3)
    : true;
  const missingCapabilities = pac.filter((requirement) => (levels.get(requirement.capabilityCode) ?? 0) < requirement.minimumLevel);
  const missingCapabilityPoints = Math.max(0, step.capabilityTarget - maturity.pointsEarned);
  const missingResponsibilityCount = Math.max(0, step.responsibilityTarget - grantedResponsibilities);
  const scopeReady = step.nucleiRequired === 1;
  return {
    step,
    pac,
    capabilityPoints: step.capabilityTarget,
    completedCapabilities: pac.filter((requirement) => (levels.get(requirement.capabilityCode) ?? 0) >= requirement.minimumLevel).length,
    completedCapabilityPoints: maturity.pointsEarned,
    certifiedCapabilityCount: library.capabilities.filter((capability) => (levels.get(capability.code) ?? 0) > 0).length,
    grantedResponsibilities,
    responsibilityTarget: step.responsibilityTarget,
    responsibilityCandidates: candidates.slice(0, step.responsibilityTarget),
    allResponsibilityCandidates: candidates,
    missingCapabilities,
    missingCapabilityPoints,
    missingResponsibilityCount,
    capabilityPercent: Math.round(Math.min(maturity.pointsEarned / step.capabilityTarget, 1) * 1000) / 10,
    responsibilityPercent: Math.round(Math.min(grantedResponsibilities / step.responsibilityTarget, 1) * 1000) / 10,
    scopeReady,
    eligible: maturity.pointsEarned >= step.capabilityTarget && fullTechnicalMaturity && grantedResponsibilities >= step.responsibilityTarget && scopeReady,
  };
}
