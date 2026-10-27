import type { SourceResponsibility } from "./capabilityDemo";

export type CompetencyProfile = {
  purpose: string;
  professionalProfile: string;
  scope: string[];
  problemsSolved: string[];
  deliverables: string[];
  limits: string;
};

const sectorLimits: Record<string, string> = {
  "Gestão Interna": "Não substitui decisões de direção, aprovações formais ou responsabilidades atribuídas a outro setor. Situações fora da alçada, com impacto jurídico, financeiro ou técnico relevante, devem ser escaladas.",
  "Processos e Órgãos": "Não substitui habilitação profissional, assinatura técnica, decisão de órgão público ou responsabilidade formal pelo processo. Exigências extraordinárias devem ser conduzidas com a liderança e o responsável técnico.",
  Projetos: "Não substitui responsabilidade técnica, emissão de ART ou decisão de engenharia reservada ao profissional habilitado. Premissas incompletas, riscos técnicos ou desvios de escopo devem ser escalados.",
  "Serviços, Visitas e Levantamentos": "Não substitui responsabilidade técnica, autorização de acesso ou decisão de segurança em campo. Riscos, impedimentos e condições fora do procedimento devem ser interrompidos e escalados.",
  "Transversal (todos os setores)": "Não substitui a decisão do setor responsável nem a atribuição formal de uma função. A competência orienta a contribuição profissional dentro da alçada e dos requisitos aplicáveis.",
};

function lowerFirst(value: string) {
  return value ? `${value.charAt(0).toLocaleLowerCase("pt-BR")}${value.slice(1)}` : value;
}

function joinPortuguese(values: string[]) {
  if (values.length < 2) return values[0] ?? "a atuação prevista";
  if (values.length === 2) return `${values[0]} e ${values[1]}`;
  return `${values.slice(0, -1).join(", ")} e ${values.at(-1)}`;
}

/**
 * The source workbook records the professional activities and capability matrix.
 * This turns those official items into a consistent competency sheet and accepts
 * a future, explicit profile payload without changing the screen contract.
 */
export function competencyProfileFor(competency: SourceResponsibility): CompetencyProfile {
  const stored = (competency as SourceResponsibility & { competencyProfile?: CompetencyProfile }).competencyProfile;
  if (stored) return stored;

  const scope = competency.activities.map((activity) => activity.text).filter(Boolean);
  const focus = scope.slice(0, 3).map(lowerFirst);
  return {
    purpose: `Assegurar que ${joinPortuguese(focus)} seja realizado com método, rastreabilidade, qualidade e comunicação adequada entre as pessoas e setores envolvidos.`,
    professionalProfile: `Profissional capaz de atuar na competência ${competency.title}, mobilizando as capacidades exigidas para organizar a execução, tomar decisões dentro da sua alçada, registrar o que foi feito e entregar resultados verificáveis.`,
    scope,
    problemsSolved: scope.slice(0, 4).map((activity) => `Lacunas, atrasos ou inconsistências em ${lowerFirst(activity)}.`),
    deliverables: scope.slice(0, 6),
    limits: sectorLimits[competency.sourceSector] ?? sectorLimits["Transversal (todos os setores)"],
  };
}
