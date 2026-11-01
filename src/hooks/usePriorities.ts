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
  weight_changed_at: row.weight_changed_at,
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
      if (data.status === 'concluida' && current) {
        let finishResult = await callPriorityRpc('finish_priority_with_task_tree', {
          p_priority_id: current.id,
          p_finish_children: false,
        });

        const hasOpenChildren = (error: typeof finishResult.error) =>
          Boolean(error && (
            error.code === 'P0001'
            || error.message?.toLocaleLowerCase('pt-BR').includes('subtarefas abertas')
          ));

        if (hasOpenChildren(finishResult.error)) {
          if (!window.confirm('Esta prioridade tem subtarefas abertas. Deseja concluir todas elas e a prioridade?')) return false;
          finishResult = await callPriorityRpc('finish_priority_with_task_tree', {
            p_priority_id: current.id,
            p_finish_children: true,
          });
        }

        if (finishResult.error && ['42883', 'PGRST202'].includes(finishResult.error.code ?? '') && current.source_task_id) {
          finishResult = await callPriorityRpc('finish_priority_task', {
            p_task_id: current.source_task_id,
            p_finish_children: false,
          });
          if (hasOpenChildren(finishResult.error)) {
            if (!window.confirm('Esta prioridade tem subtarefas abertas. Deseja concluir todas elas e a prioridade?')) return false;
            finishResult = await callPriorityRpc('finish_priority_task', {
              p_task_id: current.source_task_id,
              p_finish_children: true,
            });
          }
        } else if (finishResult.error && ['42883', 'PGRST202'].includes(finishResult.error.code ?? '')) {
          const { error: standaloneError } = await supabase.from('priorities').update({
            status: 'concluida',
            completed_at: new Date().toISOString(),
          }).eq('id', current.id);
          finishResult = { data: null, error: standaloneError };
        }
        if (finishResult.error) throw finishResult.error;
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
      const message = e instanceof Error
        ? e.message
        : (typeof e === 'object' && e && 'message' in e ? String(e.message) : 'Não foi possível atualizar a prioridade.');
      toast.error('Erro ao atualizar prioridade', { description: message });
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
      // A database created before the current migration may expose an older,
      // incompatible RPC. PostgreSQL rolls a failed RPC back atomically, so it
      // is safe to finish the same operation through the public tables.
      console.warn('Atomic priority deletion unavailable; using compatibility fallback.', atomicDelete.error);

      const current = priorities.find((priority) => priority.id === id);
      const { data: linkedTasks, error: linkedError } = await supabase
        .from('tasks')
        .select('id,parent_task_id')
        .eq('priority_id', id);
      if (linkedError) throw linkedError;

      const linkedIds = new Set((linkedTasks ?? []).map((task) => task.id));

      const rootIds = new Set<string>([
        ...(current?.source_task_id ? [current.source_task_id] : []),
        ...((linkedTasks ?? [])
          .filter((task) => !task.parent_task_id || !linkedIds.has(task.parent_task_id))
          .map((task) => task.id)),
      ]);

      const { error: unlinkError } = await supabase.from('priorities').update({ source_task_id: null }).eq('id', id);
      if (unlinkError) throw unlinkError;

      // Deleting the roots also deletes every nested subtask through the
      // parent_task_id ON DELETE CASCADE relationship.
      if (rootIds.size > 0) {
        const { error: taskError } = await supabase.from('tasks').delete().in('id', [...rootIds]);
        if (taskError) throw taskError;
      }

      // Handles legacy rows linked to the priority from the middle of a task
      // tree, without deleting an unrelated parent task.
      const { error: remainingTaskError } = await supabase.from('tasks').delete().eq('priority_id', id);
      if (remainingTaskError) throw remainingTaskError;

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
      const rpcResult = await callPriorityRpc('promote_client_task', {
        p_task_id: taskId,
        p_weight: data.weight ?? 1,
        p_category: data.category || null,
        p_actor: currentUserName,
      });
      let created = rpcResult.data as Database['public']['Tables']['priorities']['Row'] | null;

      if (rpcResult.error) {
        console.warn('Atomic task promotion unavailable; using compatibility fallback.', rpcResult.error);
        const { data: task, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', taskId)
          .single();
        if (taskError) throw taskError;

        if (task.priority_id) {
          const { data: existing, error: existingError } = await supabase
            .from('priorities')
            .select('*')
            .eq('id', task.priority_id)
            .single();
          if (existingError) throw existingError;
          created = existing;
        } else {
          const weight = Math.min(5, Math.max(1, data.weight ?? 1));
          const payload: Database['public']['Tables']['priorities']['Insert'] = {
            title: data.title?.trim() || task.title,
            description: data.description?.trim() || task.description || null,
            client_id: task.client_id,
            assigned_to: (data.assigned_to?.length ? data.assigned_to : task.assigned_to).slice(0, 1),
            due_date: data.due_date || task.due_date || null,
            status: data.status || 'aberta',
            weight,
            category: data.category || null,
            created_by: currentUserName,
            source_task_id: task.id,
          };
          const insertResult = await supabase.from('priorities').insert(payload).select('*').single();
          if (insertResult.error) throw insertResult.error;
          created = insertResult.data;

          const taskPriority = weight >= 4 ? 'urgente' : weight === 3 ? 'alta' : weight === 2 ? 'normal' : 'baixa';
          const { error: linkError } = await supabase.from('tasks').update({
            priority_id: created.id,
            priority: taskPriority,
          }).eq('id', task.id);
          if (linkError) {
            await supabase.from('priorities').delete().eq('id', created.id);
            throw linkError;
          }
        }
      }

      await fetch();
      toast.success('Tarefa promovida a prioridade');
      return created ? dbRowToPriority(created) : null;
    } catch (e) {
      console.error(e);
      const message = e instanceof Error
        ? e.message
        : (typeof e === 'object' && e && 'message' in e ? String(e.message) : 'Não foi possível promover a tarefa.');
      toast.error('Erro ao promover tarefa', { description: message });
      return null;
    }
  }, [currentUserName, fetch]);

  return { priorities, isLoading, error, addPriority, addPrioritiesForClients, updatePriority, deletePriority, promoteTaskToPriority, refetch: fetch };
}
