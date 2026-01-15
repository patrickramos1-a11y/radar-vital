import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskFormData } from '@/types/task';
import { CollaboratorName } from '@/types/client';
import { toast } from 'sonner';
import { ActivityLogger } from '@/lib/activityLogger';

// Get current user from localStorage for logging
const getCurrentUserName = () => localStorage.getItem('painel_ac_user') || 'Sistema';

// Convert DB row to Task type
const dbRowToTask = (row: any): Task => ({
  id: row.id,
  client_id: row.client_id,
  title: row.title,
  completed: row.completed,
  assigned_to: row.assigned_to as CollaboratorName | null,
  created_at: row.created_at,
  completed_at: row.completed_at,
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
    // Check limit of 11 active tasks per client
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
      });

      if (error) throw error;
      await fetchTasks();
      toast.success('Tarefa criada!');
      
      // Log activity
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
      
      // If completing task, set completed_at
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
      
      // Log activity
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
    
    // Log activity
    if (result) {
      ActivityLogger.completeTask(getCurrentUserName(), clientName || 'Cliente', task.client_id, task.title, newCompleted);
    }
    
    return result;
  }, [tasks, updateTask]);

  // Get active tasks per client
  const getActiveTasksForClient = useCallback((clientId: string) => {
    return tasks.filter(t => t.client_id === clientId && !t.completed);
  }, [tasks]);

  // Get all tasks for a client
  const getTasksForClient = useCallback((clientId: string) => {
    return tasks.filter(t => t.client_id === clientId);
  }, [tasks]);

  // Get count of active tasks per client
  const getActiveTaskCount = useCallback((clientId: string) => {
    return tasks.filter(t => t.client_id === clientId && !t.completed).length;
  }, [tasks]);

  // Get clients with active tasks
  const clientsWithActiveTasks = new Set(
    tasks.filter(t => !t.completed).map(t => t.client_id)
  );

  // Get tasks by collaborator
  const getTasksByCollaborator = useCallback((collaborator: CollaboratorName) => {
    return tasks.filter(t => t.assigned_to === collaborator && !t.completed);
  }, [tasks]);

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
    refetch: fetchTasks,
  };
}
