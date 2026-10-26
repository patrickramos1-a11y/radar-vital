import { capabilityLevelNames, type CapabilityLevel } from "./capabilityJourney";
import type { SourceResponsibility } from "./capabilityDemo";

export type ResponsibilityClaimStatus = "requested" | "approved" | "rejected" | "cancelled";
export type ResponsibilityClaim = {
  id: string;
  collaborator_id: string;
  responsibility_source_id: string;
  status: ResponsibilityClaimStatus;
  requested_at: string;
  decided_at: string | null;
  decided_by: string | null;
  decision_note: string;
};

export type ResponsibilityReadiness = {
  responsibility: SourceResponsibility;
  mode: CapabilityLevel;
  pointsEarned: number;
  pointsRequired: number;
  progress: number;
  unmet: Array<{ capabilityCode: string; minimumLevel: CapabilityLevel }>;
  status: "bloqueada" | "em_preparo" | "disponivel" | "solicitada" | "concedida";
  claim?: ResponsibilityClaim;
};

/**
 * Competencies are formed automatically from their required capabilities.
 * The legacy responsibility claim stays available for historical records,
 * but it no longer decides professional progression.
 */
export type CompetencyReadiness = Omit<ResponsibilityReadiness, "status" | "claim"> & {
  status: "bloqueada" | "em_formacao" | "consolidada";
};

type CompetencyRequirement = SourceResponsibility["requiredCapabilities"][number];

/**
 * A competência não é só uma atividade isolada: ela combina o requisito
 * específico com uma base comum do respectivo núcleo de atuação.
 */
const competencyFoundations: Record<string, Array<{ capabilityCode: string; minimumLevel: CapabilityLevel }>> = {
  "Gestão Interna": [
    { capabilityCode: "T01", minimumLevel: 1 },
    { capabilityCode: "T03", minimumLevel: 1 },
    { capabilityCode: "T04", minimumLevel: 1 },
    { capabilityCode: "T09", minimumLevel: 1 },
  ],
  "Processos e Órgãos": [
    { capabilityCode: "F02", minimumLevel: 1 },
    { capabilityCode: "F05", minimumLevel: 1 },
    { capabilityCode: "T01", minimumLevel: 1 },
    { capabilityCode: "T06", minimumLevel: 1 },
  ],
  Projetos: [
    { capabilityCode: "F07", minimumLevel: 1 },
    { capabilityCode: "T05", minimumLevel: 1 },
    { capabilityCode: "T07", minimumLevel: 1 },
    { capabilityCode: "F08", minimumLevel: 1 },
  ],
  "Serviços, Visitas e Levantamentos": [
    { capabilityCode: "F10", minimumLevel: 1 },
    { capabilityCode: "F11", minimumLevel: 1 },
    { capabilityCode: "F07", minimumLevel: 1 },
    { capabilityCode: "T07", minimumLevel: 1 },
  ],
  "Transversal (todos os setores)": [
    { capabilityCode: "T05", minimumLevel: 1 },
    { capabilityCode: "T07", minimumLevel: 1 },
    { capabilityCode: "T09", minimumLevel: 1 },
    { capabilityCode: "T10", minimumLevel: 1 },
  ],
};

export function competencyRequirements(responsibility: SourceResponsibility): CompetencyRequirement[] {
  const requirements = new Map(responsibility.requiredCapabilities.map((requirement) => [requirement.capabilityCode, requirement]));
  for (const foundation of competencyFoundations[responsibility.sourceSector] ?? []) {
    const current = requirements.get(foundation.capabilityCode);
    if (!current || current.minimumLevel < foundation.minimumLevel) {
      requirements.set(foundation.capabilityCode, {
        capabilityCode: foundation.capabilityCode,
        minimumLevel: foundation.minimumLevel,
        minimumLevelLabel: capabilityLevelNames[foundation.minimumLevel],
        sourceRef: "Matriz de jornada por competências",
      });
    }
  }
  return [...requirements.values()];
}

function withCompetencyRequirements(responsibility: SourceResponsibility): SourceResponsibility {
  return { ...responsibility, requiredCapabilities: competencyRequirements(responsibility) };
}

export function responsibilityMode(responsibility: SourceResponsibility): CapabilityLevel {
  return Math.max(...responsibility.requiredCapabilities.map((requirement) => requirement.minimumLevel), 1) as CapabilityLevel;
}

export function responsibilityReadiness(
  responsibility: SourceResponsibility,
  certifiedLevels: Map<string, number>,
  claims: ResponsibilityClaim[] = [],
): ResponsibilityReadiness {
  const requirements = responsibility.requiredCapabilities;
  const pointsRequired = requirements.reduce((total, requirement) => total + requirement.minimumLevel, 0);
  const pointsEarned = requirements.reduce((total, requirement) => total + Math.min(certifiedLevels.get(requirement.capabilityCode) ?? 0, requirement.minimumLevel), 0);
  const unmet = requirements.filter((requirement) => (certifiedLevels.get(requirement.capabilityCode) ?? 0) < requirement.minimumLevel)
    .map((requirement) => ({ capabilityCode: requirement.capabilityCode, minimumLevel: requirement.minimumLevel as CapabilityLevel }));
  const claim = claims.find((entry) => entry.responsibility_source_id === responsibility.sourceId && entry.status !== "rejected" && entry.status !== "cancelled");
  const status = claim?.status === "approved" ? "concedida" : claim?.status === "requested" ? "solicitada" : !unmet.length ? "disponivel" : pointsEarned ? "em_preparo" : "bloqueada";
  return {
    responsibility,
    mode: responsibilityMode(responsibility),
    pointsEarned,
    pointsRequired,
    progress: pointsRequired ? Math.round(pointsEarned / pointsRequired * 1000) / 10 : 0,
    unmet,
    status,
    claim,
  };
}

export function competencyReadiness(
  responsibility: SourceResponsibility,
  certifiedLevels: Map<string, number>,
): CompetencyReadiness {
  const effectiveResponsibility = withCompetencyRequirements(responsibility);
  const requirements = effectiveResponsibility.requiredCapabilities;
  const pointsRequired = requirements.reduce((total, requirement) => total + requirement.minimumLevel, 0);
  const pointsEarned = requirements.reduce((total, requirement) => total + Math.min(certifiedLevels.get(requirement.capabilityCode) ?? 0, requirement.minimumLevel), 0);
  const unmet = requirements
    .filter((requirement) => (certifiedLevels.get(requirement.capabilityCode) ?? 0) < requirement.minimumLevel)
    .map((requirement) => ({ capabilityCode: requirement.capabilityCode, minimumLevel: requirement.minimumLevel as CapabilityLevel }));

  return {
    responsibility: effectiveResponsibility,
    mode: responsibilityMode(effectiveResponsibility),
    pointsEarned,
    pointsRequired,
    progress: pointsRequired ? Math.round(pointsEarned / pointsRequired * 1000) / 10 : 0,
    unmet,
    status: !unmet.length ? "consolidada" : pointsEarned ? "em_formacao" : "bloqueada",
  };
}

export function globalCapabilityMaturity(capabilityCodes: string[], certifiedLevels: Map<string, number>) {
  const pointsEarned = capabilityCodes.reduce((total, code) => total + Math.min(certifiedLevels.get(code) ?? 0, 3), 0);
  const pointsRequired = capabilityCodes.length * 3;
  return {
    pointsEarned,
    pointsRequired,
    progress: pointsRequired ? Math.round(pointsEarned / pointsRequired * 1000) / 10 : 0,
  };
}

export function readinessModeLabel(mode: CapabilityLevel) {
  return capabilityLevelNames[mode];
}
