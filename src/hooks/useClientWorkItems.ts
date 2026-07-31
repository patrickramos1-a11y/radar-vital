import { useMemo } from "react";
import { useDeliverables } from "@/hooks/useDeliverables";
import { usePriorities } from "@/hooks/usePriorities";
import { useTasks } from "@/hooks/useTasks";
import { useAudits } from "@/hooks/useAudits";
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

  const items = useMemo(
    () =>
      buildClientWorkItems(
        clientId,
        tasks,
        prioritiesSource.priorities,
        deliverablesSource.deliverables,
        auditItems,
      ),
    [
      clientId,
      deliverablesSource.deliverables,
      auditItems,
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
      auditsSource.isLoading,
    error:
      (!taskOverride ? tasksSource.error : null) ||
      prioritiesSource.error ||
      deliverablesSource.error ||
      auditsSource.error,
    refetch: async () => {
      await Promise.all([
        tasksSource.refetch(),
        prioritiesSource.refetch(),
        deliverablesSource.refetch(),
        auditsSource.refetch(),
      ]);
    },
  };
}
