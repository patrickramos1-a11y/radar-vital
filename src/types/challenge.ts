export type ChallengeStatus =
  | "draft"
  | "active"
  | "awaiting_validation"
  | "won"
  | "lost"
  | "cancelled";

export type ChallengeItemType = "task" | "priority" | "deliverable";

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  successCriteria: string;
  clientId: string | null;
  status: ChallengeStatus;
  dueAt: string;
  rewardSuperstars: number;
  penaltyStars: number;
  createdBy: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
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
  dueAt: string;
  rewardSuperstars: number;
  penaltyStars: number;
  participantIds: string[];
  items: Array<{ itemType: ChallengeItemType; itemId: string }>;
}

export const CHALLENGE_STATUS_CONFIG: Record<
  ChallengeStatus,
  { label: string; className: string }
> = {
  draft: { label: "Rascunho", className: "bg-slate-100 text-slate-700" },
  active: { label: "Em andamento", className: "bg-sky-100 text-sky-800" },
  awaiting_validation: {
    label: "Aguardando validação",
    className: "bg-amber-100 text-amber-800",
  },
  won: { label: "Concluído", className: "bg-emerald-100 text-emerald-800" },
  lost: { label: "Não concluído", className: "bg-red-100 text-red-800" },
  cancelled: { label: "Cancelado", className: "bg-slate-100 text-slate-600" },
};
