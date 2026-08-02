export type RewardProfileKind = "production" | "intern" | "provider" | "admin";
export type TreasuryMembershipStatus = "not_participant" | "requested" | "active" | "ended";
export type RewardDestination = "treasury" | "individual";
export type RewardDestinationPolicy = "treasury_required" | "choice_allowed" | "individual_only";
export type AcceptanceRequestStatus = "pending" | "approved" | "declined" | "cancelled";

export interface RewardProfile {
  collaboratorId: string;
  profileKind: RewardProfileKind;
  updatedAt: string;
}

export interface TreasuryMembership {
  id: string;
  collaboratorId: string;
  status: TreasuryMembershipStatus;
  requestedAt: string | null;
  requestedBy: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  decisionNote: string | null;
}

export interface StarValueRate {
  id: string;
  starValueBrl: number;
  effectiveFrom: string;
  effectiveUntil: string | null;
  note: string | null;
}

export interface OpportunityAcceptanceRequest {
  id: string;
  challengeId: string;
  collaboratorId: string;
  proposedDueAt: string;
  proposedRewardSuperstars: number | null;
  requestedDestination: RewardDestination;
  note: string | null;
  status: AcceptanceRequestStatus;
  requestedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  decisionNote: string | null;
}

export interface IndividualRewardTransaction {
  id: string;
  collaboratorId: string;
  challengeId: string | null;
  grossStars: number;
  frozenStarValueBrl: number;
  payoutFraction: number;
  amountBrl: number;
  transactionType: "credit" | "payment" | "reversal";
  paymentStatus: "payable" | "paid" | "reversed";
  reason: string;
  createdAt: string;
}

export interface OpportunityCatalogItem {
  id: string;
  title: string;
  description: string | null;
  successCriteria: string;
  expectedDeliverable: string | null;
  evidenceRequirements: string | null;
  kind: string;
  status: string;
  dueAt: string | null;
  rewardStars: number;
  rewardSuperstars: number;
  rewardStatus: string;
  rewardDestinationPolicy: RewardDestinationPolicy;
  originId: string | null;
  originName: string | null;
  originCategory: string | null;
  createdAt: string;
}

export interface IndividualRewardBalance {
  collaboratorId: string;
  collaboratorName: string;
  collaboratorColor: string | null;
  photoUrl: string | null;
  payableBrl: number;
  paidBrl: number;
  payableCount: number;
}

export interface TreasuryActiveBalance {
  collaboratorId: string;
  name: string;
  color: string | null;
  photoUrl: string | null;
  balance: number;
  credits: number;
  debits: number;
}
