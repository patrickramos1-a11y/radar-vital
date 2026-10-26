import type { CapabilityLevel } from "./capabilityJourney";
import type { SourceResponsibility } from "./capabilityDemo";
import type { Library } from "./journeyRemote";
import type { ResponsibilityClaim } from "./responsibilityJourney";

export type CareerStepId = "operador_junior" | "operador_pleno" | "operador_master" | "gestao_junior" | "gestao_pleno" | "gestao_master" | "estrategico_junior";
export type PacRequirement = { capabilityCode: string; minimumLevel: CapabilityLevel };

export type CareerLadderStep = {
  id: CareerStepId;
  title: string;
  function: string;
  responsibilityIds: string[];
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

const operatorJunior = requirements(
  [2, ["T01", "T02", "T03", "T05", "T06", "T08", "F01", "F03", "F05", "F07", "F11"]],
  [1, ["T04", "F04", "F09", "F10"]],
);

const operatorPleno = requirements(
  [2, ["T01", "T02", "T03", "T04", "T05", "T06", "T08", "F01", "F03", "F04", "F05", "F07", "F09", "F10", "F11"]],
  [1, ["T07", "T09", "F02", "F06", "F08", "F12", "F13", "E01", "E02", "E03", "E04", "E05"]],
);

const operatorMaster = requirements(
  [2, ["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08", "T09", "F01", "F02", "F03", "F04", "F05", "F06", "F07", "F08", "F09", "F10", "F11", "F12", "F13", "E01", "E02", "E03", "E04", "E05"]],
  [1, ["T10"]],
);

const gestaoJunior = requirements(
  [3, ["T01", "T02", "T03", "T04", "F01", "F02", "F03", "F04"]],
  [2, ["T05", "T06", "T07", "T08", "T09", "F05", "F06", "F07", "F08", "F09", "F10", "F11", "F12", "F13", "E01", "E02", "E03", "E04", "E05"]],
  [1, ["T10"]],
);

const gestaoPleno = requirements(
  [3, ["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08", "F01", "F02", "F03", "F04", "F05", "F06", "F07", "F08", "F09"]],
  [2, ["T09", "F10", "F11", "F12", "F13", "E01", "E02", "E03", "E04", "E05"]],
  [1, ["T10"]],
);

const gestaoMaster = requirements(
  [3, ["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08", "T09", "T10", "F01", "F02", "F03", "F04", "F05", "F06", "F07", "F08", "F09", "F10", "F11", "F12", "F13", "E01"]],
  [2, ["E02", "E03", "E04", "E05"]],
);

const estrategicoJunior = requirements([3, ["T01", "T02", "T03", "T04", "T05", "T06", "T07", "T08", "T09", "T10", "F01", "F02", "F03", "F04", "F05", "F06", "F07", "F08", "F09", "F10", "F11", "F12", "F13", "E01", "E02", "E03", "E04", "E05"]]);

// A promoção é única para o Núcleo Técnico. Os setores fornecem as responsabilidades de cada degrau, mas não criam escadas paralelas.
export const nucleoTecnicoCareerLadder: CareerLadder = {
  id: "nucleo-tecnico",
  title: "Escada de promoção · Núcleo Técnico",
  scope: "Gestão Interna, Processos e Órgãos, Projetos, Serviços, Visitas e Levantamentos e eixo Transversal",
  summary: "Jornada corporativa que integra todos os setores do Núcleo Técnico. Cada cargo acrescenta capacidade certificada e responsabilidades formalmente concedidas.",
  steps: [
    {
      id: "operador_junior",
      title: "Operador Júnior",
      function: "Operação técnica inicial: execução assistida das rotinas fundamentais.",
      responsibilityIds: ["resp-20ec4169bc18b765", "resp-120793b1ab70f27f", "resp-081f67ce20624f10", "resp-5f1871e1b6525e77", "resp-e5223a2478ca72c3", "resp-c68df2f40518fac4", "resp-4dd92f1c60eda23a", "resp-7ee340a49d0a642d", "resp-86c5f2467c78720f", "resp-41cf3b43523cb0ef", "resp-1913147672bb7a52"],
      capabilityRequirements: operatorJunior,
    },
    {
      id: "operador_pleno",
      title: "Operador Pleno",
      function: "Operação técnica: autonomia nas rotinas, interfaces e entregas de campo.",
      responsibilityIds: ["resp-f72ce1f247aa74a5", "resp-5c1513a1727ab1c0", "resp-cebd28c338d58c87", "resp-b181ab438992374a", "resp-3e5f9813d6ea2e00", "resp-ae657ade32ce39f5", "resp-8f3d9f33a0ace333", "resp-33a0dc8426a5bef7"],
      capabilityRequirements: operatorPleno,
    },
    {
      id: "operador_master",
      title: "Operador Master",
      function: "Referência técnica: domínio autônomo de processos, projetos e entregas integradas.",
      responsibilityIds: ["resp-666ad73388099239", "resp-0fe0bd77b979a4c7", "resp-3376143e484680cd", "resp-5739697c18dc0409", "resp-c8acd5b15614702d", "resp-528f059535ff98fe", "resp-8331ab727331f248", "resp-cd8e3bd71528599c", "resp-8fbf76ed9b58fa01", "resp-50598130bbab746a", "resp-2695cdecf9c9b11e", "resp-bd61f92819faef63", "resp-039396162eda6b88", "resp-880672d1e6d112eb", "resp-e33a3300530ad946", "resp-e831fbee278cc093", "resp-d951ff65c1cc2e15"],
      capabilityRequirements: operatorMaster,
    },
    {
      id: "gestao_junior",
      title: "Gestão Júnior",
      function: "Gestão de setor: cobertura, fluxo e desenvolvimento de uma frente.",
      responsibilityIds: ["resp-413535e8de506f6a", "resp-1f7bb0d450478ca0", "resp-0fa4b35b63f9e668"],
      capabilityRequirements: gestaoJunior,
    },
    {
      id: "gestao_pleno",
      title: "Gestão Pleno",
      function: "Gestão integrada: coordenação de interfaces e qualidade técnica entre setores.",
      responsibilityIds: ["resp-52bf82768bc346ce", "resp-8b44d63feacd900f", "resp-b43f2b48f3f7879f"],
      capabilityRequirements: gestaoPleno,
    },
    {
      id: "gestao_master",
      title: "Gestão Master",
      function: "Gestão de núcleo: capacidade, método, formação e resultado técnico.",
      responsibilityIds: ["resp-110899f0def6ffdf", "resp-de82e5ddf1f340a4", "resp-4b295723549fd51c", "resp-2fe313509a5667cc", "resp-b0265ad877673096"],
      capabilityRequirements: gestaoMaster,
    },
    {
      id: "estrategico_junior",
      title: "Estratégico Júnior",
      function: "Estratégia do Núcleo Técnico: atuação integrada em frentes especializadas e responsabilidade pelo escopo.",
      responsibilityIds: ["resp-f94c2de51a67dde6", "resp-a00d80a50f58c7c4", "resp-0bd03c2b4f974fe3", "resp-c10a48eab7725515", "resp-441026a65a3ddd4a"],
      capabilityRequirements: estrategicoJunior,
    },
  ],
};

export function cumulativeResponsibilityIds(ladder: CareerLadder, stepId: CareerStepId) {
  const targetIndex = ladder.steps.findIndex((step) => step.id === stepId);
  return ladder.steps.slice(0, targetIndex + 1).flatMap((step) => step.responsibilityIds);
}

export function responsibilitiesForCareerStep(library: Library, ladder: CareerLadder, stepId: CareerStepId): SourceResponsibility[] {
  const ids = new Set(cumulativeResponsibilityIds(ladder, stepId));
  return library.responsibilities.filter((responsibility) => ids.has(responsibility.sourceId));
}

export function pacForCareerStep(library: Library, ladder: CareerLadder, stepId: CareerStepId): PacRequirement[] {
  const targetIndex = ladder.steps.findIndex((step) => step.id === stepId);
  const requirementsByCapability = new Map<string, CapabilityLevel>();
  const include = (requirement: PacRequirement) => requirementsByCapability.set(requirement.capabilityCode, Math.max(requirementsByCapability.get(requirement.capabilityCode) ?? 0, requirement.minimumLevel) as CapabilityLevel);
  ladder.steps.slice(0, targetIndex + 1).forEach((step) => step.capabilityRequirements.forEach(include));
  responsibilitiesForCareerStep(library, ladder, stepId).forEach((responsibility) => responsibility.requiredCapabilities.forEach(include));
  return [...requirementsByCapability.entries()]
    .map(([capabilityCode, minimumLevel]) => ({ capabilityCode, minimumLevel }))
    .sort((a, b) => a.capabilityCode.localeCompare(b.capabilityCode));
}

export function capabilityPoints(requirements: PacRequirement[]) {
  return requirements.reduce((total, requirement) => total + requirement.minimumLevel, 0);
}

export function careerStepReadiness(library: Library, ladder: CareerLadder, stepId: CareerStepId, levels: Map<string, number>, claims: ResponsibilityClaim[], collaboratorId: string) {
  const responsibilities = responsibilitiesForCareerStep(library, ladder, stepId);
  const pac = pacForCareerStep(library, ladder, stepId);
  const grantedIds = new Set(claims.filter((claim) => claim.collaborator_id === collaboratorId && claim.status === "approved").map((claim) => claim.responsibility_source_id));
  const completedCapabilities = pac.filter((requirement) => (levels.get(requirement.capabilityCode) ?? 0) >= requirement.minimumLevel).length;
  const completedCapabilityPoints = pac.reduce((total, requirement) => total + Math.min(levels.get(requirement.capabilityCode) ?? 0, requirement.minimumLevel), 0);
  const grantedResponsibilities = responsibilities.filter((responsibility) => grantedIds.has(responsibility.sourceId)).length;
  const missingCapabilities = pac.filter((requirement) => (levels.get(requirement.capabilityCode) ?? 0) < requirement.minimumLevel);
  const missingResponsibilities = responsibilities.filter((responsibility) => !grantedIds.has(responsibility.sourceId));
  return {
    responsibilities,
    pac,
    capabilityPoints: capabilityPoints(pac),
    completedCapabilities,
    completedCapabilityPoints,
    grantedResponsibilities,
    missingCapabilities,
    missingResponsibilities,
    capabilityPercent: pac.length ? Math.round(completedCapabilities / pac.length * 1000) / 10 : 100,
    responsibilityPercent: responsibilities.length ? Math.round(grantedResponsibilities / responsibilities.length * 1000) / 10 : 100,
    eligible: missingCapabilities.length === 0 && missingResponsibilities.length === 0,
  };
}
