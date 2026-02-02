import * as XLSX from 'xlsx';
import { ExcelNotificationItem, normalizeNotificationItemStatus } from '@/types/notificationItem';

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
 * Parse Excel file and extract notification item data
 */
export function parseNotificationItemExcel(file: ArrayBuffer): ExcelNotificationItem[] {
  const workbook = XLSX.read(file, { type: 'array', cellDates: true });
  
  // Find the first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
  
  if (data.length < 2) return [];
  
  // Get headers from first row
  const headers = (data[0] as string[]).map(h => String(h || '').trim());
  
  // Find column indexes based on the Excel structure
  // Columns: Empresa, Status
  const colIndexes = {
    empresa: findColumn(headers, ['Empresa', 'empresa', 'Cliente', 'EMPRESA']),
    status: findColumn(headers, ['Status', 'STATUS', 'Situação', 'Estado']),
  };
  
  // Empresa column is required
  if (colIndexes.empresa === -1) {
    console.error('Column "Empresa" not found');
    return [];
  }
  
  if (colIndexes.status === -1) {
    console.error('Column "Status" not found');
    return [];
  }
  
  const items: ExcelNotificationItem[] = [];
  
  // Process rows (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as any[];
    if (!row || row.length === 0) continue;
    
    const empresa = String(row[colIndexes.empresa] || '').trim();
    
    if (!empresa) continue;
    
    const statusText = String(row[colIndexes.status] || '').trim();
    
    const item: ExcelNotificationItem = {
      empresa,
      status: normalizeNotificationItemStatus(statusText),
    };
    
    items.push(item);
  }
  
  return items;
}

/**
 * Group notification items by company
 */
export function groupNotificationItemsByCompany(items: ExcelNotificationItem[]): Map<string, ExcelNotificationItem[]> {
  const grouped = new Map<string, ExcelNotificationItem[]>();
  
  for (const item of items) {
    const key = item.empresa;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  }
  
  return grouped;
}
