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

// License counts by status (from import data)
export interface LicenseBreakdown {
  validas: number;
  proximoVencimento: number;
  foraValidade: number;
  proximaDataVencimento: string | null; // ISO date string
}

// Process counts by status (from import data)
export interface ProcessBreakdown {
  total: number;
  deferido: number;
  emAnaliseOrgao: number;
  emAnaliseRamos: number;
  notificado: number;
  reprovado: number;
}

export interface Client {
  id: string;
  name: string;
  initials: string;
  logoUrl?: string;
  isPriority: boolean;
  isActive: boolean;
  isChecked: boolean; // New additional check flag
  order: number;
  processes: number; // Calculated: em_andamento (análise + notificado)
  processBreakdown: ProcessBreakdown; // Process counts by status
  licenses: number; // Active licenses = validas + proximoVencimento
  licenseBreakdown: LicenseBreakdown; // License counts by status
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

export const DEFAULT_LICENSE_BREAKDOWN: LicenseBreakdown = {
  validas: 0,
  proximoVencimento: 0,
  foraValidade: 0,
  proximaDataVencimento: null,
};

export const DEFAULT_PROCESS_BREAKDOWN: ProcessBreakdown = {
  total: 0,
  deferido: 0,
  emAnaliseOrgao: 0,
  emAnaliseRamos: 0,
  notificado: 0,
  reprovado: 0,
};
