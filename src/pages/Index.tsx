import { useState, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClientGrid } from "@/components/dashboard/ClientGrid";
import { FilterBar, SortOption, SortDirection, FilterFlags, ClientTypeFilter } from "@/components/dashboard/FilterBar";
import { TaskModal } from "@/components/checklist/TaskModal";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { useAllClientsCommentCountsWithRefresh } from "@/hooks/useClientComments";
import { calculateTotals, calculateTotalDemands, CollaboratorName, Client } from "@/types/client";
import { Users, FileText, Shield, ClipboardList, Star, Sparkles, CheckSquare, MessageCircle } from "lucide-react";
import { COLLABORATOR_COLORS } from "@/types/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  const [commentCounts, refreshCommentCounts] = useAllClientsCommentCountsWithRefresh();
  const getCommentCount = useCallback((clientId: string) => commentCounts.get(clientId) || 0, [commentCounts]);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [checklistClientId, setChecklistClientId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [clientTypeFilter, setClientTypeFilter] = useState<ClientTypeFilter>('all');
  
  const [filterFlags, setFilterFlags] = useState<FilterFlags>({
    priority: false,
    highlighted: false,
    selected: false,
    withJackbox: false,
    withoutJackbox: false,
    withComments: false,
    withoutComments: false,
  });
  const [collaboratorFilters, setCollaboratorFilters] = useState<CollaboratorName[]>([]);

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

  const jackboxCount = useMemo(() => 
    activeClients.filter(c => getActiveTaskCount(c.id) > 0).length,
    [activeClients, getActiveTaskCount]
  );

  const acCount = useMemo(() => activeClients.filter(c => c.clientType === 'AC').length, [activeClients]);
  const avCount = useMemo(() => activeClients.filter(c => c.clientType === 'AV').length, [activeClients]);
  const withCommentsCount = useMemo(() => 
    activeClients.filter(c => getCommentCount(c.id) > 0).length,
    [activeClients, getCommentCount]
  );
  const priorityCount = useMemo(() => activeClients.filter(c => c.isPriority).length, [activeClients]);
  const selectedCount = useMemo(() => activeClients.filter(c => c.isChecked).length, [activeClients]);

  const handleFilterFlagToggle = (flag: keyof FilterFlags) => {
    setFilterFlags(prev => ({
      ...prev,
      [flag]: !prev[flag],
      ...(flag === 'withJackbox' && !prev.withJackbox ? { withoutJackbox: false } : {}),
      ...(flag === 'withoutJackbox' && !prev.withoutJackbox ? { withJackbox: false } : {}),
      ...(flag === 'withComments' && !prev.withComments ? { withoutComments: false } : {}),
      ...(flag === 'withoutComments' && !prev.withoutComments ? { withComments: false } : {}),
    }));
  };

  const handleClearAllFilters = () => {
    setFilterFlags({
      priority: false,
      highlighted: false,
      selected: false,
      withJackbox: false,
      withoutJackbox: false,
      withComments: false,
      withoutComments: false,
    });
    setCollaboratorFilters([]);
    setClientTypeFilter('all');
  };

  const handleCollaboratorFilterToggle = (collaborator: CollaboratorName) => {
    setCollaboratorFilters(prev => 
      prev.includes(collaborator)
        ? prev.filter(c => c !== collaborator)
        : [...prev, collaborator]
    );
  };

  const filteredClients = useMemo(() => {
    let result = [...activeClients];

    if (clientTypeFilter !== 'all') {
      result = result.filter(c => c.clientType === clientTypeFilter);
    }

    const hasAnyFilterActive = 
      filterFlags.priority || 
      filterFlags.highlighted || 
      filterFlags.selected ||
      filterFlags.withJackbox || 
      filterFlags.withoutJackbox ||
      filterFlags.withComments ||
      filterFlags.withoutComments ||
      collaboratorFilters.length > 0;

    if (hasAnyFilterActive) {
      result = result.filter(c => {
        const matchesPriority = filterFlags.priority && c.isPriority;
        const matchesHighlighted = filterFlags.highlighted && highlightedClients.has(c.id);
        const matchesSelected = filterFlags.selected && c.isChecked;
        const matchesWithJackbox = filterFlags.withJackbox && getActiveTaskCount(c.id) > 0;
        const matchesWithoutJackbox = filterFlags.withoutJackbox && getActiveTaskCount(c.id) === 0;
        const matchesWithComments = filterFlags.withComments && getCommentCount(c.id) > 0;
        const matchesWithoutComments = filterFlags.withoutComments && getCommentCount(c.id) === 0;
        const matchesCollaborator = collaboratorFilters.length > 0 && 
          collaboratorFilters.some(collab => c.collaborators[collab]);

        return matchesPriority || matchesHighlighted || matchesSelected || 
               matchesWithJackbox || matchesWithoutJackbox || 
               matchesWithComments || matchesWithoutComments || matchesCollaborator;
      });
    }

    const multiplier = sortDirection === 'desc' ? 1 : -1;
    
    switch (sortBy) {
      case 'jackbox':
        result.sort((a, b) => {
          const aTaskCount = getActiveTaskCount(a.id);
          const bTaskCount = getActiveTaskCount(b.id);
          if (aTaskCount !== bTaskCount) return (bTaskCount - aTaskCount) * multiplier;
          if (a.isPriority !== b.isPriority) return (a.isPriority ? -1 : 1) * multiplier;
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
      default:
        result.sort((a, b) => (a.order - b.order) * multiplier);
        break;
    }

    return result;
  }, [activeClients, filterFlags, collaboratorFilters, clientTypeFilter, sortBy, sortDirection, highlightedClients, getActiveTaskCount, getCommentCount]);

  const totals = useMemo(() => calculateTotals(activeClients), [activeClients]);

  const collaboratorStats = useMemo(() => ({
    celine: activeClients.filter(c => c.collaborators.celine).length,
    gabi: activeClients.filter(c => c.collaborators.gabi).length,
    darley: activeClients.filter(c => c.collaborators.darley).length,
    vanessa: activeClients.filter(c => c.collaborators.vanessa).length,
  }), [activeClients]);

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
      <TooltipProvider delayDuration={200}>
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
            {/* Priority Badge */}
            <StatBadge 
              icon={<Star className="w-3.5 h-3.5" />} 
              value={priorityCount} 
              label="Prioridade" 
              color="rgb(245, 158, 11)"
              active={filterFlags.priority}
              onClick={() => handleFilterFlagToggle('priority')}
            />
            {/* Highlighted Badge */}
            <StatBadge 
              icon={<Sparkles className="w-3.5 h-3.5" />} 
              value={highlightedClients.size} 
              label="Destaque" 
              color="rgb(59, 130, 246)"
              active={filterFlags.highlighted}
              onClick={() => handleFilterFlagToggle('highlighted')}
            />
            {/* Selected Badge */}
            <StatBadge 
              icon={<CheckSquare className="w-3.5 h-3.5" />} 
              value={selectedCount} 
              label="Selecionados" 
              color="rgb(16, 185, 129)"
              active={filterFlags.selected}
              onClick={() => handleFilterFlagToggle('selected')}
            />
            {/* Comments Badge */}
            <StatBadge 
              icon={<MessageCircle className="w-3.5 h-3.5" />} 
              value={withCommentsCount} 
              label="Comentários" 
              color="rgb(99, 102, 241)"
              active={filterFlags.withComments}
              onClick={() => handleFilterFlagToggle('withComments')}
            />
          </div>

          {/* Filter Bar */}
          <FilterBar
            sortBy={sortBy}
            sortDirection={sortDirection}
            filterFlags={filterFlags}
            collaboratorFilters={collaboratorFilters}
            clientTypeFilter={clientTypeFilter}
            priorityCount={priorityCount}
            highlightedCount={highlightedClients.size}
            selectedCount={selectedCount}
            jackboxCount={jackboxCount}
            commentsCount={withCommentsCount}
            visibleCount={filteredClients.length}
            totalCount={activeClients.length}
            acCount={acCount}
            avCount={avCount}
            onSortChange={setSortBy}
            onSortDirectionChange={setSortDirection}
            onFilterFlagToggle={handleFilterFlagToggle}
            onCollaboratorFilterToggle={handleCollaboratorFilterToggle}
            onClientTypeFilterChange={setClientTypeFilter}
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
                getCommentCount={getCommentCount}
                onSelectClient={handleSelectClient}
                onHighlightClient={toggleHighlight}
                onTogglePriority={togglePriority}
                onToggleCollaborator={handleToggleCollaborator}
                onOpenChecklist={handleOpenChecklist}
              />
            )}
          </div>

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
      </TooltipProvider>
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

interface StatBadgeProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}

function StatBadge({ icon, value, label, color, active, onClick }: StatBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer hover:scale-105 ${
            active ? 'ring-2 ring-offset-1 ring-offset-background' : ''
          }`}
          style={{
            backgroundColor: active ? color : 'transparent',
            borderColor: color,
            color: active ? '#fff' : color,
          }}
        >
          {icon}
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold leading-none">{value}</span>
            <span className="text-[7px] uppercase opacity-80">{label}</span>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {active ? `Filtrar por ${label}` : `Clique para filtrar por ${label}`}
      </TooltipContent>
    </Tooltip>
  );
}

export default Index;
