import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, CheckCircle, Clock, AlertTriangle, Filter, FileSpreadsheet, RefreshCw, ClipboardList } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualPanelHeader, KPICard } from "@/components/visual-panels/VisualPanelHeader";
import { VisualGrid } from "@/components/visual-panels/VisualGrid";
import { VisualPanelFilters, VisualSortOption } from "@/components/visual-panels/VisualPanelFilters";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { useVisualPanelFilters } from "@/hooks/useVisualPanelFilters";
import { Client, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LicenseImportWizard } from "@/components/import/LicenseImportWizard";
import { CondicionanteImportWizard } from "@/components/import/CondicionanteImportWizard";

type StatusFilter = 'all' | 'valid' | 'expiring' | 'expired';

export default function LicencasUnified() {
  const navigate = useNavigate();
  const { activeClients, highlightedClients, clients, refetch } = useClients();
  const { getActiveTaskCount } = useTasks();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showLicenseImportWizard, setShowLicenseImportWizard] = useState(false);
  const [showCondicionanteImportWizard, setShowCondicionanteImportWizard] = useState(false);

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
    filteredClients: baseFilteredClients,
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

  // Apply status filter
  const filteredClients = useMemo(() => {
    if (statusFilter === 'all') return baseFilteredClients;
    
    return baseFilteredClients.filter(client => {
      const breakdown = client.licenseBreakdown || { validas: 0, proximoVencimento: 0, foraValidade: 0 };
      switch (statusFilter) {
        case 'valid': return breakdown.validas > 0;
        case 'expiring': return breakdown.proximoVencimento > 0;
        case 'expired': return breakdown.foraValidade > 0;
        default: return true;
      }
    });
  }, [baseFilteredClients, statusFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const totals = activeClients.reduce((acc, c) => {
      const breakdown = c.licenseBreakdown || { validas: 0, proximoVencimento: 0, foraValidade: 0 };
      return {
        total: acc.total + breakdown.validas + breakdown.proximoVencimento + breakdown.foraValidade,
        validas: acc.validas + breakdown.validas,
        proximoVencimento: acc.proximoVencimento + breakdown.proximoVencimento,
        foraValidade: acc.foraValidade + breakdown.foraValidade,
      };
    }, { total: 0, validas: 0, proximoVencimento: 0, foraValidade: 0 });

    // By collaborator - count clients with licenses per collaborator
    const byCollaborator = COLLABORATOR_NAMES.reduce((acc, name) => {
      acc[name] = activeClients.filter(c => c.collaborators?.[name]).reduce((sum, c) => {
        const breakdown = c.licenseBreakdown || { validas: 0, proximoVencimento: 0, foraValidade: 0 };
        return sum + breakdown.validas + breakdown.proximoVencimento + breakdown.foraValidade;
      }, 0);
      return acc;
    }, {} as Record<CollaboratorName, number>);

    // Calculate "Em Renovação" - licenses that are close to expiring (próximo vencimento) are typically in renewal process
    const emRenovacao = totals.proximoVencimento;

    return { ...totals, byCollaborator, emRenovacao };
  }, [activeClients]);

  // Clients with critical licenses (expired or expiring)
  const criticalClients = useMemo(() => {
    return new Set(activeClients.filter(c => {
      const breakdown = c.licenseBreakdown || { foraValidade: 0, proximoVencimento: 0 };
      return breakdown.foraValidade > 0 || breakdown.proximoVencimento > 0;
    }).map(c => c.id));
  }, [activeClients]);

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

  const statusButtons: { value: StatusFilter; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'all', label: 'Todas', icon: <Filter className="w-3.5 h-3.5" />, color: 'bg-muted' },
    { value: 'valid', label: 'Válidas', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'bg-emerald-500' },
    { value: 'expiring', label: 'Próx. Vencimento', icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-amber-500' },
    { value: 'expired', label: 'Vencidas', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-red-500' },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with KPIs */}
        <VisualPanelHeader 
          title="Licenças" 
          subtitle="Visão consolidada por empresa"
          icon={<Shield className="w-5 h-5" />}
          detailRoute="/licencas"
        >
          {/* Import Buttons */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
            onClick={() => setShowLicenseImportWizard(true)}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Importar Licenças
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-amber-600 text-white hover:bg-amber-700 border-amber-600"
            onClick={() => setShowCondicionanteImportWizard(true)}
          >
            <ClipboardList className="w-4 h-4" />
            Importar Condicionantes
          </Button>
          
          <div className="w-px h-8 bg-border" />
          <KPICard icon={<Shield className="w-4 h-4" />} value={kpis.total} label="Total" />
          <KPICard icon={<CheckCircle className="w-4 h-4" />} value={kpis.validas} label="Válidas" variant="success" />
          <KPICard icon={<Clock className="w-4 h-4" />} value={kpis.proximoVencimento} label="Próx. Venc." variant="warning" />
          <KPICard icon={<RefreshCw className="w-4 h-4" />} value={kpis.emRenovacao} label="Em Renovação" variant="info" />
          <KPICard icon={<AlertTriangle className="w-4 h-4" />} value={kpis.foraValidade} label="Vencidas" variant="danger" />
          
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
            const breakdown = client.licenseBreakdown || { 
              validas: 0, proximoVencimento: 0, foraValidade: 0, proximaDataVencimento: null 
            };
            const total = breakdown.validas + breakdown.proximoVencimento + breakdown.foraValidade;
            const isCritical = criticalClients.has(client.id);

            return (
              <LicenseCard
                key={client.id}
                client={client}
                breakdown={breakdown}
                total={total}
                isHighlighted={highlightedClients.has(client.id)}
                isCritical={isCritical}
                onClick={() => handleCardClick(client.id)}
              />
            );
          })}
        </VisualGrid>

        {/* License Import Wizard */}
        <LicenseImportWizard
          isOpen={showLicenseImportWizard}
          onClose={() => setShowLicenseImportWizard(false)}
          clients={clients}
          onImportComplete={() => refetch()}
        />

        {/* Condicionante Import Wizard */}
        <CondicionanteImportWizard
          isOpen={showCondicionanteImportWizard}
          onClose={() => setShowCondicionanteImportWizard(false)}
          clients={clients}
          onImportComplete={() => refetch()}
        />
      </div>
    </AppLayout>
  );
}

