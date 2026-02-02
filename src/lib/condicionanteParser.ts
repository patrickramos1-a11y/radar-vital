import * as XLSX from 'xlsx';
import { ExcelCondicionante, calculateCondicionanteStatus } from '@/types/condicionante';

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
 * Parse Excel file and extract condicionantes data
 */
export function parseCondicionanteExcel(file: ArrayBuffer): ExcelCondicionante[] {
  const workbook = XLSX.read(file, { type: 'array', cellDates: true });
  
  // Use the first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
  
  if (data.length < 2) return [];
  
  // Get headers from first row
  const headers = (data[0] as string[]).map(h => String(h || '').trim());
  
  // Find column indexes based on the Excel structure
  const colIndexes = {
    empresa: findColumn(headers, ['Empresa', 'EMPRESA', 'empresa', 'Cliente', 'CLIENTE']),
    licenca: findColumn(headers, ['Licença', 'LICENÇA', 'licenca', 'Licenca']),
    numeroItem: findColumn(headers, ['Nº item', 'N° item', 'Num item', 'NumItem', 'Numero', 'Item']),
    descricao: findColumn(headers, ['Descrição', 'DESCRIÇÃO', 'Descricao', 'DESCRICAO']),
    protocolo: findColumn(headers, ['Protocolo', 'PROTOCOLO']),
    vencimento: findColumn(headers, ['Vencimento', 'VENCIMENTO', 'Data Vencimento', 'Validade']),
    diasRestantes: findColumn(headers, ['Dias restantes', 'Dias Restantes', 'DiasRestantes']),
    dataAtendimento: findColumn(headers, ['Data de atendimento', 'Data Atendimento', 'DataAtendimento']),
    status: findColumn(headers, ['Status', 'STATUS', 'Situação', 'Estado']),
  };
  
  // Empresa and Status columns are required
  if (colIndexes.empresa === -1) {
    console.error('Column "Empresa" not found');
    return [];
  }
  
  if (colIndexes.status === -1) {
    console.error('Column "Status" not found');
    return [];
  }
  
  const condicionantes: ExcelCondicionante[] = [];
  
  // Process rows (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as any[];
    if (!row || row.length === 0) continue;
    
    const empresa = String(row[colIndexes.empresa] || '').trim();
    if (!empresa) continue;
    
    const statusOriginal = String(row[colIndexes.status] || '').trim();
    if (!statusOriginal) continue;
    
    const condicionante: ExcelCondicionante = {
      empresa,
      licenca: colIndexes.licenca !== -1 ? String(row[colIndexes.licenca] || '').trim() : '',
      numeroItem: colIndexes.numeroItem !== -1 ? String(row[colIndexes.numeroItem] || '').trim() : '',
      descricao: colIndexes.descricao !== -1 ? String(row[colIndexes.descricao] || '').trim() : '',
      protocolo: colIndexes.protocolo !== -1 ? String(row[colIndexes.protocolo] || '').trim() : '',
      vencimento: parseDate(row[colIndexes.vencimento]),
      diasRestantes: colIndexes.diasRestantes !== -1 ? String(row[colIndexes.diasRestantes] || '').trim() : '',
      dataAtendimento: parseDate(row[colIndexes.dataAtendimento]),
      statusOriginal,
      statusCalculado: calculateCondicionanteStatus(statusOriginal),
    };
    
    condicionantes.push(condicionante);
  }
  
  return condicionantes;
}

/**
 * Group condicionantes by company
 */
export function groupCondicionantesByCompany(condicionantes: ExcelCondicionante[]): Map<string, ExcelCondicionante[]> {
  const grouped = new Map<string, ExcelCondicionante[]>();
  
  for (const cond of condicionantes) {
    const key = cond.empresa;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(cond);
  }
  
  return grouped;
}
