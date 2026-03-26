import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskFormData } from '@/types/task';
import { toast } from 'sonner';
import { ActivityLogger } from '@/lib/activityLogger';
import { assigneeMatches } from '@/lib/taskAssignee';

const getCurrentUserName = () => localStorage.getItem('painel_ac_user') || 'Sistema';

const dbRowToTask = (row: any): Task => ({
  id: row.id,
  client_id: row.client_id,
  title: row.title,
  completed: row.completed,
  assigned_to: Array.isArray(row.assigned_to) ? row.assigned_to : row.assigned_to ? [row.assigned_to] : [],
  created_at: row.created_at,
  completed_at: row.completed_at,
  due_date: row.due_date || null,
});

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data || []).map(dbRowToTask));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Erro ao carregar tarefas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = useCallback(async (clientId: string, data: TaskFormData, clientName?: string) => {
    const clientActiveTasks = tasks.filter(t => t.client_id === clientId && !t.completed);
    if (clientActiveTasks.length >= 11) {
      toast.error('Limite de 11 tarefas ativas por cliente atingido');
      return false;
    }

    try {
      const { error } = await supabase.from('tasks').insert({
        client_id: clientId,
        title: data.title,
        assigned_to: data.assigned_to,
        due_date: data.due_date || null,
      });

      if (error) throw error;
      await fetchTasks();
      toast.success('Tarefa criada!');
      ActivityLogger.createTask(getCurrentUserName(), clientName || 'Cliente', clientId, data.title);
      return true;
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Erro ao criar tarefa');
      return false;
    }
  }, [tasks, fetchTasks]);

  const updateTask = useCallback(async (taskId: string, data: Partial<Task>) => {
    try {
      const updateData: any = { ...data };
      if (data.completed === true) {
        updateData.completed_at = new Date().toISOString();
      } else if (data.completed === false) {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
      await fetchTasks();
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Erro ao atualizar tarefa');
      return false;
    }
  }, [fetchTasks]);

  const deleteTask = useCallback(async (taskId: string, clientName?: string) => {
    const task = tasks.find(t => t.id === taskId);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      await fetchTasks();
      toast.success('Tarefa excluída');
      if (task) {
        ActivityLogger.deleteTask(getCurrentUserName(), clientName || 'Cliente', task.client_id, task.title);
      }
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Erro ao excluir tarefa');
      return false;
    }
  }, [tasks, fetchTasks]);

  const toggleComplete = useCallback(async (taskId: string, clientName?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;
    const newCompleted = !task.completed;
    const result = await updateTask(taskId, { completed: newCompleted });
    if (result) {
      ActivityLogger.completeTask(getCurrentUserName(), clientName || 'Cliente', task.client_id, task.title, newCompleted);
    }
    return result;
  }, [tasks, updateTask]);

  const getActiveTasksForClient = useCallback((clientId: string) => {
    return tasks.filter(t => t.client_id === clientId && !t.completed);
  }, [tasks]);

  const getTasksForClient = useCallback((clientId: string) => {
    return tasks.filter(t => t.client_id === clientId);
  }, [tasks]);

  const getActiveTaskCount = useCallback((clientId: string) => {
    return tasks.filter(t => t.client_id === clientId && !t.completed).length;
  }, [tasks]);

  const clientsWithActiveTasks = new Set(
    tasks.filter(t => !t.completed).map(t => t.client_id)
  );

  const getTasksByCollaborator = useCallback((collaborator: string) => {
    return tasks.filter(t => assigneeMatches(t.assigned_to, collaborator) && !t.completed);
  }, [tasks]);

  const getDaysOpen = useCallback((task: Task) => {
    const start = new Date(task.created_at);
    const end = task.completed && task.completed_at ? new Date(task.completed_at) : new Date();
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  const getOldestTask = useCallback(() => {
    const pending = tasks.filter(t => !t.completed);
    if (pending.length === 0) return null;
    return pending.reduce((oldest, t) =>
      new Date(t.created_at) < new Date(oldest.created_at) ? t : oldest
    );
  }, [tasks]);

  const getAverageDaysOpen = useCallback(() => {
    const pending = tasks.filter(t => !t.completed);
    if (pending.length === 0) return 0;
    const totalDays = pending.reduce((sum, t) => sum + getDaysOpen(t), 0);
    return Math.round(totalDays / pending.length);
  }, [tasks, getDaysOpen]);

  return {
    tasks,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    getActiveTasksForClient,
    getTasksForClient,
    getActiveTaskCount,
    clientsWithActiveTasks,
    getTasksByCollaborator,
    getDaysOpen,
    getOldestTask,
    getAverageDaysOpen,
    refetch: fetchTasks,
  };
}
