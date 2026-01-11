import { useState } from "react";
import { Star, CheckSquare, Plus, X } from "lucide-react";
import { Client, calculateTotalDemands, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName, ClientTask } from "@/types/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ClientCardProps {
  client: Client;
  displayNumber: number;
  isSelected: boolean;
  isHighlighted: boolean;
  taskCount: number;
  onSelect: (id: string) => void;
  onHighlight: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onToggleCollaborator: (id: string, collaborator: CollaboratorName) => void;
  onAddTask: (clientId: string, text: string) => void;
  onToggleTask: (clientId: string, taskId: string) => void;
  onDeleteTask: (clientId: string, taskId: string) => void;
}

export function ClientCard({ 
  client, 
  displayNumber, 
  isSelected, 
  isHighlighted,
  taskCount,
  onSelect, 
  onHighlight,
  onTogglePriority,
  onToggleCollaborator,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: ClientCardProps) {
  const totalDemands = calculateTotalDemands(client.demands);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");

  const handleLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHighlight(client.id);
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePriority(client.id);
  };

  const handleCollaboratorClick = (e: React.MouseEvent, collaborator: CollaboratorName) => {
    e.stopPropagation();
    onToggleCollaborator(client.id, collaborator);
  };

  const handleTaskClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTaskModal(true);
  };

  const handleAddTask = () => {
    if (newTaskText.trim()) {
      onAddTask(client.id, newTaskText.trim());
      setNewTaskText("");
    }
  };

  const pendingTasks = (client.tasks || []).filter(t => !t.completed);
  const completedTasks = (client.tasks || []).filter(t => t.completed);

  return (
    <>
      <div
        className={`client-card-compact ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${taskCount > 0 ? 'has-tasks' : ''}`}
        onClick={() => onSelect(client.id)}
      >
        {/* Top Right Buttons - Priority & Task */}
        <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5">
          {/* Task Button */}
          <button
            onClick={handleTaskClick}
            className={`p-0.5 rounded transition-colors ${
              taskCount > 0 
                ? 'bg-orange-100 hover:bg-orange-200' 
                : 'hover:bg-muted/50'
            }`}
            title={taskCount > 0 ? `${taskCount} tarefas pendentes` : "Adicionar tarefa"}
          >
            {taskCount > 0 ? (
              <span className="flex items-center justify-center w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded">
                {taskCount}
              </span>
            ) : (
              <CheckSquare className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-orange-500" />
            )}
          </button>

          {/* Priority Star */}
          <button
            onClick={handleStarClick}
            className="p-0.5 rounded transition-colors hover:bg-muted/50"
            title={client.isPriority ? "Remover prioridade" : "Marcar como prioritário"}
          >
            <Star 
              className={`w-3.5 h-3.5 transition-colors ${
                client.isPriority 
                  ? 'text-yellow-500 fill-yellow-500' 
                  : 'text-muted-foreground/40 hover:text-yellow-400'
              }`} 
            />
          </button>
        </div>

        {/* Header - Number + Name */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-card-elevated border-b border-border">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
            {displayNumber.toString().padStart(2, '0')}
          </div>
          <span className="text-[10px] font-medium text-foreground truncate flex-1 pr-8">
            {client.name}
          </span>
        </div>

        {/* Logo Area - Square and larger */}
        <div 
          className={`flex items-center justify-center aspect-square w-full transition-colors cursor-pointer ${
            isHighlighted ? 'ring-2 ring-yellow-400 ring-inset' : ''
          }`}
          style={{
            background: isHighlighted ? 'hsl(48 96% 89%)' : 'hsl(var(--muted) / 0.3)',
          }}
          onClick={handleLogoClick}
          title="Clique para destacar"
        >
          {client.logoUrl ? (
            <img 
              src={client.logoUrl} 
              alt={`Logo ${client.name}`} 
              className="max-h-[80%] max-w-[80%] object-contain rounded"
            />
          ) : (
            <div className={`flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold ${
              isHighlighted ? 'bg-yellow-400 text-yellow-900' : 'bg-primary/15 text-primary'
            }`}>
              {client.initials}
            </div>
          )}
        </div>

        {/* Collaborator Color Bars */}
        <div className="flex h-2 w-full">
          {COLLABORATOR_NAMES.map((name) => (
            <button
              key={name}
              onClick={(e) => handleCollaboratorClick(e, name)}
              className="flex-1 transition-all duration-150 hover:opacity-80"
              style={{ 
                backgroundColor: client.collaborators[name] ? COLLABORATOR_COLORS[name] : 'hsl(var(--muted) / 0.5)',
              }}
              title={`${name.charAt(0).toUpperCase() + name.slice(1)} - Clique para ${client.collaborators[name] ? 'desativar' : 'ativar'}`}
            />
          ))}
        </div>

        {/* Indicators Row - P, L, D with chips */}
        <div className="px-1.5 py-1.5 border-t border-border bg-card-elevated/50">
          <div className="flex items-center justify-between gap-0.5">
            {/* P - Processos */}
            <div className="flex flex-col items-center min-w-[22px]">
              <span className="text-[7px] text-muted-foreground font-medium leading-none">P</span>
              <span className="text-xs font-bold text-foreground leading-tight">{client.processes}</span>
            </div>

            {/* L - Licenças */}
            <div className="flex flex-col items-center min-w-[22px]">
              <span className="text-[7px] text-muted-foreground font-medium leading-none">L</span>
              <span className="text-xs font-bold text-foreground leading-tight">{client.licenses}</span>
            </div>

            {/* D - Demandas with total */}
            <div className="flex flex-col items-center min-w-[22px]">
              <span className="text-[7px] text-muted-foreground font-medium leading-none">D</span>
              <span className="text-xs font-bold text-foreground leading-tight">{totalDemands}</span>
            </div>

            {/* Status chips */}
            <div className="flex items-center gap-px">
              <DemandChip status="completed" count={client.demands.completed} />
              <DemandChip status="in-progress" count={client.demands.inProgress} />
              <DemandChip status="not-started" count={client.demands.notStarted} />
              <DemandChip status="cancelled" count={client.demands.cancelled} />
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-orange-500" />
              Tarefas - {client.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add new task */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="Nova tarefa..."
                className="flex-1 px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
              <button
                onClick={handleAddTask}
                className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Pending tasks */}
            {pendingTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Pendentes ({pendingTasks.length})</h4>
                {pendingTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => onToggleTask(client.id, task.id)}
                    onDelete={() => onDeleteTask(client.id, task.id)}
                  />
                ))}
              </div>
            )}

            {/* Completed tasks */}
            {completedTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Concluídas ({completedTasks.length})</h4>
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={() => onToggleTask(client.id, task.id)}
                    onDelete={() => onDeleteTask(client.id, task.id)}
                  />
                ))}
              </div>
            )}

            {pendingTasks.length === 0 && completedTasks.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma tarefa ainda
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface TaskItemProps {
  task: ClientTask;
  onToggle: () => void;
  onDelete: () => void;
}

function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border ${
      task.completed ? 'bg-muted/50 border-muted' : 'bg-orange-50 border-orange-200'
    }`}>
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          task.completed 
            ? 'bg-green-500 border-green-500 text-white' 
            : 'border-orange-400 hover:bg-orange-100'
        }`}
      >
        {task.completed && <span className="text-xs">✓</span>}
      </button>
      <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
        {task.text}
      </span>
      <button
        onClick={onDelete}
        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

interface DemandChipProps {
  status: 'completed' | 'in-progress' | 'not-started' | 'cancelled';
  count: number;
}

function DemandChip({ status, count }: DemandChipProps) {
  return (
    <div className={`demand-chip-small ${status}`}>
      {count}
    </div>
  );
}
