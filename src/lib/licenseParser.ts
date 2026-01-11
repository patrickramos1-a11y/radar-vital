import * as XLSX from 'xlsx';
import { ExcelLicense, LicenseStatus, calculateLicenseStatus } from '@/types/license';

/**
 * Parse date from various formats (DD/MM/YYYY, YYYY-MM-DD, Excel serial)
 */
function parseDate(value: any): Date | null {
  if (!value) return null;
  
  // If it's already a Date
  if (value instanceof Date) return value;
  
  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const days = Math.floor(value);
    const result = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    return result;
  }
  
  // If it's a string
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    
    // Try DD/MM/YYYY format
    const brMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (brMatch) {
      const [, day, month, year] = brMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Try YYYY-MM-DD format
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Try parsing as date string
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  
  return null;
}

/**
 * Find a column by checking multiple possible names
 */
function findColumn(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => 
      h?.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (index !== -1) return index;
  }
  return -1;
}

/**
 * Parse Excel file and extract license data
 */
export function parseLicenseExcel(file: ArrayBuffer): ExcelLicense[] {
  const workbook = XLSX.read(file, { type: 'array', cellDates: true });
  
  // Find the "data" sheet or use the first sheet
  let sheetName = workbook.SheetNames.find(name => 
    name.toLowerCase() === 'data' || name.toLowerCase() === 'dados'
  );
  if (!sheetName) {
    sheetName = workbook.SheetNames[0];
  }
  
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
  
  if (data.length < 2) return [];
  
  // Get headers from first row
  const headers = (data[0] as string[]).map(h => String(h || '').trim());
  
  // Find column indexes
  const colIndexes = {
    ativo: findColumn(headers, ['Ativo', 'ATIVO', 'ativo']),
    empresa: findColumn(headers, ['Empresa', 'EMPRESA', 'empresa', 'Cliente', 'CLIENTE']),
    tipoLicenca: findColumn(headers, ['Tipo de Licença', 'TIPO DE LICENÇA', 'Tipo Licença', 'TipoLicenca']),
    licenca: findColumn(headers, ['Licença', 'LICENÇA', 'licenca', 'Código', 'Numero']),
    numProcesso: findColumn(headers, ['Nº Processo', 'N° Processo', 'Num Processo', 'NumProcesso', 'Processo']),
    dataEmissao: findColumn(headers, ['Data de Emissão', 'Data Emissão', 'Emissão', 'DataEmissao']),
    vencimento: findColumn(headers, ['Vencimento', 'VENCIMENTO', 'Data Vencimento', 'Validade']),
    status: findColumn(headers, ['Status', 'STATUS', 'Situação', 'Estado']),
  };
  
  // Empresa column is required
  if (colIndexes.empresa === -1) {
    console.error('Column "Empresa" not found');
    return [];
  }
  
  const licenses: ExcelLicense[] = [];
  
  // Process rows (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as any[];
    if (!row || row.length === 0) continue;
    
    const empresa = String(row[colIndexes.empresa] || '').trim();
    if (!empresa) continue;
    
    // Skip if Ativo column exists and is not "SIM"
    if (colIndexes.ativo !== -1) {
      const ativo = String(row[colIndexes.ativo] || '').trim().toUpperCase();
      if (ativo && ativo !== 'SIM') continue;
    }
    
    const vencimento = parseDate(row[colIndexes.vencimento]);
    const statusOriginal = colIndexes.status !== -1 
      ? String(row[colIndexes.status] || '').trim() 
      : '';
    
    const license: ExcelLicense = {
      ativo: colIndexes.ativo !== -1 ? String(row[colIndexes.ativo] || '').trim() : 'SIM',
      empresa,
      tipoLicenca: colIndexes.tipoLicenca !== -1 ? String(row[colIndexes.tipoLicenca] || '').trim() : '',
      licenca: colIndexes.licenca !== -1 ? String(row[colIndexes.licenca] || '').trim() : '',
      numProcesso: colIndexes.numProcesso !== -1 ? String(row[colIndexes.numProcesso] || '').trim() : '',
      dataEmissao: parseDate(row[colIndexes.dataEmissao]),
      vencimento,
      statusOriginal,
      statusCalculado: calculateLicenseStatus(vencimento),
    };
    
    licenses.push(license);
  }
  
  return licenses;
}

/**
 * Group licenses by company
 */
export function groupLicensesByCompany(licenses: ExcelLicense[]): Map<string, ExcelLicense[]> {
  const grouped = new Map<string, ExcelLicense[]>();
  
  for (const license of licenses) {
    const key = license.empresa;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(license);
  }
  
  return grouped;
}