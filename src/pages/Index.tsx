import { useState, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ClientGrid } from "@/components/dashboard/ClientGrid";
import { FilterBar, SortOption, FilterOption } from "@/components/dashboard/FilterBar";
import { useClients } from "@/contexts/ClientContext";
import { calculateTotals, calculateTotalDemands } from "@/types/client";

const Index = () => {
  const { activeClients, highlightedClients, toggleHighlight, clearHighlights } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
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
    }

    // Sort
    switch (sortBy) {
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

  const handleSelectClient = (id: string) => {
    setSelectedClientId(prev => prev === id ? null : id);
  };

  const togglePresentationMode = () => {
    setIsPresentationMode(prev => !prev);
  };

  return (
    <div className={`
      flex flex-col h-screen w-screen overflow-hidden
      ${isPresentationMode ? 'presentation-mode' : ''}
    `}>
      {/* Header */}
      <DashboardHeader
        totalClients={totals.totalClients}
        totalProcesses={totals.totalProcesses}
        totalLicenses={totals.totalLicenses}
        totalDemands={totals.totalDemands}
        isPresentationMode={isPresentationMode}
        onTogglePresentationMode={togglePresentationMode}
      />

      {/* Filter Bar */}
      <FilterBar
        sortBy={sortBy}
        filterBy={filterBy}
        highlightedCount={highlightedClients.size}
        onSortChange={setSortBy}
        onFilterChange={setFilterBy}
        onClearHighlights={clearHighlights}
        isPresentationMode={isPresentationMode}
      />

      {/* Main Content - Client Grid */}
      <main className="flex-1 overflow-hidden">
        <ClientGrid
          clients={filteredClients}
          selectedClientId={selectedClientId}
          highlightedClients={highlightedClients}
          onSelectClient={handleSelectClient}
          onHighlightClient={toggleHighlight}
        />
      </main>
    </div>
  );
};

export default Index;
