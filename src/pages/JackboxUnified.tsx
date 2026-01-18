import { useMemo, useState } from "react";
import { Box, User, CheckSquare, Plus, Trash2, UserCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualPanelHeader, KPICard } from "@/components/visual-panels/VisualPanelHeader";
import { VisualGrid } from "@/components/visual-panels/VisualGrid";
import { VisualPanelFilters, VisualSortOption } from "@/components/visual-panels/VisualPanelFilters";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { useVisualPanelFilters } from "@/hooks/useVisualPanelFilters";
import { Client, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";
import { Task } from "@/types/task";

export default function JackboxUnified() {
  const { activeClients, highlightedClients } = useClients();
  const { 
    tasks, 
    toggleComplete, 
    addTask,
    deleteTask,
    getActiveTasksForClient,
    getActiveTaskCount,
    getTasksForClient,
  } = useTasks();

  const [showCompleted, setShowCompleted] = useState(false);

  // Custom sorter for jackbox
  const customSorter = (a: Client, b: Client, sortBy: VisualSortOption, multiplier: number) => {
    if (sortBy === 'tasks') {
      return (getActiveTaskCount(b.id) - getActiveTaskCount(a.id)) * multiplier;
    }
    return null;
  };

  // Filter clients that have ANY tasks (active or completed based on filter)
  const clientsWithTasks = useMemo(() => {
    if (showCompleted) {
      return activeClients.filter(c => getTasksForClient(c.id).length > 0);
    }
    return activeClients.filter(c => getActiveTaskCount(c.id) > 0);
  }, [activeClients, getActiveTaskCount, getTasksForClient, showCompleted]);

  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    filterFlags,
    collaboratorFilters,
    counts,
    filteredClients,
    handleFilterFlagToggle,
    handleCollaboratorFilterToggle,
    handleClearFilters,
  } = useVisualPanelFilters({
    clients: clientsWithTasks,
    highlightedClients,
    getActiveTaskCount,
    defaultSort: 'tasks',
    customSorter,
  });

  // KPIs
  const kpis = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);
    return {
      totalActive: activeTasks.length,
      totalCompleted: completedTasks.length,
      clientsWithTasks: new Set(activeTasks.map(t => t.client_id)).size,
      byCollaborator: COLLABORATOR_NAMES.reduce((acc, name) => {
        acc[name] = activeTasks.filter(t => t.assigned_to === name).length;
        return acc;
      }, {} as Record<CollaboratorName, number>),
    };
  }, [tasks]);

  // Filter tasks by collaborator
  const getFilteredTasks = (clientId: string) => {
    let clientTasks = showCompleted 
      ? getTasksForClient(clientId)
      : getActiveTasksForClient(clientId);
    
    if (collaboratorFilters.length > 0) {
      clientTasks = clientTasks.filter(t => 
        t.assigned_to && collaboratorFilters.includes(t.assigned_to)
      );
    }
    return clientTasks;
  };

  const sortOptions: { value: VisualSortOption; label: string }[] = [
    { value: 'priority', label: 'Prioridade' },
    { value: 'tasks', label: 'Tarefas' },
    { value: 'name', label: 'Nome' },
  ];

  // Find overloaded collaborators (more than average + 50%)
  const overloadedCollaborators = useMemo(() => {
    const counts = Object.values(kpis.byCollaborator);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const threshold = avg * 1.5;
    
    return COLLABORATOR_NAMES.filter(name => kpis.byCollaborator[name] > threshold);
  }, [kpis.byCollaborator]);

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with KPIs */}
        <VisualPanelHeader 
          title="Micro-Demandas Unificado" 
          subtitle="Visão completa de tarefas por colaborador"
          icon={<Box className="w-5 h-5" />}
          detailRoute="/jackbox-detalhado"
        >
          <KPICard icon={<CheckSquare className="w-4 h-4" />} value={kpis.totalActive} label="Pendentes" variant="warning" />
          <KPICard icon={<CheckSquare className="w-4 h-4" />} value={kpis.totalCompleted} label="Concluídas" variant="success" />
          <KPICard icon={<User className="w-4 h-4" />} value={kpis.clientsWithTasks} label="Empresas" variant="info" />
          
          <div className="w-px h-8 bg-border" />
          
          {/* Collaborator KPIs with overload indicator */}
          {COLLABORATOR_NAMES.map((name) => {
            const isOverloaded = overloadedCollaborators.includes(name);
            return (
              <div
                key={name}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded border transition-all",
                  isOverloaded && "ring-2 ring-red-500/50 animate-pulse"
                )}
                style={{ 
                  borderColor: COLLABORATOR_COLORS[name],
                  backgroundColor: `${COLLABORATOR_COLORS[name]}15`,
                }}
              >
                <span className="text-sm font-bold" style={{ color: COLLABORATOR_COLORS[name] }}>
                  {kpis.byCollaborator[name]}
                </span>
                <span className="text-[9px] text-muted-foreground uppercase">{name}</span>
                {isOverloaded && (
                  <span className="text-[8px] text-red-500 font-bold">!</span>
                )}
              </div>
            );
          })}
        </VisualPanelHeader>

        {/* Filters with show completed toggle */}
        <div className="flex items-center gap-4 px-6 py-2 bg-muted/30 border-b">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox 
              checked={showCompleted} 
              onCheckedChange={(checked) => setShowCompleted(!!checked)} 
            />
            <span>Mostrar concluídas</span>
          </label>
        </div>

        <VisualPanelFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterFlags={filterFlags}
          onFilterFlagToggle={handleFilterFlagToggle}
          collaboratorFilters={collaboratorFilters}
          onCollaboratorFilterToggle={handleCollaboratorFilterToggle}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={setSortBy}
          onSortDirectionChange={setSortDirection}
          onClearFilters={handleClearFilters}
          highlightedCount={counts.highlighted}
          jackboxCount={counts.jackbox}
          checkedCount={counts.checked}
          showCollaborators={true}
          sortOptions={sortOptions}
        />

        {/* Visual Grid */}
        <VisualGrid itemCount={filteredClients.length}>
          {filteredClients.map((client) => (
            <JackboxCardEnhanced
              key={client.id}
              client={client}
              isHighlighted={highlightedClients.has(client.id)}
              tasks={getFilteredTasks(client.id)}
              onToggleTask={(taskId) => toggleComplete(taskId, client.name)}
              onAddTask={(title, assignedTo) => addTask(client.id, { title, assigned_to: assignedTo }, client.name)}
              onDeleteTask={(taskId) => deleteTask(taskId, client.name)}
              showCompleted={showCompleted}
            />
          ))}
        </VisualGrid>

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma micro-demanda {showCompleted ? '' : 'ativa'}</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Enhanced Jackbox Card Component with inline actions
interface JackboxCardEnhancedProps {
  client: Client;
  isHighlighted: boolean;
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (title: string, assignedTo: CollaboratorName | null) => Promise<boolean>;
  onDeleteTask: (taskId: string) => void;
  showCompleted: boolean;
}

