export type TaskPriority = 'baixa' | 'normal' | 'alta' | 'urgente';
export type TaskModality =
  | 'levantamento'
  | 'elaboracao'
  | 'regularizacao'
  | 'acompanhamento'
  | 'execucao_operacional';
export type TaskStatus =
  | 'pendente'
  | 'em_andamento'
  | 'aguardando_cliente'
  | 'aguardando_terceiro'
  | 'bloqueada'
  | 'em_validacao'
  | 'concluida'
  | 'cancelada';
export type TaskRecurrence = 'none' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  external_url?: string | null;
  completed: boolean;
  status: TaskStatus;
  assigned_to: string[];
  created_by?: string | null;
  created_at: string;
  completed_at: string | null;
  due_date: string | null;
  scheduled_for: string | null;
  priority: TaskPriority;
  modality: TaskModality;
  priority_id?: string | null;
  parent_task_id: string | null;
  sort_order: number;
  source_comment_id: string | null;
  recurrence: TaskRecurrence;
  recurrence_origin_id: string | null;
  updated_at: string;
}

export type TaskFormData = {
  title: string;
  description?: string;
  external_url?: string;
  assigned_to: string[];
  due_date?: string;
  scheduled_for?: string;
  priority?: TaskPriority;
  modality?: TaskModality;
  status?: TaskStatus;
  parent_task_id?: string | null;
  source_comment_id?: string | null;
  recurrence?: TaskRecurrence;
  sort_order?: number;
};

export interface TaskTemplate {
  id: string;
  name: string;
  description: string | null;
  default_title: string;
  default_description: string | null;
  default_priority: TaskPriority;
  subtasks: string[];
  is_active: boolean;
}

export interface TaskDependency {
  task_id: string;
  depends_on_task_id: string;
  created_at: string;
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, {
  label: string;
  color: string;
  className: string;
  order: number;
}> = {
  pendente: { label: 'Pendente', color: '#64748B', className: 'border-slate-300 bg-slate-50 text-slate-700', order: 0 },
  em_andamento: { label: 'Em andamento', color: '#D97706', className: 'border-amber-300 bg-amber-50 text-amber-800', order: 1 },
  aguardando_cliente: { label: 'Aguardando cliente', color: '#2563EB', className: 'border-blue-300 bg-blue-50 text-blue-800', order: 2 },
  aguardando_terceiro: { label: 'Aguardando terceiro', color: '#7C3AED', className: 'border-violet-300 bg-violet-50 text-violet-800', order: 3 },
  bloqueada: { label: 'Bloqueada', color: '#DC2626', className: 'border-red-300 bg-red-50 text-red-800', order: 4 },
  em_validacao: { label: 'Em validação', color: '#0891B2', className: 'border-cyan-300 bg-cyan-50 text-cyan-800', order: 5 },
  concluida: { label: 'Concluída', color: '#059669', className: 'border-emerald-300 bg-emerald-50 text-emerald-800', order: 6 },
  cancelada: { label: 'Cancelada', color: '#6B7280', className: 'border-slate-300 bg-slate-100 text-slate-600', order: 7 },
};

export const TASK_RECURRENCE_LABELS: Record<TaskRecurrence, string> = {
  none: 'Não repetir',
  weekly: 'Semanal',
  monthly: 'Mensal',
};

export const TASK_MODALITY_CONFIG: Record<TaskModality, { label: string; shortLabel: string }> = {
  levantamento: { label: 'Levantamento', shortLabel: 'Levant.' },
  elaboracao: { label: 'Elaboração', shortLabel: 'Elab.' },
  regularizacao: { label: 'Regularização', shortLabel: 'Regular.' },
  acompanhamento: { label: 'Acompanhamento', shortLabel: 'Acomp.' },
  execucao_operacional: { label: 'Execução Operacional', shortLabel: 'Execução' },
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
