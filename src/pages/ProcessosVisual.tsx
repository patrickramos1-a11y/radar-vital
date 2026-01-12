import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, CheckCircle, Search, Clock, AlertTriangle, XCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualPanelHeader, KPICard } from "@/components/visual-panels/VisualPanelHeader";
import { VisualCard, ProgressBar, StatBadge } from "@/components/visual-panels/VisualCard";
import { VisualGrid } from "@/components/visual-panels/VisualGrid";
import { VisualPanelFilters, VisualSortOption } from "@/components/visual-panels/VisualPanelFilters";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { useVisualPanelFilters } from "@/hooks/useVisualPanelFilters";
import { Client } from "@/types/client";

export default function ProcessosVisual() {
  const navigate = useNavigate();
  const { activeClients, highlightedClients } = useClients();
  const { getActiveTaskCount } = useTasks();

  // Custom sorter for processes
  const customSorter = (a: Client, b: Client, sortBy: VisualSortOption, multiplier: number) => {
    switch (sortBy) {
      case 'critical':
        const aCritical = (a.processBreakdown?.notificado || 0) + (a.processBreakdown?.reprovado || 0);
        const bCritical = (b.processBreakdown?.notificado || 0) + (b.processBreakdown?.reprovado || 0);
        return (bCritical - aCritical) * multiplier;
      case 'processes':
        return (b.processes - a.processes) * multiplier;
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
  } = useVisualPanelFilters({
    clients: activeClients,
    highlightedClients,
    getActiveTaskCount,
    defaultSort: 'critical',
    customSorter,
  });

  // KPIs
  const kpis = useMemo(() => {
    return activeClients.reduce((acc, c) => {
      const breakdown = c.processBreakdown || { 
        total: 0, deferido: 0, emAnaliseOrgao: 0, emAnaliseRamos: 0, notificado: 0, reprovado: 0 
      };
      const criticos = breakdown.notificado + breakdown.reprovado;
      
      return {
        total: acc.total + breakdown.total,
        emAnaliseOrgao: acc.emAnaliseOrgao + breakdown.emAnaliseOrgao,
        emAnaliseRamos: acc.emAnaliseRamos + breakdown.emAnaliseRamos,
        notificado: acc.notificado + breakdown.notificado,
        reprovado: acc.reprovado + breakdown.reprovado,
        deferido: acc.deferido + breakdown.deferido,
        criticos: acc.criticos + criticos,
      };
    }, { total: 0, emAnaliseOrgao: 0, emAnaliseRamos: 0, notificado: 0, reprovado: 0, deferido: 0, criticos: 0 });
  }, [activeClients]);

  // Determine card variant
  const getCardVariant = (client: Client): "default" | "warning" | "danger" | "success" => {
    const reprovado = client.processBreakdown?.reprovado || 0;
    const notificado = client.processBreakdown?.notificado || 0;

    if (reprovado > 0) return "danger";
    if (notificado > 0) return "warning";
    
    const deferido = client.processBreakdown?.deferido || 0;
    if (deferido > 0 && reprovado === 0 && notificado === 0) return "success";
    
    return "default";
  };

  const handleCardClick = (clientId: string) => {
    navigate(`/processos?client=${clientId}`);
  };

  const sortOptions: { value: VisualSortOption; label: string }[] = [
    { value: 'priority', label: 'Prioridade' },
    { value: 'critical', label: 'Críticos' },
    { value: 'processes', label: 'Total' },
    { value: 'name', label: 'Nome' },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with KPIs */}
        <VisualPanelHeader 
          title="Visão de Processos" 
          subtitle="Panorama crítico por empresa"
          icon={<FileText className="w-5 h-5" />}
          detailRoute="/processos"
        >
          <KPICard icon={<FileText className="w-4 h-4" />} value={kpis.total} label="Total" />
          <KPICard icon={<Search className="w-4 h-4" />} value={kpis.emAnaliseOrgao} label="Análise Órgão" variant="info" />
          <KPICard icon={<Clock className="w-4 h-4" />} value={kpis.emAnaliseRamos} label="Análise Ramos" variant="info" />
          <KPICard icon={<AlertTriangle className="w-4 h-4" />} value={kpis.notificado} label="Notificados" variant="warning" />
          <KPICard icon={<XCircle className="w-4 h-4" />} value={kpis.reprovado} label="Reprovados" variant="danger" />
          <KPICard icon={<CheckCircle className="w-4 h-4" />} value={kpis.deferido} label="Deferidos" variant="success" />
          
          <div className="w-px h-8 bg-border" />
          
          <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-lg font-bold text-red-600">{kpis.criticos}</span>
            <span className="text-[10px] text-red-600 uppercase">Críticos</span>
          </div>
        </VisualPanelHeader>

        {/* Filters */}
        <VisualPanelFilters
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
          sortOptions={sortOptions}
        />

        {/* Visual Grid */}
        <VisualGrid itemCount={filteredClients.length}>
          {filteredClients.map((client) => {
            const breakdown = client.processBreakdown || { 
              total: 0, deferido: 0, emAnaliseOrgao: 0, emAnaliseRamos: 0, notificado: 0, reprovado: 0 
            };
            const criticos = breakdown.notificado + breakdown.reprovado;

            return (
              <VisualCard
                key={client.id}
                client={client}
                isHighlighted={highlightedClients.has(client.id)}
                variant={getCardVariant(client)}
                onClick={() => handleCardClick(client.id)}
              >
                {/* Main Stats */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">{client.processes}</span>
                    <span className="text-xs text-muted-foreground">em andamento</span>
                  </div>
                  {criticos > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 text-red-600">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{criticos}</span>
                    </div>
                  )}
                </div>

                {/* Progress showing non-critical vs total */}
                <ProgressBar
                  value={breakdown.deferido}
                  max={breakdown.total || 1}
                  variant={criticos > 0 ? "danger" : "success"}
                  label="Deferidos"
                />

                {/* Status Chips */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  <StatBadge value={breakdown.emAnaliseOrgao} label="órgão" variant="info" />
                  <StatBadge value={breakdown.emAnaliseRamos} label="ramos" variant="info" />
                  {breakdown.notificado > 0 && (
                    <StatBadge value={breakdown.notificado} label="notif." variant="warning" />
                  )}
                  {breakdown.reprovado > 0 && (
                    <StatBadge value={breakdown.reprovado} label="reprov." variant="danger" />
                  )}
                  <StatBadge value={breakdown.deferido} label="defer." variant="success" />
                </div>
              </VisualCard>
            );
          })}
        </VisualGrid>
      </div>
    </AppLayout>
  );
}
