export type LicenseStatus = 'VALIDA' | 'PROXIMO_VENCIMENTO' | 'FORA_VALIDADE';

export interface ExcelLicense {
  ativo: string;
  empresa: string;
  tipoLicenca: string;
  licenca: string;
  numProcesso: string;
  dataEmissao: Date | null;
  vencimento: Date | null;
  statusOriginal: string;
  statusCalculado: LicenseStatus;
}

export interface LicenseSummary {
  empresaExcel: string;
  clientId?: string;
  clientName?: string;
  matchType: 'exact' | 'suggested' | 'none';
  createNew?: boolean;
  ignored?: boolean;
  selected: boolean;
  totalLicenses: number;
  validasCount: number;
  proximoVencCount: number;
  foraValidadeCount: number;
  proximaDataVencimento: Date | null;
}

export interface LicenseMatchResult {
  empresaExcel: string;
  clientId?: string;
  clientName?: string;
  matchType: 'exact' | 'suggested' | 'none';
  suggestions?: { id: string; name: string; score: number }[];
  licenses: ExcelLicense[];
  createNew?: boolean;
  ignored?: boolean;
  selected?: boolean;
}

export const LICENSE_STATUS_LABELS: Record<LicenseStatus, string> = {
  VALIDA: 'Válida',
  PROXIMO_VENCIMENTO: 'Próximo do Vencimento',
  FORA_VALIDADE: 'Fora da Validade',
};

export const LICENSE_STATUS_COLORS: Record<LicenseStatus, string> = {
  VALIDA: 'bg-green-500',
  PROXIMO_VENCIMENTO: 'bg-yellow-500',
  FORA_VALIDADE: 'bg-red-500',
};

/**
 * Calculate license status based on vencimento date
 * - FORA_VALIDADE: vencimento < today
 * - PROXIMO_VENCIMENTO: vencimento between today and (today + 30 days)
 * - VALIDA: vencimento > (today + 30 days)
 */
export function calculateLicenseStatus(vencimento: Date | null): LicenseStatus {
  if (!vencimento) return 'FORA_VALIDADE';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const vencDate = new Date(vencimento);
  vencDate.setHours(0, 0, 0, 0);
  
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  if (vencDate < today) {
    return 'FORA_VALIDADE';
  } else if (vencDate <= thirtyDaysFromNow) {
    return 'PROXIMO_VENCIMENTO';
  } else {
    return 'VALIDA';
  }
}

/**
 * Create license summary from a list of licenses for a company
 */
export function createLicenseSummary(
  empresaExcel: string,
  licenses: ExcelLicense[],
  clientId?: string,
  clientName?: string,
  matchType: 'exact' | 'suggested' | 'none' = 'none'
): LicenseSummary {
  let validasCount = 0;
  let proximoVencCount = 0;
  let foraValidadeCount = 0;
  let proximaDataVencimento: Date | null = null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const license of licenses) {
    switch (license.statusCalculado) {
      case 'VALIDA':
        validasCount++;
        break;
      case 'PROXIMO_VENCIMENTO':
        proximoVencCount++;
        break;
      case 'FORA_VALIDADE':
        foraValidadeCount++;
        break;
    }
    
    // Find the closest future expiration date
    if (license.vencimento) {
      const vencDate = new Date(license.vencimento);
      if (vencDate >= today) {
        if (!proximaDataVencimento || vencDate < proximaDataVencimento) {
          proximaDataVencimento = vencDate;
        }
      }
    }
  }
  
  return {
    empresaExcel,
    clientId,
    clientName,
    matchType,
    selected: matchType !== 'none',
    totalLicenses: licenses.length,
    validasCount,
    proximoVencCount,
    foraValidadeCount,
    proximaDataVencimento,
  };
}