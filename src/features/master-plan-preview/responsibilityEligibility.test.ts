import { describe, expect, it } from "vitest";
import { approvedLevels, responsibilityRequirements, unmetRequirements } from "./responsibilityEligibility";

describe("responsibility eligibility", () => {
  it("requires only approved certifications at the configured minimum level", () => {
    const requirements = responsibilityRequirements({ id: "resp-1", title: "Responsabilidade", sectorId: "setor", capabilityIds: ["T01", "T02"], sourceChallengeIds: [], holderId: null, substituteId: null, status: "local" }, [
      { capabilityCode: "T01", minimumLevel: 2 }, { capabilityCode: "T02", minimumLevel: 1 },
    ]);
    const levels = approvedLevels([
      { collaborator_id: "gabi", capability_code: "T01", target_level: 2, status: "approved" },
      { collaborator_id: "gabi", capability_code: "T02", target_level: 3, status: "submitted" },
    ] as never, "gabi");
    expect(unmetRequirements(requirements, levels)).toEqual([{ capabilityCode: "T02", minimumLevel: 1 }]);
  });

  it("uses level one for a locally linked capability without source metadata", () => {
    const requirements = responsibilityRequirements({ id: "resp-2", title: "Responsabilidade", sectorId: "setor", capabilityIds: ["T04"], sourceChallengeIds: [], holderId: null, substituteId: null, status: "local" }, undefined);
    expect(requirements).toEqual([{ capabilityCode: "T04", minimumLevel: 1 }]);
  });

  it("never lets a lower direct certification reduce an approved level", () => {
    const levels = approvedLevels([{ collaborator_id: "gabi", capability_code: "T01", target_level: 3, status: "approved" }] as never, "gabi", [
      { collaborator_id: "gabi", capability_code: "T01", certified_level: 1 },
    ] as never);
    expect(levels.get("T01")).toBe(3);
  });
});
