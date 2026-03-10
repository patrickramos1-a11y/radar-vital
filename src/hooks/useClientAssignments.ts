import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClientAssignment {
  clientId: string;
  collaboratorId: string;
}

export function useClientAssignments() {
  const [assignments, setAssignments] = useState<ClientAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('client_collaborator_assignments')
        .select('client_id, collaborator_id');

      if (error) throw error;

      setAssignments(
        (data || []).map(row => ({
          clientId: row.client_id,
          collaboratorId: row.collaborator_id,
        }))
      );
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const getAssignedCollaboratorIds = useCallback(
    (clientId: string): string[] =>
      assignments.filter(a => a.clientId === clientId).map(a => a.collaboratorId),
    [assignments]
  );

  const toggleAssignment = useCallback(async (clientId: string, collaboratorId: string) => {
    const exists = assignments.some(
      a => a.clientId === clientId && a.collaboratorId === collaboratorId
    );

    try {
      if (exists) {
        const { error } = await supabase
          .from('client_collaborator_assignments')
          .delete()
          .eq('client_id', clientId)
          .eq('collaborator_id', collaboratorId);
        if (error) throw error;
        setAssignments(prev =>
          prev.filter(a => !(a.clientId === clientId && a.collaboratorId === collaboratorId))
        );
      } else {
        const { error } = await supabase
          .from('client_collaborator_assignments')
          .insert({ client_id: clientId, collaborator_id: collaboratorId });
        if (error) throw error;
        setAssignments(prev => [...prev, { clientId, collaboratorId }]);
      }
    } catch (error) {
      console.error('Error toggling assignment:', error);
    }
  }, [assignments]);

  const hasAssignment = useCallback(
    (clientId: string, collaboratorId: string): boolean =>
      assignments.some(a => a.clientId === clientId && a.collaboratorId === collaboratorId),
    [assignments]
  );

  const getClientsWithAnyAssignment = useCallback(
    (): Set<string> => new Set(assignments.map(a => a.clientId)),
    [assignments]
  );

  return {
    assignments,
    loading,
    getAssignedCollaboratorIds,
    toggleAssignment,
    hasAssignment,
    getClientsWithAnyAssignment,
    refetch: fetchAssignments,
  };
}
