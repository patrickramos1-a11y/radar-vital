import { describe, expect, it } from "vitest";
import { allowedRewardDestinations, calculateIndividualRewardBrl, rewardStarsFromChallenge } from "./opportunityProgram";

describe("opportunity reward rules", () => {
  it("converts a Super Star into ten base stars", () => {
    expect(rewardStarsFromChallenge(3, 2)).toBe(23);
  });

  it("pays production individual withdrawals at twenty-five percent", () => {
    expect(calculateIndividualRewardBrl(40, 1, "production")).toBe(10);
  });

  it("pays interns and providers in full", () => {
    expect(calculateIndividualRewardBrl(40, 1, "intern")).toBe(40);
    expect(calculateIndividualRewardBrl(40, 1, "provider")).toBe(40);
  });

  it("requires active Treasury membership for production choices", () => {
    expect(allowedRewardDestinations("production", false, "choice_allowed")).toEqual([]);
    expect(allowedRewardDestinations("production", true, "choice_allowed")).toEqual(["treasury", "individual"]);
    expect(allowedRewardDestinations("production", true, "treasury_required")).toEqual(["treasury"]);
  });
});
