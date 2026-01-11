export type DemandStatus = 'CONCLUIDO' | 'EM_EXECUCAO' | 'NAO_FEITO' | 'CANCELADO';
export type ImportMode = 'quick' | 'complete';

export interface ExcelDemand {
  codigo?: string;
  data?: string;
  empresa: string;
  descricao: string;
  responsavel?: string;
  status: DemandStatus;
  topico?: string;
  subtopico?: string;
  plano?: string;
  comentario?: string;
  origem?: string;
}

export interface Demand {
  id: string;
  codigo?: string;
  data?: string;
  clientId?: string;
  empresaExcel: string;
  descricao: string;
  responsavel?: string;
  status: DemandStatus;
  topico?: string;
  subtopico?: string;
  plano?: string;
  comentario?: string;
  origem?: string;
  importedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchResult {
  empresaExcel: string;
  clientId?: string;
  clientName?: string;
  matchType: 'exact' | 'suggested' | 'none';
  suggestions?: { id: string; name: string; score: number }[];
  demands: ExcelDemand[];
  createNew?: boolean;
  ignored?: boolean;
  selected?: boolean; // For quick mode selection
}

// Summary for quick mode - aggregated stats per company
export interface CompanySummary {
  empresaExcel: string;
  clientId?: string;
  clientName?: string;
  matchType: 'exact' | 'suggested' | 'none';
  createNew?: boolean;
  ignored?: boolean;
  selected: boolean;
  totalDemands: number;
  byStatus: Record<DemandStatus, number>;
  collaborators: {
    celine: boolean;
    gabi: boolean;
    darley: boolean;
    vanessa: boolean;
  };
}

export interface ImportSummary {
  empresa: string;
  clientName?: string;
  total: number;
  byStatus: Record<DemandStatus, number>;
  byResponsavel: Record<string, number>;
}

// Status mapping from Excel to database
export const STATUS_MAP: Record<string, DemandStatus> = {
  'CONCLUIDO': 'CONCLUIDO',
  'CONCLUÍDA': 'CONCLUIDO',
  'CONCLUIDA': 'CONCLUIDO',
  'EM_EXECUCAO': 'EM_EXECUCAO',
  'EM EXECUÇÃO': 'EM_EXECUCAO',
  'EM EXECUCAO': 'EM_EXECUCAO',
  'NAO_FEITO': 'NAO_FEITO',
  'NÃO FEITO': 'NAO_FEITO',
  'NAO FEITO': 'NAO_FEITO',
  'CANCELADO': 'CANCELADO',
  'CANCELADA': 'CANCELADO',
};

export const STATUS_LABELS: Record<DemandStatus, string> = {
  CONCLUIDO: 'Concluído',
  EM_EXECUCAO: 'Em Execução',
  NAO_FEITO: 'Não Feito',
  CANCELADO: 'Cancelado',
};

export const STATUS_COLORS: Record<DemandStatus, string> = {
  CONCLUIDO: 'bg-green-500',
  EM_EXECUCAO: 'bg-blue-500',
  NAO_FEITO: 'bg-yellow-500',
  CANCELADO: 'bg-red-500',
};

// Normalize text for comparison
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .trim()
    .replace(/\s+/g, ' ');
}

// Calculate similarity score between two strings
export function similarityScore(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 1;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }
  
  // Check word overlap
  const words1 = new Set(s1.split(' '));
  const words2 = new Set(s2.split(' '));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// Detect collaborators from demands
export function detectCollaborators(demands: ExcelDemand[]): {
  celine: boolean;
  gabi: boolean;
  darley: boolean;
  vanessa: boolean;
} {
  const collaborators = { celine: false, gabi: false, darley: false, vanessa: false };
  
  for (const demand of demands) {
    const responsavel = demand.responsavel?.toLowerCase().trim() || '';
    if (responsavel.includes('celine')) collaborators.celine = true;
    if (responsavel.includes('gabi')) collaborators.gabi = true;
    if (responsavel.includes('darley')) collaborators.darley = true;
    if (responsavel.includes('vanessa')) collaborators.vanessa = true;
  }
  
  return collaborators;
}

// Create company summary from demands
export function createCompanySummary(
  empresaExcel: string,
  demands: ExcelDemand[],
  clientId?: string,
  clientName?: string,
  matchType: 'exact' | 'suggested' | 'none' = 'none'
): CompanySummary {
  const byStatus: Record<DemandStatus, number> = {
    CONCLUIDO: 0,
    EM_EXECUCAO: 0,
    NAO_FEITO: 0,
    CANCELADO: 0,
  };
  
  for (const demand of demands) {
    byStatus[demand.status]++;
  }
  
  return {
    empresaExcel,
    clientId,
    clientName,
    matchType,
    selected: matchType !== 'none',
    totalDemands: demands.length,
    byStatus,
    collaborators: detectCollaborators(demands),
  };
}
