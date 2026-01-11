import * as XLSX from 'xlsx';
import { ExcelProcess, normalizeProcessStatus } from '@/types/process';

// Find column by multiple possible names
function findColumn(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const idx = headers.findIndex(h => 
      h && h.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (idx !== -1) return idx;
  }
  return -1;
}

// Parse date from various formats
function parseDate(value: any): Date | null {
  if (!value) return null;
  
  // If it's already a Date
  if (value instanceof Date) return value;
  
  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // If it's a string
  if (typeof value === 'string') {
    // Handle "Invalid date" or similar
    if (value.toLowerCase().includes('invalid')) return null;
    
    // Try DD/MM/YYYY format
    const ddmmyyyy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Try ISO format
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
}

// Parse process Excel file
export function parseProcessExcel(buffer: ArrayBuffer): ExcelProcess[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  
  // Find the "data" sheet or use the first one
  const sheetName = workbook.SheetNames.find(n => n.toLowerCase() === 'data') || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with headers
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { header: 1 });
  
  if (jsonData.length < 2) return [];
  
  const headers = (jsonData[0] as any[]).map(h => String(h || '').trim());
  
  // Find column indexes
  const empresaIdx = findColumn(headers, ['Empresa', 'EMPRESA', 'empresa']);
  const tipoProcessoIdx = findColumn(headers, ['Tipo de Processo', 'TIPO DE PROCESSO', 'tipo_processo']);
  const nomeIdx = findColumn(headers, ['Nome', 'NOME', 'nome']);
  const numeroIdx = findColumn(headers, ['Nº do Processo', 'Nº Processo', 'N do Processo', 'NUMERO_PROCESSO', 'numero_processo']);
  const dataProtocoloIdx = findColumn(headers, ['Data do Protocolo', 'DATA DO PROTOCOLO', 'data_protocolo']);
  const statusIdx = findColumn(headers, ['Status', 'STATUS', 'status']);
  
  if (empresaIdx === -1) {
    console.error('Column "Empresa" not found');
    return [];
  }
  
  const processes: ExcelProcess[] = [];
  
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as any[];
    if (!row || !row[empresaIdx]) continue;
    
    const empresa = String(row[empresaIdx] || '').trim();
    if (!empresa) continue;
    
    const statusRaw = statusIdx !== -1 ? String(row[statusIdx] || '').trim() : null;
    
    processes.push({
      empresa,
      tipoProcesso: tipoProcessoIdx !== -1 ? String(row[tipoProcessoIdx] || '').trim() || null : null,
      nome: nomeIdx !== -1 ? String(row[nomeIdx] || '').trim() || null : null,
      numeroProcesso: numeroIdx !== -1 ? String(row[numeroIdx] || '').trim() || null : null,
      dataProtocolo: dataProtocoloIdx !== -1 ? parseDate(row[dataProtocoloIdx]) : null,
      statusRaw,
      statusNormalized: normalizeProcessStatus(statusRaw),
    });
  }
  
  return processes;
}

// Group processes by company
export function groupProcessesByCompany(processes: ExcelProcess[]): Map<string, ExcelProcess[]> {
  const grouped = new Map<string, ExcelProcess[]>();
  
  for (const process of processes) {
    const existing = grouped.get(process.empresa) || [];
    existing.push(process);
    grouped.set(process.empresa, existing);
  }
  
  return grouped;
}
