import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, CheckCircle, PlayCircle, CircleDashed, XCircle, Filter, FileSpreadsheet } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualPanelHeader, KPICard } from "@/components/visual-panels/VisualPanelHeader";
import { VisualGrid } from "@/components/visual-panels/VisualGrid";
import { VisualPanelFilters, VisualSortOption } from "@/components/visual-panels/VisualPanelFilters";
import { Button } from "@/components/ui/button";
import { ImportWizard } from "@/components/import/ImportWizard";
import { cn } from "@/lib/utils";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { useVisualPanelFilters } from "@/hooks/useVisualPanelFilters";
import { calculateTotalDemands, Client, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";

type StatusFilter = 'all' | 'completed' | 'inProgress' | 'notStarted' | 'cancelled';

export default function DemandasUnified() {
  const navigate = useNavigate();
  const { activeClients, highlightedClients, refetch } = useClients();
  const { getActiveTaskCount } = useTasks();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showImportWizard, setShowImportWizard] = useState(false);

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
    filteredClients: baseFilteredClients,
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

  // Apply status filter
  const filteredClients = useMemo(() => {
    if (statusFilter === 'all') return baseFilteredClients;
    
    return baseFilteredClients.filter(client => {
      switch (statusFilter) {
        case 'completed': return client.demands.completed > 0;
        case 'inProgress': return client.demands.inProgress > 0;
        case 'notStarted': return client.demands.notStarted > 0;
        case 'cancelled': return client.demands.cancelled > 0;
        default: return true;
      }
    });
  }, [baseFilteredClients, statusFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const totals = activeClients.reduce((acc, c) => ({
      total: acc.total + calculateTotalDemands(c.demands),
      completed: acc.completed + c.demands.completed,
      inProgress: acc.inProgress + c.demands.inProgress,
      notStarted: acc.notStarted + c.demands.notStarted,
      cancelled: acc.cancelled + c.demands.cancelled,
    }), { total: 0, completed: 0, inProgress: 0, notStarted: 0, cancelled: 0 });

    // By collaborator
    const byCollaborator = COLLABORATOR_NAMES.reduce((acc, name) => {
      acc[name] = activeClients.reduce((sum, c) => sum + (c.demandsByCollaborator?.[name] || 0), 0);
      return acc;
    }, {} as Record<CollaboratorName, number>);

    return { ...totals, byCollaborator };
  }, [activeClients]);

  // Clients with high pending demands (more than average * 1.5)
  const highPendingClients = useMemo(() => {
    const pendingCounts = activeClients.map(c => c.demands.notStarted);
    const avg = pendingCounts.reduce((a, b) => a + b, 0) / pendingCounts.length;
    const threshold = avg * 1.5;
    return new Set(activeClients.filter(c => c.demands.notStarted > threshold).map(c => c.id));
  }, [activeClients]);

  const handleCardClick = (clientId: string) => {
    navigate(`/demandas?client=${clientId}`);
  };

  const sortOptions: { value: VisualSortOption; label: string }[] = [
    { value: 'priority', label: 'Prioridade' },
    { value: 'demands', label: 'Total' },
    { value: 'notStarted', label: 'Não Iniciadas' },
    { value: 'name', label: 'Nome' },
  ];

  const statusButtons: { value: StatusFilter; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'all', label: 'Todas', icon: <Filter className="w-3.5 h-3.5" />, color: 'bg-muted' },
    { value: 'completed', label: 'Concluídas', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'bg-emerald-500' },
    { value: 'inProgress', label: 'Em Execução', icon: <PlayCircle className="w-3.5 h-3.5" />, color: 'bg-blue-500' },
    { value: 'notStarted', label: 'Não Iniciadas', icon: <CircleDashed className="w-3.5 h-3.5" />, color: 'bg-amber-500' },
    { value: 'cancelled', label: 'Canceladas', icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-red-500' },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with KPIs */}
        <VisualPanelHeader 
          title="Demandas Unificado" 
          subtitle="Visão consolidada por empresa"
          icon={<ClipboardList className="w-5 h-5" />}
          detailRoute="/demandas"
          actions={
            <Button
              onClick={() => setShowImportWizard(true)}
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              size="sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Importar Programação
            </Button>
          }
        >
          <KPICard icon={<ClipboardList className="w-4 h-4" />} value={kpis.total} label="Total" />
          <KPICard icon={<CheckCircle className="w-4 h-4" />} value={kpis.completed} label="Concluídas" variant="success" />
          <KPICard icon={<PlayCircle className="w-4 h-4" />} value={kpis.inProgress} label="Em Execução" variant="info" />
          <KPICard icon={<CircleDashed className="w-4 h-4" />} value={kpis.notStarted} label="Não Iniciadas" variant="warning" />
          <KPICard icon={<XCircle className="w-4 h-4" />} value={kpis.cancelled} label="Canceladas" variant="danger" />
          
          <div className="w-px h-8 bg-border" />
          
          {/* Collaborator counts */}
          {COLLABORATOR_NAMES.map((name) => (
            <div
              key={name}
              className="flex items-center gap-1.5 px-2 py-1 rounded border"
              style={{ 
                borderColor: COLLABORATOR_COLORS[name],
                backgroundColor: `${COLLABORATOR_COLORS[name]}15`,
              }}
            >
              <span className="text-sm font-bold" style={{ color: COLLABORATOR_COLORS[name] }}>
                {kpis.byCollaborator[name]}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase">{name}</span>
            </div>
          ))}
        </VisualPanelHeader>

        {/* Status Filter Row */}
        <div className="flex items-center gap-2 px-6 py-2 bg-muted/30 border-b overflow-x-auto">
          {statusButtons.map((btn) => (
            <Button
              key={btn.value}
              variant={statusFilter === btn.value ? "default" : "outline"}
              size="sm"
              className={cn(
                "gap-1.5 text-xs",
                statusFilter === btn.value && btn.value !== 'all' && `${btn.color} text-white hover:${btn.color}`
              )}
              onClick={() => setStatusFilter(btn.value)}
            >
              {btn.icon}
              {btn.label}
            </Button>
          ))}
        </div>

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
            const isHighPending = highPendingClients.has(client.id);

            return (
              <DemandCard
                key={client.id}
                client={client}
                total={total}
                isHighlighted={highlightedClients.has(client.id)}
                isHighPending={isHighPending}
                onClick={() => handleCardClick(client.id)}
              />
            );
          })}
        </VisualGrid>
      </div>

      {/* Import Wizard */}
      <ImportWizard
        isOpen={showImportWizard}
        onClose={() => setShowImportWizard(false)}
        clients={activeClients}
        onImportComplete={refetch}
      />
    </AppLayout>
  );
}

