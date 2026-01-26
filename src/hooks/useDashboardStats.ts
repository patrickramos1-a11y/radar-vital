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
  // Fetch clients data
  let clientsQuery = supabase
    .from('clients')
    .select('id, client_type, municipios, is_active')
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

  // Fetch processes data
  const clientIds = clients?.map(c => c.id) || [];
  let processesQuery = supabase
    .from('processes')
    .select('id, tipo_processo, status, client_id');
  
  if (clientIds.length > 0) {
    processesQuery = processesQuery.in('client_id', clientIds);
  }

  const { data: processes, error: processesError } = await processesQuery;
  if (processesError) throw processesError;

  // Aggregate processes by type
  const tipoMap = new Map<string, number>();
  processes?.forEach(p => {
    const tipo = p.tipo_processo || 'Outros';
    tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
  });
  const byTipologia = Array.from(tipoMap.entries())
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count);

  // Aggregate processes by status
  const statusProcessMap = new Map<string, number>();
  processes?.forEach(p => {
    const status = p.status || 'Outros';
    statusProcessMap.set(status, (statusProcessMap.get(status) || 0) + 1);
  });
  const processByStatus = Array.from(statusProcessMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // Fetch licenses data
  let licensesQuery = supabase
    .from('licenses')
    .select('id, tipo_licenca, status_calculado, vencimento, client_id');
  
  if (clientIds.length > 0) {
    licensesQuery = licensesQuery.in('client_id', clientIds);
  }

  const { data: licenses, error: licensesError } = await licensesQuery;
  if (licensesError) throw licensesError;

  // Aggregate licenses by type
  const tipoLicMap = new Map<string, number>();
  licenses?.forEach(l => {
    const tipo = l.tipo_licenca || 'Outros';
    tipoLicMap.set(tipo, (tipoLicMap.get(tipo) || 0) + 1);
  });
  const byTipoLic = Array.from(tipoLicMap.entries())
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count);

  // Aggregate licenses by status
  const statusLicMap = new Map<string, number>();
  licenses?.forEach(l => {
    const status = l.status_calculado || 'Outros';
    statusLicMap.set(status, (statusLicMap.get(status) || 0) + 1);
  });
  const licByStatus = Array.from(statusLicMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  // Condicionantes calculation based on vencimento
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  let atendidas = 0;
  let vencidas = 0;
  let aVencer = 0;

  licenses?.forEach(l => {
    if (l.status_calculado === 'VALIDA') {
      atendidas++;
    } else if (l.status_calculado === 'FORA_VALIDADE' || l.status_calculado === 'VENCIDA') {
      vencidas++;
    } else if (l.status_calculado === 'PROXIMO_VENCIMENTO') {
      aVencer++;
    }
  });

  // Fetch notifications data
  let notificationsQuery = supabase
    .from('notifications')
    .select('id, status, client_id');
  
  if (clientIds.length > 0) {
    notificationsQuery = notificationsQuery.in('client_id', clientIds);
  }

  const { data: notifications, error: notificationsError } = await notificationsQuery;
  if (notificationsError) throw notificationsError;

  const totalNotifications = notifications?.length || 0;
  const itensAtendidos = notifications?.filter(n => n.status === 'ATENDIDA').length || 0;
  const itensVencidos = notifications?.filter(n => n.status === 'VENCIDA').length || 0;
  const itensPendentes = notifications?.filter(n => n.status === 'PENDENTE').length || 0;

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
      total: processes?.length || 0,
      byTipologia,
      byStatus: processByStatus,
    },
    licenses: {
      total: licenses?.length || 0,
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
