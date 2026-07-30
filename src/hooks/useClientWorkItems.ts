import { useMemo } from "react";
import { useDeliverables } from "@/hooks/useDeliverables";
import { usePriorities } from "@/hooks/usePriorities";
import { useTasks } from "@/hooks/useTasks";
import { buildClientWorkItems } from "@/lib/workItemAdapters";
import type { Task } from "@/types/task";

export function useClientWorkItems(clientId: string, taskOverride?: Task[]) {
  const tasksSource = useTasks();
  const prioritiesSource = usePriorities();
  const deliverablesSource = useDeliverables();
  const tasks = taskOverride ?? tasksSource.tasks;

  const items = useMemo(
    () =>
      buildClientWorkItems(
        clientId,
        tasks,
        prioritiesSource.priorities,
        deliverablesSource.deliverables,
      ),
    [
      clientId,
      deliverablesSource.deliverables,
      prioritiesSource.priorities,
      tasks,
    ],
  );

  return {
    items,
    isLoading:
      (!taskOverride && tasksSource.isLoading) ||
      prioritiesSource.isLoading ||
      deliverablesSource.isLoading,
    error:
      (!taskOverride ? tasksSource.error : null) ||
      prioritiesSource.error ||
      deliverablesSource.error,
    refetch: async () => {
      await Promise.all([
        tasksSource.refetch(),
        prioritiesSource.refetch(),
        deliverablesSource.refetch(),
      ]);
    },
  };
}
