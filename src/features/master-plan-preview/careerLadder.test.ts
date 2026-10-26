import { describe, expect, it } from "vitest";
import source from "../../../docs/roadmap/UNIVERSO_RAMOS_RESPONSABILIDADES_CURADAS.json";
import { capabilityPoints, careerStepReadiness, newPacRequirementsForCareerStep, nucleoTecnicoCareerLadder, pacForCareerStep } from "./careerLadder";
import type { Library } from "./journeyRemote";

const library: Library = { capabilities: source.capabilities, responsibilities: source.responsibilities, sourceSha256: source.source.sha256 };

describe("Núcleo Técnico career ladder", () => {
  it("has the seven corporate promotion milestones with the approved point targets", () => {
    expect(nucleoTecnicoCareerLadder.steps.map((step) => step.title)).toEqual([
      "Operador Júnior",
      "Operador Pleno",
      "Operador Master",
      "Gestão Júnior",
      "Gestão Pleno",
      "Gestão Master",
      "Estratégico Júnior",
    ]);
    expect(nucleoTecnicoCareerLadder.steps.map((step) => capabilityPoints(pacForCareerStep(library, nucleoTecnicoCareerLadder, step.id)))).toEqual([26, 42, 55, 63, 72, 80, 84]);
  });

  it("closes Estratégico Júnior with every Núcleo Técnico capability at Multiplicador", () => {
    const pac = pacForCareerStep(library, nucleoTecnicoCareerLadder, "estrategico_junior");
    expect(pac).toHaveLength(28);
    expect(pac.every((requirement) => requirement.minimumLevel === 3)).toBe(true);
    expect(capabilityPoints(pac)).toBe(84);
  });

  it("covers every technical and transversal responsibility once, without grouping the promotion by sector", () => {
    const technicalIds = source.responsibilities.filter((responsibility) => responsibility.sourceSector !== "Fora do Núcleo Técnico").map((responsibility) => responsibility.sourceId).sort();
    const assignedIds = nucleoTecnicoCareerLadder.steps.flatMap((step) => step.responsibilityIds).sort();
    expect(assignedIds).toEqual(technicalIds);
  });

  it("only assigns a responsibility after its technical requirements are present in the milestone PAC", () => {
    nucleoTecnicoCareerLadder.steps.forEach((step) => {
      const levels = new Map(step.capabilityRequirements.map((requirement) => [requirement.capabilityCode, requirement.minimumLevel]));
      const responsibilities = library.responsibilities.filter((responsibility) => step.responsibilityIds.includes(responsibility.sourceId));
      responsibilities.forEach((responsibility) => responsibility.requiredCapabilities.forEach((requirement) => {
        expect(levels.get(requirement.capabilityCode)).toBeGreaterThanOrEqual(requirement.minimumLevel);
      }));
    });
  });

  it("requires both the full PAC and all cumulative responsibility grants for a promotion", () => {
    const pac = pacForCareerStep(library, nucleoTecnicoCareerLadder, "operador_junior");
    const allLevels = new Map(pac.map((requirement) => [requirement.capabilityCode, requirement.minimumLevel]));
    const pending = careerStepReadiness(library, nucleoTecnicoCareerLadder, "operador_junior", allLevels, [], "gabi");
    expect(pending.completedCapabilityPoints).toBe(26);
    expect(pending.capabilityPoints).toBe(26);
    expect(pending.eligible).toBe(false);
    const claims = pending.responsibilities.map((responsibility) => ({ id: `claim-${responsibility.sourceId}`, collaborator_id: "gabi", responsibility_source_id: responsibility.sourceId, status: "approved" as const, requested_at: "2026-10-26T00:00:00.000Z", decided_at: "2026-10-26T00:00:00.000Z", decided_by: "admin", decision_note: "Concedida" }));
    expect(careerStepReadiness(library, nucleoTecnicoCareerLadder, "operador_junior", allLevels, claims, "gabi").eligible).toBe(true);
  });

  it("separates each role's new capability requirements from the accumulated PAC", () => {
    const juniorPac = pacForCareerStep(library, nucleoTecnicoCareerLadder, "operador_junior");
    expect(newPacRequirementsForCareerStep(library, nucleoTecnicoCareerLadder, "operador_junior")).toEqual(juniorPac);
    const additions = newPacRequirementsForCareerStep(library, nucleoTecnicoCareerLadder, "operador_pleno");
    const prior = new Map(juniorPac.map((requirement) => [requirement.capabilityCode, requirement.minimumLevel]));
    expect(additions).not.toHaveLength(0);
    expect(additions.every((requirement) => requirement.minimumLevel > (prior.get(requirement.capabilityCode) ?? 0))).toBe(true);
    expect(additions).toContainEqual({ capabilityCode: "T04", minimumLevel: 2 });
  });
});
