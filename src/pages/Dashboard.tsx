import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  KPICard, 
  BarChartCard, 
  PieChartCard, 
  DashboardFiltersBar 
} from "@/components/dashboard-stats";
import { useDashboardStats, DashboardFilters } from "@/hooks/useDashboardStats";
import { useClients } from "@/contexts/ClientContext";
import { Users, Building2, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({ clientType: 'all' });
  const { data: stats, isLoading, isRefetching, refetch } = useDashboardStats(filters);
  const { activeClients } = useClients();

  const municipios = useMemo(() => {
    const set = new Set<string>();
    activeClients.forEach(c => {
      c.municipios?.forEach(m => set.add(m));
    });
    return Array.from(set).sort();
  }, [activeClients]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const clientsData = stats?.clients;

  return (
    <AppLayout>
      <ScrollArea className="h-full">
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-foreground">Dashboard de Indicadores</h1>
            <p className="text-sm text-muted-foreground">
              Visão gerencial consolidada de clientes
            </p>
          </div>

          <DashboardFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
            municipios={municipios}
            isRefetching={isRefetching}
            onRefresh={() => refetch()}
          />

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Clientes
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Total de Clientes"
                value={clientsData?.total || 0}
                icon={<Users className="w-5 h-5" />}
                variant="info"
              />
              <KPICard
                title="Acompanhamento (AC)"
                value={clientsData?.totalAC || 0}
                subtitle={`${clientsData?.total ? Math.round((clientsData.totalAC / clientsData.total) * 100) : 0}% do total`}
                icon={<Building2 className="w-5 h-5" />}
                variant="success"
              />
              <KPICard
                title="Avulso (AV)"
                value={clientsData?.totalAV || 0}
                subtitle={`${clientsData?.total ? Math.round((clientsData.totalAV / clientsData.total) * 100) : 0}% do total`}
                icon={<Building2 className="w-5 h-5" />}
                variant="warning"
              />
              <PieChartCard
                title="Distribuição AC vs AV"
                data={[
                  { name: 'Acompanhamento', value: clientsData?.totalAC || 0, color: '#10B981' },
                  { name: 'Avulso', value: clientsData?.totalAV || 0, color: '#F59E0B' },
                ]}
                innerRadius={30}
                className="row-span-2"
              />
            </div>

            {(clientsData?.byMunicipio?.length || 0) > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BarChartCard
                  title="Distribuição Geográfica por Município"
                  data={(clientsData?.byMunicipio || []).slice(0, 10).map(m => ({
                    name: m.municipio,
                    value: m.count,
                  }))}
                  horizontal
                />
                <div className="bg-card rounded-lg border p-4">
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Municípios com Clientes
                  </h3>
                  <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto">
                    {(clientsData?.byMunicipio || []).map((m, i) => (
                      <span 
                        key={i}
                        className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium"
                      >
                        {m.municipio} ({m.count})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </ScrollArea>
    </AppLayout>
  );
}
