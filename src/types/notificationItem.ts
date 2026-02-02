export type NotificationItemStatus = 'ATENDIDO' | 'PENDENTE' | 'VENCIDO';

export interface ExcelNotificationItem {
  empresa: string;
  status: NotificationItemStatus;
}

export interface NotificationItemMatchResult {
  empresaExcel: string;
  clientId?: string;
  clientName?: string;
  matchType: 'exact' | 'suggested' | 'none';
  suggestions: { id: string; name: string; score: number }[];
  items: ExcelNotificationItem[];
  selected: boolean;
  ignored?: boolean;
}

export interface NotificationItemSummary {
  empresaExcel: string;
  clientId?: string;
  clientName?: string;
  matchType: 'exact' | 'suggested' | 'none';
  totalItems: number;
  atendidoCount: number;
  pendenteCount: number;
  vencidoCount: number;
  selected: boolean;
  ignored?: boolean;
}

export const NOTIFICATION_ITEM_STATUS_COLORS: Record<NotificationItemStatus, string> = {
  ATENDIDO: 'bg-emerald-500',
  PENDENTE: 'bg-amber-500',
  VENCIDO: 'bg-red-500',
};

export const NOTIFICATION_ITEM_STATUS_LABELS: Record<NotificationItemStatus, string> = {
  ATENDIDO: 'Atendido',
  PENDENTE: 'Pendente',
  VENCIDO: 'Vencido',
};

export function normalizeNotificationItemStatus(value: string | undefined): NotificationItemStatus {
  if (!value) return 'PENDENTE';
  
  const normalized = value.trim().toUpperCase();
  
  if (normalized === 'ATENDIDA' || normalized === 'ATENDIDO' || normalized.includes('ATEND')) {
    return 'ATENDIDO';
  }
  
  if (normalized === 'VENCIDA' || normalized === 'VENCIDO' || normalized.includes('VENC')) {
    return 'VENCIDO';
  }
  
  // A FAZER and PENDENTE are both treated as PENDENTE
  return 'PENDENTE';
}

export function createNotificationItemSummary(
  empresaExcel: string,
  items: ExcelNotificationItem[],
  clientId?: string,
  clientName?: string,
  matchType: 'exact' | 'suggested' | 'none' = 'none'
): NotificationItemSummary {
  const atendidoCount = items.filter(i => i.status === 'ATENDIDO').length;
  const pendenteCount = items.filter(i => i.status === 'PENDENTE').length;
  const vencidoCount = items.filter(i => i.status === 'VENCIDO').length;

  return {
    empresaExcel,
    clientId,
    clientName,
    matchType,
    totalItems: items.length,
    atendidoCount,
    pendenteCount,
    vencidoCount,
    selected: matchType !== 'none',
  };
}
