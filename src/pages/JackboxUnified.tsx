import { useMemo, useState } from "react";
import { Box, User, CheckSquare, Plus, Trash2, Clock, Calendar } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualPanelHeader, KPICard } from "@/components/visual-panels/VisualPanelHeader";
import { VisualGrid } from "@/components/visual-panels/VisualGrid";
import { VisualPanelFilters, VisualSortOption } from "@/components/visual-panels/VisualPanelFilters";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { useVisualPanelFilters } from "@/hooks/useVisualPanelFilters";
import { Client, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";
import { Task } from "@/types/task";
import { CollaboratorTaskTable } from "@/components/tasks/CollaboratorTaskTable";
import { TaskAnalytics } from "@/components/tasks/TaskAnalytics";

type StatusFilter = "pendentes" | "concluidas" | "todas";

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
    getDaysOpen,
    getOldestTask,
    getAverageDaysOpen,
  } = useTasks();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pendentes");
  const [selectedCollaborator, setSelectedCollaborator] = useState<CollaboratorName | null>(null);

  // Custom sorter for jackbox
  const customSorter = (a: Client, b: Client, sortBy: VisualSortOption, multiplier: number) => {
    if (sortBy === 'tasks') {
      const countA = getTaskCountForStatus(a.id);
      const countB = getTaskCountForStatus(b.id);
      return (countB - countA) * multiplier;
    }
    if (sortBy === 'days_open') {
      const oldestA = getOldestClientTask(a.id);
      const oldestB = getOldestClientTask(b.id);
      const daysA = oldestA ? getDaysOpen(oldestA) : 0;
      const daysB = oldestB ? getDaysOpen(oldestB) : 0;
      return (daysB - daysA) * multiplier;
    }
    return null;
  };

  // Get task count based on current status filter
  const getTaskCountForStatus = (clientId: string) => {
    if (statusFilter === "pendentes") return getActiveTasksForClient(clientId).length;
    if (statusFilter === "concluidas") return getTasksForClient(clientId).filter(t => t.completed).length;
    return getTasksForClient(clientId).length;
  };

  // Get oldest pending task for a client
  const getOldestClientTask = (clientId: string) => {
    const pending = getActiveTasksForClient(clientId);
    if (pending.length === 0) return null;
    return pending.reduce((o, t) => new Date(t.created_at) < new Date(o.created_at) ? t : o);
  };

  // Filter clients based on status filter
  const clientsWithTasks = useMemo(() => {
    return activeClients.filter(c => getTaskCountForStatus(c.id) > 0);
  }, [activeClients, tasks, statusFilter]);

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
    const oldestTask = getOldestTask();
    const avgDays = getAverageDaysOpen();
    
    return {
      totalActive: activeTasks.length,
      totalCompleted: completedTasks.length,
      clientsWithTasks: new Set(activeTasks.map(t => t.client_id)).size,
      oldestDays: oldestTask ? getDaysOpen(oldestTask) : 0,
      avgDays,
      byCollaborator: COLLABORATOR_NAMES.reduce((acc, name) => {
        const collabTasks = activeTasks.filter(t => t.assigned_to === name);
        const collabAvg = collabTasks.length > 0
          ? Math.round(collabTasks.reduce((s, t) => s + getDaysOpen(t), 0) / collabTasks.length)
          : 0;
        const collabOldest = collabTasks.length > 0
          ? collabTasks.reduce((o, t) => new Date(t.created_at) < new Date(o.created_at) ? t : o)
          : null;
        acc[name] = {
          count: collabTasks.length,
          avgDays: collabAvg,
          oldestDays: collabOldest ? getDaysOpen(collabOldest) : 0,
        };
        return acc;
      }, {} as Record<CollaboratorName, { count: number; avgDays: number; oldestDays: number }>),
    };
  }, [tasks, getDaysOpen, getOldestTask, getAverageDaysOpen]);

  // Filter tasks for card display
  const getFilteredTasks = (clientId: string) => {
    let clientTasks: Task[];
    if (statusFilter === "pendentes") clientTasks = getActiveTasksForClient(clientId);
    else if (statusFilter === "concluidas") clientTasks = getTasksForClient(clientId).filter(t => t.completed);
    else clientTasks = getTasksForClient(clientId);
    
    if (collaboratorFilters.length > 0) {
      clientTasks = clientTasks.filter(t => 
        t.assigned_to && collaboratorFilters.includes(t.assigned_to)
      );
    }
    return clientTasks;
  };

  const sortOptions: { value: VisualSortOption; label: string }[] = [
    { value: 'tasks', label: 'Tarefas' },
    { value: 'days_open' as VisualSortOption, label: 'Dias em aberto' },
    { value: 'priority', label: 'Prioridade' },
    { value: 'name', label: 'Nome' },
  ];

  // Find overloaded collaborators
  const overloadedCollaborators = useMemo(() => {
    const counts = COLLABORATOR_NAMES.map(n => kpis.byCollaborator[n].count);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const threshold = avg * 1.5;
    return COLLABORATOR_NAMES.filter(name => kpis.byCollaborator[name].count > threshold);
  }, [kpis.byCollaborator]);

  const handleCollaboratorClick = (name: CollaboratorName) => {
    setSelectedCollaborator(prev => prev === name ? null : name);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with KPIs */}
        <VisualPanelHeader 
          title="Painel de Tarefas" 
          subtitle="Visão gerencial de tarefas por colaborador"
          icon={<Box className="w-5 h-5" />}
          detailRoute="/jackbox-detalhado"
        >
          <KPICard icon={<CheckSquare className="w-4 h-4" />} value={kpis.totalActive} label="Pendentes" variant="warning" />
          <KPICard icon={<CheckSquare className="w-4 h-4" />} value={kpis.totalCompleted} label="Concluídas" variant="success" />
          <KPICard icon={<User className="w-4 h-4" />} value={kpis.clientsWithTasks} label="Empresas" variant="info" />
          <KPICard icon={<Clock className="w-4 h-4" />} value={`${kpis.oldestDays}d`} label="Mais antiga" variant="danger" />
          <KPICard icon={<Calendar className="w-4 h-4" />} value={`${kpis.avgDays}d`} label="Média aberto" variant="default" />
          
          <div className="w-px h-8 bg-border" />
          
          {/* Collaborator KPIs with tooltip and click */}
          <TooltipProvider>
            {COLLABORATOR_NAMES.map((name) => {
              const info = kpis.byCollaborator[name];
              const isOverloaded = overloadedCollaborators.includes(name);
              const isSelected = selectedCollaborator === name;
              return (
                <Tooltip key={name}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleCollaboratorClick(name)}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded border transition-all cursor-pointer",
                        isOverloaded && "ring-2 ring-red-500/50 animate-pulse",
                        isSelected && "ring-2 ring-primary shadow-md",
                      )}
                      style={{ 
                        borderColor: COLLABORATOR_COLORS[name],
                        backgroundColor: `${COLLABORATOR_COLORS[name]}${isSelected ? '25' : '15'}`,
                      }}
                    >
                      <span className="text-sm font-bold" style={{ color: COLLABORATOR_COLORS[name] }}>
                        {info.count}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase">{name}</span>
                      {isOverloaded && (
                        <span className="text-[8px] text-destructive font-bold">!</span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <p className="font-bold capitalize">{name}</p>
                      <p>Pendentes: {info.count}</p>
                      <p>Média: {info.avgDays}d em aberto</p>
                      <p>Mais antiga: {info.oldestDays}d</p>
                      <p className="text-muted-foreground italic">Clique para ver detalhes</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </VisualPanelHeader>

        {/* Analytics Ranking Bar */}
        <TaskAnalytics tasks={tasks} clients={activeClients} getDaysOpen={getDaysOpen} />

        {/* Status Filter */}
        <div className="flex items-center gap-2 px-6 py-2 bg-muted/30 border-b">
          <span className="text-xs text-muted-foreground font-medium">Status:</span>
          {([
            { key: "pendentes", label: "Pendentes" },
            { key: "concluidas", label: "Concluídas" },
            { key: "todas", label: "Todas" },
          ] as { key: StatusFilter; label: string }[]).map(({ key, label }) => (
            <Button
              key={key}
              variant={statusFilter === key ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setStatusFilter(key)}
            >
              {label}
            </Button>
          ))}
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
              statusFilter={statusFilter}
              getDaysOpen={getDaysOpen}
            />
          ))}
        </VisualGrid>

        {/* Collaborator Detail Table */}
        {selectedCollaborator && (
          <CollaboratorTaskTable
            collaborator={selectedCollaborator}
            tasks={tasks}
            clients={activeClients}
            getDaysOpen={getDaysOpen}
            onClose={() => setSelectedCollaborator(null)}
          />
        )}

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma tarefa {statusFilter === "todas" ? "" : statusFilter === "pendentes" ? "pendente" : "concluída"}</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Enhanced Jackbox Card Component
interface JackboxCardEnhancedProps {
  client: Client;
  isHighlighted: boolean;
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (title: string, assignedTo: CollaboratorName | null) => Promise<boolean>;
  onDeleteTask: (taskId: string) => void;
  statusFilter: StatusFilter;
  getDaysOpen: (task: Task) => number;
}

