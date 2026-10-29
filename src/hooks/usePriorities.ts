import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Priority, PriorityFormData, PriorityStatus } from '@/types/priority';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { actorName } from '@/lib/auth';

const dbRowToPriority = (row: Database['public']['Tables']['priorities']['Row']): Priority => ({
  id: row.id,
  title: row.title,
  description: row.description,
  client_id: row.client_id,
  assigned_to: Array.isArray(row.assigned_to) ? row.assigned_to : [],
  due_date: row.due_date,
  status: row.status as PriorityStatus,
  weight: row.weight ?? 3,
  category: row.category,
  created_by: row.created_by,
  created_at: row.created_at,
  updated_at: row.updated_at,
  completed_at: row.completed_at,
  source_task_id: row.source_task_id ?? null,
});

type PriorityRpc = (name: string, args: Record<string, unknown>) => Promise<{
  data: unknown;
  error: { message: string } | null;
}>;
const callPriorityRpc = supabase.rpc as unknown as PriorityRpc;

export function usePriorities() {
  const { currentUser } = useAuth();
  const currentUserName = actorName(currentUser);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('priorities')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPriorities((data || []).map(dbRowToPriority));
    } catch (e) {
      console.error(e);
      setError('Não foi possível carregar as prioridades.');
      toast.error('Erro ao carregar prioridades');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const ch = supabase
      .channel('priorities_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'priorities' }, () => {
        setTimeout(fetch, 100);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetch]);

  const addPrioritiesForClients = useCallback(async (data: PriorityFormData, clientIds: string[]) => {
    try {
      const ids = [...new Set(clientIds.filter(Boolean))];
      if (!ids.length) {
        toast.error('Selecione ao menos um cliente');
        return [];
      }
      const base = {
        title: data.title,
        description: data.description || null,
        assigned_to: data.assigned_to || [],
        due_date: data.due_date || null,
        status: data.status || 'aberta',
        weight: data.weight ?? 3,
        category: data.category || null,
        created_by: currentUserName,
      };
      const { data: inserted, error } = await supabase.from('priorities')
        .insert(ids.map(client_id => ({ ...base, client_id }))).select();
      if (error) throw error;
      await fetch();
      toast.success(ids.length === 1 ? 'Prioridade criada' : `${ids.length} prioridades criadas`);
      return (inserted || []).map(dbRowToPriority);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao criar prioridade');
      return [];
    }
  }, [currentUserName, fetch]);

  const addPriority = useCallback(async (data: PriorityFormData, _clientName?: string) => {
    const inserted = await addPrioritiesForClients(data, data.client_id ? [data.client_id] : []);
    return inserted[0] || null;
  }, [addPrioritiesForClients]);

  const updatePriority = useCallback(async (id: string, data: Partial<PriorityFormData>) => {
    try {
      const current = priorities.find(priority => priority.id === id);
      if (data.status === 'concluida' && current?.source_task_id) {
        const { data: related, error: relatedError } = await supabase.from('tasks')
          .select('id,parent_task_id,completed,status').eq('client_id', current.client_id!);
        if (relatedError) throw relatedError;
        const descendants = new Set([current.source_task_id]);
        let changed = true;
        while (changed) {
          changed = false;
          for (const task of related || []) {
            if (task.parent_task_id && descendants.has(task.parent_task_id) && !descendants.has(task.id)) {
              descendants.add(task.id);
              changed = true;
            }
          }
        }
        const hasOpen = (related || []).some(task => task.id !== current.source_task_id && descendants.has(task.id) && !task.completed && task.status !== 'cancelada');
        if (hasOpen && !window.confirm('Esta prioridade tem subtarefas abertas. Deseja concluir todas elas e a prioridade?')) return false;
        const { error: finishError } = await callPriorityRpc('finish_priority_task', {
          p_task_id: current.source_task_id,
          p_finish_children: hasOpen,
        });
        if (finishError) throw finishError;
        const { status: _status, client_ids: _clientIds, ...otherChanges } = data;
        if (Object.keys(otherChanges).length) {
          const { error: editError } = await supabase.from('priorities').update(otherChanges).eq('id', id);
          if (editError) throw editError;
        }
        await fetch();
        toast.success('Prioridade concluída');
        return true;
      }
      const { client_ids: _clientIds, ...patchData } = data;
      const patch: Database['public']['Tables']['priorities']['Update'] = { ...patchData };
      if (data.status === 'concluida') patch.completed_at = new Date().toISOString();
      if (data.status && data.status !== 'concluida') patch.completed_at = null;
      const { error } = await supabase.from('priorities').update(patch).eq('id', id);
      if (error) throw error;
      await fetch();
      toast.success('Prioridade atualizada');
      return true;
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar prioridade');
      return false;
    }
  }, [fetch, priorities]);

  const deletePriority = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('priorities').delete().eq('id', id);
      if (error) throw error;
      await fetch();
      toast.success('Prioridade excluída');
      return true;
    } catch (e) {
      console.error(e);
      toast.error('Erro ao excluir prioridade');
      return false;
    }
  }, [fetch]);

  const promoteTaskToPriority = useCallback(async (taskId: string, _taskTitle: string, data: PriorityFormData, _clientName?: string) => {
    try {
      const { data: created, error } = await callPriorityRpc('promote_client_task', {
        p_task_id: taskId,
        p_weight: data.weight ?? 3,
        p_category: data.category || null,
        p_actor: currentUserName,
      });
      if (error) throw error;
      await fetch();
      toast.success('Tarefa promovida a prioridade');
      return created ? dbRowToPriority(created as Database['public']['Tables']['priorities']['Row']) : null;
    } catch (e) {
      console.error(e);
      toast.error('Erro ao promover tarefa');
      return null;
    }
  }, [currentUserName, fetch]);

  return { priorities, isLoading, error, addPriority, addPrioritiesForClients, updatePriority, deletePriority, promoteTaskToPriority, refetch: fetch };
}
