import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, CheckCircle, Search, Clock, AlertTriangle, XCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualPanelHeader, KPICard } from "@/components/visual-panels/VisualPanelHeader";
import { VisualCard, ProgressBar, StatBadge } from "@/components/visual-panels/VisualCard";
import { VisualGrid } from "@/components/visual-panels/VisualGrid";
import { Input } from "@/components/ui/input";
import { useClients } from "@/contexts/ClientContext";
import { Client } from "@/types/client";

export default function ProcessosVisual() {
  const navigate = useNavigate();
  const { activeClients, highlightedClients } = useClients();
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter and sort clients by critical status
  const filteredClients = useMemo(() => {
    let result = [...activeClients];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.initials.toLowerCase().includes(query)
      );
    }

    // Sort by: critical first (notificado + reprovado), then by total
    result.sort((a, b) => {
      // Highlighted first
      const aHighlighted = highlightedClients.has(a.id) ? 1 : 0;
      const bHighlighted = highlightedClients.has(b.id) ? 1 : 0;
      if (aHighlighted !== bHighlighted) return bHighlighted - aHighlighted;

      // Priority next
      if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;

      // Critical first
      const aCritical = (a.processBreakdown?.notificado || 0) + (a.processBreakdown?.reprovado || 0);
      const bCritical = (b.processBreakdown?.notificado || 0) + (b.processBreakdown?.reprovado || 0);
      if (aCritical !== bCritical) return bCritical - aCritical;

      // Then by total processes
      return b.processes - a.processes;
    });

    return result;
  }, [activeClients, searchQuery, highlightedClients]);

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

        {/* Search Bar */}
        <div className="px-6 py-3 bg-muted/30 border-b border-border">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar empresa..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Visual Grid */}
        <VisualGrid itemCount={filteredClients.length}>
          {filteredClients.map((client) => {
            const breakdown = client.processBreakdown || { 
              total: 0, deferido: 0, emAnaliseOrgao: 0, emAnaliseRamos: 0, notificado: 0, reprovado: 0 
            };
            const criticos = breakdown.notificado + breakdown.reprovado;
            const emAndamento = breakdown.emAnaliseOrgao + breakdown.emAnaliseRamos + breakdown.notificado;

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
