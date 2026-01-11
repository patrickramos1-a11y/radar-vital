// Process status normalized values
export type ProcessStatus = 
  | 'DEFERIDO' 
  | 'EM_ANALISE_ORGAO' 
  | 'EM_ANALISE_RAMOS' 
  | 'NOTIFICADO' 
  | 'REPROVADO' 
  | 'OUTROS';

export const PROCESS_STATUS_LABELS: Record<ProcessStatus, string> = {
  DEFERIDO: 'Deferido',
  EM_ANALISE_ORGAO: 'Em Análise (Órgão)',
  EM_ANALISE_RAMOS: 'Em Análise (Ramos)',
  NOTIFICADO: 'Notificado',
  REPROVADO: 'Reprovado',
  OUTROS: 'Outros',
};

export const PROCESS_STATUS_COLORS: Record<ProcessStatus, string> = {
  DEFERIDO: 'bg-green-500',
  EM_ANALISE_ORGAO: 'bg-blue-500',
  EM_ANALISE_RAMOS: 'bg-cyan-500',
  NOTIFICADO: 'bg-yellow-500',
  REPROVADO: 'bg-red-500',
  OUTROS: 'bg-gray-500',
};

// Normalize status from Excel to our enum
export function normalizeProcessStatus(rawStatus: string | null | undefined): ProcessStatus {
  if (!rawStatus) return 'OUTROS';
  
  const normalized = rawStatus.toUpperCase().trim();
  
  if (normalized.includes('DEFERIDO')) return 'DEFERIDO';
  if (normalized.includes('EM ANÁLISE PELO ORGÃO') || normalized.includes('EM ANALISE PELO ORGAO')) return 'EM_ANALISE_ORGAO';
  if (normalized.includes('EM ANÁLISE PELA RAMOS') || normalized.includes('EM ANALISE PELA RAMOS')) return 'EM_ANALISE_RAMOS';
  if (normalized.includes('NOTIFICADO')) return 'NOTIFICADO';
  if (normalized.includes('REPROVADO') || normalized.includes('INDEFERIDO')) return 'REPROVADO';
  
  return 'OUTROS';
}

// Raw data from Excel
export interface ExcelProcess {
  empresa: string;
  tipoProcesso: string | null;
  nome: string | null;
  numeroProcesso: string | null;
  dataProtocolo: Date | null;
  statusRaw: string | null;
  statusNormalized: ProcessStatus;
}

// Summary per company
export interface ProcessSummary {
  empresaExcel: string;
  clientId?: string;
  clientName?: string;
  matchType: 'exact' | 'suggested' | 'none';
  selected: boolean;
  ignored?: boolean;
  
  // Counts by status
  deferidoCount: number;
  emAnaliseOrgaoCount: number;
  emAnaliseRamosCount: number;
  notificadoCount: number;
  reprovadoCount: number;
  outrosCount: number;
  
  // Calculated
  totalCount: number;
  criticosCount: number; // notificado + reprovado
  emAndamentoCount: number; // em_analise_orgao + em_analise_ramos + notificado
}

// Match result for wizard
export interface ProcessMatchResult {
  empresaExcel: string;
  clientId?: string;
  clientName?: string;
  matchType: 'exact' | 'suggested' | 'none';
  suggestions: { id: string; name: string; score: number }[];
  processes: ExcelProcess[];
  selected: boolean;
  ignored?: boolean;
}

// Create summary from processes
export function createProcessSummary(
  empresaExcel: string,
  processes: ExcelProcess[],
  clientId?: string,
  clientName?: string,
  matchType: 'exact' | 'suggested' | 'none' = 'none'
): ProcessSummary {
  const deferidoCount = processes.filter(p => p.statusNormalized === 'DEFERIDO').length;
  const emAnaliseOrgaoCount = processes.filter(p => p.statusNormalized === 'EM_ANALISE_ORGAO').length;
  const emAnaliseRamosCount = processes.filter(p => p.statusNormalized === 'EM_ANALISE_RAMOS').length;
  const notificadoCount = processes.filter(p => p.statusNormalized === 'NOTIFICADO').length;
  const reprovadoCount = processes.filter(p => p.statusNormalized === 'REPROVADO').length;
  const outrosCount = processes.filter(p => p.statusNormalized === 'OUTROS').length;
  
  return {
    empresaExcel,
    clientId,
    clientName,
    matchType,
    selected: matchType !== 'none',
    
    deferidoCount,
    emAnaliseOrgaoCount,
    emAnaliseRamosCount,
    notificadoCount,
    reprovadoCount,
    outrosCount,
    
    totalCount: processes.length,
    criticosCount: notificadoCount + reprovadoCount,
    emAndamentoCount: emAnaliseOrgaoCount + emAnaliseRamosCount + notificadoCount,
  };
}
