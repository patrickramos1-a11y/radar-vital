export interface DemandBreakdown {
  completed: number;
  inProgress: number;
  notStarted: number;
  cancelled: number;
}

export interface Collaborators {
  celine: boolean;
  gabi: boolean;
  darley: boolean;
  vanessa: boolean;
}

// Demand counts per collaborator (from import data - NOT manual selections)
export interface CollaboratorDemandCounts {
  celine: number;
  gabi: number;
  darley: number;
  vanessa: number;
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
  demandsByCollaborator: CollaboratorDemandCounts; // Demand counts per collaborator (from import)
  collaborators: Collaborators; // Manual selection flags (user interaction)
  createdAt: string;
  updatedAt: string;
}

export type ClientFormData = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;

export type CollaboratorName = 'celine' | 'gabi' | 'darley' | 'vanessa';

export const COLLABORATOR_COLORS: Record<CollaboratorName, string> = {
  celine: '#8B5CF6',    // Purple/Violet
  gabi: '#EC4899',      // Pink
  darley: '#F59E0B',    // Amber/Orange
  vanessa: '#06B6D4',   // Cyan/Teal
};

export const COLLABORATOR_NAMES: CollaboratorName[] = ['celine', 'gabi', 'darley', 'vanessa'];

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

export const DEFAULT_COLLABORATORS: Collaborators = {
  celine: false,
  gabi: false,
  darley: false,
  vanessa: false,
};

export const DEFAULT_COLLABORATOR_DEMAND_COUNTS: CollaboratorDemandCounts = {
  celine: 0,
  gabi: 0,
  darley: 0,
  vanessa: 0,
};
