import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  KPICard, 
  BarChartCard, 
  PieChartCard, 
  StatusCard, 
  PercentageGauge,
  DashboardFiltersBar 
} from "@/components/dashboard-stats";
import { useDashboardStats, DashboardFilters } from "@/hooks/useDashboardStats";
import { useClients } from "@/contexts/ClientContext";
import { 
  Users, 
  Building2, 
  FileText, 
  Shield, 
  Bell, 
  TrendingUp,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({ clientType: 'all' });
  const { data: stats, isLoading, isRefetching, refetch } = useDashboardStats(filters);
  const { activeClients } = useClients();

  // Get unique municipalities from clients
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const clientsData = stats?.clients;
  const processesData = stats?.processes;
  const licensesData = stats?.licenses;
  const notificationsData = stats?.notifications;
  const performanceData = stats?.performance;

  return (
    <AppLayout>
      <ScrollArea className="h-full">
        <div className="p-4 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-foreground">Dashboard de Indicadores</h1>
            <p className="text-sm text-muted-foreground">
              Visão gerencial consolidada de clientes, processos, licenças e notificações
            </p>
          </div>

          {/* Filters */}
          <DashboardFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
            municipios={municipios}
            isRefetching={isRefetching}
            onRefresh={() => refetch()}
          />

          {/* === SEÇÃO: CLIENTES === */}
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

            {/* Distribuição Geográfica */}
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

          {/* === SEÇÃO: PROCESSOS === */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Processos
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Processos Ativos"
                value={processesData?.total || 0}
                icon={<FileText className="w-5 h-5" />}
                variant="info"
              />
              <BarChartCard
                title="Processos por Tipologia"
                data={(processesData?.byTipologia || []).slice(0, 6).map(t => ({
                  name: t.tipo.length > 15 ? t.tipo.substring(0, 15) + '...' : t.tipo,
                  value: t.count,
                }))}
                className="col-span-1 sm:col-span-2 lg:col-span-3"
              />
            </div>

            {/* Status dos Processos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PieChartCard
                title="Processos por Status"
                data={(processesData?.byStatus || []).map((s, i) => ({
                  name: s.status,
                  value: s.count,
                }))}
              />
              <BarChartCard
                title="Distribuição por Status"
                data={(processesData?.byStatus || []).map(s => ({
                  name: s.status.length > 20 ? s.status.substring(0, 20) + '...' : s.status,
                  value: s.count,
                }))}
                horizontal
              />
            </div>
          </section>

          {/* === SEÇÃO: LICENÇAS === */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Licenças
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Total de Licenças"
                value={licensesData?.total || 0}
                icon={<Shield className="w-5 h-5" />}
                variant="info"
              />
              <StatusCard
                title="Situação das Condicionantes"
                items={[
                  { label: 'Atendidas', value: licensesData?.condicionantes.atendidas || 0, color: 'success' },
                  { label: 'A Vencer', value: licensesData?.condicionantes.aVencer || 0, color: 'warning' },
                  { label: 'Vencidas', value: licensesData?.condicionantes.vencidas || 0, color: 'danger' },
                ]}
                className="col-span-1 sm:col-span-2 lg:col-span-1"
              />
              <PieChartCard
                title="Licenças por Tipo"
                data={(licensesData?.byTipo || []).slice(0, 6).map(t => ({
                  name: t.tipo,
                  value: t.count,
                }))}
                className="col-span-1 sm:col-span-2"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BarChartCard
                title="Distribuição por Tipo de Licença"
                data={(licensesData?.byTipo || []).map(t => ({
                  name: t.tipo.length > 12 ? t.tipo.substring(0, 12) + '...' : t.tipo,
                  value: t.count,
                }))}
              />
              <BarChartCard
                title="Licenças por Status"
                data={(licensesData?.byStatus || []).map(s => ({
                  name: s.status,
                  value: s.count,
                  color: s.status === 'VALIDA' ? '#10B981' : 
                         s.status === 'PROXIMO_VENCIMENTO' ? '#F59E0B' : 
                         s.status.includes('FORA') || s.status.includes('VENCIDA') ? '#EF4444' : undefined
                }))}
                horizontal
              />
            </div>
          </section>

          {/* === SEÇÃO: NOTIFICAÇÕES === */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notificações
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Total de Notificações"
                value={notificationsData?.total || 0}
                icon={<Bell className="w-5 h-5" />}
                variant="info"
              />
              <KPICard
                title="Itens Atendidos"
                value={notificationsData?.itensAtendidos || 0}
                icon={<CheckCircle2 className="w-5 h-5" />}
                variant="success"
              />
              <KPICard
                title="Itens Pendentes"
                value={notificationsData?.itensPendentes || 0}
                icon={<Clock className="w-5 h-5" />}
                variant="warning"
              />
              <KPICard
                title="Itens Vencidos"
                value={notificationsData?.itensVencidos || 0}
                icon={<AlertTriangle className="w-5 h-5" />}
                variant="danger"
              />
            </div>

            <StatusCard
              title="Status dos Itens de Notificações"
              items={[
                { label: 'Atendidos', value: notificationsData?.itensAtendidos || 0, color: 'success' },
                { label: 'Pendentes', value: notificationsData?.itensPendentes || 0, color: 'warning' },
                { label: 'Vencidos', value: notificationsData?.itensVencidos || 0, color: 'danger' },
              ]}
            />
          </section>

          {/* === SEÇÃO: DESEMPENHO === */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Indicadores de Desempenho
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <PercentageGauge
                title="Taxa de Atendimento - Notificações"
                value={performanceData?.taxaAtendimentoNotificacoes || 0}
                subtitle="Itens atendidos / Total de itens"
              />
              <PercentageGauge
                title="Taxa de Atendimento - Condicionantes"
                value={performanceData?.taxaAtendimentoCondicionantes || 0}
                subtitle="Condicionantes atendidas / Total"
              />
              <div className="col-span-1 sm:col-span-2 bg-card rounded-lg border p-4">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Resumo de Desempenho
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Notificações</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-foreground">
                        {performanceData?.taxaAtendimentoNotificacoes || 0}%
                      </span>
                      <span className="text-xs text-muted-foreground">atendimento</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${performanceData?.taxaAtendimentoNotificacoes || 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Condicionantes</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-foreground">
                        {performanceData?.taxaAtendimentoCondicionantes || 0}%
                      </span>
                      <span className="text-xs text-muted-foreground">atendimento</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${performanceData?.taxaAtendimentoCondicionantes || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </ScrollArea>
    </AppLayout>
  );
}
