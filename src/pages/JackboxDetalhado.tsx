import { useMemo, useState } from "react";
import { Box, CheckSquare, User, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PanelHeader, StatCard } from "@/components/panels/PanelHeader";
import { PanelFilters, PanelSortOption } from "@/components/panels/PanelFilters";
import { ClientRow } from "@/components/panels/ClientRow";
import { TaskModal } from "@/components/checklist/TaskModal";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { usePanelFilters } from "@/hooks/usePanelFilters";
import { Client, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";
import { Task } from "@/types/task";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export default function JackboxDetalhado() {
  const { 
    activeClients, 
    highlightedClients, 
    toggleHighlight,
    togglePriority,
    toggleChecked,
  } = useClients();

  const {
    tasks,
    getActiveTaskCount,
    getTasksForClient,
    getActiveTasksForClient,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
  } = useTasks();

  const [checklistClientId, setChecklistClientId] = useState<string | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Custom sorter for jackbox
  const customSorter = (a: Client, b: Client, sortBy: PanelSortOption, multiplier: number) => {
    if (sortBy === 'jackbox') {
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
  } = usePanelFilters({
    clients: activeClients.filter(c => getActiveTaskCount(c.id) > 0),
    highlightedClients,
    getActiveTaskCount,
    defaultSort: 'jackbox',
    customSorter,
  });

  // KPIs
  const kpis = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.completed);
    const completedToday = tasks.filter(t => {
      if (!t.completed_at) return false;
      const today = new Date();
      const completedDate = new Date(t.completed_at);
      return completedDate.toDateString() === today.toDateString();
    });

    return {
      totalTasks: activeTasks.length,
      clientsWithTasks: new Set(activeTasks.map(t => t.client_id)).size,
      completedToday: completedToday.length,
      byCollaborator: COLLABORATOR_NAMES.reduce((acc, name) => {
        acc[name] = activeTasks.filter(t => t.assigned_to === name).length;
        return acc;
      }, {} as Record<CollaboratorName, number>),
    };
  }, [tasks]);

  const checklistClient = checklistClientId ? activeClients.find(c => c.id === checklistClientId) : null;

  const handleRowClick = (clientId: string) => {
    setExpandedClientId(expandedClientId === clientId ? null : clientId);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with KPIs */}
        <PanelHeader title="Micro-Demandas (Jackbox)" subtitle="Visão detalhada das tarefas por cliente">
          <StatCard icon={<CheckSquare className="w-4 h-4" />} value={kpis.totalTasks} label="Tarefas Ativas" />
          <StatCard icon={<User className="w-4 h-4" />} value={kpis.clientsWithTasks} label="Empresas" variant="info" />
          <StatCard icon={<Check className="w-4 h-4" />} value={kpis.completedToday} label="Concluídas Hoje" variant="success" />
          
          <div className="w-px h-8 bg-border mx-1" />
          
          {/* Collaborator stats */}
          {COLLABORATOR_NAMES.map((name) => (
            <div 
              key={name}
              className="flex items-center gap-1.5 px-2 py-1 rounded border"
              style={{ borderColor: COLLABORATOR_COLORS[name], backgroundColor: `${COLLABORATOR_COLORS[name]}15` }}
            >
              <span className="text-sm font-bold" style={{ color: COLLABORATOR_COLORS[name] }}>
                {kpis.byCollaborator[name]}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase">{name}</span>
            </div>
          ))}
        </PanelHeader>

        {/* Filters */}
        <PanelFilters
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
        />

        {/* Client List with Tasks */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {filteredClients.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum cliente com tarefas ativas</p>
              </div>
            </div>
          ) : (
            filteredClients.map((client) => {
              const clientTasks = getActiveTasksForClient(client.id);
              const isExpanded = expandedClientId === client.id;

              return (
                <div key={client.id} className="space-y-1">
                  <div 
                    onClick={() => handleRowClick(client.id)}
                    className="cursor-pointer"
                  >
                    <ClientRow
                      client={client}
                      isHighlighted={highlightedClients.has(client.id)}
                      activeTaskCount={getActiveTaskCount(client.id)}
                      onTogglePriority={togglePriority}
                      onToggleHighlight={toggleHighlight}
                      onToggleChecked={toggleChecked}
                      onOpenChecklist={setChecklistClientId}
                    >
                      {/* Task Stats */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold text-foreground">{clientTasks.length}</span>
                          <span className="text-xs text-muted-foreground">tarefas</span>
                        </div>
                        
                        {/* Collaborator task counts */}
                        <div className="flex items-center gap-1">
                          {COLLABORATOR_NAMES.map((name) => {
                            const count = clientTasks.filter(t => t.assigned_to === name).length;
                            if (count === 0) return null;
                            return (
                              <span 
                                key={name}
                                className="px-1.5 py-0.5 rounded text-xs font-bold text-white"
                                style={{ backgroundColor: COLLABORATOR_COLORS[name] }}
                              >
                                {count}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </ClientRow>
                  </div>

                  {/* Expanded Task List */}
                  {isExpanded && clientTasks.length > 0 && (
                    <div className="ml-14 mr-4 bg-muted/30 rounded-lg border border-border p-3 space-y-2">
                      {clientTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onToggle={() => toggleComplete(task.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Task Modal */}
        {checklistClient && (
          <TaskModal
            isOpen={!!checklistClientId}
            onClose={() => setChecklistClientId(null)}
            client={checklistClient}
            tasks={getTasksForClient(checklistClientId!)}
            onAddTask={addTask}
            onToggleComplete={toggleComplete}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        )}
      </div>
    </AppLayout>
  );
}

// Task Item Component
interface TaskItemProps {
  task: Task;
  onToggle: () => void;
}

function TaskItem({ task, onToggle }: TaskItemProps) {
  return (
    <div className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-muted/50 transition-colors">
      <Checkbox
        checked={task.completed}
        onCheckedChange={onToggle}
      />
      <span className={cn(
        "flex-1 text-sm",
        task.completed && "line-through text-muted-foreground"
      )}>
        {task.title}
      </span>
      {task.assigned_to && (
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
          style={{ backgroundColor: COLLABORATOR_COLORS[task.assigned_to] }}
        >
          {task.assigned_to.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
