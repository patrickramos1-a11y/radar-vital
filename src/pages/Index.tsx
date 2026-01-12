import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClientGrid } from "@/components/dashboard/ClientGrid";
import { FilterBar, SortOption, SortDirection, FilterFlags } from "@/components/dashboard/FilterBar";
import { TaskModal } from "@/components/checklist/TaskModal";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { calculateTotals, calculateTotalDemands, CollaboratorName, Client } from "@/types/client";
import { Users, FileText, Shield, ClipboardList, Star, Sparkles } from "lucide-react";
import { COLLABORATOR_COLORS } from "@/types/client";

const Index = () => {
  const { 
    activeClients, 
    highlightedClients, 
    toggleHighlight, 
    clearHighlights,
    togglePriority,
    toggleChecked,
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
  
  // Multi-select filter flags
  const [filterFlags, setFilterFlags] = useState<FilterFlags>({
    priority: false,
    highlighted: false,
    withJackbox: false,
    withoutJackbox: false,
  });
  const [collaboratorFilters, setCollaboratorFilters] = useState<CollaboratorName[]>([]);

  // Calculate collaborator demand stats from client data (from imports)
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

  // Count clients with active tasks (jackbox)
  const jackboxCount = useMemo(() => 
    activeClients.filter(c => getActiveTaskCount(c.id) > 0).length,
    [activeClients, getActiveTaskCount]
  );

  // Toggle filter flag (multi-select)
  const handleFilterFlagToggle = (flag: keyof FilterFlags) => {
    setFilterFlags(prev => ({
      ...prev,
      [flag]: !prev[flag],
      // Mutually exclusive: withJackbox and withoutJackbox
      ...(flag === 'withJackbox' && !prev.withJackbox ? { withoutJackbox: false } : {}),
      ...(flag === 'withoutJackbox' && !prev.withoutJackbox ? { withJackbox: false } : {}),
    }));
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setFilterFlags({
      priority: false,
      highlighted: false,
      withJackbox: false,
      withoutJackbox: false,
    });
    setCollaboratorFilters([]);
  };

  // Toggle collaborator filter (multi-select)
  const handleCollaboratorFilterToggle = (collaborator: CollaboratorName) => {
    setCollaboratorFilters(prev => 
      prev.includes(collaborator)
        ? prev.filter(c => c !== collaborator)
        : [...prev, collaborator]
    );
  };

  // Apply filters (OR logic - shows items matching ANY selected filter)
  const filteredClients = useMemo(() => {
    let result = [...activeClients];

    // Check if any filter is active
    const hasAnyFilterActive = 
      filterFlags.priority || 
      filterFlags.highlighted || 
      filterFlags.withJackbox || 
      filterFlags.withoutJackbox ||
      collaboratorFilters.length > 0;

    // If any filter is active, use OR logic
    if (hasAnyFilterActive) {
      result = result.filter(c => {
        // Check each condition - return true if ANY matches
        const matchesPriority = filterFlags.priority && c.isPriority;
        const matchesHighlighted = filterFlags.highlighted && highlightedClients.has(c.id);
        const matchesWithJackbox = filterFlags.withJackbox && getActiveTaskCount(c.id) > 0;
        const matchesWithoutJackbox = filterFlags.withoutJackbox && getActiveTaskCount(c.id) === 0;
        const matchesCollaborator = collaboratorFilters.length > 0 && 
          collaboratorFilters.some(collab => c.collaborators[collab]);

        // OR logic: return true if ANY condition matches
        return matchesPriority || 
               matchesHighlighted || 
               matchesWithJackbox || 
               matchesWithoutJackbox || 
               matchesCollaborator;
      });
    }

    // Sort
    const multiplier = sortDirection === 'desc' ? 1 : -1;
    
    switch (sortBy) {
      case 'jackbox':
        result.sort((a, b) => {
          const aTaskCount = getActiveTaskCount(a.id);
          const bTaskCount = getActiveTaskCount(b.id);
          // First by task count
          if (aTaskCount !== bTaskCount) {
            return (bTaskCount - aTaskCount) * multiplier;
          }
          // Then by priority
          if (a.isPriority !== b.isPriority) {
            return (a.isPriority ? -1 : 1) * multiplier;
          }
          // Then by name
          return a.name.localeCompare(b.name);
        });
        break;
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
  }, [activeClients, filterFlags, collaboratorFilters, sortBy, sortDirection, highlightedClients, getActiveTaskCount]);

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
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Stats Bar */}
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-card border-b border-border flex-wrap">
          <StatCardMini icon={<Users className="w-3.5 h-3.5" />} value={totals.totalClients} label="Clientes" />
          <StatCardMini icon={<FileText className="w-3.5 h-3.5" />} value={totals.totalProcesses} label="Processos" />
          <StatCardMini icon={<Shield className="w-3.5 h-3.5" />} value={totals.totalLicenses} label="Licenças" />
          <StatCardMini icon={<ClipboardList className="w-3.5 h-3.5" />} value={totals.totalDemands} label="Demandas" />
          <div className="w-px h-6 bg-border mx-1" />
          {(['celine', 'gabi', 'darley', 'vanessa'] as const).map((name) => (
            <div key={name} className="flex flex-col rounded-lg border border-border overflow-hidden bg-card min-w-[52px]">
              <div className="px-2 py-0.5 text-center" style={{ backgroundColor: COLLABORATOR_COLORS[name] }}>
                <span className="text-[9px] font-semibold text-white uppercase">{name}</span>
              </div>
              <div className="flex items-stretch divide-x divide-border">
                <div className="flex flex-col items-center px-2 py-1 flex-1">
                  <span className="text-sm font-bold leading-none">{collaboratorDemandStats[name]}</span>
                  <span className="text-[7px] text-muted-foreground uppercase">Dem</span>
                </div>
                <div className="flex flex-col items-center px-2 py-1 flex-1">
                  <span className="text-sm font-bold leading-none">{collaboratorStats[name]}</span>
                  <span className="text-[7px] text-muted-foreground uppercase">Sel</span>
                </div>
              </div>
            </div>
          ))}
          <div className="w-px h-6 bg-border mx-1" />
          <StatCardMini icon={<Star className="w-3.5 h-3.5 text-amber-500" />} value={priorityCount} label="Prioridade" />
          <StatCardMini icon={<Sparkles className="w-3.5 h-3.5 text-blue-500" />} value={highlightedClients.size} label="Destaques" />
        </div>

        {/* Filter Bar */}
        <FilterBar
          sortBy={sortBy}
          sortDirection={sortDirection}
          filterFlags={filterFlags}
          collaboratorFilters={collaboratorFilters}
          highlightedCount={highlightedClients.size}
          jackboxCount={jackboxCount}
          onSortChange={setSortBy}
          onSortDirectionChange={setSortDirection}
          onFilterFlagToggle={handleFilterFlagToggle}
          onCollaboratorFilterToggle={handleCollaboratorFilterToggle}
          onClearHighlights={clearHighlights}
          onClearAllFilters={handleClearAllFilters}
        />

        {/* Main Content - Client Grid */}
        <div className="flex-1 overflow-hidden">
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
};

function StatCardMini({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg border bg-card border-border">
      {icon}
      <div className="flex flex-col">
        <span className="text-sm font-bold text-foreground leading-none">{value}</span>
        <span className="text-[8px] text-muted-foreground uppercase">{label}</span>
      </div>
    </div>
  );
}

export default Index;