// Demand Card Component
interface DemandCardProps {
  client: Client;
  total: number;
  isHighlighted: boolean;
  isHighPending: boolean;
  onClick: () => void;
}

function DemandCard({ client, total, isHighlighted, isHighPending, onClick }: DemandCardProps) {
  const completedPct = total > 0 ? Math.round((client.demands.completed / total) * 100) : 0;

  // Determine variant based on status
  const getVariant = () => {
    if (client.demands.notStarted > total * 0.5) return "danger";
    if (client.demands.notStarted > total * 0.2) return "warning";
    if (client.demands.completed > total * 0.8) return "success";
    return "default";
  };

  const variantStyles = {
    default: "border-border",
    warning: "border-amber-500/50 bg-amber-500/5",
    danger: "border-red-500/50 bg-red-500/5",
    success: "border-emerald-500/50 bg-emerald-500/5",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-xl border-2 bg-card p-3 transition-all duration-200 cursor-pointer",
        "hover:shadow-lg hover:scale-[1.02]",
        variantStyles[getVariant()],
        isHighlighted && "border-4 border-red-500 ring-2 ring-red-500/30",
        isHighPending && "ring-2 ring-amber-500/50"
      )}
    >
      {/* Client Header */}
      <div className="flex items-center gap-2 mb-2">
        {client.logoUrl ? (
          <img
            src={client.logoUrl}
            alt={client.name}
            className="w-8 h-8 object-contain rounded-lg bg-white p-0.5"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{client.initials}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-xs">{client.name}</h3>
        </div>
        {client.isPriority && (
          <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-[7px] text-white">★</span>
          </div>
        )}
      </div>

      {/* Total and Percentage */}
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-2xl font-bold text-foreground">{total}</span>
        <span className="text-xs text-muted-foreground">{completedPct}% concluídas</span>
      </div>

      {/* Status Bars */}
      <div className="space-y-1 mb-2">
        {/* Completed */}
        <div className="flex items-center gap-1.5">
          <div className="w-8 text-[10px] text-emerald-600 font-medium">✓ {client.demands.completed}</div>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all"
              style={{ width: total > 0 ? `${(client.demands.completed / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
        {/* In Progress */}
        <div className="flex items-center gap-1.5">
          <div className="w-8 text-[10px] text-blue-600 font-medium">► {client.demands.inProgress}</div>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all"
              style={{ width: total > 0 ? `${(client.demands.inProgress / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
        {/* Not Started */}
        <div className="flex items-center gap-1.5">
          <div className="w-8 text-[10px] text-amber-600 font-medium">○ {client.demands.notStarted}</div>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all"
              style={{ width: total > 0 ? `${(client.demands.notStarted / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Collaborator Badges */}
      {client.demandsByCollaborator && (
        <div className="flex items-center gap-1 flex-wrap">
          {COLLABORATOR_NAMES.map((name) => {
            const count = client.demandsByCollaborator?.[name] || 0;
            if (count === 0) return null;
            return (
              <span
                key={name}
                className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
                style={{ backgroundColor: COLLABORATOR_COLORS[name] }}
              >
                {count}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
