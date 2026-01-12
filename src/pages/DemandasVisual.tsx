import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, CheckCircle, PlayCircle, CircleDashed, XCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualPanelHeader, KPICard } from "@/components/visual-panels/VisualPanelHeader";
import { VisualCard, ProgressBar, StatBadge } from "@/components/visual-panels/VisualCard";
import { VisualGrid } from "@/components/visual-panels/VisualGrid";
import { VisualPanelFilters, VisualSortOption } from "@/components/visual-panels/VisualPanelFilters";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { useVisualPanelFilters } from "@/hooks/useVisualPanelFilters";
import { calculateTotalDemands, Client, COLLABORATOR_COLORS, COLLABORATOR_NAMES } from "@/types/client";

export default function DemandasVisual() {
  const navigate = useNavigate();
  const { activeClients, highlightedClients } = useClients();
  const { getActiveTaskCount } = useTasks();

  // Custom sorter for demands
  const customSorter = (a: Client, b: Client, sortBy: VisualSortOption, multiplier: number) => {
    switch (sortBy) {
      case 'demands':
        return (calculateTotalDemands(b.demands) - calculateTotalDemands(a.demands)) * multiplier;
      case 'notStarted':
        return (b.demands.notStarted - a.demands.notStarted) * multiplier;
      case 'critical':
        return (b.demands.notStarted - a.demands.notStarted) * multiplier;
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
    defaultSort: 'notStarted',
    customSorter,
  });

  // KPIs
  const kpis = useMemo(() => {
    return activeClients.reduce((acc, c) => ({
      total: acc.total + calculateTotalDemands(c.demands),
      completed: acc.completed + c.demands.completed,
      inProgress: acc.inProgress + c.demands.inProgress,
      notStarted: acc.notStarted + c.demands.notStarted,
      cancelled: acc.cancelled + c.demands.cancelled,
    }), { total: 0, completed: 0, inProgress: 0, notStarted: 0, cancelled: 0 });
  }, [activeClients]);

  // Determine card variant
  const getCardVariant = (client: Client) => {
    const total = calculateTotalDemands(client.demands);
    if (total === 0) return "default";
    
    const completedRatio = client.demands.completed / total;
    const notStartedRatio = client.demands.notStarted / total;

    if (notStartedRatio > 0.5) return "danger";
    if (notStartedRatio > 0.2) return "warning";
    if (completedRatio > 0.8) return "success";
    return "default";
  };

  const handleCardClick = (clientId: string) => {
    navigate(`/demandas?client=${clientId}`);
  };

  const sortOptions: { value: VisualSortOption; label: string }[] = [
    { value: 'priority', label: 'Prioridade' },
    { value: 'demands', label: 'Total' },
    { value: 'notStarted', label: 'Não Iniciadas' },
    { value: 'name', label: 'Nome' },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with KPIs */}
        <VisualPanelHeader 
          title="Visão de Demandas" 
          subtitle="Panorama visual por empresa"
          icon={<ClipboardList className="w-5 h-5" />}
          detailRoute="/demandas"
        >
          <KPICard icon={<ClipboardList className="w-4 h-4" />} value={kpis.total} label="Total" />
          <KPICard icon={<CheckCircle className="w-4 h-4" />} value={kpis.completed} label="Concluídas" variant="success" />
          <KPICard icon={<PlayCircle className="w-4 h-4" />} value={kpis.inProgress} label="Em Execução" variant="info" />
          <KPICard icon={<CircleDashed className="w-4 h-4" />} value={kpis.notStarted} label="Não Iniciadas" variant="warning" />
          <KPICard icon={<XCircle className="w-4 h-4" />} value={kpis.cancelled} label="Canceladas" variant="danger" />
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
            const total = calculateTotalDemands(client.demands);
            const completedPct = total > 0 ? Math.round((client.demands.completed / total) * 100) : 0;

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
                  <span className="text-xs text-muted-foreground">
                    {completedPct}% concluídas
                  </span>
                </div>

                {/* Progress Bar */}
                <ProgressBar
                  value={client.demands.completed}
                  max={total}
                  variant={completedPct > 80 ? "success" : completedPct > 50 ? "info" : "warning"}
                />

                {/* Status Chips */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  <StatBadge value={client.demands.completed} label="✓" variant="success" />
                  <StatBadge value={client.demands.inProgress} label="►" variant="info" />
                  <StatBadge value={client.demands.notStarted} label="○" variant="warning" />
                  {client.demands.cancelled > 0 && (
                    <StatBadge value={client.demands.cancelled} label="✕" variant="danger" />
                  )}
                </div>

                {/* Collaborator Badges */}
                {client.demandsByCollaborator && (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {COLLABORATOR_NAMES.map((name) => {
                      const count = client.demandsByCollaborator?.[name] || 0;
                      if (count === 0) return null;
                      return (
                        <span
                          key={name}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: COLLABORATOR_COLORS[name] }}
                        >
                          {count}
                        </span>
                      );
                    })}
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
