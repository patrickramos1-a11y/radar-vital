export type NotificationStatus = 'PENDENTE' | 'ATENDIDA';

export interface ExcelNotification {
  empresa: string;
  numeroProcesso: string | null;
  numeroNotificacao: string;
  descricao: string | null;
  dataRecebimento: Date | null;
  status: NotificationStatus;
}

export interface NotificationMatchResult {
  empresaExcel: string;
  clientId?: string;
  clientName?: string;
  matchType: 'exact' | 'suggested' | 'none';
  suggestions: { id: string; name: string; score: number }[];
  notifications: ExcelNotification[];
  selected: boolean;
  ignored?: boolean;
}

export interface NotificationSummary {
  empresaExcel: string;
  clientId?: string;
  clientName?: string;
  matchType: 'exact' | 'suggested' | 'none';
  totalNotifications: number;
  pendentesCount: number;
  atendidasCount: number;
  selected: boolean;
  ignored?: boolean;
}

export const NOTIFICATION_STATUS_COLORS: Record<NotificationStatus, string> = {
  PENDENTE: 'bg-amber-500',
  ATENDIDA: 'bg-emerald-500',
};

export const NOTIFICATION_STATUS_LABELS: Record<NotificationStatus, string> = {
  PENDENTE: 'Pendente',
  ATENDIDA: 'Atendida',
};

export function createNotificationSummary(
  empresaExcel: string,
  notifications: ExcelNotification[],
  clientId?: string,
  clientName?: string,
  matchType: 'exact' | 'suggested' | 'none' = 'none'
): NotificationSummary {
  const pendentesCount = notifications.filter(n => n.status === 'PENDENTE').length;
  const atendidasCount = notifications.filter(n => n.status === 'ATENDIDA').length;

  return {
    empresaExcel,
    clientId,
    clientName,
    matchType,
    totalNotifications: notifications.length,
    pendentesCount,
    atendidasCount,
    selected: matchType !== 'none',
  };
}

export function normalizeNotificationStatus(value: string | undefined): NotificationStatus {
  if (!value) return 'PENDENTE';
  
  const normalized = value.trim().toUpperCase();
  
  if (normalized === 'ATENDIDA' || normalized.includes('ATEND')) {
    return 'ATENDIDA';
  }
  
  return 'PENDENTE';
}
