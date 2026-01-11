import { useState } from 'react';
import { X, Plus, Check, Trash2, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Task, TaskFormData } from '@/types/task';
import { Client, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from '@/types/client';

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
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<CollaboratorName | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    const success = await onAddTask(client.id, {
      title: newTaskTitle.trim(),
      assigned_to: newTaskAssignee,
    });

    if (success) {
      setNewTaskTitle('');
      setNewTaskAssignee(null);
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

  const handleAssigneeChange = async (taskId: string, assignee: CollaboratorName | null) => {
    await onUpdateTask(taskId, { assigned_to: assignee });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {client.logoUrl ? (
              <img src={client.logoUrl} alt="" className="w-8 h-8 object-contain rounded" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                {client.initials}
              </div>
            )}
            <span>Checklist - {client.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Add new task */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Nova tarefa..."
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                maxLength={100}
              />
              <button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim() || activeTasks.length >= 11}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Responsável:</span>
              <div className="flex gap-1">
                {COLLABORATOR_NAMES.map((name) => (
                  <button
                    key={name}
                    onClick={() => setNewTaskAssignee(newTaskAssignee === name ? null : name)}
                    className="w-6 h-6 rounded text-xs font-medium transition-all"
                    style={{
                      backgroundColor: newTaskAssignee === name ? COLLABORATOR_COLORS[name] : 'transparent',
                      border: `2px solid ${COLLABORATOR_COLORS[name]}`,
                      color: newTaskAssignee === name ? 'white' : COLLABORATOR_COLORS[name],
                    }}
                    title={name.charAt(0).toUpperCase() + name.slice(1)}
                  >
                    {name[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {activeTasks.length >= 11 && (
              <p className="text-xs text-amber-600">Limite de 11 tarefas ativas atingido</p>
            )}
          </div>

          {/* Active tasks */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">
              Tarefas Ativas ({activeTasks.length}/11)
            </h4>
            {activeTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground/50 py-2">Nenhuma tarefa ativa</p>
            ) : (
              <div className="space-y-1">
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
                    onDelete={() => onDeleteTask(task.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Completed tasks */}
          {completedTasks.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">
                Concluídas ({completedTasks.length})
              </h4>
              <div className="space-y-1 opacity-60">
                {completedTasks.slice(0, 5).map((task) => (
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
                    onDelete={() => onDeleteTask(task.id)}
                  />
                ))}
                {completedTasks.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{completedTasks.length - 5} mais
                  </p>
                )}
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
  onAssigneeChange: (a: CollaboratorName | null) => void;
  onDelete: () => void;
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
  onDelete,
}: TaskItemProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-card rounded border group">
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          task.completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-muted-foreground/30 hover:border-primary'
        }`}
      >
        {task.completed && <Check className="w-3 h-3" />}
      </button>

      {isEditing ? (
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          className="flex-1 px-2 py-1 text-sm border rounded bg-background"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveEdit();
            if (e.key === 'Escape') onCancelEdit();
          }}
          onBlur={onSaveEdit}
        />
      ) : (
        <span
          className={`flex-1 text-sm cursor-pointer ${task.completed ? 'line-through text-muted-foreground' : ''}`}
          onClick={!task.completed ? onStartEdit : undefined}
        >
          {task.title}
        </span>
      )}

      {!task.completed && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {COLLABORATOR_NAMES.map((name) => (
            <button
              key={name}
              onClick={() => onAssigneeChange(task.assigned_to === name ? null : name)}
              className="w-4 h-4 rounded-sm transition-all"
              style={{
                backgroundColor: task.assigned_to === name ? COLLABORATOR_COLORS[name] : 'transparent',
                border: `1px solid ${COLLABORATOR_COLORS[name]}`,
                opacity: task.assigned_to === name ? 1 : 0.4,
              }}
              title={name.charAt(0).toUpperCase() + name.slice(1)}
            />
          ))}
        </div>
      )}

      {task.assigned_to && !task.completed && (
        <span
          className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
          style={{ backgroundColor: COLLABORATOR_COLORS[task.assigned_to] }}
        >
          {task.assigned_to[0].toUpperCase()}
        </span>
      )}

      <button
        onClick={onDelete}
        className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
