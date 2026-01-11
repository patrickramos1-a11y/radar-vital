import { useMemo } from "react";
import { ClipboardList, CheckCircle, PlayCircle, CircleDashed, XCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PanelHeader, StatCard } from "@/components/panels/PanelHeader";
import { PanelFilters, PanelSortOption } from "@/components/panels/PanelFilters";
import { ClientRow } from "@/components/panels/ClientRow";
import { TaskModal } from "@/components/checklist/TaskModal";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { usePanelFilters } from "@/hooks/usePanelFilters";
import { calculateTotalDemands, Client, COLLABORATOR_COLORS, COLLABORATOR_NAMES } from "@/types/client";
import { useState } from "react";

export default function DemandasPanel() {
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
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
  } = useTasks();

  const [checklistClientId, setChecklistClientId] = useState<string | null>(null);

  // Custom sorter for demands
  const customSorter = (a: Client, b: Client, sortBy: PanelSortOption, multiplier: number) => {
    switch (sortBy) {
      case 'demands':
        return (calculateTotalDemands(b.demands) - calculateTotalDemands(a.demands)) * multiplier;
      case 'critical':
        return (b.demands.notStarted - a.demands.notStarted) * multiplier;
      default:
        return null;
    }
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
    clients: activeClients,
    highlightedClients,
    getActiveTaskCount,
    defaultSort: 'demands',
    customSorter,
  });

  // KPIs
  const kpis = useMemo(() => {
    return activeClients.reduce((acc, c) => ({
      total: acc.total + calculateTotalDemands(c.demands),
      completed: acc.completed + c.demands.completed,
      inProgress: acc.inProgress + c.demands.inProgress,
      notStarted: acc.notStarted + c.demands.notStarted,
      cancelled: acc.cancelled + c.demands.cancelled,
    }), { total: 0, completed: 0, inProgress: 0, notStarted: 0, cancelled: 0 });
  }, [activeClients]);

  // Collaborator demand totals
  const collaboratorTotals = useMemo(() => {
    return activeClients.reduce((acc, c) => ({
      celine: acc.celine + (c.demandsByCollaborator?.celine || 0),
      gabi: acc.gabi + (c.demandsByCollaborator?.gabi || 0),
      darley: acc.darley + (c.demandsByCollaborator?.darley || 0),
      vanessa: acc.vanessa + (c.demandsByCollaborator?.vanessa || 0),
    }), { celine: 0, gabi: 0, darley: 0, vanessa: 0 });
  }, [activeClients]);

  const checklistClient = checklistClientId ? activeClients.find(c => c.id === checklistClientId) : null;

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with KPIs */}
        <PanelHeader title="Painel de Demandas" subtitle="Visão detalhada das demandas por cliente">
          <StatCard icon={<ClipboardList className="w-4 h-4" />} value={kpis.total} label="Total" />
          <StatCard icon={<CheckCircle className="w-4 h-4" />} value={kpis.completed} label="Concluídas" variant="success" />
          <StatCard icon={<PlayCircle className="w-4 h-4" />} value={kpis.inProgress} label="Em Execução" variant="info" />
          <StatCard icon={<CircleDashed className="w-4 h-4" />} value={kpis.notStarted} label="Não Iniciadas" variant="warning" />
          <StatCard icon={<XCircle className="w-4 h-4" />} value={kpis.cancelled} label="Canceladas" variant="danger" />
          
          <div className="w-px h-8 bg-border mx-1" />
          
          {/* Collaborator stats */}
          {COLLABORATOR_NAMES.map((name) => (
            <div 
              key={name}
              className="flex items-center gap-1.5 px-2 py-1 rounded border"
              style={{ borderColor: COLLABORATOR_COLORS[name], backgroundColor: `${COLLABORATOR_COLORS[name]}15` }}
            >
              <span className="text-sm font-bold" style={{ color: COLLABORATOR_COLORS[name] }}>
                {collaboratorTotals[name]}
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
          extraSortOptions={[
            { value: 'demands', label: 'Demandas' },
            { value: 'critical', label: 'Não Iniciadas' },
          ]}
        />

        {/* Client List */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {filteredClients.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Nenhum cliente encontrado
            </div>
          ) : (
            filteredClients.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                isHighlighted={highlightedClients.has(client.id)}
                activeTaskCount={getActiveTaskCount(client.id)}
                onTogglePriority={togglePriority}
                onToggleHighlight={toggleHighlight}
                onToggleChecked={toggleChecked}
                onOpenChecklist={setChecklistClientId}
              >
                {/* Demand Stats */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-foreground">{calculateTotalDemands(client.demands)}</span>
                    <span className="text-xs text-muted-foreground">total</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <div className="demand-chip-small completed">{client.demands.completed}</div>
                    <div className="demand-chip-small in-progress">{client.demands.inProgress}</div>
                    <div className="demand-chip-small not-started">{client.demands.notStarted}</div>
                    <div className="demand-chip-small cancelled">{client.demands.cancelled}</div>
                  </div>
                  
                  {/* Collaborator demands */}
                  <div className="flex items-center gap-1">
                    {COLLABORATOR_NAMES.map((name) => {
                      const count = client.demandsByCollaborator?.[name] || 0;
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
            ))
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
