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
const callPriorityRpc: PriorityRpc = async (name, args) => {
  try {
    return await supabase.rpc(name as never, args as never) as unknown as Awaited<ReturnType<PriorityRpc>>;
  } catch (error) {
    // A stale generated API client can throw before Supabase returns an RPC
    // response. Returning a normal error keeps the compatibility path below
    // available instead of breaking the action in the interface.
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Não foi possível executar a ação no banco.',
      },
    };
  }
};

const isOpenSubtaskError = (error: { code?: string; message: string } | null) => Boolean(error && (
  error.code === 'P0001'
  || error.message?.toLocaleLowerCase('pt-BR').includes('subtarefas abertas')
));

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
    const uniqueClientIds = [...new Set(clientIds.filter(Boolean))];
    const targets = uniqueClientIds.length ? uniqueClientIds : (data.client_id ? [data.client_id] : []);
    if (!targets.length) return [];
    const inserted = await Promise.all(targets.map(clientId => addPriority({
      ...data,
      client_id: clientId,
      universe_item_id: null,
    })));
    return inserted.filter((priority): priority is Priority => Boolean(priority));
  }, [addPriority]);

  const finishPriorityThroughTables = useCallback(async (priority: Priority, finishChildren: boolean) => {
    const taskColumns = 'id,parent_task_id,completed,status';
    const { data: linkedTasks, error: linkedError } = await supabase
      .from('tasks')
      .select(taskColumns)
      .eq('priority_id', priority.id);
    if (linkedError) return { data: null, error: linkedError };

    let taskPool = linkedTasks ?? [];
    if (priority.client_id) {
      const { data: clientTasks, error: clientError } = await supabase
        .from('tasks')
        .select(taskColumns)
        .eq('client_id', priority.client_id);
      if (clientError) return { data: null, error: clientError };
      taskPool = clientTasks ?? taskPool;
    }

    if (priority.source_task_id && !taskPool.some(task => task.id === priority.source_task_id)) {
      const { data: sourceTask, error: sourceError } = await supabase
        .from('tasks')
        .select(taskColumns)
        .eq('id', priority.source_task_id)
        .maybeSingle();
      if (sourceError) return { data: null, error: sourceError };
      if (sourceTask) taskPool = [...taskPool, sourceTask];
    }

    const linkedIds = new Set((linkedTasks ?? []).map(task => task.id));
    const rootIds = new Set<string>([
      ...(priority.source_task_id ? [priority.source_task_id] : []),
      ...((linkedTasks ?? [])
        .filter(task => !task.parent_task_id || !linkedIds.has(task.parent_task_id))
        .map(task => task.id)),
    ]);
    const childrenByParent = new Map<string, string[]>();
    taskPool.forEach(task => {
      if (!task.parent_task_id) return;
      childrenByParent.set(task.parent_task_id, [...(childrenByParent.get(task.parent_task_id) ?? []), task.id]);
    });

    const descendants = new Set<string>();
    const queue = [...rootIds];
    while (queue.length) {
      const parentId = queue.shift()!;
      (childrenByParent.get(parentId) ?? []).forEach(childId => {
        if (descendants.has(childId)) return;
        descendants.add(childId);
        queue.push(childId);
      });
    }

    const taskById = new Map(taskPool.map(task => [task.id, task]));
    const openDescendants = [...descendants].filter(taskId => {
      const task = taskById.get(taskId);
      return task && !task.completed && task.status !== 'concluida' && task.status !== 'cancelada';
    });
    if (openDescendants.length && !finishChildren) {
      return { data: null, error: { code: 'P0001', message: 'Existem subtarefas abertas.' } };
    }

    const completedAt = new Date().toISOString();
    const taskPatch: Database['public']['Tables']['tasks']['Update'] = {
      completed: true,
      completed_at: completedAt,
      scheduled_for: null,
      status: 'concluida',
    };
    if (finishChildren && descendants.size) {
      const { error: childrenError } = await supabase.from('tasks').update(taskPatch).in('id', [...descendants]);
      if (childrenError) return { data: null, error: childrenError };
    }
    if (rootIds.size) {
      const { error: rootError } = await supabase.from('tasks').update(taskPatch).in('id', [...rootIds]);
      if (rootError) return { data: null, error: rootError };
    }

    const { error: priorityError } = await supabase.from('priorities').update({
      status: 'concluida',
      completed_at: completedAt,
    }).eq('id', priority.id);
    return { data: null, error: priorityError };
  }, []);

  const updatePriority = useCallback(async (id: string, data: Partial<PriorityFormData>) => {
    try {
      const current = priorities.find(priority => priority.id === id);
      if (data.status === 'concluida' && current) {
        const finish = async (finishChildren: boolean) => {
          const rpcResult = await callPriorityRpc('finish_priority_with_task_tree', {
            p_priority_id: current.id,
            p_finish_children: finishChildren,
          });
          if (!rpcResult.error) return rpcResult;

          // The application can run against a database that has not refreshed
          // the RPC signature yet. Preserve the task-tree rule with a direct
          // table fallback rather than leaving the priority impossible to close.
          console.warn('Priority completion RPC unavailable; using compatibility fallback.', rpcResult.error);
          return finishPriorityThroughTables(current, finishChildren);
        };

        let finishResult = await finish(false);
        if (isOpenSubtaskError(finishResult.error)) {
          if (!window.confirm('Esta prioridade tem subtarefas abertas. Deseja concluir todas elas e a prioridade?')) return false;
          finishResult = await finish(true);
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
  }, [fetch, finishPriorityThroughTables, priorities]);

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

  const demotePriorityToTask = useCallback(async (id: string) => {
    try {
      const current = priorities.find((priority) => priority.id === id);
      if (!current) throw new Error('Prioridade não encontrada.');

      const rpcResult = await callPriorityRpc('demote_priority_to_task', {
        p_priority_id: id,
        p_actor: currentUserName,
      });
      if (!rpcResult.error) {
        await fetch();
        toast.success('Prioridade voltou a ser uma tarefa');
        return true;
      }

      // Compatibility path for databases that have not received the helper
      // function yet. Keep the original task tree intact and only remove the
      // priority relationship from it.
      const { data: linkedTasks, error: linkedError } = await supabase
        .from('tasks')
        .select('*')
        .eq('priority_id', id);
      if (linkedError) throw linkedError;

      const source = linkedTasks?.find((task) => task.id === current.source_task_id)
        || linkedTasks?.find((task) => !task.parent_task_id)
        || null;

      if (source) {
        const { error: unlinkTasksError } = await supabase
          .from('tasks')
          .update({ priority_id: null, priority: 'normal' })
          .eq('priority_id', id);
        if (unlinkTasksError) throw unlinkTasksError;
      } else if (current.client_id) {
        const { data: createdTask, error: createTaskError } = await supabase
          .from('tasks')
          .insert({
            client_id: current.client_id,
            title: current.title,
            description: current.description,
            assigned_to: current.assigned_to.slice(0, 1),
            due_date: current.due_date,
            priority: 'normal',
            modality: current.category || 'Levantamento',
            status: current.status === 'concluida' ? 'concluida' : 'pendente',
            completed: current.status === 'concluida',
            completed_at: current.completed_at,
            created_by: current.created_by,
          })
          .select('id')
          .single();
        if (createTaskError) throw createTaskError;

        if (linkedTasks?.length && createdTask) {
          const { error: relinkError } = await supabase
            .from('tasks')
            .update({ priority_id: null, parent_task_id: createdTask.id, priority: 'normal' })
            .eq('priority_id', id);
          if (relinkError) throw relinkError;
        }
      } else {
        throw new Error('Esta prioridade do Universo Ramos não possui uma tarefa vinculada para restaurar.');
      }

      const { error: clearSourceError } = await supabase
        .from('priorities')
        .update({ source_task_id: null })
        .eq('id', id);
      if (clearSourceError) throw clearSourceError;
      const { error: deleteError } = await supabase.from('priorities').delete().eq('id', id);
      if (deleteError) throw deleteError;

      await fetch();
      toast.success('Prioridade voltou a ser uma tarefa');
      return true;
    } catch (e) {
      console.error(e);
      toast.error('Erro ao despromover prioridade', {
        description: e instanceof Error ? e.message : 'Não foi possível restaurar a tarefa.',
      });
      return false;
    }
  }, [currentUserName, fetch, priorities]);

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

  return { priorities, isLoading, error, addPriority, addPrioritiesForClients, updatePriority, deletePriority, demotePriorityToTask, promoteTaskToPriority, refetch: fetch };
}
