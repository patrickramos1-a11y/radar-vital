import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, CheckCircle, Clock, AlertTriangle, Search } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualPanelHeader, KPICard } from "@/components/visual-panels/VisualPanelHeader";
import { VisualCard, RiskBar, StatBadge } from "@/components/visual-panels/VisualCard";
import { VisualGrid } from "@/components/visual-panels/VisualGrid";
import { Input } from "@/components/ui/input";
import { useClients } from "@/contexts/ClientContext";
import { Client } from "@/types/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function LicencasVisual() {
  const navigate = useNavigate();
  const { activeClients, highlightedClients } = useClients();
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter and sort clients by risk
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

    // Sort by risk: expired first, then expiring, then by total
    result.sort((a, b) => {
      // Highlighted first
      const aHighlighted = highlightedClients.has(a.id) ? 1 : 0;
      const bHighlighted = highlightedClients.has(b.id) ? 1 : 0;
      if (aHighlighted !== bHighlighted) return bHighlighted - aHighlighted;

      // Priority next
      if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;

      // Expired first
      const aExpired = a.licenseBreakdown?.foraValidade || 0;
      const bExpired = b.licenseBreakdown?.foraValidade || 0;
      if (aExpired !== bExpired) return bExpired - aExpired;

      // Then by expiring
      const aExpiring = a.licenseBreakdown?.proximoVencimento || 0;
      const bExpiring = b.licenseBreakdown?.proximoVencimento || 0;
      if (aExpiring !== bExpiring) return bExpiring - aExpiring;

      // Then by total
      return b.licenses - a.licenses;
    });

    return result;
  }, [activeClients, searchQuery, highlightedClients]);

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
