import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, BadgeCheck, CalendarPlus, CalendarX2, Check, ClipboardCheck, Clock3, Eye, FileCheck2, Flame, History, MessageSquareText, Minus, PenLine, Plus, Search, Settings2, ShieldCheck, Star, Trash2, User, UserRoundX, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ClientWorkList } from '@/components/client-work/ClientWorkList';
import { assigneeMatches, findCollaboratorColor } from '@/lib/taskAssignee';
import { Task, TaskFormData, TaskModality, TaskPriority, PRIORITY_CONFIG, TASK_MODALITY_CONFIG, TASK_STATUS_CONFIG } from '@/types/task';
import { Client } from '@/types/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClientWorkItems } from '@/hooks/useClientWorkItems';
import type { WorkItem, WorkItemFilter } from '@/types/workItem';
import type { TaskDependency, TaskTemplate } from '@/types/task';
import { getTaskProgress } from '@/lib/taskOperations';
import { cn } from '@/lib/utils';

const MODALITY_ICONS: Record<TaskModality, typeof Search> = {
  levantamento: Search,
  elaboracao: PenLine,
  regularizacao: BadgeCheck,
  acompanhamento: Eye,
  execucao_operacional: Settings2,
};

const MODALITY_VISUALS: Record<TaskModality, { className: string; selectedClassName: string }> = {
  levantamento: {
    className: 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100',
    selectedClassName: 'border-cyan-600 bg-cyan-600 text-white hover:bg-cyan-600',
  },
  elaboracao: {
    className: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
    selectedClassName: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-600',
  },
  regularizacao: {
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    selectedClassName: 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600',
  },
  acompanhamento: {
    className: 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100',
    selectedClassName: 'border-violet-600 bg-violet-600 text-white hover:bg-violet-600',
  },
  execucao_operacional: {
    className: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
    selectedClassName: 'border-amber-500 bg-amber-500 text-white hover:bg-amber-500',
  },
};

const PRIORITY_VISUALS: Record<TaskPriority, { icon: typeof Flame; shortLabel: string; className: string }> = {
  urgente: { icon: Flame, shortLabel: 'Urg.', className: 'border-red-300 bg-red-50 text-red-700' },
  alta: { icon: ArrowUp, shortLabel: 'Alta', className: 'border-orange-300 bg-orange-50 text-orange-700' },
  normal: { icon: Minus, shortLabel: 'Normal', className: 'border-slate-200 bg-background text-slate-600' },
  baixa: { icon: ArrowDown, shortLabel: 'Baixa', className: 'border-sky-200 bg-sky-50 text-sky-700' },
};

const isFutureScheduled = (task: Task) => Boolean(
  task.scheduled_for && task.scheduled_for > new Date().toISOString().slice(0, 10),
);

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  tasks: Task[];
  dependencies: TaskDependency[];
  templates: TaskTemplate[];
  onAddTask: (clientId: string, data: TaskFormData) => Promise<boolean>;
  onToggleComplete: (taskId: string) => Promise<boolean>;
  onUpdateTask: (taskId: string, data: Partial<Task>) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
  onAddTaskFromTemplate: (clientId: string, template: TaskTemplate, overrides: Partial<TaskFormData>, clientName?: string) => Promise<boolean>;
  onSetTaskDependencies: (taskId: string, dependsOnIds: string[]) => Promise<boolean>;
  initialView?: WorkItemFilter;
}

type SubtaskDraft = Pick<TaskFormData, 'title' | 'assigned_to' | 'due_date' | 'priority' | 'modality'>;

