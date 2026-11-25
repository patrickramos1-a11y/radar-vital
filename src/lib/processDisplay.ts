import { differenceInCalendarDays, format } from 'date-fns';
import { ArrowDown, ArrowUp, Flame, Minus, Siren } from 'lucide-react';
import type { Task } from '@/types/task';
import { PROCESS_WEIGHT_CONFIG, normalizeProcessWeight, type ProcessWeight } from '@/lib/processWeight';

/** Apoio de tela dos Processos: datas, cores e aparência do peso. */
export function today() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDay(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR');
}

export function colorWithAlpha(color: string, alpha: string) {
  return /^#[0-9a-f]{6}$/i.test(color) ? `${color}${alpha}` : 'rgba(15, 118, 110, 0.08)';
}

export function daysOpen(task: Pick<Task, 'created_at' | 'completed_at'>) {
  return Math.max(0, differenceInCalendarDays(new Date(task.completed_at || new Date()), new Date(task.created_at)));
}

const WEIGHT_VISUAL: Record<ProcessWeight, { icon: typeof Siren; borderClass: string }> = {
  5: { icon: Siren, borderClass: 'border-l-rose-700' },
  4: { icon: Flame, borderClass: 'border-l-red-600' },
  3: { icon: ArrowUp, borderClass: 'border-l-orange-500' },
  2: { icon: Minus, borderClass: 'border-l-sky-400' },
  1: { icon: ArrowDown, borderClass: 'border-l-slate-300' },
};

export function weightVisual(weight: number) {
  const normalized = normalizeProcessWeight(weight);
  return { ...PROCESS_WEIGHT_CONFIG[normalized], ...WEIGHT_VISUAL[normalized], weight: normalized };
}
