import { useState, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ClientGrid } from "@/components/dashboard/ClientGrid";
import { FilterBar, SortOption, SortDirection, FilterOption } from "@/components/dashboard/FilterBar";
import { TaskModal } from "@/components/checklist/TaskModal";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { calculateTotals, calculateTotalDemands, COLLABORATOR_NAMES, CollaboratorName, Client } from "@/types/client";

const Index = () => {
  const { 
    activeClients, 
    highlightedClients, 
    toggleHighlight, 
    clearHighlights,
    togglePriority,
    toggleCollaborator,
    isLoading,
    getClient,
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

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [checklistClientId, setChecklistClientId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [collaboratorFilters, setCollaboratorFilters] = useState<CollaboratorName[]>([]);

  // Calculate collaborator demand stats from client data (from imports)
  // This is SEPARATE from selection counts (manual interaction)
  const collaboratorDemandStats = useMemo(() => {
    const stats = { celine: 0, gabi: 0, darley: 0, vanessa: 0 };
    
    activeClients.forEach((client) => {
      stats.celine += client.demandsByCollaborator?.celine || 0;
      stats.gabi += client.demandsByCollaborator?.gabi || 0;
      stats.darley += client.demandsByCollaborator?.darley || 0;
      stats.vanessa += client.demandsByCollaborator?.vanessa || 0;
    });
    
    return stats;
  }, [activeClients]);

  // Toggle collaborator filter (multi-select)
  const handleCollaboratorFilterToggle = (collaborator: CollaboratorName) => {
    setCollaboratorFilters(prev => 
      prev.includes(collaborator)
        ? prev.filter(c => c !== collaborator)
        : [...prev, collaborator]
    );
  };

  // Apply filters
  const filteredClients = useMemo(() => {
    let result = [...activeClients];

    // Filter by main filter option
    if (filterBy === 'priority') {
      result = result.filter(c => c.isPriority);
    } else if (filterBy === 'highlighted') {
      result = result.filter(c => highlightedClients.has(c.id));
    }

    // Filter by collaborators (if any selected - OR logic)
    if (collaboratorFilters.length > 0) {
      result = result.filter(c => 
        collaboratorFilters.some(collab => c.collaborators[collab])
      );
    }

    // Sort
    const multiplier = sortDirection === 'desc' ? 1 : -1;
    
    switch (sortBy) {
      case 'priority':
        result.sort((a, b) => {
          if (a.isPriority === b.isPriority) return (a.order - b.order) * multiplier;
          return (a.isPriority ? -1 : 1) * multiplier;
        });
        break;
      case 'processes':
        result.sort((a, b) => (b.processes - a.processes) * multiplier);
        break;
      case 'licenses':
        result.sort((a, b) => (b.licenses - a.licenses) * multiplier);
        break;
      case 'demands':
        result.sort((a, b) => (calculateTotalDemands(b.demands) - calculateTotalDemands(a.demands)) * multiplier);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name) * multiplier);
        break;
      case 'order':
      default:
        result.sort((a, b) => (a.order - b.order) * multiplier);
        break;
    }

    return result;
  }, [activeClients, filterBy, collaboratorFilters, sortBy, sortDirection, highlightedClients]);

  const totals = useMemo(() => calculateTotals(activeClients), [activeClients]);

  // Calculate collaborator stats (manual selections)
  const collaboratorStats = useMemo(() => ({
    celine: activeClients.filter(c => c.collaborators.celine).length,
    gabi: activeClients.filter(c => c.collaborators.gabi).length,
    darley: activeClients.filter(c => c.collaborators.darley).length,
    vanessa: activeClients.filter(c => c.collaborators.vanessa).length,
  }), [activeClients]);

  // Calculate priority count
  const priorityCount = useMemo(() => 
    activeClients.filter(c => c.isPriority).length, 
    [activeClients]
  );

  const handleSelectClient = (id: string) => {
    setSelectedClientId(prev => prev === id ? null : id);
  };

  const handleToggleCollaborator = (id: string, collaborator: CollaboratorName) => {
    toggleCollaborator(id, collaborator);
  };

  const handleOpenChecklist = (id: string) => {
    setChecklistClientId(id);
  };

  const checklistClient = checklistClientId ? getClient(checklistClientId) : null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Header - Compact */}
      <DashboardHeader
        totalClients={totals.totalClients}
        totalProcesses={totals.totalProcesses}
        totalLicenses={totals.totalLicenses}
        totalDemands={totals.totalDemands}
        collaboratorStats={collaboratorStats}
        collaboratorDemandStats={collaboratorDemandStats}
        priorityCount={priorityCount}
        highlightedCount={highlightedClients.size}
      />

      {/* Filter Bar */}
      <FilterBar
        sortBy={sortBy}
        sortDirection={sortDirection}
        filterBy={filterBy}
        collaboratorFilters={collaboratorFilters}
        highlightedCount={highlightedClients.size}
        onSortChange={setSortBy}
        onSortDirectionChange={setSortDirection}
        onFilterChange={setFilterBy}
        onCollaboratorFilterToggle={handleCollaboratorFilterToggle}
        onClearHighlights={clearHighlights}
      />

      {/* Main Content - Client Grid */}
      <main className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-muted-foreground">Carregando clientes...</p>
            </div>
          </div>
        ) : (
          <ClientGrid
            clients={filteredClients}
            selectedClientId={selectedClientId}
            highlightedClients={highlightedClients}
            getActiveTaskCount={getActiveTaskCount}
            onSelectClient={handleSelectClient}
            onHighlightClient={toggleHighlight}
            onTogglePriority={togglePriority}
            onToggleCollaborator={handleToggleCollaborator}
            onOpenChecklist={handleOpenChecklist}
          />
        )}
      </main>

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
  );
};

export default Index;
