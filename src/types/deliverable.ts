export type DeliverableStatus = 'aberto' | 'em_andamento' | 'concluido' | 'cancelado';
export type DeliverableItemType = 'priority' | 'task';

export interface DeliverableItem {
  id: string;
  deliverable_id: string;
  item_type: DeliverableItemType;
  item_id: string;
  created_at: string;
}

export interface Deliverable {
  id: string;
  name: string;
  description: string | null;
  assigned_to: string[];
  requester: string | null;
  due_date: string | null;
  status: DeliverableStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  items: DeliverableItem[];
}

export interface DeliverableFormData {
  name: string;
  description?: string;
  assigned_to: string[];
  requester?: string | null;
  due_date?: string | null;
  status?: DeliverableStatus;
  items?: { item_type: DeliverableItemType; item_id: string }[];
}

export const DELIVERABLE_STATUS_CONFIG: Record<DeliverableStatus, { label: string; color: string; bgClass: string; textClass: string }> = {
  aberto: { label: 'Aberto', color: '#0EA5E9', bgClass: 'bg-sky-50', textClass: 'text-sky-700' },
  em_andamento: { label: 'Em andamento', color: '#F59E0B', bgClass: 'bg-amber-50', textClass: 'text-amber-700' },
  concluido: { label: 'Concluído', color: '#10B981', bgClass: 'bg-emerald-50', textClass: 'text-emerald-700' },
  cancelado: { label: 'Cancelado', color: '#64748B', bgClass: 'bg-slate-50', textClass: 'text-slate-500' },
};
