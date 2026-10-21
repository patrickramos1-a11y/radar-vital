import { endOfWeek, format, startOfWeek } from 'date-fns';
import { Deliverable } from '@/types/deliverable';
import { normalizeAssignee } from '@/lib/taskAssignee';

export interface CollaboratorGroup {
  name: string;
  deliveries: Deliverable[];
}

export interface WeekGroup {
  key: string;
  start: Date;
  end: Date;
  deliveries: Deliverable[];
  collaborators: CollaboratorGroup[];
}

export const deliveryDate = (deliverable: Deliverable): Date =>
  new Date(deliverable.completed_at || deliverable.updated_at || deliverable.created_at);

export function groupDeliverablesByWeek(
  deliverables: Deliverable[],
  collaborator: string,
  isTeamView: boolean,
  responsibleList: { name: string }[],
): WeekGroup[] {
  const weeks = new Map<string, { start: Date; end: Date; deliveries: Deliverable[] }>();

  deliverables.forEach(deliverable => {
    const deliveredAt = deliveryDate(deliverable);
    const weekStart = startOfWeek(deliveredAt, { weekStartsOn: 1 });
    const key = format(weekStart, 'yyyy-MM-dd');
    const week = weeks.get(key) || {
      start: weekStart,
      end: endOfWeek(deliveredAt, { weekStartsOn: 1 }),
      deliveries: [],
    };
    week.deliveries.push(deliverable);
    weeks.set(key, week);
  });

  return Array.from(weeks.entries())
    .map(([key, week]) => {
      const byCollaborator = new Map<string, Deliverable[]>();
      week.deliveries.forEach(deliverable => {
        const assignees = isTeamView
          ? deliverable.assigned_to.length > 0 ? deliverable.assigned_to : ['Sem responsável']
          : [collaborator];
        const names = new Set(assignees.map(assignee =>
          responsibleList.find(responsible =>
            normalizeAssignee(responsible.name) === normalizeAssignee(assignee))?.name || assignee));
        names.forEach(name => {
          const current = byCollaborator.get(name) || [];
          current.push(deliverable);
          byCollaborator.set(name, current);
        });
      });

      const collaborators = Array.from(byCollaborator.entries())
        .map(([name, deliveries]) => ({ name, deliveries }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return { key, ...week, collaborators };
    })
    .sort((a, b) => b.start.getTime() - a.start.getTime());
}
