import { describe, expect, it } from 'vitest';
import { groupDeliverablesByWeek } from '@/lib/deliverableWeekGroups';
import { Deliverable } from '@/types/deliverable';

function delivery(id: string, completedAt: string, assignedTo: string[]): Deliverable {
  return {
    id,
    name: id,
    description: null,
    client_id: null,
    source_priority_id: null,
    assigned_to: assignedTo,
    requester: null,
    due_date: null,
    status: 'concluido',
    created_by: null,
    created_at: completedAt,
    updated_at: completedAt,
    completed_at: completedAt,
    items: [],
  };
}

describe('weekly deliverable groups', () => {
  const responsibleList = [{ name: 'Celine' }, { name: 'Gabi' }];

  it('groups Monday through Sunday and sorts recent weeks first', () => {
    const groups = groupDeliverablesByWeek([
      delivery('last', '2026-10-11T12:00:00', ['Celine']),
      delivery('sunday', '2026-10-18T12:00:00', ['Celine']),
      delivery('monday', '2026-10-12T12:00:00', ['Gabi']),
    ], 'Celine', true, responsibleList);

    expect(groups.map(group => group.key)).toEqual(['2026-10-12', '2026-10-05']);
    expect(groups[0].deliveries.map(item => item.id)).toEqual(['sunday', 'monday']);
  });

  it('shows a shared delivery under each collaborator without inflating the weekly count', () => {
    const groups = groupDeliverablesByWeek([
      delivery('shared', '2026-10-21T12:00:00', ['CELINE', 'Gabi', 'celine']),
    ], 'Celine', true, responsibleList);

    expect(groups[0].deliveries).toHaveLength(1);
    expect(groups[0].collaborators.map(group => group.name)).toEqual(['Celine', 'Gabi']);
    expect(groups[0].collaborators.every(group => group.deliveries[0].id === 'shared')).toBe(true);
  });

  it('keeps unassigned deliveries visible in the team view', () => {
    const groups = groupDeliverablesByWeek([
      delivery('unassigned', '2026-10-21T12:00:00', []),
    ], 'Celine', true, responsibleList);

    expect(groups[0].collaborators[0].name).toBe('Sem responsável');
  });
});