function JackboxCardEnhanced({ 
  client, 
  isHighlighted, 
  tasks, 
  onToggleTask,
  onAddTask,
  onDeleteTask,
  statusFilter,
  getDaysOpen,
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
        "group relative rounded-xl border-2 bg-card p-4 transition-all duration-200",
        "border-border hover:border-primary/50 hover:shadow-lg",
        isHighlighted && "border-4 border-red-500 ring-2 ring-red-500/30"
      )}
    >
      {/* Client Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        {/* Logo */}
        <div className="relative flex-shrink-0">
          {client.logoUrl ? (
            <img
              src={client.logoUrl}
              alt={client.name}
              className="w-9 h-9 object-contain rounded-lg bg-white p-0.5"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
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
          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
            {client.name}
          </h3>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-amber-600 font-medium">{pendingCount} pend.</span>
            {completedCount > 0 && (
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
      <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
        {tasks.slice(0, 11).map((task) => {
          const days = getDaysOpen(task);
          return (
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
                  "text-xs block leading-tight",
                  task.completed && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </span>
              </div>
              {!task.completed && (
                <span className={cn(
                  "text-[9px] flex-shrink-0 mt-0.5",
                  days > 30 ? "text-destructive font-bold" : days > 14 ? "text-amber-600" : "text-muted-foreground"
                )}>
                  {days}d
                </span>
              )}
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
          );
        })}
      </div>

      {tasks.length > 11 && (
        <p className="text-[10px] text-muted-foreground text-center mt-1">
          +{tasks.length - 11} tarefas
        </p>
      )}
    </div>
  );
}
