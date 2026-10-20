import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Task, TaskDependency, TaskFormData, TaskTemplate } from '@/types/task';
import { toast } from 'sonner';
import { ActivityLogger } from '@/lib/activityLogger';
import { assigneeMatches } from '@/lib/taskAssignee';
import { useAuth } from '@/contexts/AuthContext';
import { actorName } from '@/lib/auth';
import { canCompleteTask, getNextRecurrenceDate } from '@/lib/taskOperations';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type TaskPriorityAutomationRpc = (
  fn: string,
  args: Record<string, unknown>,
) => Promise<{ error: { code?: string; message: string } | null }>;

const LOCAL_WORKSPACE_PREVIEW = import.meta.env.VITE_CLIENT_WORKSPACE_PREVIEW === 'true';
const LOCAL_WORKSPACE_KEY = 'radar-vital:client-workspace-preview:v1';
const LOCAL_WORKSPACE_EVENT = 'radar-vital:client-workspace-preview-change';

const isFutureScheduled = (task: Task) => {
  if (!task.scheduled_for) return false;
  return task.scheduled_for > new Date().toISOString().slice(0, 10);
};

const PREVIEW_TEMPLATES: TaskTemplate[] = [
  {
    id: 'preview-documents',
    name: 'Solicitação de documentos',
    description: 'Organiza a coleta, conferência e retorno de documentos do cliente.',
    default_title: 'Solicitar e conferir documentos',
    default_description: 'Registrar quais documentos são necessários, solicitar ao cliente e conferir o material recebido.',
    default_priority: 'normal',
    subtasks: ['Listar documentos necessários', 'Solicitar documentos ao cliente', 'Conferir documentos recebidos', 'Registrar pendências', 'Confirmar recebimento ao cliente'],
    is_active: true,
  },
  {
    id: 'preview-environmental-protocol',
    name: 'Protocolo ambiental',
    description: 'Etapas essenciais para preparar e protocolar uma demanda ambiental.',
    default_title: 'Preparar protocolo ambiental',
    default_description: 'Consolidar documentos, revisar o processo, realizar o protocolo e registrar o comprovante.',
    default_priority: 'alta',
    subtasks: ['Conferir documentos do processo', 'Preparar requerimento', 'Realizar revisão final', 'Protocolar no órgão', 'Registrar número e comprovante'],
    is_active: true,
  },
  {
    id: 'preview-client-return',
    name: 'Retorno ao cliente',
    description: 'Fluxo curto para organizar acompanhamento e devolutiva.',
    default_title: 'Realizar retorno ao cliente',
    default_description: 'Reunir o contexto da demanda, confirmar o andamento e registrar a devolutiva realizada.',
    default_priority: 'normal',
    subtasks: ['Reunir informações atualizadas', 'Preparar devolutiva', 'Contatar o cliente', 'Registrar resultado do contato'],
    is_active: true,
  },
];

interface LocalWorkspaceState {
  tasks: Task[];
  dependencies: TaskDependency[];
}

function readLocalWorkspace(): LocalWorkspaceState | null {
  if (!LOCAL_WORKSPACE_PREVIEW || typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(LOCAL_WORKSPACE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as LocalWorkspaceState;
    return {
      ...parsed,
      tasks: parsed.tasks.map((task) => ({ ...task, modality: task.modality || 'levantamento', scheduled_for: task.scheduled_for || null })),
    };
  } catch {
    return null;
  }
}

function writeLocalWorkspace(state: LocalWorkspaceState) {
  window.localStorage.setItem(LOCAL_WORKSPACE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(LOCAL_WORKSPACE_EVENT));
}

function createLocalTask(clientId: string, data: TaskFormData): Task {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    client_id: clientId,
    title: data.title,
    description: data.description?.trim() || null,
    completed: data.status === 'concluida',
    status: data.status || 'pendente',
    assigned_to: data.assigned_to,
    created_at: now,
    completed_at: data.status === 'concluida' ? now : null,
    due_date: data.due_date || null,
    scheduled_for: data.scheduled_for || null,
    priority: data.priority || 'normal',
    modality: data.modality || 'levantamento',
    parent_task_id: data.parent_task_id || null,
    sort_order: data.sort_order || 0,
    source_comment_id: data.source_comment_id || null,
    recurrence: data.recurrence || 'none',
    recurrence_origin_id: null,
    updated_at: now,
  };
}

