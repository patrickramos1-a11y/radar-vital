import type { Database } from "@/integrations/supabase/types";
import type {
  Challenge,
  ChallengeItem,
  ChallengeParticipant,
  ChallengeCompletionCondition,
  ChallengeStatus,
} from "@/types/challenge";

type ChallengeRow = Database["public"]["Tables"]["challenges"]["Row"];
type ChallengeItemRow =
  Database["public"]["Tables"]["challenge_items"]["Row"];
type ChallengeParticipantRow =
  Database["public"]["Tables"]["challenge_participants"]["Row"];

type ChallengeCompletionConditionRow = Database["public"]["Tables"]["challenge_completion_conditions"]["Row"];

export function mapChallenge(row: ChallengeRow): Challenge {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    successCriteria: row.success_criteria,
    completionMode: (row.completion_mode ?? "guidance") as Challenge["completionMode"],
    kind: (row.challenge_kind ?? "company_general") as Challenge["kind"],
    expectedDeliverable: row.expected_deliverable,
    evidenceRequirements: row.evidence_requirements,
    clientId: row.client_id,
    status: row.status as ChallengeStatus,
    dueAt: row.due_at,
    rewardStars: row.reward_stars ?? 0,
    rewardSuperstars: row.reward_superstars,
    rewardStatus: (row.reward_status ?? "unpriced") as Challenge["rewardStatus"],
    rewardConfiguredAt: row.reward_configured_at ?? null,
    rewardConfiguredBy: row.reward_configured_by ?? null,
    penaltyStars: row.penalty_stars,
    createdBy: row.created_by,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at,
    resolutionNotes: row.resolution_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapChallengeParticipant(
  row: ChallengeParticipantRow,
): ChallengeParticipant {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    collaboratorId: row.collaborator_id,
    createdAt: row.created_at,
  };
}

export function mapChallengeItem(row: ChallengeItemRow): ChallengeItem {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    itemType: row.item_type as ChallengeItem["itemType"],
    itemId: row.item_id,
    createdAt: row.created_at,
  };
}

export function getEffectiveChallengeStatus(
  challenge: Pick<Challenge, "status" | "dueAt">,
  now = new Date(),
): ChallengeStatus {
  if (
    (challenge.status === "active" || challenge.status === "accepted" || challenge.status === "in_progress") &&
    challenge.dueAt &&
    new Date(challenge.dueAt).getTime() <= now.getTime()
  ) {
    return "awaiting_validation";
  }

  return challenge.status;
}

export function getChallengeRewardStars(
  challenge: Pick<Challenge, "rewardStars" | "rewardSuperstars">,
): number {
  return challenge.rewardStars + challenge.rewardSuperstars * 10;
}

export function mapChallengeCompletionCondition(row: ChallengeCompletionConditionRow): ChallengeCompletionCondition {
  return { id: row.id, challengeId: row.challenge_id, title: row.title, sortOrder: row.sort_order, isRequired: row.is_required, completedAt: row.completed_at, completedBy: row.completed_by, createdAt: row.created_at, updatedAt: row.updated_at };
}

export function getChallengeElapsedDays(
  challenge: Pick<Challenge, "createdAt" | "resolvedAt">,
  now = new Date(),
): number {
  const start = new Date(challenge.createdAt);
  const end = challenge.resolvedAt ? new Date(challenge.resolvedAt) : now;
  return Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / 86_400_000),
  );
}
