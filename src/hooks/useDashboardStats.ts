import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientStats {
  totalAC: number;
  totalAV: number;
  total: number;
  byMunicipio: { municipio: string; count: number }[];
}

export interface ProcessStats {
  total: number;
  byTipologia: { tipo: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

export interface LicenseStats {
  total: number;
  byTipo: { tipo: string; count: number }[];
  byStatus: { status: string; count: number }[];
  condicionantes: {
    atendidas: number;
    vencidas: number;
    aVencer: number;
  };
}

export interface NotificationStats {
  total: number;
  itensAtendidos: number;
  itensVencidos: number;
  itensPendentes: number;
  taxaAtendimento: number;
}

export interface PerformanceStats {
  taxaAtendimentoNotificacoes: number;
  taxaAtendimentoCondicionantes: number;
}

export interface DashboardStats {
  clients: ClientStats;
  processes: ProcessStats;
  licenses: LicenseStats;
  notifications: NotificationStats;
  performance: PerformanceStats;
}

export interface DashboardFilters {
  clientType?: 'AC' | 'AV' | 'all';
  municipio?: string;
  status?: string;
  tipologia?: string;
}

async function fetchDashboardStats(filters: DashboardFilters): Promise<DashboardStats> {
  // Fetch clients data with all aggregated fields including condicionantes
  let clientsQuery = supabase
    .from('clients')
    .select('id, client_type, municipios, is_active, lic_validas_count, lic_proximo_venc_count, lic_fora_validade_count, proc_total_count, proc_deferido_count, proc_em_analise_orgao_count, proc_em_analise_ramos_count, proc_notificado_count, proc_reprovado_count, notif_total_count, notif_atendida_count, notif_pendente_count, cond_atendidas_count, cond_a_vencer_count, cond_vencidas_count')
    .eq('is_active', true);

  if (filters.clientType && filters.clientType !== 'all') {
    clientsQuery = clientsQuery.eq('client_type', filters.clientType);
  }

  const { data: clients, error: clientsError } = await clientsQuery;
  if (clientsError) throw clientsError;

  // Calculate client stats
  const totalAC = clients?.filter(c => c.client_type === 'AC').length || 0;
  const totalAV = clients?.filter(c => c.client_type === 'AV').length || 0;

  // Aggregate by municipality
  const municipioMap = new Map<string, number>();
  clients?.forEach(c => {
    if (c.municipios && Array.isArray(c.municipios)) {
      c.municipios.forEach((m: string) => {
        municipioMap.set(m, (municipioMap.get(m) || 0) + 1);
      });
    }
  });
  const byMunicipio = Array.from(municipioMap.entries())
    .map(([municipio, count]) => ({ municipio, count }))
    .sort((a, b) => b.count - a.count);

  // Get client IDs for filtering related data
  const clientIds = clients?.map(c => c.id) || [];

  // Calculate process stats from client aggregated data (imported from Excel)
  let totalProcesses = 0;
  let deferidoCount = 0;
  let emAnaliseOrgaoCount = 0;
  let emAnaliseRamosCount = 0;
  let notificadoCount = 0;
  let reprovadoCount = 0;

  clients?.forEach(c => {
    totalProcesses += c.proc_total_count || 0;
    deferidoCount += c.proc_deferido_count || 0;
    emAnaliseOrgaoCount += c.proc_em_analise_orgao_count || 0;
    emAnaliseRamosCount += c.proc_em_analise_ramos_count || 0;
    notificadoCount += c.proc_notificado_count || 0;
    reprovadoCount += c.proc_reprovado_count || 0;
  });

  // Try to get individual processes from processes table for tipology distribution
  let processesQuery = supabase
    .from('processes')
    .select('id, tipo_processo, status, client_id');
  
  if (clientIds.length > 0) {
    processesQuery = processesQuery.in('client_id', clientIds);
  }

  const { data: processes } = await processesQuery;

  // Build tipology distribution from processes table if available
  const tipoMap = new Map<string, number>();
  if (processes && processes.length > 0) {
    processes.forEach(p => {
      const tipo = p.tipo_processo || 'Outros';
      tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
    });
  }
  const byTipologia = Array.from(tipoMap.entries())
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count);

  // Build status distribution from aggregated client data
  const processByStatus: { status: string; count: number }[] = [];
  if (deferidoCount > 0) processByStatus.push({ status: 'Deferido', count: deferidoCount });
  if (emAnaliseOrgaoCount > 0) processByStatus.push({ status: 'Em Análise (Órgão)', count: emAnaliseOrgaoCount });
  if (emAnaliseRamosCount > 0) processByStatus.push({ status: 'Em Análise (Ramos)', count: emAnaliseRamosCount });
  if (notificadoCount > 0) processByStatus.push({ status: 'Notificado', count: notificadoCount });
  if (reprovadoCount > 0) processByStatus.push({ status: 'Reprovado', count: reprovadoCount });
  processByStatus.sort((a, b) => b.count - a.count);

  // Calculate license stats from client aggregated data (imported from Excel)
  let licValidasCount = 0;
  let licProximoVencCount = 0;
  let licForaValidadeCount = 0;

  clients?.forEach(c => {
    licValidasCount += c.lic_validas_count || 0;
    licProximoVencCount += c.lic_proximo_venc_count || 0;
    licForaValidadeCount += c.lic_fora_validade_count || 0;
  });
  const totalLicensesAgg = licValidasCount + licProximoVencCount + licForaValidadeCount;

  // Try to get individual licenses from licenses table for type distribution
  let licensesQuery = supabase
    .from('licenses')
    .select('id, tipo_licenca, status_calculado, vencimento, client_id');
  
  if (clientIds.length > 0) {
    licensesQuery = licensesQuery.in('client_id', clientIds);
  }

  const { data: licenses } = await licensesQuery;

  // Aggregate licenses by type from licenses table if available
  const tipoLicMap = new Map<string, number>();
  if (licenses && licenses.length > 0) {
    licenses.forEach(l => {
      const tipo = l.tipo_licenca || 'Outros';
      tipoLicMap.set(tipo, (tipoLicMap.get(tipo) || 0) + 1);
    });
  }
  const byTipoLic = Array.from(tipoLicMap.entries())
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count);

