import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientStats {
  totalAC: number;
  totalAV: number;
  total: number;
  byMunicipio: { municipio: string; count: number }[];
}

export interface DashboardStats {
  clients: ClientStats;
}

export interface DashboardFilters {
  clientType?: 'AC' | 'AV' | 'all';
  municipio?: string;
}

async function fetchDashboardStats(filters: DashboardFilters): Promise<DashboardStats> {
  let clientsQuery = supabase
    .from('clients')
    .select('id, client_type, municipios, is_active')
    .eq('is_active', true);

  if (filters.clientType && filters.clientType !== 'all') {
    clientsQuery = clientsQuery.eq('client_type', filters.clientType);
  }

  const { data: clients, error: clientsError } = await clientsQuery;
  if (clientsError) throw clientsError;

  const totalAC = clients?.filter(c => c.client_type === 'AC').length || 0;
  const totalAV = clients?.filter(c => c.client_type === 'AV').length || 0;

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

  return {
    clients: {
      totalAC,
      totalAV,
      total: totalAC + totalAV,
      byMunicipio,
    },
  };
}

export function useDashboardStats(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ['dashboard-stats', filters],
    queryFn: () => fetchDashboardStats(filters),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });
}
