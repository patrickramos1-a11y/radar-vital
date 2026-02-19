import { useState, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClientGrid } from "@/components/dashboard/ClientGrid";
import { FilterBar, SortOption, SortDirection, FilterFlags, ClientTypeFilter, ViewMode, GridSize } from "@/components/dashboard/FilterBar";
import { TaskModal } from "@/components/checklist/TaskModal";
import { CommentsModal } from "@/components/comments/CommentsModal";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { useAllClientsCommentCountsWithRefresh } from "@/hooks/useClientComments";
import { useAuth } from "@/contexts/AuthContext";
import { CollaboratorName, Client } from "@/types/client";
import { Users, Star, Sparkles, UserCheck, MessageCircle, ShieldCheck, AlertTriangle } from "lucide-react";
import { COLLABORATOR_COLORS } from "@/types/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { PanelNavigationBar } from "@/components/panel-links/PanelNavigationBar";
import { MobileCompactHeader } from "@/components/mobile/MobileCompactHeader";
import { MobileCompactFilters } from "@/components/mobile/MobileCompactFilters";
import { MobileCompactGrid } from "@/components/mobile/MobileCompactGrid";
import { MobileClientDetail } from "@/components/mobile/MobileClientDetail";
const Index = () => {
  const isMobile = useIsMobile();
  const { currentUser } = useAuth();
  
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

  const [commentCounts, refreshCommentCounts] = useAllClientsCommentCountsWithRefresh(currentUser?.name);
  const getCommentCount = useCallback((clientId: string) => commentCounts.get(clientId) || 0, [commentCounts]);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [checklistClientId, setChecklistClientId] = useState<string | null>(null);
  const [mobileDetailClientId, setMobileDetailClientId] = useState<string | null>(null);
  const [mobileCommentsClientId, setMobileCommentsClientId] = useState<string | null>(null);
  const [mobileJackboxClientId, setMobileJackboxClientId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [clientTypeFilter, setClientTypeFilter] = useState<ClientTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('fit-all');
  const [gridSize, setGridSize] = useState<GridSize>(null);
  const [fitAllLocked, setFitAllLocked] = useState(false);
  
  const [filterFlags, setFilterFlags] = useState<FilterFlags>({
    priority: false,
    highlighted: false,
    selected: false,
    hasCollaborators: false,
    withJackbox: false,
    withoutJackbox: false,
    withComments: false,
    withoutComments: false,
  });
  const [collaboratorFilters, setCollaboratorFilters] = useState<CollaboratorName[]>([]);


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
  
  // Count of clients with at least one collaborator assigned (responsáveis)
  const responsaveisCount = useMemo(() => 
    activeClients.filter(c => Object.values(c.collaborators).some(v => v)).length,
    [activeClients]
  );

  // "De Boa" classification: client has no alerts
  const isClienteDeBoa = useCallback((client: Client) => {
    return !client.isPriority &&
      !client.isHighlighted &&
      !client.isChecked &&
      !Object.values(client.collaborators).some(v => v) &&
      getCommentCount(client.id) === 0 &&
      getActiveTaskCount(client.id) === 0;
  }, [getCommentCount, getActiveTaskCount]);

  const deBoaCount = useMemo(() => activeClients.filter(c => isClienteDeBoa(c)).length, [activeClients, isClienteDeBoa]);
  const comAlertaCount = useMemo(() => activeClients.filter(c => !isClienteDeBoa(c)).length, [activeClients, isClienteDeBoa]);

  type AlertFilter = 'all' | 'deBoa' | 'comAlerta';
  const [alertFilter, setAlertFilter] = useState<AlertFilter>('all');

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
      hasCollaborators: false,
      withJackbox: false,
      withoutJackbox: false,
      withComments: false,
      withoutComments: false,
    });
    setCollaboratorFilters([]);
    setClientTypeFilter('all');
    setSearchQuery('');
    setAlertFilter('all');
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

    // Apply search filter first
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(c => {
        // Search by client name
        const matchesName = c.name.toLowerCase().includes(query);
        
        // Search by initials
        const matchesInitials = c.initials.toLowerCase().includes(query);
        
        // Search by collaborator names
        const matchesCollaborator = Object.entries(c.collaborators)
          .some(([name, isActive]) => isActive && name.toLowerCase().includes(query));
        
        return matchesName || matchesInitials || matchesCollaborator;
      });
    }

    if (clientTypeFilter !== 'all') {
      result = result.filter(c => c.clientType === clientTypeFilter);
    }

    // Alert filter (De Boa / Com Alerta)
    if (alertFilter === 'deBoa') {
      result = result.filter(c => isClienteDeBoa(c));
    } else if (alertFilter === 'comAlerta') {
      result = result.filter(c => !isClienteDeBoa(c));
    }

    const hasAnyFilterActive = 
      filterFlags.priority || 
      filterFlags.highlighted || 
      filterFlags.selected ||
      filterFlags.hasCollaborators ||
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
        const matchesHasCollaborators = filterFlags.hasCollaborators && Object.values(c.collaborators).some(v => v);
        const matchesWithJackbox = filterFlags.withJackbox && getActiveTaskCount(c.id) > 0;
        const matchesWithoutJackbox = filterFlags.withoutJackbox && getActiveTaskCount(c.id) === 0;
        const matchesWithComments = filterFlags.withComments && getCommentCount(c.id) > 0;
        const matchesWithoutComments = filterFlags.withoutComments && getCommentCount(c.id) === 0;
        const matchesCollaborator = collaboratorFilters.length > 0 && 
          collaboratorFilters.some(collab => c.collaborators[collab]);

        return matchesPriority || matchesHighlighted || matchesSelected || matchesHasCollaborators ||
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
      case 'comments':
        result.sort((a, b) => (getCommentCount(b.id) - getCommentCount(a.id)) * multiplier);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name) * multiplier);
        break;
      default:
        result.sort((a, b) => (a.order - b.order) * multiplier);
        break;
    }

    return result;
  }, [activeClients, filterFlags, collaboratorFilters, clientTypeFilter, alertFilter, sortBy, sortDirection, highlightedClients, getActiveTaskCount, getCommentCount, searchQuery, isClienteDeBoa]);

  const totalClients = activeClients.length;

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

  const mobileDetailClient = mobileDetailClientId ? getClient(mobileDetailClientId) : null;
  const mobileCommentsClient = mobileCommentsClientId ? getClient(mobileCommentsClientId) : null;
  const mobileJackboxClient = mobileJackboxClientId ? getClient(mobileJackboxClientId) : null;

  // Calculate hasActiveFilters for mobile
  const hasActiveFilters = 
    filterFlags.priority || 
    filterFlags.highlighted || 
    filterFlags.selected ||
    filterFlags.hasCollaborators ||
    filterFlags.withJackbox || 
    filterFlags.withComments ||
    collaboratorFilters.length > 0 ||
    clientTypeFilter !== 'all' ||
    alertFilter !== 'all' ||
    searchQuery.trim() !== '';

  // Mobile View
  if (isMobile) {
    return (
      <AppLayout>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header with macro indicators */}
          <MobileCompactHeader
            totalClients={totalClients}
            acCount={acCount}
            avCount={avCount}
            collaboratorSelectedStats={collaboratorStats}
            priorityCount={priorityCount}
            highlightedCount={highlightedClients.size}
            responsaveisCount={responsaveisCount}
            commentsCount={withCommentsCount}
            filterFlags={{
              priority: filterFlags.priority,
              highlighted: filterFlags.highlighted,
              hasCollaborators: filterFlags.hasCollaborators,
              withComments: filterFlags.withComments,
            }}
            collaboratorFilters={collaboratorFilters}
            onFilterFlagToggle={(flag) => {
              // Map mobile flags to full FilterFlags
              if (flag === 'hasCollaborators') {
                handleFilterFlagToggle('hasCollaborators');
              } else {
                handleFilterFlagToggle(flag);
              }
            }}
            onCollaboratorFilterToggle={handleCollaboratorFilterToggle}
          />

          {/* Filters: sort, search, type */}
          <MobileCompactFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            sortDirection={sortDirection}
            clientTypeFilter={clientTypeFilter}
            visibleCount={filteredClients.length}
            totalCount={activeClients.length}
            acCount={acCount}
            avCount={avCount}
            hasActiveFilters={hasActiveFilters}
            onSortChange={setSortBy}
            onSortDirectionChange={setSortDirection}
            onClientTypeFilterChange={setClientTypeFilter}
            onClearAllFilters={handleClearAllFilters}
          />

          {/* Compact grid of clients */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <MobileCompactGrid
                clients={filteredClients}
                highlightedClients={highlightedClients}
                getActiveTaskCount={getActiveTaskCount}
                getCommentCount={getCommentCount}
                onClientTap={setMobileDetailClientId}
              />
            )}
          </div>

          {/* Detail sheet */}
          <MobileClientDetail
            client={mobileDetailClient}
            isOpen={!!mobileDetailClientId}
            onClose={() => setMobileDetailClientId(null)}
            isHighlighted={mobileDetailClientId ? highlightedClients.has(mobileDetailClientId) : false}
            activeTaskCount={mobileDetailClientId ? getActiveTaskCount(mobileDetailClientId) : 0}
            commentCount={mobileDetailClientId ? getCommentCount(mobileDetailClientId) : 0}
            tasks={mobileDetailClientId ? getTasksForClient(mobileDetailClientId) : []}
            onTogglePriority={togglePriority}
            onToggleHighlight={toggleHighlight}
            onToggleChecked={toggleChecked}
            onToggleCollaborator={handleToggleCollaborator}
            onAddTask={addTask}
            onToggleComplete={toggleComplete}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />

          {/* Comments modal - opened from card action */}
          {mobileCommentsClient && (
            <CommentsModal
              isOpen={!!mobileCommentsClientId}
              onClose={() => setMobileCommentsClientId(null)}
              clientId={mobileCommentsClient.id}
              clientName={mobileCommentsClient.name}
            />
          )}

          {/* Jackbox modal - opened from card action */}
          {mobileJackboxClient && (
            <TaskModal
              isOpen={!!mobileJackboxClientId}
              onClose={() => setMobileJackboxClientId(null)}
              client={mobileJackboxClient}
              tasks={getTasksForClient(mobileJackboxClientId!)}
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

  // Desktop View
  return (
    <AppLayout>
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Stats Bar */}
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-card border-b border-border flex-wrap">
            <StatCardMini icon={<Users className="w-3.5 h-3.5" />} value={totalClients} label="Clientes" />
            <StatCardMini value={acCount} label="AC" variant="success" />
            <StatCardMini value={avCount} label="AV" variant="warning" />
            <div className="w-px h-6 bg-border mx-1" />
            <AlertFilterButton
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              value={deBoaCount}
              label="De Boa"
              color="#10B981"
              active={alertFilter === 'deBoa'}
              onClick={() => setAlertFilter(alertFilter === 'deBoa' ? 'all' : 'deBoa')}
            />
            <AlertFilterButton
              icon={<AlertTriangle className="w-3.5 h-3.5" />}
              value={comAlertaCount}
              label="Com Alerta"
              color="#EF4444"
              active={alertFilter === 'comAlerta'}
              onClick={() => setAlertFilter(alertFilter === 'comAlerta' ? 'all' : 'comAlerta')}
            />
            <div className="w-px h-6 bg-border mx-1" />
            {(['celine', 'gabi', 'darley', 'vanessa'] as const).map((name) => (
              <div key={name} className="flex flex-col rounded-lg border border-border overflow-hidden bg-card min-w-[40px]">
                <div className="px-2 py-0.5 text-center" style={{ backgroundColor: COLLABORATOR_COLORS[name] }}>
                  <span className="text-[9px] font-semibold text-white uppercase">{name}</span>
                </div>
                <div className="flex items-center justify-center px-2 py-1">
                  <span className="text-sm font-bold leading-none">{collaboratorStats[name]}</span>
                </div>
              </div>
            ))}
            <div className="w-px h-6 bg-border mx-1" />
            <StatBadge icon={<Star className="w-3.5 h-3.5" />} value={priorityCount} label="Prioridade" color="rgb(245, 158, 11)" active={filterFlags.priority} onClick={() => handleFilterFlagToggle('priority')} />
            <StatBadge icon={<Sparkles className="w-3.5 h-3.5" />} value={highlightedClients.size} label="Destaque" color="rgb(59, 130, 246)" active={filterFlags.highlighted} onClick={() => handleFilterFlagToggle('highlighted')} />
            <StatBadge icon={<UserCheck className="w-3.5 h-3.5" />} value={responsaveisCount} label="Responsáveis" color="rgb(16, 185, 129)" active={filterFlags.hasCollaborators} onClick={() => handleFilterFlagToggle('hasCollaborators')} />
            <StatBadge icon={<MessageCircle className="w-3.5 h-3.5" />} value={withCommentsCount} label="Comentários" color="rgb(99, 102, 241)" active={filterFlags.withComments} onClick={() => handleFilterFlagToggle('withComments')} />
          </div>

          {/* Panel Navigation Bar */}
          <PanelNavigationBar />

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
            searchQuery={searchQuery}
            viewMode={viewMode}
            gridSize={gridSize}
            fitAllLocked={fitAllLocked}
            onSearchChange={setSearchQuery}
            onSortChange={setSortBy}
            onSortDirectionChange={setSortDirection}
            onFilterFlagToggle={handleFilterFlagToggle}
            onCollaboratorFilterToggle={handleCollaboratorFilterToggle}
            onClientTypeFilterChange={setClientTypeFilter}
            onClearHighlights={clearHighlights}
            onClearAllFilters={handleClearAllFilters}
            onViewModeChange={setViewMode}
            onGridSizeChange={setGridSize}
            onFitAllLockedChange={setFitAllLocked}
          />

          <div 
            className={`flex-1 ${fitAllLocked ? 'overflow-hidden' : 'overflow-auto'}`}
            style={fitAllLocked ? { overflow: 'hidden', maxHeight: '100%' } : {}}
          >
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
                viewMode={viewMode}
                gridSize={gridSize}
                fitAllLocked={fitAllLocked}
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

function StatCardMini({ icon, value, label, variant = 'default' }: { icon?: React.ReactNode; value: number; label: string; variant?: 'default' | 'success' | 'warning' }) {
  const accentColor = {
    default: undefined,
    success: '#10B981',
    warning: '#F59E0B',
  }[variant];
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-card border-border">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      {!icon && accentColor && (
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
      )}
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

function AlertFilterButton({ icon, value, label, color, active, onClick }: StatBadgeProps) {
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
        {active ? `Mostrando: ${label}` : `Filtrar: ${label}`}
      </TooltipContent>
    </Tooltip>
  );
}

export default Index;
