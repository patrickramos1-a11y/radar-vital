import { describe, expect, it } from "vitest";
import source from "../../../docs/roadmap/UNIVERSO_RAMOS_RESPONSABILIDADES_CURADAS.json";
import { capabilitiesForCareerStep, capabilityPoints, careerStepReadiness, newPacRequirementsForCareerStep, nucleoTecnicoCareerLadder, pacForCareerStep, responsibilitiesForCareerStep, technicalResponsibilities } from "./careerLadder";
import type { Library } from "./journeyRemote";
import type { ResponsibilityClaim } from "./responsibilityJourney";

const library: Library = { capabilities: source.capabilities, responsibilities: source.responsibilities, sourceSha256: source.source.sha256 };

describe("Núcleo Técnico career ladder", () => {
  it("has the nine corporate milestones with the agreed capability and responsibility targets", () => {
    expect(nucleoTecnicoCareerLadder.steps.map((step) => step.title)).toEqual([
      "Operador Júnior",
      "Operador Pleno",
      "Operador Master",
      "Gestão Júnior",
      "Gestão Pleno",
      "Gestão Master",
      "Estratégico Júnior",
      "Estratégico Pleno",
      "Estratégico Master",
    ]);
    expect(nucleoTecnicoCareerLadder.steps.map((step) => step.capabilityTarget)).toEqual([26, 42, 55, 63, 72, 80, 84, 84, 84]);
    expect(nucleoTecnicoCareerLadder.steps.map((step) => step.responsibilityTarget)).toEqual([3, 8, 16, 26, 34, 44, 52, 52, 52]);
  });

  it("keeps the standard PAC on the approved point targets and closes Estratégico Júnior at Multiplicador", () => {
    expect(nucleoTecnicoCareerLadder.steps.map((step) => capabilityPoints(pacForCareerStep(library, nucleoTecnicoCareerLadder, step.id)))).toEqual([26, 42, 55, 63, 72, 80, 84, 84, 84]);
    const pac = pacForCareerStep(library, nucleoTecnicoCareerLadder, "estrategico_junior");
    expect(pac).toHaveLength(28);
    expect(pac.every((requirement) => requirement.minimumLevel === 3)).toBe(true);
  });

  it("uses the 52 responsibilities inside the Núcleo Técnico and leaves external sectors outside this ladder", () => {
    expect(technicalResponsibilities(library)).toHaveLength(52);
    expect(technicalResponsibilities(library).every((responsibility) => responsibility.sourceSector !== "Fora do Núcleo Técnico")).toBe(true);
  });

  it("opens all Operador Júnior responsibility paths that do not require Multiplicador", () => {
    const capabilities = capabilitiesForCareerStep(library, nucleoTecnicoCareerLadder, "operador_junior");
    expect(capabilities.every((requirement) => requirement.minimumLevel < 3)).toBe(true);
    expect(responsibilitiesForCareerStep(library, nucleoTecnicoCareerLadder, "operador_junior")).toHaveLength(41);
    expect(responsibilitiesForCareerStep(library, nucleoTecnicoCareerLadder, "operador_junior").every((responsibility) => responsibility.requiredCapabilities.every((requirement) => requirement.minimumLevel < 3))).toBe(true);
  });

  it("automatically recognizes the three competencies needed by Operador Júnior", () => {
    const pac = pacForCareerStep(library, nucleoTecnicoCareerLadder, "operador_junior");
    const levels = new Map(pac.map((requirement) => [requirement.capabilityCode, requirement.minimumLevel]));
    const pending = careerStepReadiness(library, nucleoTecnicoCareerLadder, "operador_junior", levels, [], "gabi");
    expect(pending.completedCapabilityPoints).toBe(26);
    expect(pending.capabilityPoints).toBe(26);
    expect(pending.competencyTarget).toBe(3);
    expect(pending.competencyCandidates).toHaveLength(3);
    expect(pending.earnedCompetencies).toBeGreaterThanOrEqual(3);
    expect(pending.eligible).toBe(true);
  });

  it("derives different responsibility paths from different certified capabilities with the same point total", () => {
    const standardPac = pacForCareerStep(library, nucleoTecnicoCareerLadder, "operador_junior");
    const standardLevels = new Map(standardPac.map((requirement) => [requirement.capabilityCode, requirement.minimumLevel]));
    const alternativeLevels = new Map(standardLevels);
    alternativeLevels.set("F05", 1);
    alternativeLevels.set("E04", 1);
    const standard = careerStepReadiness(library, nucleoTecnicoCareerLadder, "operador_junior", standardLevels, [], "celine");
    const alternative = careerStepReadiness(library, nucleoTecnicoCareerLadder, "operador_junior", alternativeLevels, [], "gabi");
    expect([...alternativeLevels.values()].reduce((sum, level) => sum + level, 0)).toBe(26);
    expect(standard.competencyCandidates.map((item) => item.responsibility.sourceId)).not.toEqual(alternative.competencyCandidates.map((item) => item.responsibility.sourceId));
  });

  it("does not depend on a manual claim to advance the career milestone", () => {
    const juniorPac = pacForCareerStep(library, nucleoTecnicoCareerLadder, "operador_junior");
    const juniorLevels = new Map(juniorPac.map((requirement) => [requirement.capabilityCode, requirement.minimumLevel]));
    const withoutClaims = careerStepReadiness(library, nucleoTecnicoCareerLadder, "operador_junior", juniorLevels, [], "gabi");
    const historicalClaim: ResponsibilityClaim = { id: "legacy", collaborator_id: "gabi", responsibility_source_id: "legacy", status: "approved", requested_at: "2026-10-26T00:00:00.000Z", decided_at: "2026-10-26T00:00:00.000Z", decided_by: "admin", decision_note: "Histórico" };
    const withHistoricalClaim = careerStepReadiness(library, nucleoTecnicoCareerLadder, "operador_junior", juniorLevels, [historicalClaim], "gabi");
    expect(withoutClaims.eligible).toBe(true);
    expect(withHistoricalClaim.earnedCompetencies).toBe(withoutClaims.earnedCompetencies);
  });

  it("separates the new recommendations from the accumulated PAC", () => {
    const juniorPac = pacForCareerStep(library, nucleoTecnicoCareerLadder, "operador_junior");
    expect(newPacRequirementsForCareerStep(library, nucleoTecnicoCareerLadder, "operador_junior")).toEqual(juniorPac);
    const additions = newPacRequirementsForCareerStep(library, nucleoTecnicoCareerLadder, "operador_pleno");
    const prior = new Map(juniorPac.map((requirement) => [requirement.capabilityCode, requirement.minimumLevel]));
    expect(additions).not.toHaveLength(0);
    expect(additions.every((requirement) => requirement.minimumLevel > (prior.get(requirement.capabilityCode) ?? 0))).toBe(true);
    expect(additions).toContainEqual({ capabilityCode: "E01", minimumLevel: 1 });
  });
});