// License Card Component
interface LicenseCardProps {
  client: Client;
  breakdown: {
    validas: number;
    proximoVencimento: number;
    foraValidade: number;
    proximaDataVencimento?: string | null;
  };
  total: number;
  isHighlighted: boolean;
  isCritical: boolean;
  onClick: () => void;
}

function LicenseCard({ client, breakdown, total, isHighlighted, isCritical, onClick }: LicenseCardProps) {
  const validPct = total > 0 ? Math.round((breakdown.validas / total) * 100) : 0;

  // Determine variant based on status
  const getVariant = () => {
    if (breakdown.foraValidade > 0) return "danger";
    if (breakdown.proximoVencimento > 0) return "warning";
    if (breakdown.validas > 0) return "success";
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
        isCritical && getVariant() === "default" && "ring-2 ring-amber-500/50"
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
        <span className="text-xs text-muted-foreground">{validPct}% válidas</span>
      </div>

      {/* Status Bars */}
      <div className="space-y-1 mb-2">
        {/* Valid */}
        <div className="flex items-center gap-1.5">
          <div className="w-8 text-[10px] text-emerald-600 font-medium">✓ {breakdown.validas}</div>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all"
              style={{ width: total > 0 ? `${(breakdown.validas / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
        {/* Expiring */}
        <div className="flex items-center gap-1.5">
          <div className="w-8 text-[10px] text-amber-600 font-medium">⏱ {breakdown.proximoVencimento}</div>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all"
              style={{ width: total > 0 ? `${(breakdown.proximoVencimento / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
        {/* Expired */}
        <div className="flex items-center gap-1.5">
          <div className="w-8 text-[10px] text-red-600 font-medium">✗ {breakdown.foraValidade}</div>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all"
              style={{ width: total > 0 ? `${(breakdown.foraValidade / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Next Expiry Date */}
      {breakdown.proximaDataVencimento && (
        <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
          Próx. venc.: <span className="font-medium text-foreground">
            {format(new Date(breakdown.proximaDataVencimento), "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>
      )}
    </div>
  );
}
