import { describe, expect, it } from "vitest";
import { calculateSettlementPreview } from "@/lib/treasury";

describe("calculateSettlementPreview", () => {
  const balances = [
    { collaboratorId: "a", name: "A", color: null, photoUrl: null, balance: 25, credits: 25, debits: 0 },
    { collaboratorId: "b", name: "B", color: null, photoUrl: null, balance: -8, credits: 0, debits: -8 },
  ];

  it("keeps negative balances in the collective total", () => {
    expect(calculateSettlementPreview(balances, ["a", "b"], 2)).toEqual({
      totalStars: 17,
      payableStars: 25,
      estimatedBrl: 50,
    });
  });

  it("does not invent a currency conversion before a rate is chosen", () => {
    expect(calculateSettlementPreview(balances, ["a", "b"], null).estimatedBrl).toBeNull();
  });
});