  // Build license status distribution from aggregated client data
  const licByStatus: { status: string; count: number }[] = [];
  if (licValidasCount > 0) licByStatus.push({ status: 'VALIDA', count: licValidasCount });
  if (licProximoVencCount > 0) licByStatus.push({ status: 'PROXIMO_VENCIMENTO', count: licProximoVencCount });
  if (licForaValidadeCount > 0) licByStatus.push({ status: 'FORA_VALIDADE', count: licForaValidadeCount });
  licByStatus.sort((a, b) => b.count - a.count);

  // Condicionantes from dedicated columns (imported separately)
  // Calculate condicionantes from dedicated columns (from condicionantes import)
  let condAtendidas = 0;
  let condAVencer = 0;
  let condVencidas = 0;

  clients?.forEach(c => {
    condAtendidas += (c as any).cond_atendidas_count || 0;
    condAVencer += (c as any).cond_a_vencer_count || 0;
    condVencidas += (c as any).cond_vencidas_count || 0;
  });

  // Use dedicated condicionantes columns if they have data, otherwise fall back to license status
  const hasCondicionantesData = condAtendidas > 0 || condAVencer > 0 || condVencidas > 0;
  const atendidas = hasCondicionantesData ? condAtendidas : licValidasCount;
  const vencidas = hasCondicionantesData ? condVencidas : licForaValidadeCount;
  const aVencer = hasCondicionantesData ? condAVencer : licProximoVencCount;

  // Calculate notification stats from client aggregated data (imported from Excel)
  let totalNotificationsAgg = 0;
  let notifAtendidaCount = 0;
  let notifPendenteCount = 0;

  clients?.forEach(c => {
    totalNotificationsAgg += c.notif_total_count || 0;
    notifAtendidaCount += c.notif_atendida_count || 0;
    notifPendenteCount += c.notif_pendente_count || 0;
  });

  // Calculate vencidos as difference (total - atendida - pendente)
  const notifVencidoCount = Math.max(0, totalNotificationsAgg - notifAtendidaCount - notifPendenteCount);

  const totalNotifications = totalNotificationsAgg;
  const itensAtendidos = notifAtendidaCount;
  const itensVencidos = notifVencidoCount;
  const itensPendentes = notifPendenteCount;

  const taxaAtendimentoNotificacoes = totalNotifications > 0 
    ? Math.round((itensAtendidos / totalNotifications) * 100) 
    : 0;

  const totalCondicionantes = atendidas + vencidas + aVencer;
  const taxaAtendimentoCondicionantes = totalCondicionantes > 0
    ? Math.round((atendidas / totalCondicionantes) * 100)
    : 0;

  return {
    clients: {
      totalAC,
      totalAV,
      total: totalAC + totalAV,
      byMunicipio,
    },
    processes: {
      total: totalProcesses,
      byTipologia,
      byStatus: processByStatus,
    },
    licenses: {
      total: totalLicensesAgg,
      byTipo: byTipoLic,
      byStatus: licByStatus,
      condicionantes: {
        atendidas,
        vencidas,
        aVencer,
      },
    },
    notifications: {
      total: totalNotifications,
      itensAtendidos,
      itensVencidos,
      itensPendentes,
      taxaAtendimento: taxaAtendimentoNotificacoes,
    },
    performance: {
      taxaAtendimentoNotificacoes,
      taxaAtendimentoCondicionantes,
    },
  };
}

export function useDashboardStats(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ['dashboard-stats', filters],
    queryFn: () => fetchDashboardStats(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
