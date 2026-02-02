export type CondicionanteStatus = 'ATENDIDA' | 'A_VENCER' | 'VENCIDA' | 'A_FAZER';

export interface ExcelCondicionante {
  empresa: string;
  licenca: string;
  numeroItem: string;
  descricao: string;
  protocolo: string;
  vencimento: Date | null;
  diasRestantes: string;
  dataAtendimento: Date | null;
  statusOriginal: string;
  statusCalculado: CondicionanteStatus;
}

export interface CondicionanteSummary {
  empresaExcel: string;
  clientId?: string;
  clientName?: string;
  matchType: 'exact' | 'suggested' | 'none';
  createNew?: boolean;
  ignored?: boolean;
  selected: boolean;
  totalCondicionantes: number;
  atendidasCount: number;
  aVencerCount: number;
  vencidasCount: number;
}

export interface CondicionanteMatchResult {
  empresaExcel: string;
  clientId?: string;
  clientName?: string;
  matchType: 'exact' | 'suggested' | 'none';
  suggestions?: { id: string; name: string; score: number }[];
  condicionantes: ExcelCondicionante[];
  createNew?: boolean;
  ignored?: boolean;
  selected?: boolean;
}

export const CONDICIONANTE_STATUS_LABELS: Record<CondicionanteStatus, string> = {
  ATENDIDA: 'Atendida',
  A_VENCER: 'A Vencer',
  VENCIDA: 'Vencida',
  A_FAZER: 'A Fazer',
};

export const CONDICIONANTE_STATUS_COLORS: Record<CondicionanteStatus, string> = {
  ATENDIDA: 'bg-emerald-500',
  A_VENCER: 'bg-amber-500',
  VENCIDA: 'bg-red-500',
  A_FAZER: 'bg-blue-500',
};

/**
 * Calculate condicionante status based on the original status from Excel
 */
export function calculateCondicionanteStatus(statusOriginal: string): CondicionanteStatus {
  const normalized = statusOriginal.toLowerCase().trim();
  
  if (normalized.includes('atendida') || normalized.includes('conclu')) {
    return 'ATENDIDA';
  }
  if (normalized.includes('vencida')) {
    return 'VENCIDA';
  }
  if (normalized.includes('vencer') || normalized.includes('a fazer') || normalized.includes('fazer')) {
    return 'A_VENCER';
  }
  
  return 'A_FAZER';
}

/**
 * Create condicionante summary from a list of condicionantes for a company
 */
export function createCondicionanteSummary(
  empresaExcel: string,
  condicionantes: ExcelCondicionante[],
  clientId?: string,
  clientName?: string,
  matchType: 'exact' | 'suggested' | 'none' = 'none'
): CondicionanteSummary {
  let atendidasCount = 0;
  let aVencerCount = 0;
  let vencidasCount = 0;
  
  for (const cond of condicionantes) {
    switch (cond.statusCalculado) {
      case 'ATENDIDA':
        atendidasCount++;
        break;
      case 'A_VENCER':
      case 'A_FAZER':
        aVencerCount++;
        break;
      case 'VENCIDA':
        vencidasCount++;
        break;
    }
  }
  
  return {
    empresaExcel,
    clientId,
    clientName,
    matchType,
    selected: matchType !== 'none',
    totalCondicionantes: condicionantes.length,
    atendidasCount,
    aVencerCount,
    vencidasCount,
  };
}
