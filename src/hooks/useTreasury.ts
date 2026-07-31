import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  mapCollaboratorStarBalance,
  mapStarSettlement,
  mapStarTransaction,
  mapStarTreasurySummary,
} from "@/lib/treasury";
import type {
  CollaboratorStarBalance,
  StarSettlement,
  StarTransaction,
  StarTreasurySummary,
  TreasurySettlementInput,
} from "@/types/treasury";

const emptySummary: StarTreasurySummary = {
  collectiveBalance: 0,
  totalCredits: 0,
  totalDebits: 0,
  transactionCount: 0,
};

export function useTreasury() {
  const [balances, setBalances] = useState<CollaboratorStarBalance[]>([]);
  const [transactions, setTransactions] = useState<StarTransaction[]>([]);
  const [settlements, setSettlements] = useState<StarSettlement[]>([]);
  const [summary, setSummary] = useState<StarTreasurySummary>(emptySummary);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [balancesResult, transactionsResult, settlementsResult, summaryResult] =
        await Promise.all([
          supabase.from("collaborator_star_balances").select("*").order("balance", { ascending: false }),
          supabase.from("star_transactions").select("*").order("created_at", { ascending: false }),
          supabase.from("star_settlements").select("*").order("created_at", { ascending: false }),
          supabase.from("star_treasury_summary").select("*").maybeSingle(),
        ]);

      if (balancesResult.error) throw balancesResult.error;
      if (transactionsResult.error) throw transactionsResult.error;
      if (settlementsResult.error) throw settlementsResult.error;
      if (summaryResult.error) throw summaryResult.error;

      setBalances((balancesResult.data ?? []).map(mapCollaboratorStarBalance));
      setTransactions((transactionsResult.data ?? []).map(mapStarTransaction));
      setSettlements((settlementsResult.data ?? []).map(mapStarSettlement));
      setSummary(mapStarTreasurySummary(summaryResult.data));
    } catch (caught) {
      console.error("Error fetching Treasury data:", caught);
      setError("Não foi possível carregar o Tesouro de Estrelas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
    const channel = supabase
      .channel("star_treasury_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "star_transactions" },
        () => void refetch(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "star_settlements" },
        () => void refetch(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refetch]);

  const grantManual = useCallback(
    async (input: {
      collaboratorId: string;
      amount: number;
      reason: string;
      isPenalty: boolean;
    }) => {
      const { error: grantError } = await supabase.rpc("grant_manual_stars", {
        p_collaborator_id: input.collaboratorId,
        p_amount: input.amount,
        p_reason: input.reason,
        p_is_penalty: input.isPenalty,
        p_request_id: crypto.randomUUID(),
      });
      if (grantError) {
        console.error("Error granting stars:", grantError);
        toast.error("Não foi possível registrar a movimentação.");
        return false;
      }
      await refetch();
      toast.success(input.isPenalty ? "Penalidade registrada." : "Estrelas adicionadas.");
      return true;
    },
    [refetch],
  );

  const grantOpening = useCallback(
    async (collaboratorIds: string[], amount: number, reason: string) => {
      const { error: grantError } = await supabase.rpc("grant_opening_stars", {
        p_collaborator_ids: collaboratorIds,
        p_amount: amount,
        p_reason: reason,
        p_batch_id: crypto.randomUUID(),
      });
      if (grantError) {
        console.error("Error granting opening stars:", grantError);
        toast.error("Não foi possível registrar o crédito inicial.");
        return false;
      }
      await refetch();
      toast.success("Crédito inicial registrado.");
      return true;
    },
    [refetch],
  );

  const settle = useCallback(
    async (input: TreasurySettlementInput) => {
      const { error: settlementError } = await supabase.rpc("settle_star_balances", {
        p_collaborator_ids: input.collaboratorIds,
        p_period_start: input.periodStart || null,
        p_period_end: input.periodEnd || null,
        p_star_to_brl: input.starToBrl ?? null,
        p_notes: input.notes || null,
      });
      if (settlementError) {
        console.error("Error settling stars:", settlementError);
        toast.error("Não foi possível liquidar os saldos selecionados.");
        return false;
      }
      await refetch();
      toast.success("Liquidação registrada sem apagar o histórico.");
      return true;
    },
    [refetch],
  );

  const reverse = useCallback(
    async (transactionId: string, reason: string) => {
      const { error: reverseError } = await supabase.rpc("reverse_star_transaction", {
        p_transaction_id: transactionId,
        p_reason: reason,
      });
      if (reverseError) {
        console.error("Error reversing transaction:", reverseError);
        toast.error("Não foi possível estornar a movimentação.");
        return false;
      }
      await refetch();
      toast.success("Estorno registrado no extrato.");
      return true;
    },
    [refetch],
  );

  const backfillSources = useCallback(async () => {
    const { error: backfillError } = await supabase.rpc("backfill_star_sources");
    if (backfillError) {
      console.error("Error backfilling Treasury sources:", backfillError);
      toast.error("Não foi possível sincronizar o histórico.");
      return false;
    }
    await refetch();
    toast.success("Histórico de avaliações e desafios sincronizado.");
    return true;
  }, [refetch]);

  return {
    balances,
    transactions,
    settlements,
    summary,
    isLoading,
    error,
    refetch,
    grantManual,
    grantOpening,
    settle,
    reverse,
    backfillSources,
  };
}
