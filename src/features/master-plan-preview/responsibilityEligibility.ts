import type { RequestRow, TeamCertificationRow } from "./journeyRemote";
import type { PreviewResponsibility } from "./model";

export type ResponsibilityRequirement = { capabilityCode: string; minimumLevel: number };

export function responsibilityRequirements(
  responsibility: PreviewResponsibility,
  sourceRequirements: ResponsibilityRequirement[] | undefined,
): ResponsibilityRequirement[] {
  if (sourceRequirements?.length) return sourceRequirements;
  return responsibility.capabilityIds.map((capabilityCode) => ({ capabilityCode, minimumLevel: 1 }));
}

export function approvedLevels(requests: RequestRow[], collaboratorId: string, teamCertifications: TeamCertificationRow[] = []): Map<string, number> {
  const levels = new Map<string, number>();
  for (const request of requests) {
    if (request.collaborator_id !== collaboratorId || request.status !== "approved") continue;
    levels.set(request.capability_code, Math.max(levels.get(request.capability_code) ?? 0, request.target_level));
  }
  for (const certification of Array.isArray(teamCertifications) ? teamCertifications : []) {
    if (certification.collaborator_id !== collaboratorId) continue;
    levels.set(certification.capability_code, Math.max(levels.get(certification.capability_code) ?? 0, certification.certified_level));
  }
  return levels;
}

export function unmetRequirements(requirements: ResponsibilityRequirement[], levels: Map<string, number>): ResponsibilityRequirement[] {
  return requirements.filter((requirement) => (levels.get(requirement.capabilityCode) ?? 0) < requirement.minimumLevel);
}
