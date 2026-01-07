export interface DemandBreakdown {
  completed: number;
  inProgress: number;
  notStarted: number;
  cancelled: number;
}

export interface Client {
  id: string;
  name: string;
  initials: string;
  logoUrl?: string;
  isPriority: boolean;
  isActive: boolean;
  order: number;
  processes: number;
  licenses: number;
  demands: DemandBreakdown;
  createdAt: string;
  updatedAt: string;
}

export type ClientFormData = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;

export function generateInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function calculateTotalDemands(demands: DemandBreakdown): number {
  return demands.completed + demands.inProgress + demands.notStarted + demands.cancelled;
}

export function calculateTotals(clients: Client[]) {
  const activeClients = clients.filter(c => c.isActive);
  return {
    totalClients: activeClients.length,
    totalProcesses: activeClients.reduce((sum, c) => sum + c.processes, 0),
    totalLicenses: activeClients.reduce((sum, c) => sum + c.licenses, 0),
    totalDemands: activeClients.reduce((sum, c) => 
      sum + calculateTotalDemands(c.demands), 0
    ),
  };
}
