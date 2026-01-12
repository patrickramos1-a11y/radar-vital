import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, CheckCircle, PlayCircle, CircleDashed, XCircle, Search } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualPanelHeader, KPICard } from "@/components/visual-panels/VisualPanelHeader";
import { VisualCard, ProgressBar, StatBadge } from "@/components/visual-panels/VisualCard";
import { VisualGrid } from "@/components/visual-panels/VisualGrid";
import { Input } from "@/components/ui/input";
import { useClients } from "@/contexts/ClientContext";
import { calculateTotalDemands, Client, COLLABORATOR_COLORS, COLLABORATOR_NAMES } from "@/types/client";

export default function DemandasVisual() {
  const navigate = useNavigate();
  const { activeClients, highlightedClients } = useClients();
  const [searchQuery, setSearchQuery] = useState("");

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

  // Filter and sort clients
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

    // Sort by: gargalos first (notStarted), then by total demands
    result.sort((a, b) => {
      // Highlighted first
      const aHighlighted = highlightedClients.has(a.id) ? 1 : 0;
      const bHighlighted = highlightedClients.has(b.id) ? 1 : 0;
      if (aHighlighted !== bHighlighted) return bHighlighted - aHighlighted;

      // Priority next
      if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;

      // Gargalos (not started) first
      if (a.demands.notStarted !== b.demands.notStarted) {
        return b.demands.notStarted - a.demands.notStarted;
      }

      // Then by total
      return calculateTotalDemands(b.demands) - calculateTotalDemands(a.demands);
    });

    return result;
  }, [activeClients, searchQuery, highlightedClients]);

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
