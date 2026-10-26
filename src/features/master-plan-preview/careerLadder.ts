import type { CapabilityLevel } from "./capabilityJourney";
import type { SourceResponsibility } from "./capabilityDemo";
import type { Library } from "./journeyRemote";
import type { ResponsibilityClaim } from "./responsibilityJourney";

export type CareerStepId = string;

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

const junior = (responsibilityIds: string[], functionName: string): CareerLadderStep => ({
  id: "operador_junior",
  title: "Operador Júnior",
  function: functionName,
  responsibilityIds,
});

const pleno = (responsibilityIds: string[], functionName: string): CareerLadderStep => ({
  id: "operador_pleno",
  title: "Operador Pleno",
  function: functionName,
  responsibilityIds,
});

const estrategico = (responsibilityIds: string[], functionName: string): CareerLadderStep => ({
  id: "estrategico_junior",
  title: "Estratégico Júnior",
  function: functionName,
  responsibilityIds,
});

// A classificação é organizacional: os níveis do PAC são calculados a partir dos requisitos reais.
export const processosEOrgaosLadder: CareerLadder = {
  id: "processos-e-orgaos",
  title: "Escada padrão · Processos e Órgãos",
  sector: "Processos e Órgãos",
  summary: "Do registro documental à coordenação regulatória e à condução de casos de maior impacto.",
  steps: [
    junior(["resp-c68df2f40518fac4", "resp-4dd92f1c60eda23a", "resp-7ee340a49d0a642d"], "Execução documental e cadastral supervisionada"),
    pleno(["resp-b181ab438992374a", "resp-3376143e484680cd", "resp-5739697c18dc0409", "resp-c8acd5b15614702d", "resp-528f059535ff98fe", "resp-8331ab727331f248"], "Execução regulatória autônoma"),
    estrategico(["resp-0fa4b35b63f9e668", "resp-f94c2de51a67dde6", "resp-a00d80a50f58c7c4"], "Coordenação regulatória e condução de frentes especializadas"),
  ],
};

export const gestaoInternaLadder: CareerLadder = {
  id: "gestao-interna",
  title: "Escada padrão · Gestão Interna",
  sector: "Gestão Interna",
  summary: "Da organização da rotina à coordenação do fluxo operacional e à melhoria contínua.",
  steps: [
    junior(["resp-20ec4169bc18b765", "resp-120793b1ab70f27f", "resp-081f67ce20624f10", "resp-5f1871e1b6525e77", "resp-e5223a2478ca72c3"], "Organização de informações, atendimento e entrada de demandas"),
    pleno(["resp-f72ce1f247aa74a5", "resp-5c1513a1727ab1c0", "resp-666ad73388099239", "resp-cebd28c338d58c87", "resp-0fe0bd77b979a4c7"], "Gestão autônoma de interfaces, pendências e encaminhamentos"),
    estrategico(["resp-413535e8de506f6a", "resp-1f7bb0d450478ca0", "resp-52bf82768bc346ce", "resp-8b44d63feacd900f"], "Coordenação do fluxo e identificação sistêmica de melhorias"),
  ],
};

export const projetosLadder: CareerLadder = {
  id: "projetos",
  title: "Escada padrão · Projetos",
  sector: "Projetos",
  summary: "Da produção técnica orientada à gestão de qualidade, capacidade e multiplicação do conhecimento.",
  steps: [
    junior(["resp-cd8e3bd71528599c", "resp-86c5f2467c78720f", "resp-41cf3b43523cb0ef", "resp-8fbf76ed9b58fa01"], "Produção técnica e aplicação de padrões"),
    pleno(["resp-50598130bbab746a", "resp-2695cdecf9c9b11e", "resp-0bd03c2b4f974fe3"], "Planejamento da produção e supervisão técnica"),
    estrategico(["resp-b43f2b48f3f7879f", "resp-110899f0def6ffdf", "resp-de82e5ddf1f340a4", "resp-4b295723549fd51c"], "Qualidade, capacidade e multiplicação técnica"),
  ],
};

export const servicosCampoLadder: CareerLadder = {
  id: "servicos-visitas-levantamentos",
  title: "Escada padrão · Serviços, Visitas e Levantamentos",
  sector: "Serviços, Visitas e Levantamentos",
  summary: "Da execução de levantamentos à coordenação de campo e à garantia da qualidade dos dados.",
  steps: [
    junior(["resp-c10a48eab7725515", "resp-bd61f92819faef63", "resp-441026a65a3ddd4a", "resp-3e5f9813d6ea2e00", "resp-1913147672bb7a52", "resp-ae657ade32ce39f5"], "Levantamentos, visitas e registros de campo"),
    pleno(["resp-039396162eda6b88", "resp-880672d1e6d112eb", "resp-8f3d9f33a0ace333", "resp-33a0dc8426a5bef7", "resp-e33a3300530ad946", "resp-e831fbee278cc093"], "Coordenação de serviços e consolidação de entregas de campo"),
    estrategico(["resp-2fe313509a5667cc", "resp-b0265ad877673096"], "Planejamento de campo e integridade dos dados"),
  ],
};

export const transversalLadder: CareerLadder = {
  id: "transversal",
  title: "Escada padrão · Transversal",
  sector: "Transversal (todos os setores)",
  summary: "Responsabilidade compartilhada que conecta a continuidade do trabalho entre os setores.",
  steps: [
    junior(["resp-d951ff65c1cc2e15"], "Passagem de bastão e interface entre setores"),
    pleno([], "Aplicação autônoma nas rotinas do setor"),
    estrategico([], "Referência de integração entre setores"),
  ],
};

export const suporteLadder: CareerLadder = {
  id: "fora-do-nucleo-tecnico",
  title: "Escada padrão · Fora do Núcleo Técnico",
  sector: "Fora do Núcleo Técnico",
  summary: "Escopo de apoio corporativo. As responsabilidades ainda não possuem requisitos técnicos cadastrados.",
  steps: [
    junior(["resp-471106dc089e627c", "resp-5ee6816c015a93e1", "resp-ea80eae010a11116", "resp-ecf95e2f9636c9a8"], "Apoio administrativo, financeiro, de pessoas e tecnologia"),
    pleno([], "Atuação autônoma a detalhar"),
    estrategico([], "Referência estratégica a detalhar"),
  ],
};

export const careerLadders: CareerLadder[] = [
  processosEOrgaosLadder,
  gestaoInternaLadder,
  projetosLadder,
  servicosCampoLadder,
  transversalLadder,
  suporteLadder,
];

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
