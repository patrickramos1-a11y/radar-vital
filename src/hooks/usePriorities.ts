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
  universe_item_id: row.universe_item_id ?? null,
  assigned_to: Array.isArray(row.assigned_to) ? row.assigned_to.slice(0, 1) : [],
  due_date: row.due_date,
  status: row.status as PriorityStatus,
  weight: row.weight ?? 1,
  category: row.category,
  created_by: row.created_by,
  created_at: row.created_at,
  updated_at: row.updated_at,
  completed_at: row.completed_at,
  source_task_id: row.source_task_id ?? null,
});

type PriorityRpc = (name: string, args: Record<string, unknown>) => Promise<{
  data: unknown;
  error: { code?: string; message: string } | null;
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

  const addPriority = useCallback(async (data: PriorityFormData, _clientName?: string) => {
    try {
      if (!data.client_id && !data.universe_item_id) {
        toast.error('Selecione um cliente ou um item do Universo Ramos');
        return null;
      }
      const payload: Database['public']['Tables']['priorities']['Insert'] = {
        title: data.title,
        description: data.description || null,
        client_id: data.universe_item_id ? null : data.client_id || null,
        assigned_to: (data.assigned_to || []).slice(0, 1),
        due_date: data.due_date || null,
        status: data.status || 'aberta',
        weight: data.weight ?? 1,
        category: data.category || null,
        created_by: currentUserName,
        ...(data.universe_item_id ? { universe_item_id: data.universe_item_id } : {}),
      };
      const { data: inserted, error } = await supabase.from('priorities').insert(payload).select().single();
      if (error) throw error;
      await fetch();
      toast.success('Prioridade criada');
      return inserted ? dbRowToPriority(inserted) : null;
    } catch (e) {
      console.error(e);
      toast.error('Erro ao criar prioridade');
      return null;
    }
  }, [currentUserName, fetch]);

  const addPrioritiesForClients = useCallback(async (data: PriorityFormData, clientIds: string[]) => {
    const clientId = [...new Set(clientIds.filter(Boolean))][0] || data.client_id || null;
    const inserted = await addPriority({ ...data, client_id: clientId, universe_item_id: null });
    return inserted ? [inserted] : [];
  }, [addPriority]);

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
        const { status: _status, ...otherChanges } = data;
        if (otherChanges.assigned_to) otherChanges.assigned_to = otherChanges.assigned_to.slice(0, 1);
        if (Object.keys(otherChanges).length) {
          const { error: editError } = await supabase.from('priorities').update(otherChanges).eq('id', id);
          if (editError) throw editError;
        }
        await fetch();
        toast.success('Prioridade concluída');
        return true;
      }
      const patchData = { ...data };
      if (patchData.assigned_to) patchData.assigned_to = patchData.assigned_to.slice(0, 1);
      if (patchData.universe_item_id === null && !current?.universe_item_id) delete patchData.universe_item_id;
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
      const atomicDelete = await callPriorityRpc('delete_priority_with_task_tree', { p_priority_id: id });
      if (!atomicDelete.error) {
        await fetch();
        toast.success('Prioridade, tarefa e subtarefas excluídas');
        return true;
      }
      if (!['42883', 'PGRST202'].includes(atomicDelete.error.code ?? '')) throw atomicDelete.error;

      const current = priorities.find((priority) => priority.id === id);
      const { data: linkedTasks, error: linkedError } = await supabase
        .from('tasks')
        .select('id,parent_task_id')
        .eq('priority_id', id);
      if (linkedError) throw linkedError;

      const rootIds = new Set<string>([
        ...(current?.source_task_id ? [current.source_task_id] : []),
        ...((linkedTasks ?? []).filter((task) => !task.parent_task_id).map((task) => task.id)),
      ]);

      if (current?.source_task_id) {
        const { error: unlinkError } = await supabase.from('priorities').update({ source_task_id: null }).eq('id', id);
        if (unlinkError) throw unlinkError;
      }

      // Deleting the roots also deletes every nested subtask through the
      // parent_task_id ON DELETE CASCADE relationship.
      if (rootIds.size > 0) {
        const { error: taskError } = await supabase.from('tasks').delete().in('id', [...rootIds]);
        if (taskError) throw taskError;
      }

      const { error } = await supabase.from('priorities').delete().eq('id', id);
      if (error) throw error;
      await fetch();
      toast.success(rootIds.size > 0 ? 'Prioridade, tarefa e subtarefas excluídas' : 'Prioridade excluída');
      return true;
    } catch (e) {
      console.error(e);
      toast.error('Erro ao excluir prioridade');
      return false;
    }
  }, [fetch, priorities]);

  const promoteTaskToPriority = useCallback(async (taskId: string, _taskTitle: string, data: PriorityFormData, _clientName?: string) => {
    try {
      const { data: created, error } = await callPriorityRpc('promote_client_task', {
        p_task_id: taskId,
        p_weight: data.weight ?? 1,
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