export function TaskModal({
  isOpen,
  onClose,
  client,
  tasks,
  onAddTask,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  initialView = 'all',
}: TaskModalProps) {
  const navigate = useNavigate();
  const { collaborators } = useAuth();
  const {
    items: workItems,
    isLoading: workItemsLoading,
    error: workItemsError,
    refetch: refetchWorkItems,
  } = useClientWorkItems(client.id, tasks);
  const [activeView, setActiveView] = useState<WorkItemFilter>(initialView);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('normal');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [newTaskModality, setNewTaskModality] = useState<TaskModality>('levantamento');

  const collaboratorColorMap: Record<string, string> = {};
  collaborators.forEach(c => { collaboratorColorMap[c.name] = c.color; });

  const activeTasks = tasks
    .filter(t => !t.parent_task_id && !t.completed && t.status !== 'cancelada' && !isFutureScheduled(t))
    .sort((a, b) => (PRIORITY_CONFIG[a.priority]?.order ?? 9) - (PRIORITY_CONFIG[b.priority]?.order ?? 9));
  const completedTasks = tasks.filter(t => !t.parent_task_id && (t.completed || t.status === 'cancelada'));
  const openTasks = activeTasks.length;
  const overdueTasks = activeTasks.filter((task) => task.due_date && new Date(`${task.due_date}T23:59:59`) < new Date()).length;
  const waitingTasks = activeTasks.filter((task) => task.status === 'aguardando_cliente' || task.status === 'aguardando_terceiro').length;
  const unassignedTasks = activeTasks.filter((task) => task.assigned_to.length === 0).length;
  const nextAction = [...activeTasks].sort((left, right) => {
    const leftDue = left.due_date ? new Date(left.due_date).getTime() : Number.MAX_SAFE_INTEGER;
    const rightDue = right.due_date ? new Date(right.due_date).getTime() : Number.MAX_SAFE_INTEGER;
    return leftDue - rightDue || new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
  })[0];
  const filteredWorkItems =
    activeView === 'all'
      ? workItems
      : workItems.filter(item => item.kind === activeView);
  const overviewItems = [
    { kind: 'task' as const, label: 'Tarefas', count: tasks.filter((task) => !task.parent_task_id).length, icon: ClipboardCheck, className: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100' },
    { kind: 'priority' as const, label: 'Prioridades', count: workItems.filter(item => item.kind === 'priority').length, icon: Star, className: 'border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100' },
    { kind: 'deliverable' as const, label: 'Entregáveis', count: workItems.filter(item => item.kind === 'deliverable').length, icon: FileCheck2, className: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100' },
    { kind: 'audit' as const, label: 'Auditorias', count: workItems.filter(item => item.kind === 'audit').length, icon: ShieldCheck, className: 'border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100' },
    { kind: 'comment' as const, label: 'Comentários', count: workItems.filter(item => item.kind === 'comment' && item.status !== 'completed').length, icon: MessageSquareText, className: 'border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100' },
  ];

  useEffect(() => {
    if (isOpen) setActiveView(initialView);
  }, [initialView, isOpen]);

  const handleOpenSource = (item: WorkItem) => {
    if (!item.sourcePath) return;
    const separator = item.sourcePath.includes('?') ? '&' : '?';
    onClose();
    navigate(`${item.sourcePath}${separator}clientId=${client.id}`);
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    const success = await onAddTask(client.id, {
      title: newTaskTitle.trim(),
      assigned_to: newTaskAssignees,
      due_date: newTaskDueDate || undefined,
      priority: newTaskPriority,
      modality: newTaskModality,
    });

    if (success) {
      setNewTaskTitle('');
      setNewTaskAssignees([]);
      setNewTaskDueDate('');
      setNewTaskPriority('normal');
      setNewTaskModality('levantamento');
    }
  };

  const handleAddSubtask = async (parentTask: Task, draft: SubtaskDraft) => {
    const siblingCount = tasks.filter((task) => task.parent_task_id === parentTask.id).length;
    return onAddTask(client.id, {
      ...draft,
      parent_task_id: parentTask.id,
      sort_order: siblingCount,
    });
  };

  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
  };

  const handleSaveEdit = async (taskId: string) => {
    if (!editingTitle.trim()) return;
    await onUpdateTask(taskId, { title: editingTitle.trim() });
    setEditingTaskId(null);
    setEditingTitle('');
  };

  const handleAssigneeChange = async (taskId: string, collaboratorName: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const current = task.assigned_to || [];
    const isAssigned = current.some(a => a.toLowerCase() === collaboratorName.toLowerCase());
    const newAssignees = isAssigned
      ? current.filter(a => a.toLowerCase() !== collaboratorName.toLowerCase())
      : [...current, collaboratorName];
    await onUpdateTask(taskId, { assigned_to: newAssignees });
  };

  const handlePriorityChange = async (taskId: string, priority: TaskPriority) => {
    await onUpdateTask(taskId, { priority });
  };

  const handleModalityChange = async (taskId: string, modality: TaskModality) => {
    await onUpdateTask(taskId, { modality });
  };

  const handleDueDateChange = async (taskId: string, dueDate: string) => {
    await onUpdateTask(taskId, { due_date: dueDate || null });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showClose={false} className="flex max-h-[86vh] w-[calc(100vw-2rem)] max-w-4xl flex-col gap-3 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="relative border-b px-5 py-4">
          <DialogTitle className="flex min-w-0 items-center gap-3 pr-12">
            {client.logoUrl ? (
              <img src={client.logoUrl} alt="" className="h-8 w-8 flex-shrink-0 rounded object-contain" />
            ) : (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {client.initials}
              </div>
            )}
            <div className="min-w-0">
              <span className="block truncate">Central do Cliente - {client.name}</span>
              <span className="block text-xs font-normal text-muted-foreground">
                {workItems.length} itens vinculados
              </span>
              {import.meta.env.VITE_CLIENT_WORKSPACE_PREVIEW === 'true' && (
                <span className="mt-1 block text-[10px] font-semibold uppercase text-amber-700">
                  Avaliação local: alterações não afetam a produção
                </span>
              )}
            </div>
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Fechar Central do Cliente"
            aria-label="Fechar Central do Cliente"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          {activeView === 'all' ? (
            <div className="flex-1 space-y-5 overflow-auto px-5 py-5">
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumo operacional</p>
                <h3 className="mt-1 text-base font-semibold">O que precisa de atenção neste cliente</h3>
              </section>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <SummaryMetric label="Tarefas abertas" value={openTasks} icon={ClipboardCheck} tone="text-sky-700" />
                <SummaryMetric label="Atrasadas" value={overdueTasks} icon={AlertTriangle} tone={overdueTasks ? 'text-red-700' : 'text-muted-foreground'} />
                <SummaryMetric label="Aguardando" value={waitingTasks} icon={Clock3} tone={waitingTasks ? 'text-amber-700' : 'text-muted-foreground'} />
                <SummaryMetric label="Sem responsável" value={unassignedTasks} icon={UserRoundX} tone={unassignedTasks ? 'text-violet-700' : 'text-muted-foreground'} />
              </div>

              <section className="border-y bg-muted/20 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Próxima ação</p>
                    {nextAction ? (
                      <button type="button" onClick={() => setActiveView('task')} className="mt-1 block max-w-full truncate text-left text-sm font-semibold hover:text-primary">
                        {nextAction.title}
                      </button>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">Nenhuma tarefa aberta.</p>
                    )}
                  </div>
                  {nextAction?.due_date && (
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {new Date(`${nextAction.due_date}T12:00:00`).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </section>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {overviewItems.map(({ kind, label, count, icon: Icon, className }) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setActiveView(kind)}
                    className={`flex min-h-20 items-center gap-3 rounded-lg border p-3 text-left transition-colors ${className}`}
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-background/80 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-lg font-bold leading-none">{count}</span>
                      <span className="mt-1 block text-xs font-semibold">{label}</span>
                    </span>
                  </button>
                ))}
              </div>

              <section>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4 text-muted-foreground" /> Últimas movimentações</div>
                <div className="divide-y border">
                  {[...workItems]
                    .sort((left, right) => new Date(right.completedAt ?? right.createdAt).getTime() - new Date(left.completedAt ?? left.createdAt).getTime())
                    .slice(0, 6)
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => item.kind === 'task' ? setActiveView('task') : handleOpenSource(item)}
                        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 text-left hover:bg-muted/40"
                      >
                        <span className="text-[10px] font-semibold uppercase text-muted-foreground">{item.kind === 'comment' ? 'Comentário' : item.kind === 'task' ? 'Tarefa' : item.kind}</span>
                        <span className="truncate text-xs font-medium">{item.title}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(item.completedAt ?? item.createdAt).toLocaleDateString('pt-BR')}</span>
                      </button>
                    ))}
                  {workItems.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Ainda não há movimentações registradas.</p>}
                </div>
              </section>
            </div>
          ) : (
            <div className="flex-1 space-y-4 overflow-auto px-5 pb-5 pt-3">
              <button
                type="button"
                onClick={() => setActiveView('all')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar à visão geral
              </button>
              {activeView !== 'task' ? (
              <ClientWorkList
                items={filteredWorkItems}
                isLoading={workItemsLoading}
                error={workItemsError}
                emptyMessage={
                  `Nenhum item desta categoria vinculado ao cliente.`
                }
                onOpenSource={handleOpenSource}
                onRetry={() => void refetchWorkItems()}
              />
              ) : (
              <>
                {/* Add new task */}
                <div className="sticky top-0 z-10 border bg-background/95 p-2 backdrop-blur">
                  <div className="grid gap-2">
                    <ModalitySelector value={newTaskModality} onChange={setNewTaskModality} />
                    <div className="grid grid-cols-[minmax(0,1fr)_40px] gap-2">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Nova tarefa..."
                        className="h-10 min-w-0 border bg-background px-3 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        maxLength={100}
                      />
                      <button
                        onClick={handleAddTask}
                        disabled={!newTaskTitle.trim()}
                        className="grid h-10 place-items-center bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Adicionar tarefa"
                        aria-label="Adicionar tarefa"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] gap-2">
                      <NewTaskAssigneeDropdown
                        collaborators={collaborators}
                        selected={newTaskAssignees}
                        onChange={setNewTaskAssignees}
                      />
                      <PrioritySelector value={newTaskPriority} onChange={setNewTaskPriority} />
                      <label className="flex h-9 min-w-0 items-center gap-1 border bg-background px-2">
                        <Clock3 className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                        <input
                          type="date"
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                          className="h-8 min-w-0 flex-1 bg-transparent text-xs outline-none"
                          aria-label="Prazo da nova tarefa"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Active tasks */}
                <div className="space-y-1.5">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    Tarefas Ativas ({activeTasks.length})
                  </h4>
                  {activeTasks.length === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground/50">Nenhuma tarefa ativa</p>
                  ) : (
                    <div className="space-y-1.5">
                      {activeTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          isEditing={editingTaskId === task.id}
                          editingTitle={editingTitle}
                          setEditingTitle={setEditingTitle}
                          onToggle={() => onToggleComplete(task.id)}
                          onStartEdit={() => handleStartEdit(task)}
                          onSaveEdit={() => handleSaveEdit(task.id)}
                          onCancelEdit={() => setEditingTaskId(null)}
                          onAssigneeChange={(a) => handleAssigneeChange(task.id, a)}
                          onPriorityChange={(p) => handlePriorityChange(task.id, p)}
                          onModalityChange={(modality) => handleModalityChange(task.id, modality)}
                          onDueDateChange={(dueDate) => handleDueDateChange(task.id, dueDate)}
                          onScheduleChange={(date) => onUpdateTask(task.id, { scheduled_for: date })}
                          onDelete={() => onDeleteTask(task.id)}
                          subtasks={tasks.filter((item) => item.parent_task_id === task.id)}
                          onAddSubtask={(draft) => handleAddSubtask(task, draft)}
                          onToggleSubtask={(subtaskId) => onToggleComplete(subtaskId)}
                          onUpdateSubtask={(subtaskId, data) => onUpdateTask(subtaskId, data)}
                          onDeleteSubtask={(subtaskId) => onDeleteTask(subtaskId)}
                          progress={getTaskProgress(task.id, tasks)}
                          collaborators={collaborators}
                          collaboratorColorMap={collaboratorColorMap}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Completed tasks */}
                {completedTasks.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Concluídas ({completedTasks.length})
                    </h4>
                    <div className="space-y-1 opacity-70">
                      {completedTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          isEditing={false}
                          editingTitle=""
                          setEditingTitle={() => {}}
                          onToggle={() => onToggleComplete(task.id)}
                          onStartEdit={() => {}}
                          onSaveEdit={() => {}}
                          onCancelEdit={() => {}}
                          onAssigneeChange={() => {}}
                          onPriorityChange={() => {}}
                          onModalityChange={(modality) => handleModalityChange(task.id, modality)}
                          onDueDateChange={() => {}}
                          onScheduleChange={(date) => onUpdateTask(task.id, { scheduled_for: date })}
                          onDelete={() => onDeleteTask(task.id)}
                          subtasks={tasks.filter((item) => item.parent_task_id === task.id)}
                          onAddSubtask={(draft) => handleAddSubtask(task, draft)}
                          onToggleSubtask={(subtaskId) => onToggleComplete(subtaskId)}
                          onUpdateSubtask={(subtaskId, data) => onUpdateTask(subtaskId, data)}
                          onDeleteSubtask={(subtaskId) => onDeleteTask(subtaskId)}
                          progress={getTaskProgress(task.id, tasks)}
                          collaborators={collaborators}
                          collaboratorColorMap={collaboratorColorMap}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TaskItemProps {
  task: Task;
  isEditing: boolean;
  editingTitle: string;
  setEditingTitle: (v: string) => void;
  onToggle: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onAssigneeChange: (collaboratorName: string) => void;
  onPriorityChange: (priority: TaskPriority) => void;
  onModalityChange: (modality: TaskModality) => void;
  onDueDateChange: (dueDate: string) => void;
  onScheduleChange: (date: string | null) => Promise<boolean>;
  onDelete: () => void;
  subtasks: Task[];
  onAddSubtask: (draft: SubtaskDraft) => Promise<boolean>;
  onToggleSubtask: (taskId: string) => Promise<boolean>;
  onUpdateSubtask: (taskId: string, data: Partial<Task>) => Promise<boolean>;
  onDeleteSubtask: (taskId: string) => Promise<boolean>;
  progress: { completed: number; total: number };
  collaborators: { id: string; name: string; color: string; initials: string }[];
  collaboratorColorMap: Record<string, string>;
}

function TaskItem({
  task,
  isEditing,
  editingTitle,
  setEditingTitle,
  onToggle,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onAssigneeChange,
  onPriorityChange,
  onModalityChange,
  onDueDateChange,
  onScheduleChange,
  onDelete,
  subtasks,
  onAddSubtask,
  onToggleSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  progress,
  collaborators,
  collaboratorColorMap,
}: TaskItemProps) {
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskModality, setSubtaskModality] = useState<TaskModality>(task.modality || 'levantamento');
  const [subtaskPriority, setSubtaskPriority] = useState<TaskPriority>(task.priority || 'normal');
  const [subtaskAssignees, setSubtaskAssignees] = useState<string[]>(task.assigned_to);
  const [subtaskDueDate, setSubtaskDueDate] = useState('');
  const [isSavingSubtask, setIsSavingSubtask] = useState(false);
  const priority = (task.priority || 'normal') as TaskPriority;
  const modality = (task.modality || 'levantamento') as TaskModality;
  const pConf = PRIORITY_CONFIG[priority];
  const status = TASK_STATUS_CONFIG[task.status];
  const daysOpen = Math.max(0, Math.floor((Date.now() - new Date(task.created_at).getTime()) / 86_400_000));
  const containerClass = task.completed
    ? 'bg-card border'
    : `${pConf.bgClass} ${pConf.borderClass} border-y border-r`;

  const submitSubtask = async () => {
    const title = subtaskTitle.trim();
    if (!title || isSavingSubtask) return;
    setIsSavingSubtask(true);
    try {
      const created = await onAddSubtask({
        title,
        modality: subtaskModality,
        priority: subtaskPriority,
        assigned_to: subtaskAssignees,
        due_date: subtaskDueDate || undefined,
      });
      if (created) {
        setSubtaskTitle('');
        setSubtaskDueDate('');
        setIsAddingSubtask(false);
      }
    } finally {
      setIsSavingSubtask(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className={`group flex items-center gap-2 rounded-md px-3 py-2 ${containerClass}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={task.completed ? `Reabrir tarefa ${task.title}` : `Concluir tarefa ${task.title}`}
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
          task.completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-muted-foreground/30 hover:border-primary'
        }`}
      >
        {task.completed && <Check className="h-3.5 w-3.5" />}
      </button>

      {isEditing ? (
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          className="h-8 flex-1 rounded border bg-background px-3 text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveEdit();
            if (e.key === 'Escape') onCancelEdit();
          }}
          onBlur={onSaveEdit}
        />
      ) : (
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ModalityMenu value={modality} onChange={onModalityChange} />
            {!task.completed && task.status !== 'pendente' && (
              <span className={cn('flex-shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold', status.className)}>
                {status.label}
              </span>
            )}
            <span
              className={`min-w-0 truncate text-sm leading-snug ${task.completed ? 'text-muted-foreground line-through' : ''}`}
              onDoubleClick={onStartEdit}
              title={task.title}
            >
              {task.title}
            </span>
          </div>
          {!task.completed && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              <PriorityMenu value={priority} onChange={onPriorityChange} />
              <span>Criada há {daysOpen} {daysOpen === 1 ? 'dia' : 'dias'}</span>
              {progress.total > 0 && <span>{progress.completed}/{progress.total} etapas</span>}
              <label className="flex w-fit items-center gap-1">
                <span>Prazo</span>
              <input
                type="date"
                value={task.due_date ?? ''}
                onChange={(event) => onDueDateChange(event.target.value)}
                className={`h-6 rounded border bg-background px-1 text-[10px] outline-none ${
                  task.due_date && new Date(task.due_date) < new Date(new Date().toDateString())
                    ? 'border-destructive text-destructive font-bold'
                    : 'border-border'
                }`}
                aria-label={`Prazo da tarefa ${task.title}`}
              />
              </label>
            </div>
          )}
        </div>
      )}

      {!task.completed && (
        <>
          <button
            type="button"
            onClick={() => {
              setSubtaskModality(task.modality || 'levantamento');
              setSubtaskPriority(task.priority || 'normal');
              setSubtaskAssignees(task.assigned_to);
              setIsAddingSubtask((current) => !current);
            }}
            className={cn(
              'grid h-7 w-7 flex-shrink-0 place-items-center border text-muted-foreground transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary',
              isAddingSubtask && 'border-primary bg-primary/10 text-primary',
            )}
            title="Adicionar subtarefa"
            aria-label={`Adicionar subtarefa em ${task.title}`}
          >
            <Plus className="h-4 w-4" />
          </button>
          <AssigneeDropdown
            task={task}
            collaborators={collaborators}
            collaboratorColorMap={collaboratorColorMap}
            onAssigneeChange={onAssigneeChange}
          />
          <TaskReplanMenu task={task} onScheduleChange={onScheduleChange} />
        </>
      )}

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Excluir tarefa ${task.title}`}
        className="p-1 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      </div>

      {isAddingSubtask && !task.completed && (
        <div className="ml-9 border-l-2 border-primary/30 bg-muted/20 py-1 pl-3 pr-1">
          <div className="flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
            <input
              type="text"
              value={subtaskTitle}
              onChange={(event) => setSubtaskTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void submitSubtask();
                if (event.key === 'Escape') {
                  setSubtaskTitle('');
                  setIsAddingSubtask(false);
                }
              }}
              placeholder="Escreva a subtarefa e pressione Enter"
              className="h-8 min-w-0 flex-1 border-0 bg-transparent px-1 text-xs outline-none"
              maxLength={100}
              autoFocus
            />
            <ModalityMenu value={subtaskModality} onChange={setSubtaskModality} />
            <PriorityMenu value={subtaskPriority} onChange={setSubtaskPriority} />
            <SubtaskAssigneeMenu
              selected={subtaskAssignees}
              collaborators={collaborators}
              onChange={setSubtaskAssignees}
            />
            <button
              type="button"
              onClick={() => void submitSubtask()}
              disabled={!subtaskTitle.trim() || isSavingSubtask}
              className="grid h-7 w-7 flex-shrink-0 place-items-center bg-primary text-primary-foreground disabled:opacity-40"
              title="Salvar subtarefa"
              aria-label="Salvar subtarefa"
            >
              {isSavingSubtask ? <Clock3 className="h-3.5 w-3.5 animate-pulse" /> : <Check className="h-3.5 w-3.5" />}
            </button>
          </div>
          <label className="mt-1 flex w-fit items-center gap-1 pl-5 text-[9px] text-muted-foreground">
            <Clock3 className="h-3 w-3" />
            <span>Prazo opcional</span>
            <input
              type="date"
              value={subtaskDueDate}
              onChange={(event) => setSubtaskDueDate(event.target.value)}
              className="h-6 border bg-background px-1 text-[9px]"
              aria-label="Prazo da nova subtarefa"
            />
          </label>
        </div>
      )}

      {[...subtasks]
        .sort((left, right) => left.sort_order - right.sort_order || left.created_at.localeCompare(right.created_at))
        .map((subtask) => (
          <InlineSubtask
            key={subtask.id}
            task={subtask}
            collaborators={collaborators}
            onToggle={() => void onToggleSubtask(subtask.id)}
            onUpdate={(data) => onUpdateSubtask(subtask.id, data)}
            onDelete={() => void onDeleteSubtask(subtask.id)}
          />
        ))}
    </div>
  );
}

function TaskReplanMenu({ task, onScheduleChange }: {
  task: Task;
  onScheduleChange: (date: string | null) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(task.scheduled_for ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const save = async (nextDate: string | null) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const updated = await onScheduleChange(nextDate);
      if (updated) setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (nextOpen) setDate(task.scheduled_for ?? '');
    }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'grid h-7 w-7 flex-shrink-0 place-items-center border transition-colors',
            task.scheduled_for
              ? 'border-violet-300 bg-violet-100 text-violet-700'
              : 'text-muted-foreground hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700',
          )}
          title="Replanejar tarefa"
          aria-label={`Replanejar tarefa ${task.title}`}
        >
          <CalendarPlus className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <p className="text-sm font-semibold">Replanejar tarefa</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ela ficará em Agendadas e voltará às tarefas ativas na data escolhida.
        </p>
        <input
          type="date"
          value={date}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(event) => setDate(event.target.value)}
          className="mt-3 h-9 w-full border bg-background px-2 text-xs outline-none focus:border-violet-400"
          aria-label={`Nova data para ${task.title}`}
        />
        <div className="mt-3 flex items-center gap-2">
          {task.scheduled_for && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void save(null)}
              className="inline-flex h-8 items-center gap-1 border px-2 text-xs hover:bg-muted disabled:opacity-50"
            >
              <CalendarX2 className="h-3.5 w-3.5" />
              Ativar agora
            </button>
          )}
          <button
            type="button"
            disabled={!date || isSaving}
            onClick={() => void save(date)}
            className="ml-auto h-8 bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-40"
          >
            {isSaving ? 'Salvando...' : 'Replanejar'}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function InlineSubtask({ task, collaborators, onToggle, onUpdate, onDelete }: {
  task: Task;
  collaborators: { id: string; name: string; color: string; initials: string }[];
  onToggle: () => void;
  onUpdate: (data: Partial<Task>) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const modality = (task.modality || 'levantamento') as TaskModality;
  const priority = (task.priority || 'normal') as TaskPriority;
  const daysOpen = Math.max(0, Math.floor((Date.now() - new Date(task.created_at).getTime()) / 86_400_000));

  const saveTitle = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setTitle(task.title);
      setIsEditingTitle(false);
      return;
    }
    if (nextTitle !== task.title) await onUpdate({ title: nextTitle });
    setIsEditingTitle(false);
  };

  return (
    <div className="group/subtask ml-9 border-l-2 border-border bg-muted/15 py-1 pl-3 pr-2">
      <div className="flex min-h-8 items-center gap-1.5">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'grid h-4 w-4 flex-shrink-0 place-items-center rounded border',
            task.completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-muted-foreground/30 hover:border-primary',
          )}
          title={task.completed ? 'Reabrir subtarefa' : 'Concluir subtarefa'}
          aria-label={task.completed ? `Reabrir subtarefa ${task.title}` : `Concluir subtarefa ${task.title}`}
        >
          {task.completed && <Check className="h-3 w-3" />}
        </button>
        <ModalityMenu value={modality} onChange={(value) => void onUpdate({ modality: value })} />
        {isEditingTitle ? (
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => void saveTitle()}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void saveTitle();
              if (event.key === 'Escape') {
                setTitle(task.title);
                setIsEditingTitle(false);
              }
            }}
            className="h-7 min-w-0 flex-1 border bg-background px-2 text-xs outline-none"
            maxLength={100}
            autoFocus
            aria-label={`Editar subtarefa ${task.title}`}
          />
        ) : (
          <span
            className={cn('min-w-0 flex-1 truncate text-xs', task.completed && 'text-muted-foreground line-through')}
            title={`${task.title} - clique duas vezes para editar`}
            onDoubleClick={() => setIsEditingTitle(true)}
          >
            {task.title}
          </span>
        )}
        <PriorityMenu value={priority} onChange={(value) => void onUpdate({ priority: value })} />
        <SubtaskAssigneeMenu
          selected={task.assigned_to}
          collaborators={collaborators}
          onChange={(value) => void onUpdate({ assigned_to: value })}
        />
        <button
          type="button"
          onClick={onDelete}
          className="p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover/subtask:opacity-100"
          title="Excluir subtarefa"
          aria-label={`Excluir subtarefa ${task.title}`}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <div className="ml-[42px] flex flex-wrap items-center gap-2 text-[9px] text-muted-foreground">
        <span>Criada há {daysOpen} {daysOpen === 1 ? 'dia' : 'dias'}</span>
        <label className="flex items-center gap-1">
          <span>Prazo</span>
          <input
            type="date"
            value={task.due_date ?? ''}
            onChange={(event) => void onUpdate({ due_date: event.target.value || null })}
            className="h-5 border bg-background px-1 text-[9px]"
            aria-label={`Prazo da subtarefa ${task.title}`}
          />
        </label>
      </div>
    </div>
  );
}

function SubtaskAssigneeMenu({ selected, collaborators, onChange }: {
  selected: string[];
  collaborators: { id: string; name: string; color: string; initials: string }[];
  onChange: (value: string[]) => void;
}) {
  const toggle = (name: string) => {
    const isSelected = selected.some((item) => assigneeMatches([item], name));
    onChange(isSelected ? selected.filter((item) => !assigneeMatches([item], name)) : [...selected, name]);
  };

  const first = selected[0];
  const firstCollaborator = collaborators.find((item) => assigneeMatches([item.name], first));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="grid h-6 w-6 flex-shrink-0 place-items-center border bg-background text-muted-foreground hover:bg-muted"
          title={selected.length ? selected.join(', ') : 'Vincular responsável'}
          aria-label={selected.length ? `Responsáveis: ${selected.join(', ')}` : 'Vincular responsável à subtarefa'}
        >
          {first ? (
            <span
              className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold text-white"
              style={{ backgroundColor: firstCollaborator?.color || '#64748B' }}
            >
              {first.charAt(0).toUpperCase()}
            </span>
          ) : <User className="h-3.5 w-3.5" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1.5">
        {collaborators.map((collaborator) => {
          const isSelected = selected.some((item) => assigneeMatches([item], collaborator.name));
          return (
            <button
              key={collaborator.id}
              type="button"
              onClick={() => toggle(collaborator.name)}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-muted"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: collaborator.color }}>
                {collaborator.initials}
              </span>
              <span className="flex-1 truncate">{collaborator.name}</span>
              {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

// Compact assignee dropdown with search
function AssigneeDropdown({
  task,
  collaborators,
  collaboratorColorMap,
  onAssigneeChange,
}: {
  task: Task;
  collaborators: { id: string; name: string; color: string; initials: string }[];
  collaboratorColorMap: Record<string, string>;
  onAssigneeChange: (name: string) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = collaborators.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-muted transition-colors flex-shrink-0">
          {task.assigned_to.length > 0 ? (
            <div className="flex items-center -space-x-1">
              {task.assigned_to.slice(0, 3).map((name) => {
                const color = findCollaboratorColor([name], collaboratorColorMap);
                return (
                  <span
                    key={name}
                    className="w-6 h-6 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-card"
                    style={{ backgroundColor: color || '#6B7280' }}
                    title={name}
                  >
                    {name[0].toUpperCase()}
                  </span>
                );
              })}
              {task.assigned_to.length > 3 && (
                <span className="w-6 h-6 rounded-full text-[9px] font-bold bg-muted text-muted-foreground flex items-center justify-center border-2 border-card">
                  +{task.assigned_to.length - 3}
                </span>
              )}
            </div>
          ) : (
            <User className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2" align="end">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-7 pr-2 py-1.5 text-sm border rounded-md bg-background"
            autoFocus
          />
        </div>
        <div className="space-y-0.5 max-h-[180px] overflow-y-auto">
          {filtered.map((collab) => {
            const isAssigned = assigneeMatches(task.assigned_to, collab.name);
            return (
              <button
                key={collab.id}
                onClick={() => onAssigneeChange(collab.name)}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors"
              >
                <span
                  className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: collab.color }}
                >
                  {collab.name[0].toUpperCase()}
                </span>
                <span className="flex-1 text-left truncate capitalize">{collab.name}</span>
                {isAssigned && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Dropdown for assigning collaborators when creating a new task
function NewTaskAssigneeDropdown({
  collaborators,
  selected,
  onChange,
}: {
  collaborators: { id: string; name: string; color: string; initials: string }[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = collaborators.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (name: string) => {
    onChange(
      selected.includes(name)
        ? selected.filter(n => n !== name)
        : [...selected, name]
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex h-9 min-w-9 items-center justify-center gap-1 border bg-background px-2 text-xs transition-colors hover:bg-muted"
          title={selected.length ? `${selected.length} responsável(is)` : 'Selecionar responsáveis'}
          aria-label={selected.length ? `${selected.length} responsável(is) selecionado(s)` : 'Selecionar responsáveis'}
        >
          <User className="w-4 h-4 text-muted-foreground" />
          {selected.length > 0 ? (
            <div className="flex items-center -space-x-1">
              {selected.slice(0, 3).map((name) => {
                const collab = collaborators.find(c => c.name === name);
                return (
                  <span
                    key={name}
                    className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-background"
                    style={{ backgroundColor: collab?.color || '#6B7280' }}
                  >
                    {name[0].toUpperCase()}
                  </span>
                );
              })}
              {selected.length > 3 && (
                <span className="text-xs text-muted-foreground ml-1">+{selected.length - 3}</span>
              )}
            </div>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-7 pr-2 py-1.5 text-sm border rounded-md bg-background"
            autoFocus
          />
        </div>
        <div className="space-y-0.5 max-h-[180px] overflow-y-auto">
          {filtered.map((collab) => {
            const isSelected = selected.includes(collab.name);
            return (
              <button
                key={collab.id}
                onClick={() => toggle(collab.name)}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors"
              >
                <span
                  className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: collab.color }}
                >
                  {collab.name[0].toUpperCase()}
                </span>
                <span className="flex-1 text-left truncate capitalize">{collab.name}</span>
                {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ModalitySelector({ value, onChange }: { value: TaskModality; onChange: (modality: TaskModality) => void }) {
  return (
    <div className="grid grid-cols-5 gap-1 border bg-muted/20 p-1" aria-label="Modalidade da tarefa">
      {(Object.keys(TASK_MODALITY_CONFIG) as TaskModality[]).map((modality) => {
        const Icon = MODALITY_ICONS[modality];
        const config = TASK_MODALITY_CONFIG[modality];
        const visual = MODALITY_VISUALS[modality];
        return (
          <button
            key={modality}
            type="button"
            onClick={() => onChange(modality)}
            title={config.label}
            aria-label={config.label}
            aria-pressed={value === modality}
            className={cn(
              'flex h-9 min-w-0 flex-col items-center justify-center gap-0.5 border px-0.5 transition-colors',
              value === modality ? visual.selectedClassName : visual.className,
            )}
          >
            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="max-w-full truncate text-[7px] font-semibold leading-none">{config.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

function ModalityMenu({ value, onChange }: { value: TaskModality; onChange: (modality: TaskModality) => void }) {
  const CurrentIcon = MODALITY_ICONS[value];
  const currentConfig = TASK_MODALITY_CONFIG[value];
  const currentVisual = MODALITY_VISUALS[value];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn('grid h-6 w-6 flex-shrink-0 place-items-center border transition-colors', currentVisual.className)}
          title={`Alterar modalidade: ${currentConfig.label}`}
          aria-label={`Alterar modalidade da tarefa. Atual: ${currentConfig.label}`}
        >
          <CurrentIcon className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1.5">
        {(Object.keys(TASK_MODALITY_CONFIG) as TaskModality[]).map((modality) => {
          const Icon = MODALITY_ICONS[modality];
          const config = TASK_MODALITY_CONFIG[modality];
          const visual = MODALITY_VISUALS[modality];
          return (
            <button
              key={modality}
              type="button"
              onClick={() => onChange(modality)}
              className={cn(
                'flex w-full items-center gap-2 border px-2 py-2 text-left text-xs transition-colors',
                value === modality ? visual.selectedClassName : visual.className,
              )}
              aria-pressed={value === modality}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 font-medium">{config.label}</span>
              {value === modality && <Check className="h-3.5 w-3.5" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

// Priority selector for new-task form
function PrioritySelector({ value, onChange }: { value: TaskPriority; onChange: (p: TaskPriority) => void }) {
  const conf = PRIORITY_CONFIG[value];
  const visual = PRIORITY_VISUALS[value];
  const Icon = visual.icon;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn('flex h-9 items-center gap-1 border px-2 text-[10px] font-semibold transition-opacity hover:opacity-80', visual.className)}
          title={`Prioridade: ${conf.label}`}
        >
          <Icon className="h-3.5 w-3.5" />
          <span>{visual.shortLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start">
        {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => {
          const c = PRIORITY_CONFIG[p];
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted text-left ${value === p ? 'bg-muted' : ''}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} />
              <span className="flex-1">{c.label}</span>
              {value === p && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

// Priority change menu for existing tasks (compact icon)
function PriorityMenu({ value, onChange }: { value: TaskPriority; onChange: (p: TaskPriority) => void }) {
  const conf = PRIORITY_CONFIG[value];
  const visual = PRIORITY_VISUALS[value];
  const Icon = visual.icon;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={`Prioridade: ${conf.label}`}
          aria-label={`Alterar prioridade: ${conf.label}`}
          className={cn('grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border transition-transform hover:scale-105', visual.className)}
        >
          <Icon className="h-2.5 w-2.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="end">
        {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => {
          const c = PRIORITY_CONFIG[p];
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted text-left ${value === p ? 'bg-muted' : ''}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${c.dotClass}`} />
              <span className="flex-1">{c.label}</span>
              {value === p && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

function SummaryMetric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof ClipboardCheck;
  tone: string;
}) {
  return (
    <div className="border bg-background px-3 py-2.5">
      <div className={cn('flex items-center gap-1.5 text-xs', tone)}>
        <Icon className="h-3.5 w-3.5" />
        <span className="font-medium">{label}</span>
      </div>
      <strong className="mt-1 block text-xl leading-none text-foreground">{value}</strong>
    </div>
  );
}




