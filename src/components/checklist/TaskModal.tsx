import { useState } from 'react';
import { X, Plus, Check, Trash2, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { assigneeMatches, findCollaboratorColor } from '@/lib/taskAssignee';
import { Task, TaskFormData } from '@/types/task';
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
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const collaboratorColorMap: Record<string, string> = {};
  collaborators.forEach(c => { collaboratorColorMap[c.name] = c.color; });

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    const success = await onAddTask(client.id, {
      title: newTaskTitle.trim(),
      assigned_to: newTaskAssignees,
    });

    if (success) {
      setNewTaskTitle('');
      setNewTaskAssignees([]);
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

  const handleAssigneeChange = async (taskId: string, assignee: string | null) => {
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
                {collaborators.map((collab) => (
                  <button
                    key={collab.id}
                    onClick={() => setNewTaskAssignee(newTaskAssignee === collab.name ? null : collab.name)}
                    className="w-6 h-6 rounded text-xs font-medium transition-all"
                    style={{
                      backgroundColor: newTaskAssignee === collab.name ? collab.color : 'transparent',
                      border: `2px solid ${collab.color}`,
                      color: newTaskAssignee === collab.name ? 'white' : collab.color,
                    }}
                    title={collab.name}
                  >
                    {collab.initials[0]}
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
                    collaborators={collaborators}
                    collaboratorColorMap={collaboratorColorMap}
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
                    collaborators={collaborators}
                    collaboratorColorMap={collaboratorColorMap}
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
  onAssigneeChange: (a: string | null) => void;
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
  onDelete,
  collaborators,
  collaboratorColorMap,
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
          {collaborators.map((collab) => (
            <button
              key={collab.id}
              onClick={() => onAssigneeChange(assigneeMatches(task.assigned_to, collab.name) ? null : collab.name)}
              className="w-4 h-4 rounded-sm transition-all"
              style={{
                backgroundColor: assigneeMatches(task.assigned_to, collab.name) ? collab.color : 'transparent',
                border: `1px solid ${collab.color}`,
                opacity: assigneeMatches(task.assigned_to, collab.name) ? 1 : 0.4,
              }}
              title={collab.name}
            />
          ))}
        </div>
      )}

      {task.assigned_to && !task.completed && (() => {
        const color = findCollaboratorColor(task.assigned_to, collaboratorColorMap);
        return color ? (
          <span
            className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            {task.assigned_to![0].toUpperCase()}
          </span>
        ) : null;
      })()}

      <button
        onClick={onDelete}
        className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
