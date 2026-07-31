import { describe, expect, it } from "vitest";
import {
  getChallengeRewardStars,
  getEffectiveChallengeStatus,
} from "@/lib/challenge";

describe("challenge domain rules", () => {
  it("converts every Super Estrela to ten base stars", () => {
    expect(getChallengeRewardStars({ rewardSuperstars: 3 })).toBe(30);
  });

  it("keeps the full reward per participant instead of splitting it", () => {
    const rewardPerParticipant = getChallengeRewardStars({
      rewardSuperstars: 2,
    });

    expect(rewardPerParticipant).toBe(20);
    expect(rewardPerParticipant * 3).toBe(60);
  });

  it("moves expired active challenges to awaiting validation without penalty", () => {
    expect(
      getEffectiveChallengeStatus(
        { status: "active", dueAt: "2026-07-01T00:00:00.000Z" },
        new Date("2026-07-02T00:00:00.000Z"),
      ),
    ).toBe("awaiting_validation");
  });
});
