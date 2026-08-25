import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ClipboardCheck, FileCheck2, Flag, History, Plus, Search, ShieldCheck, Star, Trash2, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ClientWorkList } from '@/components/client-work/ClientWorkList';
import { assigneeMatches, findCollaboratorColor } from '@/lib/taskAssignee';
import { Task, TaskFormData, TaskPriority, PRIORITY_CONFIG } from '@/types/task';
import { Client } from '@/types/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClientWorkItems } from '@/hooks/useClientWorkItems';
import type { WorkItem, WorkItemFilter } from '@/types/workItem';

export interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  tasks: Task[];
  onAddTask: (clientId: string, data: TaskFormData) => Promise<boolean>;
  onToggleComplete: (taskId: string) => Promise<boolean>;
  onUpdateTask: (taskId: string, data: Partial<Task>) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
  initialView?: WorkItemFilter;
}

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

  const collaboratorColorMap: Record<string, string> = {};
  collaborators.forEach(c => { collaboratorColorMap[c.name] = c.color; });

  const activeTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => (PRIORITY_CONFIG[a.priority]?.order ?? 9) - (PRIORITY_CONFIG[b.priority]?.order ?? 9));
  const completedTasks = tasks.filter(t => t.completed);
  const filteredWorkItems =
    activeView === 'all'
      ? workItems
      : workItems.filter(item => item.kind === activeView);
  const overviewItems = [
    { kind: 'task' as const, label: 'Tarefas', count: tasks.length, icon: ClipboardCheck, className: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100' },
    { kind: 'priority' as const, label: 'Prioridades', count: workItems.filter(item => item.kind === 'priority').length, icon: Star, className: 'border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100' },
    { kind: 'deliverable' as const, label: 'Entregáveis', count: workItems.filter(item => item.kind === 'deliverable').length, icon: FileCheck2, className: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100' },
    { kind: 'audit' as const, label: 'Auditorias', count: workItems.filter(item => item.kind === 'audit').length, icon: ShieldCheck, className: 'border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100' },
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
    });

    if (success) {
      setNewTaskTitle('');
      setNewTaskAssignees([]);
      setNewTaskDueDate('');
      setNewTaskPriority('normal');
    }
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

  const handleDueDateChange = async (taskId: string, dueDate: string) => {
    await onUpdateTask(taskId, { due_date: dueDate || undefined });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showClose={false} className="flex max-h-[86vh] w-[calc(100vw-2rem)] max-w-4xl flex-col gap-3 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b px-5 py-4">
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
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          {activeView === 'all' ? (
            <div className="flex-1 space-y-5 overflow-auto px-5 py-5">
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gestão do cliente</p>
                <h3 className="mt-1 text-base font-semibold">Acompanhe o que está acontecendo neste cliente</h3>
              </section>
              <div className="grid gap-3 sm:grid-cols-2">
                {overviewItems.map(({ kind, label, count, icon: Icon, className }) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setActiveView(kind)}
                    className={`flex min-h-28 items-center gap-4 rounded-xl border p-4 text-left transition-colors ${className}`}
                  >
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-background/80 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-2xl font-bold leading-none">{count}</span>
                      <span className="mt-1 block text-sm font-semibold">{label}</span>
                    </span>
                  </button>
                ))}
              </div>
              <section className="rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4 text-muted-foreground" /> Visão rápida</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Escolha um indicador para abrir a área correspondente. Tarefas, prioridades, entregáveis e auditorias continuam separados, sem perder a visão geral do cliente.
                </p>
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
                <div className="sticky top-0 z-10 rounded-b-lg border bg-background/95 py-3 backdrop-blur">
                  <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Nova tarefa..."
                      className="h-10 min-w-0 rounded-md border bg-background px-3 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                      maxLength={100}
                    />
                    <NewTaskAssigneeDropdown
                      collaborators={collaborators}
                      selected={newTaskAssignees}
                      onChange={setNewTaskAssignees}
                    />
                    <PrioritySelector value={newTaskPriority} onChange={setNewTaskPriority} />
                    <div className="flex h-10 items-center gap-2 rounded-md border bg-background px-3">
                      <span className="text-xs font-medium text-muted-foreground">Prazo</span>
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="h-8 bg-transparent text-sm outline-none"
                      />
                    </div>
                    <button
                      onClick={handleAddTask}
                      disabled={!newTaskTitle.trim()}
                      className="flex h-10 items-center justify-center rounded-md bg-primary px-4 text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 md:w-12"
                      title="Adicionar tarefa"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
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
                          onDueDateChange={(dueDate) => handleDueDateChange(task.id, dueDate)}
                          onDelete={() => onDeleteTask(task.id)}
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
                          onDueDateChange={() => {}}
                          onDelete={() => onDeleteTask(task.id)}
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
  onDueDateChange: (dueDate: string) => void;
  onDelete: () => void;
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
  onDueDateChange,
  onDelete,
  collaborators,
  collaboratorColorMap,
}: TaskItemProps) {
  const priority = (task.priority || 'normal') as TaskPriority;
  const pConf = PRIORITY_CONFIG[priority];
  const daysOpen = Math.max(0, Math.floor((Date.now() - new Date(task.created_at).getTime()) / 86_400_000));
  const containerClass = task.completed
    ? 'bg-card border'
    : `${pConf.bgClass} ${pConf.borderClass} border-y border-r`;

  return (
    <div className={`group flex items-center gap-2 rounded-md px-3 py-2 ${containerClass}`}>
      <button
        onClick={onToggle}
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
            {!task.completed && priority !== 'normal' && (
              <span className={`inline-flex flex-shrink-0 items-center gap-1 rounded border border-current/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${pConf.textClass} ${pConf.bgClass}`}>
                <span>{pConf.icon}</span>{pConf.label}
              </span>
            )}
            <span
              className={`min-w-0 cursor-pointer truncate text-sm leading-snug ${task.completed ? 'text-muted-foreground line-through' : ''}`}
              onClick={!task.completed ? onStartEdit : undefined}
            >
              {task.title}
            </span>
          </div>
          {!task.completed && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>Criada há {daysOpen} {daysOpen === 1 ? 'dia' : 'dias'}</span>
              <label className="flex w-fit items-center gap-1">
                <span>Prazo</span>
              <input
                type="date"
                value={task.due_date ?? ''}
                onChange={(event) => onDueDateChange(event.target.value)}
                className={`h-6 rounded border bg-background px-1 text-xs outline-none ${
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
          <PriorityMenu value={priority} onChange={onPriorityChange} />
          <AssigneeDropdown
            task={task}
            collaborators={collaborators}
            collaboratorColorMap={collaboratorColorMap}
            onAssigneeChange={onAssigneeChange}
          />
        </>
      )}

      <button
        onClick={onDelete}
        className="p-1 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
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
        <button className="flex h-10 items-center gap-2 rounded-md border bg-background px-3 text-sm transition-colors hover:bg-muted">
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
          ) : (
            <span className="text-muted-foreground">Responsáveis</span>
          )}
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

// Priority selector for new-task form
function PrioritySelector({ value, onChange }: { value: TaskPriority; onChange: (p: TaskPriority) => void }) {
  const conf = PRIORITY_CONFIG[value];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex h-10 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-opacity hover:opacity-80 ${conf.textClass} ${conf.bgClass}`}
        >
          <Flag className="w-3.5 h-3.5" />
          {conf.label}
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
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={`Prioridade: ${conf.label}`}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${conf.dotClass}`}
        >
          {conf.label.charAt(0)}
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




