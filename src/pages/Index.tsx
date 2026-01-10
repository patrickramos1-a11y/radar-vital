import { useState, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ClientGrid } from "@/components/dashboard/ClientGrid";
import { FilterBar, SortOption, FilterOption } from "@/components/dashboard/FilterBar";
import { useClients } from "@/contexts/ClientContext";
import { calculateTotals, calculateTotalDemands, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";

const Index = () => {
  const { 
    activeClients, 
    highlightedClients, 
    toggleHighlight, 
    clearHighlights,
    togglePriority,
    toggleCollaborator,
    isLoading,
  } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('order');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Apply filters
  const filteredClients = useMemo(() => {
    let result = [...activeClients];

    // Filter
    if (filterBy === 'priority') {
      result = result.filter(c => c.isPriority);
    } else if (filterBy === 'highlighted') {
      result = result.filter(c => highlightedClients.has(c.id));
    } else if (COLLABORATOR_NAMES.includes(filterBy as CollaboratorName)) {
      result = result.filter(c => c.collaborators[filterBy as CollaboratorName]);
    }

    // Sort
    switch (sortBy) {
      case 'priority':
        result.sort((a, b) => {
          if (a.isPriority === b.isPriority) return a.order - b.order;
          return a.isPriority ? -1 : 1;
        });
        break;
      case 'processes':
        result.sort((a, b) => b.processes - a.processes);
        break;
      case 'licenses':
        result.sort((a, b) => b.licenses - a.licenses);
        break;
      case 'demands':
        result.sort((a, b) => calculateTotalDemands(b.demands) - calculateTotalDemands(a.demands));
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'order':
      default:
        result.sort((a, b) => a.order - b.order);
        break;
    }

    return result;
  }, [activeClients, filterBy, sortBy, highlightedClients]);

  const totals = useMemo(() => calculateTotals(activeClients), [activeClients]);

  // Calculate collaborator stats
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

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Header - Compact */}
      <DashboardHeader
        totalClients={totals.totalClients}
        totalProcesses={totals.totalProcesses}
        totalLicenses={totals.totalLicenses}
        totalDemands={totals.totalDemands}
        collaboratorStats={collaboratorStats}
        priorityCount={priorityCount}
        highlightedCount={highlightedClients.size}
      />

      {/* Filter Bar */}
      <FilterBar
        sortBy={sortBy}
        filterBy={filterBy}
        highlightedCount={highlightedClients.size}
        onSortChange={setSortBy}
        onFilterChange={setFilterBy}
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
            onSelectClient={handleSelectClient}
            onHighlightClient={toggleHighlight}
            onTogglePriority={togglePriority}
            onToggleCollaborator={handleToggleCollaborator}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
