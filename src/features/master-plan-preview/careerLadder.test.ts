import { describe, expect, it } from "vitest";
import source from "../../../docs/roadmap/UNIVERSO_RAMOS_RESPONSABILIDADES_CURADAS.json";
import { careerStepReadiness, pacForCareerStep, processosEOrgaosLadder } from "./careerLadder";
import type { Library } from "./journeyRemote";

const library: Library = { capabilities: source.capabilities, responsibilities: source.responsibilities, sourceSha256: source.source.sha256 };

describe("Processos e Órgãos career ladder", () => {
  it("builds each PAC cumulatively from the real responsibility requirements", () => {
    const juniorPac = pacForCareerStep(library, processosEOrgaosLadder, "operador_junior");
    const plenoPac = pacForCareerStep(library, processosEOrgaosLadder, "operador_pleno");
    const masterPac = pacForCareerStep(library, processosEOrgaosLadder, "operador_master");
    expect(juniorPac).toEqual(expect.arrayContaining([{ capabilityCode: "F03", minimumLevel: 2 }, { capabilityCode: "T01", minimumLevel: 2 }]));
    expect(plenoPac).toEqual(expect.arrayContaining([{ capabilityCode: "T08", minimumLevel: 2 }, { capabilityCode: "F04", minimumLevel: 2 }]));
    expect(masterPac).toEqual(expect.arrayContaining([{ capabilityCode: "F02", minimumLevel: 3 }, { capabilityCode: "E02", minimumLevel: 2 }, { capabilityCode: "E04", minimumLevel: 2 }]));
    expect(masterPac.length).toBeGreaterThan(plenoPac.length);
    expect(plenoPac.length).toBeGreaterThan(juniorPac.length);
  });

  it("requires both the full PAC and all cumulative responsibility grants", () => {
    const allLevels = new Map(pacForCareerStep(library, processosEOrgaosLadder, "operador_junior").map((requirement) => [requirement.capabilityCode, requirement.minimumLevel]));
    const pending = careerStepReadiness(library, processosEOrgaosLadder, "operador_junior", allLevels, [], "gabi");
    expect(pending.capabilityPercent).toBe(100);
    expect(pending.responsibilityPercent).toBe(0);
    expect(pending.eligible).toBe(false);
    const claims = pending.responsibilities.map((responsibility) => ({ id: `claim-${responsibility.sourceId}`, collaborator_id: "gabi", responsibility_source_id: responsibility.sourceId, status: "approved" as const, requested_at: "2026-10-26T00:00:00.000Z", decided_at: "2026-10-26T00:00:00.000Z", decided_by: "admin", decision_note: "Concedida" }));
    expect(careerStepReadiness(library, processosEOrgaosLadder, "operador_junior", allLevels, claims, "gabi").eligible).toBe(true);
  });
});
