import type { Collaborator } from '@/types/collaborator';
import type { Task } from '@/types/task';
import { assigneeMatches } from '@/lib/taskAssignee';

export function getActiveCollaboratorIdsForClient(
  clientId: string,
  tasks: Task[],
  collaborators: Collaborator[],
) {
  const activeTasks = tasks.filter(task =>
    task.client_id === clientId
    && !task.completed
    && task.status !== 'concluida'
    && task.status !== 'cancelada',
  );

  return collaborators
    .filter(collaborator => collaborator.isActive && activeTasks.some(task =>
      assigneeMatches(task.assigned_to, collaborator.name),
    ))
    .map(collaborator => collaborator.id);
}
