import { useMemo, useState } from "react";
import { Shield, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PanelHeader, StatCard } from "@/components/panels/PanelHeader";
import { PanelFilters, PanelSortOption } from "@/components/panels/PanelFilters";
import { ClientRow } from "@/components/panels/ClientRow";
import { TaskModal } from "@/components/checklist/TaskModal";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { usePanelFilters } from "@/hooks/usePanelFilters";
import { Client } from "@/types/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LicencasPanel() {
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

  // Filter states
  const [showOnlyExpired, setShowOnlyExpired] = useState(false);
  const [showOnlyExpiring, setShowOnlyExpiring] = useState(false);

  // Custom sorter for licenses
  const customSorter = (a: Client, b: Client, sortBy: PanelSortOption, multiplier: number) => {
    switch (sortBy) {
      case 'licenses':
        return (b.licenses - a.licenses) * multiplier;
      case 'critical':
        return ((b.licenseBreakdown?.foraValidade || 0) - (a.licenseBreakdown?.foraValidade || 0)) * multiplier;
      case 'expiring':
        const dateA = a.licenseBreakdown?.proximaDataVencimento ? new Date(a.licenseBreakdown.proximaDataVencimento).getTime() : Infinity;
        const dateB = b.licenseBreakdown?.proximaDataVencimento ? new Date(b.licenseBreakdown.proximaDataVencimento).getTime() : Infinity;
        return (dateA - dateB) * multiplier;
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
    filteredClients: baseFilteredClients,
    handleFilterFlagToggle,
    handleCollaboratorFilterToggle,
    handleClearFilters,
  } = usePanelFilters({
    clients: activeClients,
    highlightedClients,
    getActiveTaskCount,
    defaultSort: 'licenses',
    customSorter,
  });

  // Apply extra filters
  const filteredClients = useMemo(() => {
    let result = baseFilteredClients;
    
    if (showOnlyExpired) {
      result = result.filter(c => (c.licenseBreakdown?.foraValidade || 0) > 0);
    }
    
    if (showOnlyExpiring) {
      result = result.filter(c => (c.licenseBreakdown?.proximoVencimento || 0) > 0);
    }
    
    return result;
  }, [baseFilteredClients, showOnlyExpired, showOnlyExpiring]);

  // KPIs
  const kpis = useMemo(() => {
    return activeClients.reduce((acc, c) => {
      const breakdown = c.licenseBreakdown || { validas: 0, proximoVencimento: 0, foraValidade: 0 };
      return {
        total: acc.total + breakdown.validas + breakdown.proximoVencimento + breakdown.foraValidade,
        validas: acc.validas + breakdown.validas,
        proximoVencimento: acc.proximoVencimento + breakdown.proximoVencimento,
        foraValidade: acc.foraValidade + breakdown.foraValidade,
      };
    }, { total: 0, validas: 0, proximoVencimento: 0, foraValidade: 0 });
  }, [activeClients]);

  const checklistClient = checklistClientId ? activeClients.find(c => c.id === checklistClientId) : null;

  const handleClearAllFilters = () => {
    handleClearFilters();
    setShowOnlyExpired(false);
    setShowOnlyExpiring(false);
  };

  return (
    <AppLayout>
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header with KPIs */}
          <PanelHeader title="Painel de Licenças" subtitle="Visão detalhada das licenças por cliente">
            <StatCard icon={<Shield className="w-4 h-4" />} value={kpis.total} label="Total" />
            <StatCard icon={<CheckCircle className="w-4 h-4" />} value={kpis.validas} label="Válidas" variant="success" />
            <StatCard icon={<Clock className="w-4 h-4" />} value={kpis.proximoVencimento} label="Próx. Venc." variant="warning" />
            <StatCard icon={<AlertTriangle className="w-4 h-4" />} value={kpis.foraValidade} label="Vencidas" variant="danger" />
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
            onClearFilters={handleClearAllFilters}
            highlightedCount={counts.highlighted}
            jackboxCount={counts.jackbox}
            checkedCount={counts.checked}
            showCollaborators={false}
            extraSortOptions={[
              { value: 'licenses', label: 'Licenças' },
              { value: 'critical', label: 'Vencidas' },
              { value: 'expiring', label: 'Urgência' },
            ]}
            extraFilters={
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowOnlyExpired(!showOnlyExpired)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    showOnlyExpired 
                      ? 'bg-red-500/20 text-red-600 border border-red-500/30' 
                      : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
                  }`}
                >
                  Vencidas
                </button>
                <button
                  onClick={() => setShowOnlyExpiring(!showOnlyExpiring)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    showOnlyExpiring 
                      ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' 
                      : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
                  }`}
                >
                  Próx. Venc.
                </button>
              </div>
            }
          />

          {/* Client List */}
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {filteredClients.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Nenhum cliente encontrado
              </div>
            ) : (
              filteredClients.map((client) => {
                const breakdown = client.licenseBreakdown || { validas: 0, proximoVencimento: 0, foraValidade: 0, proximaDataVencimento: null };
                const total = breakdown.validas + breakdown.proximoVencimento + breakdown.foraValidade;
                
                return (
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
                    {/* License Stats */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-foreground">{total}</span>
                        <span className="text-xs text-muted-foreground">total</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/20 text-emerald-600">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span className="text-sm font-bold">{breakdown.validas}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Licenças válidas</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 text-amber-600">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-sm font-bold">{breakdown.proximoVencimento}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Próximas do vencimento (30 dias)</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 text-red-600">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span className="text-sm font-bold">{breakdown.foraValidade}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Licenças vencidas</TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {/* Next expiry date */}
                      {breakdown.proximaDataVencimento && (
                        <div className="text-xs text-muted-foreground">
                          Próx. venc.: <span className="font-medium text-foreground">
                            {format(new Date(breakdown.proximaDataVencimento), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      )}
                    </div>
                  </ClientRow>
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
      </TooltipProvider>
    </AppLayout>
  );
}
