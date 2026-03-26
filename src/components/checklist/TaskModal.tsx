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
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
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
      due_date: newTaskDueDate || undefined,
    });

    if (success) {
      setNewTaskTitle('');
      setNewTaskAssignees([]);
      setNewTaskDueDate('');
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
              <span className="text-xs text-muted-foreground">Responsáveis:</span>
              <div className="flex gap-1">
                {collaborators.map((collab) => {
                  const isSelected = newTaskAssignees.includes(collab.name);
                  return (
                    <button
                      key={collab.id}
                      onClick={() => setNewTaskAssignees(prev => 
                        isSelected ? prev.filter(n => n !== collab.name) : [...prev, collab.name]
                      )}
                      className="w-6 h-6 rounded text-xs font-medium transition-all"
                      style={{
                        backgroundColor: isSelected ? collab.color : 'transparent',
                        border: `2px solid ${collab.color}`,
                        color: isSelected ? 'white' : collab.color,
                      }}
                      title={collab.name}
                    >
                      {collab.initials[0]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Prazo:</span>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="px-2 py-1 text-xs border rounded-md bg-background"
              />
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
  onAssigneeChange: (collaboratorName: string) => void;
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
    <div className="flex items-center gap-3 p-3 bg-card rounded-lg border group">
      <button
        onClick={onToggle}
        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
          task.completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-muted-foreground/30 hover:border-primary'
        }`}
      >
        {task.completed && <Check className="w-4 h-4" />}
      </button>

      {isEditing ? (
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          className="flex-1 px-3 py-1.5 text-sm border rounded bg-background"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveEdit();
            if (e.key === 'Escape') onCancelEdit();
          }}
          onBlur={onSaveEdit}
        />
      ) : (
        <div className="flex-1 min-w-0">
          <span
            className={`text-sm md:text-base cursor-pointer leading-snug ${task.completed ? 'line-through text-muted-foreground' : ''}`}
            onClick={!task.completed ? onStartEdit : undefined}
          >
            {task.title}
          </span>
          {task.due_date && !task.completed && (
            <span className={`text-xs ml-2 ${new Date(task.due_date) < new Date(new Date().toDateString()) ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
              📅 {new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      )}

      {!task.completed && (
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {collaborators.map((collab) => (
            <button
              key={collab.id}
              onClick={() => onAssigneeChange(collab.name)}
              className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all"
              style={{
                backgroundColor: assigneeMatches(task.assigned_to, collab.name) ? collab.color : 'transparent',
                border: `2px solid ${collab.color}`,
                color: assigneeMatches(task.assigned_to, collab.name) ? 'white' : collab.color,
                opacity: assigneeMatches(task.assigned_to, collab.name) ? 1 : 0.4,
              }}
              title={collab.name}
            >
              {collab.name[0].toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {task.assigned_to.length > 0 && !task.completed && (
        <div className="flex items-center gap-1">
          {task.assigned_to.map((name) => {
            const color = findCollaboratorColor([name], collaboratorColorMap);
            return color ? (
              <span
                key={name}
                className="w-7 h-7 rounded-full text-xs font-bold text-white flex items-center justify-center"
                style={{ backgroundColor: color }}
              >
                {name[0].toUpperCase()}
              </span>
            ) : null;
          })}
        </div>
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
