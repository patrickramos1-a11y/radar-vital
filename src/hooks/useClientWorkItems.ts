import { useMemo } from "react";
import { useDeliverables } from "@/hooks/useDeliverables";
import { usePriorities } from "@/hooks/usePriorities";
import { useTasks } from "@/hooks/useTasks";
import { useAudits } from "@/hooks/useAudits";
import { useChallenges } from "@/hooks/useChallenges";
import { useCollaborators } from "@/hooks/useCollaborators";
import { getEffectiveChallengeStatus } from "@/lib/challenge";
import {
  buildClientWorkItems,
  type FutureWorkItemSource,
} from "@/lib/workItemAdapters";
import type { Task } from "@/types/task";

export function useClientWorkItems(clientId: string, taskOverride?: Task[]) {
  const tasksSource = useTasks();
  const prioritiesSource = usePriorities();
  const deliverablesSource = useDeliverables();
  const auditsSource = useAudits();
  const challengesSource = useChallenges();
  const collaboratorsSource = useCollaborators();
  const tasks = taskOverride ?? tasksSource.tasks;
  const auditById = useMemo(
    () => new Map(auditsSource.audits.map((audit) => [audit.id, audit])),
    [auditsSource.audits],
  );
  const auditItems = useMemo<FutureWorkItemSource[]>(
    () =>
      auditsSource.items.flatMap((item) => {
        const audit = auditById.get(item.auditId);
        if (!audit) return [];
        return [
          {
            id: item.id,
            kind: "audit" as const,
            clientId: item.clientId,
            title: audit.title,
            description: item.notes ?? audit.objective,
            status:
              item.status === "validated"
                ? ("completed" as const)
                : item.status === "completed"
                  ? ("pending_validation" as const)
                  : item.status === "in_progress"
                    ? ("in_progress" as const)
                    : ("open" as const),
            createdAt: item.createdAt,
            dueDate: audit.dueAt,
            completedAt: item.validatedAt ?? item.completedAt,
            sourcePath: `/auditorias?auditId=${audit.id}`,
          },
        ];
      }),
    [auditById, auditsSource.items],
  );
  const challengeItems = useMemo<FutureWorkItemSource[]>(
    () =>
      challengesSource.challenges.flatMap((challenge) => {
        if (!challenge.clientId) return [];
        const status = getEffectiveChallengeStatus(challenge);
        const assignees = (challengesSource.participantsByChallenge.get(challenge.id) ?? [])
          .map((participant) =>
            collaboratorsSource.collaborators.find(
              (collaborator) => collaborator.id === participant.collaboratorId,
            )?.name,
          )
          .filter((name): name is string => Boolean(name));

        return [
          {
            id: challenge.id,
            kind: "challenge" as const,
            clientId: challenge.clientId,
            title: challenge.title,
            description: challenge.successCriteria,
            status:
              status === "won"
                ? ("completed" as const)
                : status === "lost" || status === "cancelled"
                  ? ("cancelled" as const)
                  : status === "awaiting_validation"
                    ? ("pending_validation" as const)
                    : status === "active"
                      ? ("in_progress" as const)
                      : ("open" as const),
            createdAt: challenge.createdAt,
            dueDate: challenge.dueAt,
            completedAt: challenge.resolvedAt,
            assignees,
            sourcePath: "/central-entregas?tab=challenges",
          },
        ];
      }),
    [
      challengesSource.challenges,
      challengesSource.participantsByChallenge,
      collaboratorsSource.collaborators,
    ],
  );

  const items = useMemo(
    () =>
      buildClientWorkItems(
        clientId,
        tasks,
        prioritiesSource.priorities,
        deliverablesSource.deliverables,
        [...auditItems, ...challengeItems],
      ),
    [
      clientId,
      deliverablesSource.deliverables,
      auditItems,
      challengeItems,
      prioritiesSource.priorities,
      tasks,
    ],
  );

  return {
    items,
    isLoading:
      (!taskOverride && tasksSource.isLoading) ||
      prioritiesSource.isLoading ||
      deliverablesSource.isLoading ||
      auditsSource.isLoading ||
      challengesSource.isLoading ||
      collaboratorsSource.loading,
    error:
      (!taskOverride ? tasksSource.error : null) ||
      prioritiesSource.error ||
      deliverablesSource.error ||
      auditsSource.error ||
      challengesSource.error,
    refetch: async () => {
      await Promise.all([
        tasksSource.refetch(),
        prioritiesSource.refetch(),
        deliverablesSource.refetch(),
        auditsSource.refetch(),
        challengesSource.refetch(),
      ]);
    },
  };
}
