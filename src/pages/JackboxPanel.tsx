import { useMemo } from "react";
import { Box, User, CheckSquare } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualPanelHeader, KPICard } from "@/components/visual-panels/VisualPanelHeader";
import { VisualGrid } from "@/components/visual-panels/VisualGrid";
import { VisualPanelFilters, VisualSortOption } from "@/components/visual-panels/VisualPanelFilters";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { useVisualPanelFilters } from "@/hooks/useVisualPanelFilters";
import { Client, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";
import { Task } from "@/types/task";

export default function JackboxPanel() {
  const { activeClients, highlightedClients } = useClients();
  const { 
    tasks, 
    toggleComplete, 
    getActiveTasksForClient,
    getActiveTaskCount,
  } = useTasks();

  // Custom sorter for jackbox
  const customSorter = (a: Client, b: Client, sortBy: VisualSortOption, multiplier: number) => {
    if (sortBy === 'tasks') {
      return (getActiveTaskCount(b.id) - getActiveTaskCount(a.id)) * multiplier;
    }
    return null;
  };

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
    clients: activeClients.filter(c => getActiveTaskCount(c.id) > 0),
    highlightedClients,
    getActiveTaskCount,
    defaultSort: 'tasks',
    customSorter,
  });

  // KPIs
  const kpis = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.completed);
    return {
      totalTasks: activeTasks.length,
      clientsWithTasks: new Set(activeTasks.map(t => t.client_id)).size,
      byCollaborator: COLLABORATOR_NAMES.reduce((acc, name) => {
        acc[name] = activeTasks.filter(t => t.assigned_to === name).length;
        return acc;
      }, {} as Record<CollaboratorName, number>),
    };
  }, [tasks]);

  // Filter tasks by collaborator - only show clients that have tasks matching the filter
  const getFilteredTasks = (clientId: string) => {
    let clientTasks = getActiveTasksForClient(clientId);
    if (collaboratorFilters.length > 0) {
      clientTasks = clientTasks.filter(t => 
        t.assigned_to && collaboratorFilters.includes(t.assigned_to)
      );
    }
    return clientTasks;
  };

  // Custom filter: when collaborator filters are active, only show clients with matching tasks
  const clientsWithMatchingTasks = useMemo(() => {
    if (collaboratorFilters.length === 0) return filteredClients;
    
    return filteredClients.filter(client => {
      const matchingTasks = getActiveTasksForClient(client.id).filter(t =>
        t.assigned_to && collaboratorFilters.includes(t.assigned_to)
      );
      return matchingTasks.length > 0;
    });
  }, [filteredClients, collaboratorFilters, getActiveTasksForClient]);

  const sortOptions: { value: VisualSortOption; label: string }[] = [
    { value: 'priority', label: 'Prioridade' },
    { value: 'tasks', label: 'Tarefas' },
    { value: 'name', label: 'Nome' },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with KPIs */}
        <VisualPanelHeader 
          title="Micro-Demandas (Jackbox)" 
          subtitle="Tarefas rápidas por empresa"
          icon={<Box className="w-5 h-5" />}
          detailRoute="/jackbox-detalhado"
        >
          <KPICard icon={<CheckSquare className="w-4 h-4" />} value={kpis.totalTasks} label="Tarefas" />
          <KPICard icon={<User className="w-4 h-4" />} value={kpis.clientsWithTasks} label="Empresas" variant="info" />
          
          <div className="w-px h-8 bg-border" />
          
          {/* Collaborator KPIs */}
          {COLLABORATOR_NAMES.map((name) => (
            <div
              key={name}
              className="flex items-center gap-1.5 px-2 py-1 rounded border"
              style={{ 
                borderColor: COLLABORATOR_COLORS[name],
                backgroundColor: `${COLLABORATOR_COLORS[name]}15`,
              }}
            >
              <span className="text-sm font-bold" style={{ color: COLLABORATOR_COLORS[name] }}>
                {kpis.byCollaborator[name]}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase">{name}</span>
            </div>
          ))}
        </VisualPanelHeader>

        {/* Filters */}
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
        <VisualGrid itemCount={clientsWithMatchingTasks.length}>
          {clientsWithMatchingTasks.map((client) => (
            <JackboxCard
              key={client.id}
              client={client}
              isHighlighted={highlightedClients.has(client.id)}
              tasks={getFilteredTasks(client.id)}
              onToggleTask={toggleComplete}
            />
          ))}
        </VisualGrid>

        {/* Empty State */}
        {clientsWithMatchingTasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma micro-demanda ativa</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Jackbox Card Component
interface JackboxCardProps {
  client: Client;
  isHighlighted: boolean;
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
}

function JackboxCard({ 
  client, 
  isHighlighted, 
  tasks, 
  onToggleTask,
}: JackboxCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border-2 bg-card p-4 transition-all duration-200",
        "border-border hover:border-primary/50 hover:shadow-lg",
        isHighlighted && "border-4 border-red-500 ring-2 ring-red-500/30"
      )}
    >
      {/* Client Header */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
        {/* Logo */}
        <div className="relative flex-shrink-0">
          {client.logoUrl ? (
            <img
              src={client.logoUrl}
              alt={client.name}
              className="w-10 h-10 object-contain rounded-lg bg-white p-1"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{client.initials}</span>
            </div>
          )}
          {client.isPriority && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-[6px] text-white">★</span>
            </div>
          )}
        </div>
        
        {/* Name and Count */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-sm">
            {client.name}
          </h3>
          <span className="text-xs text-muted-foreground">
            {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Task Checklist */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {tasks.slice(0, 11).map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-2 group/task"
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => onToggleTask(task.id)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <span className={cn(
                "text-sm block truncate",
                task.completed && "line-through text-muted-foreground"
              )}>
                {task.title}
              </span>
            </div>
            {task.assigned_to && (
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                style={{ backgroundColor: COLLABORATOR_COLORS[task.assigned_to] }}
                title={task.assigned_to}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
