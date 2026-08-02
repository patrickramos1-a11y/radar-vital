import type { RewardDestination, RewardDestinationPolicy, RewardProfileKind } from "@/types/opportunity";

export const STAR_VALUE_BRL = 1;
export const SUPERSTAR_BASE_STARS = 10;

export function rewardStarsFromChallenge(rewardStars: number, rewardSuperstars: number) {
  return Math.max(0, rewardStars) + Math.max(0, rewardSuperstars) * SUPERSTAR_BASE_STARS;
}

export function calculateIndividualRewardBrl(
  grossStars: number,
  rateBrl: number,
  profileKind: RewardProfileKind,
) {
  const fraction = profileKind === "production" ? 0.25 : 1;
  return Number((Math.max(0, grossStars) * rateBrl * fraction).toFixed(2));
}

export function allowedRewardDestinations(
  profileKind: RewardProfileKind,
  treasuryMembershipActive: boolean,
  policy: RewardDestinationPolicy,
): RewardDestination[] {
  if (profileKind === "admin") return [];
  if (profileKind === "intern" || profileKind === "provider") return ["individual"];
  if (!treasuryMembershipActive) return [];
  if (policy === "treasury_required") return ["treasury"];
  if (policy === "individual_only") return ["individual"];
  return ["treasury", "individual"];
}

export function currencyBrl(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
