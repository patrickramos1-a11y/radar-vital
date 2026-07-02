export type PriorityStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';

export interface Priority {
  id: string;
  title: string;
  description: string | null;
  client_id: string | null;
  assigned_to: string[];
  due_date: string | null;
  status: PriorityStatus;
  weight: number;
  category: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface PriorityFormData {
  title: string;
  description?: string;
  client_id?: string | null;
  assigned_to: string[];
  due_date?: string | null;
  status?: PriorityStatus;
  weight?: number;
  category?: string | null;
}

export const PRIORITY_STATUS_CONFIG: Record<PriorityStatus, {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  aberta: {
    label: 'Aberta',
    color: '#0EA5E9',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-700',
    borderClass: 'border-sky-300',
  },
  em_andamento: {
    label: 'Em andamento',
    color: '#F59E0B',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-300',
  },
  concluida: {
    label: 'Concluída',
    color: '#10B981',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-300',
  },
  cancelada: {
    label: 'Cancelada',
    color: '#64748B',
    bgClass: 'bg-slate-50',
    textClass: 'text-slate-500',
    borderClass: 'border-slate-300',
  },
};
