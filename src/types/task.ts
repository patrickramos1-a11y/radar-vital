export type TaskPriority = 'baixa' | 'normal' | 'alta' | 'urgente';

export interface Task {
  id: string;
  client_id: string;
  title: string;
  completed: boolean;
  assigned_to: string[];
  created_at: string;
  completed_at: string | null;
  due_date: string | null;
  priority: TaskPriority;
}

export type TaskFormData = {
  title: string;
  assigned_to: string[];
  due_date?: string;
  priority?: TaskPriority;
};

export const PRIORITY_CONFIG: Record<TaskPriority, {
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  dotClass: string;
  icon: string;
  order: number;
}> = {
  urgente: {
    label: 'Urgente',
    color: '#DC2626',
    bgClass: 'bg-red-50',
    borderClass: 'border-l-4 border-red-600',
    textClass: 'text-red-700',
    dotClass: 'bg-red-600',
    icon: '🔥',
    order: 0,
  },
  alta: {
    label: 'Alta',
    color: '#EA580C',
    bgClass: 'bg-orange-50',
    borderClass: 'border-l-4 border-orange-500',
    textClass: 'text-orange-700',
    dotClass: 'bg-orange-500',
    icon: '⬆️',
    order: 1,
  },
  normal: {
    label: 'Normal',
    color: '#0EA5E9',
    bgClass: 'bg-card',
    borderClass: 'border-l-4 border-sky-400',
    textClass: 'text-sky-700',
    dotClass: 'bg-sky-400',
    icon: '•',
    order: 2,
  },
  baixa: {
    label: 'Baixa',
    color: '#64748B',
    bgClass: 'bg-slate-50',
    borderClass: 'border-l-4 border-slate-300',
    textClass: 'text-slate-600',
    dotClass: 'bg-slate-400',
    icon: '⬇️',
    order: 3,
  },
};
