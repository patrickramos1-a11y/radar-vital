import { useState } from 'react';
import { Plus, Check, Trash2, User, Search, Flag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { assigneeMatches, findCollaboratorColor } from '@/lib/taskAssignee';
import { Task, TaskFormData, TaskPriority, PRIORITY_CONFIG } from '@/types/task';
import { Client } from '@/types/client';
import { useAuth } from '@/contexts/AuthContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  tasks: Task[];
  onAddTask: (clientId: string, data: TaskFormData) => Promise<boolean>;
  onToggleComplete: (taskId: string) => Promise<boolean>;
  onUpdateTask: (taskId: string, data: Partial<Task>) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
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
}: TaskModalProps) {
  const { collaborators } = useAuth();
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[86vh] w-[calc(100vw-2rem)] max-w-4xl flex-col gap-3 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle className="flex min-w-0 items-center gap-3 pr-8">
            {client.logoUrl ? (
              <img src={client.logoUrl} alt="" className="h-8 w-8 flex-shrink-0 rounded object-contain" />
            ) : (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {client.initials}
              </div>
            )}
            <span className="truncate">Checklist - {client.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-auto px-5 pb-5">
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
              <p className="text-sm text-muted-foreground/50 py-2">Nenhuma tarefa ativa</p>
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
                    onDelete={() => onDeleteTask(task.id)}
                    collaborators={collaborators}
                    collaboratorColorMap={collaboratorColorMap}
                  />
                ))}
              </div>
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
  onDelete,
  collaborators,
  collaboratorColorMap,
}: TaskItemProps) {
  const priority = (task.priority || 'normal') as TaskPriority;
  const pConf = PRIORITY_CONFIG[priority];
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
          {task.due_date && !task.completed && (
            <span className={`text-xs ${new Date(task.due_date) < new Date(new Date().toDateString()) ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
              📅 {new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
            </span>
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




