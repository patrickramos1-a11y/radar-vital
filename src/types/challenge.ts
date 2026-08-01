export type ChallengeStatus =
  | "draft"
  | "open"
  | "accepted"
  | "in_progress"
  | "active"
  | "awaiting_validation"
  | "won"
  | "lost"
  | "cancelled";

export type ChallengeItemType = "task" | "priority" | "deliverable";
export type ChallengeKind = "sector" | "project" | "company" | "individual_goal" | "company_general";
export type ChallengeRewardStatus = "unpriced" | "requested" | "configured" | "non_rewarded";
export type ChallengeValueRequestStatus = "pending" | "reviewed" | "declined";

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  successCriteria: string;
  kind: ChallengeKind;
  expectedDeliverable: string | null;
  evidenceRequirements: string | null;
  clientId: string | null;
  status: ChallengeStatus;
  dueAt: string | null;
  rewardStars: number;
  rewardSuperstars: number;
  rewardStatus: ChallengeRewardStatus;
  rewardConfiguredAt: string | null;
  rewardConfiguredBy: string | null;
  penaltyStars: number;
  createdBy: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeValueRequest {
  id: string;
  challengeId: string;
  collaboratorId: string;
  justification: string;
  status: ChallengeValueRequestStatus;
  adminNote: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface ChallengeRewardConfig {
  rewardStars: number;
  rewardSuperstars: number;
  penaltyStars: number;
  rewardStatus: Extract<ChallengeRewardStatus, "configured" | "non_rewarded">;
  note?: string;
}

export interface ChallengeEditData {
  title: string;
  description?: string;
  successCriteria: string;
  expectedDeliverable?: string;
  evidenceRequirements?: string;
  clientId?: string | null;
  kind?: ChallengeKind;
  dueAt?: string | null;
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  collaboratorId: string;
  createdAt: string;
}

export interface ChallengeItem {
  id: string;
  challengeId: string;
  itemType: ChallengeItemType;
  itemId: string;
  createdAt: string;
}

export interface ChallengeFormData {
  title: string;
  description?: string;
  successCriteria: string;
  clientId?: string | null;
  dueAt?: string | null;
  kind?: ChallengeKind;
  expectedDeliverable?: string;
  evidenceRequirements?: string;
  rewardSuperstars: number;
  rewardStars?: number;
  penaltyStars: number;
  participantIds: string[];
  items: Array<{ itemType: ChallengeItemType; itemId: string }>;
}

export const CHALLENGE_STATUS_CONFIG: Record<
  ChallengeStatus,
  { label: string; className: string }
> = {
  draft: { label: "Rascunho", className: "bg-slate-100 text-slate-700" },
  open: { label: "Aberto", className: "bg-violet-100 text-violet-800" },
  accepted: { label: "Aceito", className: "bg-sky-100 text-sky-800" },
  in_progress: { label: "Em execução", className: "bg-sky-100 text-sky-800" },
  active: { label: "Em andamento", className: "bg-sky-100 text-sky-800" },
  awaiting_validation: {
    label: "Aguardando validação",
    className: "bg-amber-100 text-amber-800",
  },
  won: { label: "Concluído", className: "bg-emerald-100 text-emerald-800" },
  lost: { label: "Não concluído", className: "bg-red-100 text-red-800" },
  cancelled: { label: "Cancelado", className: "bg-slate-100 text-slate-600" },
};
