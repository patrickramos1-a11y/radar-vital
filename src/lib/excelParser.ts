import * as XLSX from 'xlsx';
import { ExcelDemand, STATUS_MAP, DemandStatus, normalizeText } from '@/types/demand';

interface ExcelRow {
  Data?: string | number;
  Ano?: number;
  Mês?: number;
  'Mês Inicial'?: string;
  Empresa?: string;
  Origem?: string;
  Descrição?: string;
  Descricao?: string;
  Responsável?: string;
  Responsavel?: string;
  Plano?: string;
  Status?: string;
  Comentário?: string;
  Comentario?: string;
  Tópico?: string;
  Topico?: string;
  Subtópico?: string;
  Subtopico?: string;
  Código?: string;
  Codigo?: string;
}

function parseExcelDate(value: string | number | undefined): string | undefined {
  if (!value) return undefined;
  
  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
  }
  
  // If it's a string
  if (typeof value === 'string') {
    // Try to parse DD/MM/YYYY format
    const parts = value.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return undefined;
}

function parseStatus(value: string | undefined): DemandStatus {
  if (!value) return 'NAO_FEITO';
  
  const normalized = normalizeText(value).toUpperCase().replace(/\s+/g, '_');
  
  // Check direct mapping
  for (const [key, status] of Object.entries(STATUS_MAP)) {
    if (normalizeText(key) === normalizeText(value)) {
      return status;
    }
  }
  
  // Fallback mappings
  if (normalized.includes('CONCLU')) return 'CONCLUIDO';
  if (normalized.includes('EXECU') || normalized.includes('ANDAMENTO')) return 'EM_EXECUCAO';
  if (normalized.includes('CANCEL')) return 'CANCELADO';
  
  return 'NAO_FEITO';
}

export async function parseExcelFile(file: File): Promise<ExcelDemand[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet (Sheet1)
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        // Parse each row
        const demands: ExcelDemand[] = rows
          .filter(row => {
            // Must have empresa and descricao
            const empresa = row.Empresa || '';
            const descricao = row.Descrição || row.Descricao || '';
            return empresa.trim() !== '' && descricao.trim() !== '';
          })
          .map((row, index) => ({
            codigo: row.Código || row.Codigo || `IMP-${Date.now()}-${index}`,
            data: parseExcelDate(row.Data),
            empresa: (row.Empresa || '').trim(),
            descricao: (row.Descrição || row.Descricao || '').trim(),
            responsavel: (row.Responsável || row.Responsavel || '').trim() || undefined,
            status: parseStatus(row.Status),
            topico: (row.Tópico || row.Topico || '').trim() || undefined,
            subtopico: (row.Subtópico || row.Subtopico || '').trim() || undefined,
            plano: (row.Plano || '').trim() || undefined,
            comentario: (row.Comentário || row.Comentario || '').trim() || undefined,
            origem: (row.Origem || '').trim() || undefined,
          }));
        
        resolve(demands);
      } catch (error) {
        reject(new Error('Erro ao ler arquivo Excel: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

export function groupDemandsByEmpresa(demands: ExcelDemand[]): Map<string, ExcelDemand[]> {
  const groups = new Map<string, ExcelDemand[]>();
  
  for (const demand of demands) {
    const empresa = demand.empresa;
    if (!groups.has(empresa)) {
      groups.set(empresa, []);
    }
    groups.get(empresa)!.push(demand);
  }
  
  return groups;
}
