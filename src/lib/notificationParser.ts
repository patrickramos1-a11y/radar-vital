import * as XLSX from 'xlsx';
import { ExcelNotification, normalizeNotificationStatus } from '@/types/notification';

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
      h?.toLowerCase().trim().includes(name.toLowerCase().trim())
    );
    if (index !== -1) return index;
  }
  return -1;
}

/**
 * Parse Excel file and extract notification data
 */
export function parseNotificationExcel(file: ArrayBuffer): ExcelNotification[] {
  const workbook = XLSX.read(file, { type: 'array', cellDates: true });
  
  // Find the first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
  
  if (data.length < 2) return [];
  
  // Get headers from first row
  const headers = (data[0] as string[]).map(h => String(h || '').trim());
  
  // Find column indexes based on the Excel structure
  // Columns: Empresa, Processo, Nº da notificação, descricao, Data de recebimento, Status
  const colIndexes = {
    empresa: findColumn(headers, ['Empresa', 'empresa', 'Cliente', 'EMPRESA']),
    processo: findColumn(headers, ['Processo', 'processo', 'Nº Processo', 'N° Processo', 'Num Processo']),
    numeroNotificacao: findColumn(headers, ['Nº da notificação', 'N° da notificação', 'Notificação', 'Numero Notificação', 'notificacao']),
    descricao: findColumn(headers, ['descricao', 'Descrição', 'Descricao', 'DESCRICAO']),
    dataRecebimento: findColumn(headers, ['Data de recebimento', 'Data recebimento', 'Recebimento', 'Data']),
    status: findColumn(headers, ['Status', 'STATUS', 'Situação', 'Estado']),
  };
  
  // Empresa and numero_notificacao columns are required
  if (colIndexes.empresa === -1) {
    console.error('Column "Empresa" not found');
    return [];
  }
  
  if (colIndexes.numeroNotificacao === -1) {
    console.error('Column "Nº da notificação" not found');
    return [];
  }
  
  const notifications: ExcelNotification[] = [];
  
  // Process rows (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as any[];
    if (!row || row.length === 0) continue;
    
    const empresa = String(row[colIndexes.empresa] || '').trim();
    const numeroNotificacao = String(row[colIndexes.numeroNotificacao] || '').trim();
    
    if (!empresa || !numeroNotificacao) continue;
    
    const statusText = colIndexes.status !== -1 
      ? String(row[colIndexes.status] || '').trim() 
      : '';
    
    const notification: ExcelNotification = {
      empresa,
      numeroProcesso: colIndexes.processo !== -1 ? String(row[colIndexes.processo] || '').trim() || null : null,
      numeroNotificacao,
      descricao: colIndexes.descricao !== -1 ? String(row[colIndexes.descricao] || '').trim() || null : null,
      dataRecebimento: parseDate(row[colIndexes.dataRecebimento]),
      status: normalizeNotificationStatus(statusText),
    };
    
    notifications.push(notification);
  }
  
  return notifications;
}

/**
 * Group notifications by company
 */
export function groupNotificationsByCompany(notifications: ExcelNotification[]): Map<string, ExcelNotification[]> {
  const grouped = new Map<string, ExcelNotification[]>();
  
  for (const notification of notifications) {
    const key = notification.empresa;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(notification);
  }
  
  return grouped;
}
