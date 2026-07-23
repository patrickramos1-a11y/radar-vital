import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Priority, PriorityFormData, PriorityStatus } from '@/types/priority';
import { toast } from 'sonner';

const getCurrentUserName = () => localStorage.getItem('painel_ac_user') || 'Sistema';

const dbRowToPriority = (row: any): Priority => ({
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
});

export function usePriorities() {
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('priorities')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPriorities((data || []).map(dbRowToPriority));
    } catch (e) {
      console.error(e);
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

  const addPriority = useCallback(async (data: PriorityFormData, clientName?: string) => {
    try {
      const { data: inserted, error } = await supabase.from('priorities').insert({
        title: data.title,
        description: data.description || null,
        client_id: data.client_id || null,
        assigned_to: data.assigned_to || [],
        due_date: data.due_date || null,
        status: data.status || 'aberta',
        weight: data.weight ?? 3,
        category: data.category || null,
        created_by: getCurrentUserName(),
      }).select().single();
      if (error) throw error;
      await fetch();
      toast.success('Prioridade criada');
      return inserted ? dbRowToPriority(inserted) : null;
    } catch (e) {
      console.error(e);
      toast.error('Erro ao criar prioridade');
      return null;
    }
  }, [fetch]);

  const updatePriority = useCallback(async (id: string, data: Partial<PriorityFormData>) => {
    try {
      const patch: any = { ...data };
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

  const promoteTaskToPriority = useCallback(async (taskId: string, taskTitle: string, data: PriorityFormData, clientName?: string) => {
    const priority = await addPriority(data, clientName);
    if (!priority) return null;
    try {
      const { error } = await supabase.from('tasks').update({ priority_id: priority.id }).eq('id', taskId);
      if (error) throw error;
      return priority;
    } catch (e) {
      console.error(e);
      toast.error('Erro ao vincular tarefa');
      return null;
    }
  }, [addPriority]);

  return { priorities, isLoading, addPriority, updatePriority, deletePriority, promoteTaskToPriority, refetch: fetch };
}
