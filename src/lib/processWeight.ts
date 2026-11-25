import type { TaskPriority } from '@/types/task';

/** Peso do processo: 1 a 5. Peso 5 = Máxima (o que antes era "prioridade"). */
export type ProcessWeight = 1 | 2 | 3 | 4 | 5;

export const PROCESS_WEIGHTS: ProcessWeight[] = [5, 4, 3, 2, 1];
export const MAXIMUM_PROCESS_WEIGHT: ProcessWeight = 5;
export const DEFAULT_PROCESS_WEIGHT: ProcessWeight = 2;

export const PROCESS_WEIGHT_CONFIG: Record<ProcessWeight, { label: string; className: string }> = {
  5: { label: 'Máxima', className: 'border-red-300 bg-red-50 text-red-800' },
  4: { label: 'Urgente', className: 'border-orange-300 bg-orange-50 text-orange-800' },
  3: { label: 'Alta', className: 'border-amber-300 bg-amber-50 text-amber-800' },
  2: { label: 'Normal', className: 'border-sky-300 bg-sky-50 text-sky-800' },
  1: { label: 'Baixa', className: 'border-slate-300 bg-slate-50 text-slate-700' },
};

/** Mesmo mapa do banco (`task_weight_for_urgency`). */
export function weightForUrgency(urgency: TaskPriority | null | undefined): ProcessWeight {
  switch (urgency) {
    case 'baixa': return 1;
    case 'alta': return 3;
    case 'urgente': return 4;
    default: return 2;
  }
}

/** Mesmo mapa do banco (`task_urgency_for_weight`). */
export function urgencyForWeight(weight: number): TaskPriority {
  if (weight >= 4) return 'urgente';
  if (weight === 3) return 'alta';
  if (weight === 2) return 'normal';
  return 'baixa';
}

export function normalizeProcessWeight(value: unknown, fallback: ProcessWeight = DEFAULT_PROCESS_WEIGHT): ProcessWeight {
  if (value === null || value === undefined || value === '') return fallback;
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(5, Math.max(1, Math.round(number))) as ProcessWeight;
}

export function isMaximumWeight(weight: number): boolean {
  return weight >= MAXIMUM_PROCESS_WEIGHT;
}
