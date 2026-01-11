import { useMemo, useState } from "react";
import { FileText, CheckCircle, Search, Clock, AlertTriangle, XCircle } from "lucide-react";
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

export default function ProcessosPanel() {
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
  const [showOnlyCritical, setShowOnlyCritical] = useState(false);
  const [showOnlyNotified, setShowOnlyNotified] = useState(false);
  const [showOnlyRejected, setShowOnlyRejected] = useState(false);

  // Custom sorter for processes
  const customSorter = (a: Client, b: Client, sortBy: PanelSortOption, multiplier: number) => {
    switch (sortBy) {
      case 'processes':
        return (b.processes - a.processes) * multiplier;
      case 'critical':
        const aCritical = (a.processBreakdown?.notificado || 0) + (a.processBreakdown?.reprovado || 0);
        const bCritical = (b.processBreakdown?.notificado || 0) + (b.processBreakdown?.reprovado || 0);
        return (bCritical - aCritical) * multiplier;
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
    defaultSort: 'processes',
    customSorter,
  });

  // Apply extra filters
  const filteredClients = useMemo(() => {
    let result = baseFilteredClients;
    
    if (showOnlyCritical) {
      result = result.filter(c => 
        ((c.processBreakdown?.notificado || 0) + (c.processBreakdown?.reprovado || 0)) > 0
      );
    }
    
    if (showOnlyNotified) {
      result = result.filter(c => (c.processBreakdown?.notificado || 0) > 0);
    }
    
    if (showOnlyRejected) {
      result = result.filter(c => (c.processBreakdown?.reprovado || 0) > 0);
    }
    
    return result;
  }, [baseFilteredClients, showOnlyCritical, showOnlyNotified, showOnlyRejected]);

  // KPIs
  const kpis = useMemo(() => {
    return activeClients.reduce((acc, c) => {
      const breakdown = c.processBreakdown || { 
        total: 0, deferido: 0, emAnaliseOrgao: 0, emAnaliseRamos: 0, notificado: 0, reprovado: 0 
      };
      const emAndamento = breakdown.emAnaliseOrgao + breakdown.emAnaliseRamos + breakdown.notificado;
      const criticos = breakdown.notificado + breakdown.reprovado;
      
      return {
        total: acc.total + breakdown.total,
        emAndamento: acc.emAndamento + emAndamento,
        emAnaliseOrgao: acc.emAnaliseOrgao + breakdown.emAnaliseOrgao,
        emAnaliseRamos: acc.emAnaliseRamos + breakdown.emAnaliseRamos,
        notificado: acc.notificado + breakdown.notificado,
        reprovado: acc.reprovado + breakdown.reprovado,
        criticos: acc.criticos + criticos,
        deferido: acc.deferido + breakdown.deferido,
      };
    }, { total: 0, emAndamento: 0, emAnaliseOrgao: 0, emAnaliseRamos: 0, notificado: 0, reprovado: 0, criticos: 0, deferido: 0 });
  }, [activeClients]);

  const checklistClient = checklistClientId ? activeClients.find(c => c.id === checklistClientId) : null;

  const handleClearAllFilters = () => {
    handleClearFilters();
    setShowOnlyCritical(false);
    setShowOnlyNotified(false);
    setShowOnlyRejected(false);
  };

  return (
    <AppLayout>
      <TooltipProvider delayDuration={200}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header with KPIs */}
          <PanelHeader title="Painel de Processos" subtitle="Visão detalhada dos processos por cliente">
            <StatCard icon={<FileText className="w-4 h-4" />} value={kpis.emAndamento} label="Em Andamento" />
            <StatCard icon={<Search className="w-4 h-4" />} value={kpis.emAnaliseOrgao} label="Análise Órgão" variant="info" />
            <StatCard icon={<Clock className="w-4 h-4" />} value={kpis.emAnaliseRamos} label="Análise Ramos" variant="info" />
            <StatCard icon={<AlertTriangle className="w-4 h-4" />} value={kpis.notificado} label="Notificados" variant="warning" />
            <StatCard icon={<XCircle className="w-4 h-4" />} value={kpis.reprovado} label="Reprovados" variant="danger" />
            <StatCard icon={<CheckCircle className="w-4 h-4" />} value={kpis.deferido} label="Deferidos" variant="success" />
            
            <div className="w-px h-8 bg-border mx-1" />
            
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 border border-red-500/30">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-lg font-bold text-red-600">{kpis.criticos}</span>
              <span className="text-[9px] text-red-600 uppercase">Críticos</span>
            </div>
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
              { value: 'processes', label: 'Processos' },
              { value: 'critical', label: 'Críticos' },
            ]}
            extraFilters={
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowOnlyCritical(!showOnlyCritical)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    showOnlyCritical 
                      ? 'bg-red-500/20 text-red-600 border border-red-500/30' 
                      : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
                  }`}
                >
                  Críticos
                </button>
                <button
                  onClick={() => setShowOnlyNotified(!showOnlyNotified)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    showOnlyNotified 
                      ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' 
                      : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
                  }`}
                >
                  Notificados
                </button>
                <button
                  onClick={() => setShowOnlyRejected(!showOnlyRejected)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    showOnlyRejected 
                      ? 'bg-red-500/20 text-red-600 border border-red-500/30' 
                      : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
                  }`}
                >
                  Reprovados
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
                const breakdown = client.processBreakdown || { 
                  total: 0, deferido: 0, emAnaliseOrgao: 0, emAnaliseRamos: 0, notificado: 0, reprovado: 0 
                };
                const criticos = breakdown.notificado + breakdown.reprovado;
                
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
                    {/* Process Stats */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-foreground">{client.processes}</span>
                        <span className="text-xs text-muted-foreground">P</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/20 text-blue-600">
                              <Search className="w-3.5 h-3.5" />
                              <span className="text-sm font-bold">{breakdown.emAnaliseOrgao}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Em análise (órgão)</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20 text-cyan-600">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-sm font-bold">{breakdown.emAnaliseRamos}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Em análise (Ramos)</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 text-amber-600">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span className="text-sm font-bold">{breakdown.notificado}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Notificados</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 text-red-600">
                              <XCircle className="w-3.5 h-3.5" />
                              <span className="text-sm font-bold">{breakdown.reprovado}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Reprovados</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/20 text-emerald-600">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span className="text-sm font-bold">{breakdown.deferido}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Deferidos</TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {/* Critical badge */}
                      {criticos > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/30 text-red-600 border border-red-500/50">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="text-sm font-bold">{criticos}</span>
                          <span className="text-[9px] uppercase">críticos</span>
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
