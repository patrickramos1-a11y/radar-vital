import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, CheckCircle, Search, Clock, AlertTriangle, XCircle, Filter } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualPanelHeader, KPICard } from "@/components/visual-panels/VisualPanelHeader";
import { VisualGrid } from "@/components/visual-panels/VisualGrid";
import { VisualPanelFilters, VisualSortOption } from "@/components/visual-panels/VisualPanelFilters";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { useVisualPanelFilters } from "@/hooks/useVisualPanelFilters";
import { Client } from "@/types/client";

type StatusFilter = 'all' | 'critical' | 'notificado' | 'reprovado' | 'emAnalise' | 'deferido';

export default function ProcessosUnified() {
  const navigate = useNavigate();
  const { activeClients, highlightedClients } = useClients();
  const { getActiveTaskCount } = useTasks();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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
    filteredClients: baseFilteredClients,
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

  // Apply status filter
  const filteredClients = useMemo(() => {
    if (statusFilter === 'all') return baseFilteredClients;
    
    return baseFilteredClients.filter(client => {
      const breakdown = client.processBreakdown || { notificado: 0, reprovado: 0, emAnaliseOrgao: 0, emAnaliseRamos: 0, deferido: 0 };
      switch (statusFilter) {
        case 'critical': return (breakdown.notificado + breakdown.reprovado) > 0;
        case 'notificado': return breakdown.notificado > 0;
        case 'reprovado': return breakdown.reprovado > 0;
        case 'emAnalise': return (breakdown.emAnaliseOrgao + breakdown.emAnaliseRamos) > 0;
        case 'deferido': return breakdown.deferido > 0;
        default: return true;
      }
    });
  }, [baseFilteredClients, statusFilter]);

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
        emAndamento: acc.emAndamento + c.processes,
      };
    }, { total: 0, emAnaliseOrgao: 0, emAnaliseRamos: 0, notificado: 0, reprovado: 0, deferido: 0, criticos: 0, emAndamento: 0 });
  }, [activeClients]);

  const handleCardClick = (clientId: string) => {
    navigate(`/processos?client=${clientId}`);
  };

  const sortOptions: { value: VisualSortOption; label: string }[] = [
    { value: 'priority', label: 'Prioridade' },
    { value: 'critical', label: 'Críticos' },
    { value: 'processes', label: 'Em Andamento' },
    { value: 'name', label: 'Nome' },
  ];

  const statusButtons: { value: StatusFilter; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'all', label: 'Todos', icon: <Filter className="w-3.5 h-3.5" />, color: 'bg-muted' },
    { value: 'critical', label: 'Críticos', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-red-500' },
    { value: 'notificado', label: 'Notificados', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-amber-500' },
    { value: 'reprovado', label: 'Reprovados', icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-red-600' },
    { value: 'emAnalise', label: 'Em Análise', icon: <Search className="w-3.5 h-3.5" />, color: 'bg-blue-500' },
    { value: 'deferido', label: 'Deferidos', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'bg-emerald-500' },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with KPIs */}
        <VisualPanelHeader 
          title="Processos Unificado" 
          subtitle="Visão crítica por empresa"
          icon={<FileText className="w-5 h-5" />}
          detailRoute="/processos"
        >
          <KPICard icon={<FileText className="w-4 h-4" />} value={kpis.total} label="Total" />
          <KPICard icon={<Clock className="w-4 h-4" />} value={kpis.emAndamento} label="Em Andamento" variant="info" />
          <KPICard icon={<Search className="w-4 h-4" />} value={kpis.emAnaliseOrgao + kpis.emAnaliseRamos} label="Em Análise" variant="info" />
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
          {filteredClients.map((client) => (
            <ProcessCard
              key={client.id}
              client={client}
              isHighlighted={highlightedClients.has(client.id)}
              onClick={() => handleCardClick(client.id)}
            />
          ))}
        </VisualGrid>
      </div>
    </AppLayout>
  );
}

// Process Card Component
interface ProcessCardProps {
  client: Client;
  isHighlighted: boolean;
  onClick: () => void;
}

function ProcessCard({ client, isHighlighted, onClick }: ProcessCardProps) {
  const breakdown = client.processBreakdown || { 
    total: 0, deferido: 0, emAnaliseOrgao: 0, emAnaliseRamos: 0, notificado: 0, reprovado: 0 
  };
  const criticos = breakdown.notificado + breakdown.reprovado;
  const emAnalise = breakdown.emAnaliseOrgao + breakdown.emAnaliseRamos;

  // Determine variant based on status
  const getVariant = (): "default" | "warning" | "danger" | "success" => {
    if (breakdown.reprovado > 0) return "danger";
    if (breakdown.notificado > 0) return "warning";
    if (breakdown.deferido > 0 && criticos === 0) return "success";
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
        isHighlighted && "border-4 border-red-500 ring-2 ring-red-500/30"
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

      {/* Main Stats */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground">{client.processes}</span>
          <span className="text-[10px] text-muted-foreground">andamento</span>
        </div>
        {criticos > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 text-red-600">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs font-bold">{criticos}</span>
          </div>
        )}
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-2 gap-1">
        {/* Em Análise */}
        <div className="flex items-center gap-1 px-1.5 py-1 rounded bg-blue-500/10">
          <Search className="w-3 h-3 text-blue-600" />
          <span className="text-[10px] font-medium text-blue-600">{emAnalise} análise</span>
        </div>
        {/* Deferidos */}
        <div className="flex items-center gap-1 px-1.5 py-1 rounded bg-emerald-500/10">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          <span className="text-[10px] font-medium text-emerald-600">{breakdown.deferido} defer.</span>
        </div>
        {/* Notificados */}
        {breakdown.notificado > 0 && (
          <div className="flex items-center gap-1 px-1.5 py-1 rounded bg-amber-500/10">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span className="text-[10px] font-medium text-amber-600">{breakdown.notificado} notif.</span>
          </div>
        )}
        {/* Reprovados */}
        {breakdown.reprovado > 0 && (
          <div className="flex items-center gap-1 px-1.5 py-1 rounded bg-red-500/10">
            <XCircle className="w-3 h-3 text-red-600" />
            <span className="text-[10px] font-medium text-red-600">{breakdown.reprovado} reprov.</span>
          </div>
        )}
      </div>
    </div>
  );
}