const dbRowToTask = (row: TaskRow): Task => ({
  id: row.id,
  client_id: row.client_id,
  title: row.title,
  description: row.description ?? null,
  completed: row.completed,
  status: (row.status as Task['status']) || (row.completed ? 'concluida' : 'pendente'),
  assigned_to: Array.isArray(row.assigned_to) ? row.assigned_to : row.assigned_to ? [row.assigned_to] : [],
  created_at: row.created_at,
  completed_at: row.completed_at,
  due_date: row.due_date || null,
  scheduled_for: row.scheduled_for || null,
  priority: (row.priority as Task['priority']) || 'normal',
  modality: (row.modality as Task['modality']) || 'levantamento',
  priority_id: row.priority_id ?? null,
  parent_task_id: row.parent_task_id ?? null,
  sort_order: row.sort_order ?? 0,
  source_comment_id: row.source_comment_id ?? null,
  recurrence: (row.recurrence as Task['recurrence']) || 'none',
  recurrence_origin_id: row.recurrence_origin_id ?? null,
  updated_at: row.updated_at ?? row.created_at,
});

export function useTasks() {
  const { currentUser } = useAuth();
  const currentUserName = actorName(currentUser);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (LOCAL_WORKSPACE_PREVIEW) {
        const taskResult = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (taskResult.error) throw taskResult.error;
        const stored = readLocalWorkspace();
        const previewState = stored ?? {
          tasks: (taskResult.data || []).map(dbRowToTask),
          dependencies: [],
        };
        if (!stored) writeLocalWorkspace(previewState);
        setTasks(previewState.tasks);
        setDependencies(previewState.dependencies);
        setTemplates(PREVIEW_TEMPLATES);
        return;
      }

      // Idempotent: when the policy migration is available, this keeps aged
      // tasks and their automatic priorities in sync before rendering them.
      const { error: automationError } = await (supabase.rpc as unknown as TaskPriorityAutomationRpc)(
        'reconcile_stale_task_priorities',
        { p_actor_name: currentUserName || 'Sistema' },
      );

      if (automationError && automationError.code !== '42883') {
        console.warn('Task priority automation was not applied:', automationError.message);
      }

      const [taskResult, dependencyResult, templateResult] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('task_dependencies').select('*'),
        supabase.from('task_templates').select('*').eq('is_active', true).order('name'),
      ]);

      if (taskResult.error) throw taskResult.error;
      if (dependencyResult.error) throw dependencyResult.error;
      if (templateResult.error) throw templateResult.error;
      setTasks((taskResult.data || []).map(dbRowToTask));
      setDependencies((dependencyResult.data || []) as TaskDependency[]);
      setTemplates((templateResult.data || []).map((template) => ({
        ...template,
        default_priority: template.default_priority as TaskTemplate['default_priority'],
        subtasks: Array.isArray(template.subtasks)
          ? template.subtasks.filter((item): item is string => typeof item === 'string')
          : [],
      })));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Não foi possível carregar as tarefas.');
      toast.error('Erro ao carregar tarefas');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserName]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!LOCAL_WORKSPACE_PREVIEW) return;
    const syncLocalWorkspace = () => {
      const stored = readLocalWorkspace();
      if (!stored) return;
      setTasks(stored.tasks);
      setDependencies(stored.dependencies);
    };
    window.addEventListener(LOCAL_WORKSPACE_EVENT, syncLocalWorkspace);
    return () => window.removeEventListener(LOCAL_WORKSPACE_EVENT, syncLocalWorkspace);
  }, []);

  const createTask = useCallback(async (
    clientId: string,
    data: TaskFormData,
    clientName?: string,
    refresh = true,
  ): Promise<Task | null> => {
    try {
      if (LOCAL_WORKSPACE_PREVIEW) {
        const created = createLocalTask(clientId, data);
        writeLocalWorkspace({ tasks: [created, ...tasks], dependencies });
        return created;
      }

      const { data: inserted, error } = await supabase.from('tasks').insert({
        client_id: clientId,
        title: data.title,
        description: data.description?.trim() || null,
        assigned_to: data.assigned_to,
        due_date: data.due_date || null,
        scheduled_for: data.scheduled_for || null,
        priority: data.priority || 'normal',
        modality: data.modality || 'levantamento',
        status: data.status || 'pendente',
        parent_task_id: data.parent_task_id || null,
        source_comment_id: data.source_comment_id || null,
        recurrence: data.recurrence || 'none',
        sort_order: data.sort_order || 0,
      }).select('*').single();

      if (error) throw error;
      if (refresh) await fetchTasks();
      ActivityLogger.createTask(currentUserName, clientName || 'Cliente', clientId, data.title);
      return dbRowToTask(inserted);
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Erro ao criar tarefa');
      return null;
    }
  }, [currentUserName, dependencies, fetchTasks, tasks]);

  const addTask = useCallback(async (clientId: string, data: TaskFormData, clientName?: string) => {
    const task = await createTask(clientId, data, clientName);
    if (task) toast.success(data.parent_task_id ? 'Subtarefa criada!' : 'Tarefa criada!');
    return !!task;
  }, [createTask]);

  const addTaskFromTemplate = useCallback(async (
    clientId: string,
    template: TaskTemplate,
    overrides: Partial<TaskFormData>,
    clientName?: string,
  ) => {
    if (LOCAL_WORKSPACE_PREVIEW) {
      const parent = createLocalTask(clientId, {
        title: overrides.title || template.default_title,
        description: overrides.description ?? template.default_description ?? undefined,
        assigned_to: overrides.assigned_to || [],
        due_date: overrides.due_date,
        priority: overrides.priority || template.default_priority,
        modality: overrides.modality || 'levantamento',
        status: overrides.status || 'pendente',
        recurrence: overrides.recurrence || 'none',
      });
      const childTasks = template.subtasks.map((title, index) => createLocalTask(clientId, {
        title,
        assigned_to: overrides.assigned_to || [],
        priority: overrides.priority || template.default_priority,
        modality: overrides.modality || 'levantamento',
        parent_task_id: parent.id,
        sort_order: index,
      }));
      writeLocalWorkspace({ tasks: [parent, ...childTasks, ...tasks], dependencies });
      toast.success('Tarefa criada a partir do modelo');
      return true;
    }

    const parent = await createTask(clientId, {
      title: overrides.title || template.default_title,
      description: overrides.description ?? template.default_description ?? undefined,
      assigned_to: overrides.assigned_to || [],
      due_date: overrides.due_date,
      priority: overrides.priority || template.default_priority,
      modality: overrides.modality || 'levantamento',
      status: overrides.status || 'pendente',
      recurrence: overrides.recurrence || 'none',
    }, clientName, false);
    if (!parent) return false;

    if (template.subtasks.length > 0) {
      const { error } = await supabase.from('tasks').insert(template.subtasks.map((title, index) => ({
        client_id: clientId,
        title,
        assigned_to: overrides.assigned_to || [],
        priority: overrides.priority || template.default_priority,
        modality: overrides.modality || 'levantamento',
        parent_task_id: parent.id,
        status: 'pendente',
        sort_order: index,
      })));
      if (error) {
        console.error('Error adding template subtasks:', error);
        toast.error('A tarefa foi criada, mas as etapas não puderam ser adicionadas');
      }
    }

    await fetchTasks();
    toast.success('Tarefa criada a partir do modelo');
    return true;
  }, [createTask, dependencies, fetchTasks, tasks]);

  const updateTask = useCallback(async (taskId: string, data: Partial<Task>) => {
    try {
      const currentTask = tasks.find((task) => task.id === taskId);
      const isCompleting = data.completed === true || data.status === 'concluida';
      if (isCompleting && !canCompleteTask(taskId, tasks)) {
        toast.error('Conclua ou cancele as subtarefas abertas primeiro');
        return false;
      }

      if (LOCAL_WORKSPACE_PREVIEW) {
        if (!currentTask) return false;
        const now = new Date().toISOString();
        let completed = data.completed ?? currentTask.completed;
        let status = data.status ?? currentTask.status;
        let completedAt = currentTask.completed_at;

        if (data.completed === true || data.status === 'concluida') {
          completed = true;
          status = 'concluida';
          completedAt = completedAt || now;
        } else if (data.completed === false) {
          completed = false;
          status = currentTask.status === 'concluida' ? 'pendente' : status;
          completedAt = null;
        } else if (data.status) {
          completed = false;

          completedAt = null;
        }

        const updatedTask: Task = {
          ...currentTask,
          ...data,
          completed,
          status,
          completed_at: completedAt,
          updated_at: now,
        };
        let nextTasks = tasks.map((item) => item.id === taskId ? updatedTask : item);

        if (isCompleting && !currentTask.completed && currentTask.recurrence !== 'none' && !currentTask.parent_task_id) {
          const nextTask = createLocalTask(currentTask.client_id, {
            title: currentTask.title,
            description: currentTask.description ?? undefined,
            assigned_to: currentTask.assigned_to,
            due_date: getNextRecurrenceDate(currentTask.due_date, currentTask.recurrence) ?? undefined,
            priority: currentTask.priority,
            modality: currentTask.modality,
            recurrence: currentTask.recurrence,
          });
          nextTask.recurrence_origin_id = currentTask.recurrence_origin_id || currentTask.id;
          const nextChildren = tasks
            .filter((item) => item.parent_task_id === currentTask.id)
            .map((child) => createLocalTask(child.client_id, {
              title: child.title,
              description: child.description ?? undefined,
              assigned_to: child.assigned_to,
              priority: child.priority,
              modality: child.modality,
              parent_task_id: nextTask.id,
              sort_order: child.sort_order,
            }));
          nextTasks = [nextTask, ...nextChildren, ...nextTasks];
          toast.success('Próxima ocorrência criada automaticamente');
        }

        writeLocalWorkspace({ tasks: nextTasks, dependencies });
        return true;
      }

      const updateData: Database['public']['Tables']['tasks']['Update'] = { ...data };
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

      if (currentTask && isCompleting && !currentTask.completed && currentTask.recurrence !== 'none' && !currentTask.parent_task_id) {
        const nextDueDate = getNextRecurrenceDate(currentTask.due_date, currentTask.recurrence);
        const recurrenceOriginId = currentTask.recurrence_origin_id || currentTask.id;
        const { data: nextTask, error: recurrenceError } = await supabase.from('tasks').insert({
          client_id: currentTask.client_id,
          title: currentTask.title,
          description: currentTask.description,
          assigned_to: currentTask.assigned_to,
          due_date: nextDueDate,
          priority: currentTask.priority,
          modality: currentTask.modality,
          status: 'pendente',
          recurrence: currentTask.recurrence,
          recurrence_origin_id: recurrenceOriginId,
        }).select('*').single();

        if (recurrenceError && recurrenceError.code !== '23505') throw recurrenceError;
        if (nextTask) {
          const childTasks = tasks.filter((task) => task.parent_task_id === currentTask.id);
          if (childTasks.length > 0) {
            const { error: childrenError } = await supabase.from('tasks').insert(childTasks.map((child) => ({
              client_id: child.client_id,
              title: child.title,
              description: child.description,
              assigned_to: child.assigned_to,
              due_date: null,
              priority: child.priority,
              modality: child.modality,
              status: 'pendente',
              parent_task_id: nextTask.id,
              sort_order: child.sort_order,
            })));
            if (childrenError) throw childrenError;
          }
          toast.success('Próxima ocorrência criada automaticamente');
        }
      }

      await fetchTasks();
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Erro ao atualizar tarefa');
      return false;
    }
  }, [dependencies, fetchTasks, tasks]);

  const bulkUpdateTasks = useCallback(async (
    taskIds: string[],
    data: Partial<Pick<Task, 'assigned_to' | 'priority' | 'modality' | 'scheduled_for'>>,
  ) => {
    const uniqueTaskIds = [...new Set(taskIds)];
    if (uniqueTaskIds.length === 0) return false;

    try {
      if (LOCAL_WORKSPACE_PREVIEW) {
        const selectedIds = new Set(uniqueTaskIds);
        const now = new Date().toISOString();
        writeLocalWorkspace({
          tasks: tasks.map(task => selectedIds.has(task.id) ? { ...task, ...data, updated_at: now } : task),
          dependencies,
        });
        toast.success(`${uniqueTaskIds.length} tarefas atualizadas`);
        return true;
      }

      const { error } = await supabase
        .from('tasks')
        .update(data)
        .in('id', uniqueTaskIds);

      if (error) throw error;
      await fetchTasks();
      toast.success(`${uniqueTaskIds.length} tarefas atualizadas`);
      return true;
    } catch (error) {
      console.error('Error bulk updating tasks:', error);
      toast.error('Erro ao atualizar tarefas em massa');
      return false;
    }
  }, [dependencies, fetchTasks, tasks]);

  const setTaskDependencies = useCallback(async (taskId: string, dependsOnIds: string[]) => {
    try {
      if (LOCAL_WORKSPACE_PREVIEW) {
        const nextDependencies = [
          ...dependencies.filter((item) => item.task_id !== taskId),
          ...dependsOnIds.map((dependsOnTaskId) => ({
            task_id: taskId,
            depends_on_task_id: dependsOnTaskId,
            created_at: new Date().toISOString(),
          })),
        ];
        writeLocalWorkspace({ tasks, dependencies: nextDependencies });
        toast.success('Dependências atualizadas');
        return true;
      }

      const { error: deleteError } = await supabase.from('task_dependencies').delete().eq('task_id', taskId);
      if (deleteError) throw deleteError;
      if (dependsOnIds.length > 0) {
        const { error: insertError } = await supabase.from('task_dependencies').insert(
          dependsOnIds.map((dependsOnTaskId) => ({ task_id: taskId, depends_on_task_id: dependsOnTaskId })),
        );
        if (insertError) throw insertError;
      }
      await fetchTasks();
      toast.success('Dependências atualizadas');
      return true;
    } catch (error) {
      console.error('Error updating task dependencies:', error);
      toast.error('Erro ao atualizar dependências');
      return false;
    }
  }, [dependencies, fetchTasks, tasks]);

  const deleteTask = useCallback(async (taskId: string, _clientName?: string) => {
    try {
      if (LOCAL_WORKSPACE_PREVIEW) {
        const removedIds = new Set([taskId, ...tasks.filter((task) => task.parent_task_id === taskId).map((task) => task.id)]);
        writeLocalWorkspace({
          tasks: tasks.filter((task) => !removedIds.has(task.id)),
          dependencies: dependencies.filter((item) => !removedIds.has(item.task_id) && !removedIds.has(item.depends_on_task_id)),
        });
        toast.success('Tarefa excluída');
        return true;
      }

      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      await fetchTasks();
      toast.success('Tarefa excluída');
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Erro ao excluir tarefa');
      return false;
    }
  }, [dependencies, fetchTasks, tasks]);

  const toggleComplete = useCallback(async (taskId: string, _clientName?: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;
    const newCompleted = !task.completed;
    const result = await updateTask(taskId, { completed: newCompleted });
    return result;
  }, [tasks, updateTask]);

  const getActiveTasksForClient = useCallback((clientId: string) => {
    return tasks.filter(t => t.client_id === clientId && !t.completed && !isFutureScheduled(t));
  }, [tasks]);

  const getTasksForClient = useCallback((clientId: string) => {
    return tasks.filter(t => t.client_id === clientId);
  }, [tasks]);

  const getActiveTaskCount = useCallback((clientId: string) => {
    return tasks.filter(t => t.client_id === clientId && !t.completed && !isFutureScheduled(t)).length;
  }, [tasks]);

  const clientsWithActiveTasks = new Set(
    tasks.filter(t => !t.completed && !isFutureScheduled(t)).map(t => t.client_id)
  );

  const getTasksByCollaborator = useCallback((collaborator: string) => {
    return tasks.filter(t => assigneeMatches(t.assigned_to, collaborator) && !t.completed && !isFutureScheduled(t));
  }, [tasks]);

  const getDaysOpen = useCallback((task: Task) => {
    const start = new Date(task.created_at);
    const end = task.completed && task.completed_at ? new Date(task.completed_at) : new Date();
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  const getOldestTask = useCallback(() => {
    const pending = tasks.filter(t => !t.completed && !isFutureScheduled(t));
    if (pending.length === 0) return null;
    return pending.reduce((oldest, t) =>
      new Date(t.created_at) < new Date(oldest.created_at) ? t : oldest
    );
  }, [tasks]);

  const getAverageDaysOpen = useCallback(() => {
    const pending = tasks.filter(t => !t.completed && !isFutureScheduled(t));
    if (pending.length === 0) return 0;
    const totalDays = pending.reduce((sum, t) => sum + getDaysOpen(t), 0);
    return Math.round(totalDays / pending.length);
  }, [tasks, getDaysOpen]);

  const getOverdueTasks = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks
      .filter(t => !t.completed && !isFutureScheduled(t) && t.due_date && new Date(t.due_date) < today)
      .map(t => {
        const dueDate = new Date(t.due_date!);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return { ...t, daysOverdue };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [tasks]);

  return {
    tasks,
    dependencies,
    templates,
    isLoading,
    error,
    addTask,
    addTaskFromTemplate,
    updateTask,
    bulkUpdateTasks,
    deleteTask,
    toggleComplete,
    setTaskDependencies,
    getActiveTasksForClient,
    getTasksForClient,
    getActiveTaskCount,
    clientsWithActiveTasks,
    getTasksByCollaborator,
    getDaysOpen,
    getOldestTask,
    getAverageDaysOpen,
    getOverdueTasks,
    refetch: fetchTasks,
  };
}