function JackboxCardEnhanced({ 
  client, 
  isHighlighted, 
  tasks, 
  onToggleTask,
  onAddTask,
  onDeleteTask,
  showCompleted,
}: JackboxCardEnhancedProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<CollaboratorName | ''>('');

  // Group tasks by collaborator for summary
  const tasksByCollaborator = useMemo(() => {
    const summary: Record<CollaboratorName, number> = {
      celine: 0, gabi: 0, darley: 0, vanessa: 0
    };
    tasks.filter(t => !t.completed).forEach(t => {
      if (t.assigned_to) {
        summary[t.assigned_to]++;
      }
    });
    return summary;
  }, [tasks]);

  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  const handleSubmit = async () => {
    if (!newTaskTitle.trim()) return;
    const success = await onAddTask(newTaskTitle.trim(), newTaskAssignee || null);
    if (success) {
      setNewTaskTitle('');
      setNewTaskAssignee('');
      setIsAdding(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl border-2 bg-card p-3 transition-all duration-200",
        "border-border hover:border-primary/50 hover:shadow-lg",
        isHighlighted && "border-4 border-red-500 ring-2 ring-red-500/30"
      )}
    >
      {/* Client Header */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
        {/* Logo */}
        <div className="relative flex-shrink-0">
          {client.logoUrl ? (
            <img
              src={client.logoUrl}
              alt={client.name}
              className="w-8 h-8 object-contain rounded-lg bg-white p-0.5"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{client.initials}</span>
            </div>
          )}
          {client.isPriority && (
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-[5px] text-white">★</span>
            </div>
          )}
        </div>
        
        {/* Name and Count */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-xs">
            {client.name}
          </h3>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-amber-600 font-medium">{pendingCount} pend.</span>
            {showCompleted && completedCount > 0 && (
              <span className="text-emerald-600 font-medium">{completedCount} conc.</span>
            )}
          </div>
        </div>

        {/* Add Task Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Collaborator Summary Dots */}
      <div className="flex items-center gap-1 mb-2">
        {COLLABORATOR_NAMES.map((name) => {
          const count = tasksByCollaborator[name];
          if (count === 0) return null;
          return (
            <div
              key={name}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
              style={{ backgroundColor: COLLABORATOR_COLORS[name] }}
              title={`${name}: ${count} tarefas`}
            >
              {count}
            </div>
          );
        })}
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <div className="mb-2 p-2 bg-muted/50 rounded-lg space-y-2">
          <Input
            placeholder="Título da tarefa..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="h-7 text-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <div className="flex gap-2">
            <Select value={newTaskAssignee} onValueChange={(v) => setNewTaskAssignee(v as CollaboratorName | '')}>
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {COLLABORATOR_NAMES.map((name) => (
                  <SelectItem key={name} value={name}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLLABORATOR_COLORS[name] }} />
                      {name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              Adicionar
            </Button>
          </div>
        </div>
      )}

      {/* Task Checklist */}
      <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
        {tasks.slice(0, 11).map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-1.5 group/task p-1 rounded hover:bg-muted/50"
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => onToggleTask(task.id)}
              className="mt-0.5 h-3.5 w-3.5"
            />
            <div className="flex-1 min-w-0">
              <span className={cn(
                "text-xs block truncate",
                task.completed && "line-through text-muted-foreground"
              )}>
                {task.title}
              </span>
            </div>
            {task.assigned_to && (
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                style={{ backgroundColor: COLLABORATOR_COLORS[task.assigned_to] }}
                title={task.assigned_to}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 opacity-0 group-hover/task:opacity-100 text-destructive hover:text-destructive"
              onClick={() => onDeleteTask(task.id)}
            >
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          </div>
        ))}
      </div>

      {tasks.length > 11 && (
        <p className="text-[10px] text-muted-foreground text-center mt-1">
          +{tasks.length - 11} tarefas
        </p>
      )}
    </div>
  );
}
