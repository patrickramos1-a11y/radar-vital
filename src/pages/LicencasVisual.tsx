import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualPanelHeader, KPICard } from "@/components/visual-panels/VisualPanelHeader";
import { VisualCard, RiskBar, StatBadge } from "@/components/visual-panels/VisualCard";
import { VisualGrid } from "@/components/visual-panels/VisualGrid";
import { VisualPanelFilters, VisualSortOption } from "@/components/visual-panels/VisualPanelFilters";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { useVisualPanelFilters } from "@/hooks/useVisualPanelFilters";
import { Client } from "@/types/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LicencasVisual() {
  const navigate = useNavigate();
  const { activeClients, highlightedClients } = useClients();
  const { getActiveTaskCount } = useTasks();

  // Custom sorter for licenses
  const customSorter = (a: Client, b: Client, sortBy: VisualSortOption, multiplier: number) => {
    switch (sortBy) {
      case 'expired':
        const aExpired = a.licenseBreakdown?.foraValidade || 0;
        const bExpired = b.licenseBreakdown?.foraValidade || 0;
        return (bExpired - aExpired) * multiplier;
      case 'expiring':
        const aExpiring = a.licenseBreakdown?.proximoVencimento || 0;
        const bExpiring = b.licenseBreakdown?.proximoVencimento || 0;
        return (bExpiring - aExpiring) * multiplier;
      case 'licenses':
        return (b.licenses - a.licenses) * multiplier;
      case 'critical':
        const aCrit = (a.licenseBreakdown?.foraValidade || 0) + (a.licenseBreakdown?.proximoVencimento || 0);
        const bCrit = (b.licenseBreakdown?.foraValidade || 0) + (b.licenseBreakdown?.proximoVencimento || 0);
        return (bCrit - aCrit) * multiplier;
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
    defaultSort: 'expired',
    customSorter,
  });

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

  // Determine card variant
  const getCardVariant = (client: Client): "default" | "warning" | "danger" | "success" => {
    const expired = client.licenseBreakdown?.foraValidade || 0;
    const expiring = client.licenseBreakdown?.proximoVencimento || 0;

    if (expired > 0) return "danger";
    if (expiring > 0) return "warning";
    
    const valid = client.licenseBreakdown?.validas || 0;
    if (valid > 0) return "success";
    
    return "default";
  };

  const handleCardClick = (clientId: string) => {
    navigate(`/licencas?client=${clientId}`);
  };

  const sortOptions: { value: VisualSortOption; label: string }[] = [
    { value: 'priority', label: 'Prioridade' },
    { value: 'expired', label: 'Vencidas' },
    { value: 'expiring', label: 'Próx. Venc.' },
    { value: 'licenses', label: 'Total' },
    { value: 'name', label: 'Nome' },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with KPIs */}
        <VisualPanelHeader 
          title="Visão de Licenças" 
          subtitle="Análise de risco por empresa"
          icon={<Shield className="w-5 h-5" />}
          detailRoute="/licencas"
        >
          <KPICard icon={<Shield className="w-4 h-4" />} value={kpis.total} label="Total" />
          <KPICard icon={<CheckCircle className="w-4 h-4" />} value={kpis.validas} label="Válidas" variant="success" />
          <KPICard icon={<Clock className="w-4 h-4" />} value={kpis.proximoVencimento} label="Próx. Venc." variant="warning" />
          <KPICard icon={<AlertTriangle className="w-4 h-4" />} value={kpis.foraValidade} label="Vencidas" variant="danger" />
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
            const breakdown = client.licenseBreakdown || { 
              validas: 0, proximoVencimento: 0, foraValidade: 0, proximaDataVencimento: null 
            };
            const total = breakdown.validas + breakdown.proximoVencimento + breakdown.foraValidade;

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
                  <span className="text-2xl font-bold text-foreground">{total}</span>
                  {breakdown.foraValidade > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 text-red-600">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{breakdown.foraValidade} vencidas</span>
                    </div>
                  )}
                </div>

                {/* Risk Bar */}
                <RiskBar
                  valid={breakdown.validas}
                  expiring={breakdown.proximoVencimento}
                  expired={breakdown.foraValidade}
                />

                {/* Status Chips */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  <StatBadge value={breakdown.validas} label="válidas" variant="success" />
                  <StatBadge value={breakdown.proximoVencimento} label="prox. venc." variant="warning" />
                  {breakdown.foraValidade > 0 && (
                    <StatBadge value={breakdown.foraValidade} label="vencidas" variant="danger" />
                  )}
                </div>

                {/* Next Expiry Date */}
                {breakdown.proximaDataVencimento && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Próx. venc.: <span className="font-medium text-foreground">
                      {format(new Date(breakdown.proximaDataVencimento), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </VisualCard>
            );
          })}
        </VisualGrid>
      </div>
    </AppLayout>
  );
}
