import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { actorName } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import type {
  IndividualRewardBalance,
  IndividualRewardTransaction,
  OpportunityAcceptanceRequest,
  OpportunityCatalogItem,
  RewardProfile,
  StarValueRate,
  TreasuryMembership,
  TreasuryActiveBalance,
} from "@/types/opportunity";

// The database types are regenerated when OP-0 is applied. Keeping the
// boundary here prevents a schema rollout from breaking the current app.
const database = supabase as unknown as {
  from: (relation: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};

const text = (value: unknown) => (value == null ? null : String(value));
const number = (value: unknown) => Number(value ?? 0);

const mapProfile = (row: Record<string, unknown>): RewardProfile => ({
  collaboratorId: String(row.collaborator_id),
  profileKind: row.profile_kind as RewardProfile["profileKind"],
  updatedAt: String(row.updated_at),
});
const mapMembership = (row: Record<string, unknown>): TreasuryMembership => ({
  id: String(row.id), collaboratorId: String(row.collaborator_id), status: row.status as TreasuryMembership["status"],
  requestedAt: text(row.requested_at), requestedBy: text(row.requested_by), decidedAt: text(row.decided_at),
  decidedBy: text(row.decided_by), decisionNote: text(row.decision_note),
});
const mapRate = (row: Record<string, unknown>): StarValueRate => ({
  id: String(row.id), starValueBrl: number(row.star_value_brl), effectiveFrom: String(row.effective_from),
  effectiveUntil: text(row.effective_until), note: text(row.note),
});
const mapRequest = (row: Record<string, unknown>): OpportunityAcceptanceRequest => ({
  id: String(row.id), challengeId: String(row.challenge_id), collaboratorId: String(row.collaborator_id),
  proposedDueAt: String(row.proposed_due_at), proposedRewardSuperstars: row.proposed_reward_superstars == null ? null : number(row.proposed_reward_superstars),
  requestedDestination: row.requested_destination as OpportunityAcceptanceRequest["requestedDestination"],
  note: text(row.note), status: row.status as OpportunityAcceptanceRequest["status"], requestedAt: String(row.requested_at),
  decidedAt: text(row.decided_at), decidedBy: text(row.decided_by), decisionNote: text(row.decision_note),
});
const mapCatalog = (row: Record<string, unknown>): OpportunityCatalogItem => ({
  id: String(row.id), title: String(row.title), description: text(row.description), successCriteria: String(row.success_criteria ?? ""),
  expectedDeliverable: text(row.expected_deliverable), evidenceRequirements: text(row.evidence_requirements), kind: String(row.kind),
  status: String(row.status), dueAt: text(row.due_at), rewardStars: number(row.reward_stars), rewardSuperstars: number(row.reward_superstars),
  rewardStatus: String(row.reward_status), rewardDestinationPolicy: row.reward_destination_policy as OpportunityCatalogItem["rewardDestinationPolicy"],
  originId: text(row.origin_id), originName: text(row.origin_name), originCategory: text(row.origin_category), createdAt: String(row.created_at),
});
const mapIndividualTransaction = (row: Record<string, unknown>): IndividualRewardTransaction => ({
  id: String(row.id), collaboratorId: String(row.collaborator_id), challengeId: text(row.challenge_id), grossStars: number(row.gross_stars),
  frozenStarValueBrl: number(row.frozen_star_value_brl), payoutFraction: number(row.payout_fraction), amountBrl: number(row.amount_brl),
  transactionType: row.transaction_type as IndividualRewardTransaction["transactionType"], paymentStatus: row.payment_status as IndividualRewardTransaction["paymentStatus"],
  reason: String(row.reason), createdAt: String(row.created_at),
});
const mapIndividualBalance = (row: Record<string, unknown>): IndividualRewardBalance => ({
  collaboratorId: String(row.collaborator_id), collaboratorName: String(row.collaborator_name), collaboratorColor: text(row.collaborator_color),
  photoUrl: text(row.photo_url), payableBrl: number(row.payable_brl), paidBrl: number(row.paid_brl), payableCount: number(row.payable_count),
});
const mapTreasuryBalance = (row: Record<string, unknown>): TreasuryActiveBalance => ({
  collaboratorId: String(row.collaborator_id), name: String(row.collaborator_name), color: text(row.collaborator_color),
  photoUrl: text(row.photo_url), balance: number(row.balance), credits: number(row.credits), debits: number(row.debits),
});

export function useOpportunityProgram() {
  const { currentUser } = useAuth();
  const currentUserName = actorName(currentUser);
  const [profiles, setProfiles] = useState<RewardProfile[]>([]);
  const [memberships, setMemberships] = useState<TreasuryMembership[]>([]);
  const [rates, setRates] = useState<StarValueRate[]>([]);
  const [acceptanceRequests, setAcceptanceRequests] = useState<OpportunityAcceptanceRequest[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityCatalogItem[]>([]);
  const [individualTransactions, setIndividualTransactions] = useState<IndividualRewardTransaction[]>([]);
  const [individualBalances, setIndividualBalances] = useState<IndividualRewardBalance[]>([]);
  const [treasuryBalances, setTreasuryBalances] = useState<TreasuryActiveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaReady, setSchemaReady] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    const results = await Promise.all([
      database.from("collaborator_reward_profiles").select("*"),
      database.from("treasury_memberships").select("*"),
      database.from("star_value_rates").select("*").order("effective_from", { ascending: false }),
      database.from("challenge_acceptance_requests").select("*").order("requested_at", { ascending: false }),
      database.from("opportunity_catalog").select("*").order("created_at", { ascending: false }),
      database.from("individual_reward_transactions").select("*").order("created_at", { ascending: false }),
      database.from("individual_reward_balances").select("*").order("payable_brl", { ascending: false }),
      database.from("treasury_active_balances").select("*").order("balance", { ascending: false }),
    ]);
    const failed = results.find((result) => result.error);
    if (failed?.error) {
      const message = failed.error.message;
      setSchemaReady(!/does not exist|schema cache|relation/i.test(message));
      setError(message);
      setLoading(false);
      return;
    }
    setSchemaReady(true);
    setProfiles((results[0].data ?? []).map(mapProfile));
    setMemberships((results[1].data ?? []).map(mapMembership));
    setRates((results[2].data ?? []).map(mapRate));
    setAcceptanceRequests((results[3].data ?? []).map(mapRequest));
    setOpportunities((results[4].data ?? []).map(mapCatalog));
    setIndividualTransactions((results[5].data ?? []).map(mapIndividualTransaction));
    setIndividualBalances((results[6].data ?? []).map(mapIndividualBalance));
    setTreasuryBalances((results[7].data ?? []).map(mapTreasuryBalance));
    setLoading(false);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const requestMembership = useCallback(async () => {
    if (!currentUser) return false;
    const { error: rpcError } = await database.rpc("request_treasury_membership", {
      p_collaborator_id: currentUser.id, p_actor_name: currentUserName,
    });
    if (rpcError) { toast.error(rpcError.message); return false; }
    toast.success("Solicitação de participação enviada para Patrick."); await refetch(); return true;
  }, [currentUser, currentUserName, refetch]);

  const requestAcceptance = useCallback(async (input: {
    challengeId: string; dueAt: string; destination: "treasury" | "individual"; proposedSuperstars?: number | null; note?: string;
  }) => {
    if (!currentUser) return false;
    const { error: rpcError } = await database.rpc("request_opportunity_acceptance", {
      p_challenge_id: input.challengeId, p_collaborator_id: currentUser.id,
      p_proposed_due_at: input.dueAt, p_requested_destination: input.destination,
      p_proposed_reward_superstars: input.proposedSuperstars ?? null, p_note: input.note ?? null,
      p_actor_name: currentUserName,
    });
    if (rpcError) { toast.error(rpcError.message); return false; }
    toast.success("Solicitação enviada para aprovação de Patrick."); await refetch(); return true;
  }, [currentUser, currentUserName, refetch]);

  const reviewAcceptance = useCallback(async (request: OpportunityAcceptanceRequest, approve: boolean) => {
    const { error: rpcError } = await database.rpc("review_opportunity_acceptance", {
      p_request_id: request.id, p_approve: approve, p_due_at: request.proposedDueAt,
      p_reward_superstars: request.proposedRewardSuperstars, p_destination: request.requestedDestination,
      p_actor_name: currentUserName,
    });
    if (rpcError) { toast.error(rpcError.message); return false; }
    toast.success(approve ? "Solicitação aprovada." : "Solicitação recusada."); await refetch(); return true;
  }, [currentUserName, refetch]);

  const currentProfile = useMemo(() => profiles.find((profile) => profile.collaboratorId === currentUser?.id) ?? null, [currentUser?.id, profiles]);
  const currentMembership = useMemo(() => memberships.find((membership) => membership.collaboratorId === currentUser?.id) ?? null, [currentUser?.id, memberships]);
  const currentRate = rates.find((rate) => !rate.effectiveUntil) ?? rates[0] ?? null;

  return {
    profiles, memberships, rates, acceptanceRequests, opportunities, individualTransactions, individualBalances, treasuryBalances,
    currentProfile, currentMembership, currentRate, loading, schemaReady, error, refetch,
    requestMembership, requestAcceptance, reviewAcceptance,
  };
}
