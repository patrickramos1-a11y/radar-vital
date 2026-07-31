import type {
  CollaboratorStarBalance,
  StarSettlement,
  StarTransaction,
  StarTransactionType,
  StarTreasurySummary,
} from "@/types/treasury";
import type { Database } from "@/integrations/supabase/types";

type TransactionRow = Database["public"]["Tables"]["star_transactions"]["Row"];
type BalanceRow = Database["public"]["Views"]["collaborator_star_balances"]["Row"];
type SummaryRow = Database["public"]["Views"]["star_treasury_summary"]["Row"];
type SettlementRow = Database["public"]["Tables"]["star_settlements"]["Row"];

const numberValue = (value: number | string | null | undefined) => Number(value ?? 0);

export function mapStarTransaction(row: TransactionRow): StarTransaction {
  return {
    id: row.id,
    collaboratorId: row.collaborator_id,
    amount: numberValue(row.amount),
    transactionType: row.transaction_type as StarTransactionType,
    sourceType: row.source_type,
    sourceId: row.source_id,
    reason: row.reason,
    reversesTransactionId: row.reverses_transaction_id,
    settlementId: row.settlement_id,
    createdAt: row.created_at,
  };
}

export function mapCollaboratorStarBalance(row: BalanceRow): CollaboratorStarBalance {
  return {
    collaboratorId: row.collaborator_id ?? "",
    name: row.collaborator_name ?? "Colaborador removido",
    color: row.collaborator_color,
    photoUrl: row.photo_url,
    balance: numberValue(row.balance),
    credits: numberValue(row.credits),
    debits: numberValue(row.debits),
  };
}

export function mapStarTreasurySummary(row: SummaryRow | null): StarTreasurySummary {
  return {
    collectiveBalance: numberValue(row?.collective_balance),
    totalCredits: numberValue(row?.total_credits),
    totalDebits: numberValue(row?.total_debits),
    transactionCount: numberValue(row?.transaction_count),
  };
}

export function mapStarSettlement(row: SettlementRow): StarSettlement {
  return {
    id: row.id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    starToBrl: row.star_to_brl === null ? null : numberValue(row.star_to_brl),
    totalStars: numberValue(row.total_stars),
    totalBrl: numberValue(row.total_brl),
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function calculateSettlementPreview(
  balances: CollaboratorStarBalance[],
  collaboratorIds: string[],
  starToBrl: number | null,
) {
  const selected = balances.filter((balance) => collaboratorIds.includes(balance.collaboratorId));
  const totalStars = selected.reduce((sum, balance) => sum + balance.balance, 0);
  const payableStars = selected.reduce((sum, balance) => sum + Math.max(0, balance.balance), 0);
  return {
    totalStars,
    payableStars,
    estimatedBrl: starToBrl === null ? null : payableStars * starToBrl,
  };
}
