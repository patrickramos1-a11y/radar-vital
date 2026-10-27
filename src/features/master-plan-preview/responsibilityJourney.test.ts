import { describe, expect, it } from "vitest";
import source from "../../../docs/roadmap/UNIVERSO_RAMOS_RESPONSABILIDADES_CURADAS.json";
import { competencyRequirements, globalCapabilityMaturity, responsibilityReadiness } from "./responsibilityJourney";

const sisramos = source.responsibilities.find((responsibility) => responsibility.sourceId === "resp-413535e8de506f6a")!;

describe("responsibility journey", () => {
  it("keeps a mixed-level responsibility blocked until every requirement is certified", () => {
    const readiness = responsibilityReadiness(sisramos, new Map([["T02", 3], ["T01", 2], ["T08", 1]]));

    expect(readiness.mode).toBe(3);
    expect(readiness.pointsEarned).toBe(6);
    expect(readiness.pointsRequired).toBe(7);
    expect(readiness.progress).toBeCloseTo(85.7);
    expect(readiness.status).toBe("em_preparo");
    expect(readiness.unmet).toEqual([{ capabilityCode: "T08", minimumLevel: 2 }]);
  });

  it("makes a responsibility available only after its complete capability matrix is met", () => {
    const readiness = responsibilityReadiness(sisramos, new Map([["T02", 3], ["T01", 2], ["T08", 2]]));

    expect(readiness.status).toBe("disponivel");
    expect(readiness.progress).toBe(100);
  });

  it("uses all capacity levels in the global maturity scale", () => {
    expect(globalCapabilityMaturity(["T01", "T02", "T08"], new Map([["T01", 1], ["T02", 2], ["T08", 3]]))).toEqual({ pointsEarned: 6, pointsRequired: 9, progress: 66.7 });
  });

  it("uses the workbook composition, including the new financial capacity", () => {
    const finance = source.responsibilities.find((responsibility) => responsibility.title === "Financeiro")!;
    expect(competencyRequirements(finance)).toEqual(expect.arrayContaining([
      expect.objectContaining({ capabilityCode: "F14", minimumLevel: 2 }),
      expect.objectContaining({ capabilityCode: "T04", minimumLevel: 2 }),
      expect.objectContaining({ capabilityCode: "T09", minimumLevel: 1 }),
    ]));
    expect(competencyRequirements(finance)).toHaveLength(8);
  });
});
