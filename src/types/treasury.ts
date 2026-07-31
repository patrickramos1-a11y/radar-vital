export type StarTransactionType =
  | "opening_grant"
  | "deliverable_reward"
  | "challenge_reward"
  | "challenge_penalty"
  | "manual_award"
  | "manual_penalty"
  | "adjustment"
  | "reversal"
  | "settlement";

export interface StarTransaction {
  id: string;
  collaboratorId: string;
  amount: number;
  transactionType: StarTransactionType;
  sourceType: string | null;
  sourceId: string | null;
  reason: string;
  reversesTransactionId: string | null;
  settlementId: string | null;
  createdAt: string;
}

export interface CollaboratorStarBalance {
  collaboratorId: string;
  name: string;
  color: string | null;
  photoUrl: string | null;
  balance: number;
  credits: number;
  debits: number;
}

export interface StarTreasurySummary {
  collectiveBalance: number;
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
}

export interface StarSettlement {
  id: string;
  periodStart: string | null;
  periodEnd: string | null;
  starToBrl: number | null;
  totalStars: number;
  totalBrl: number;
  notes: string | null;
  createdAt: string;
}

export interface TreasurySettlementInput {
  collaboratorIds: string[];
  periodStart?: string;
  periodEnd?: string;
  starToBrl?: number | null;
  notes?: string;
}

export const STAR_TRANSACTION_LABELS: Record<StarTransactionType, string> = {
  opening_grant: "Crédito inicial",
  deliverable_reward: "Avaliação de entregável",
  challenge_reward: "Desafio cumprido",
  challenge_penalty: "Penalidade de desafio",
  manual_award: "Concessão manual",
  manual_penalty: "Penalidade manual",
  adjustment: "Ajuste",
  reversal: "Estorno",
  settlement: "Liquidação",
};
