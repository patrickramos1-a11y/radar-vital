import { addDays, differenceInCalendarDays, startOfWeek, subWeeks } from 'date-fns';
import { compareProcesses, isProcessOpen, type Process } from '@/lib/processModel';

/**
 * Processos v2 (D-025): acompanhamento são os comentários feitos no processo
 * (`client_comments.task_id`). Eles aparecem no processo, nos Comentários do
 * cliente e na aba "Em acompanhamento" dos Entregáveis.
 */
export interface ProcessComment {
  id: string;
  clientId: string;
  taskId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export const FOLLOW_UP_WEEKS = 5;

/** Comentários de cada processo, do mais novo para o mais antigo. Comentário numa etapa conta para o processo. */
export function commentsByProcess(processes: Process[], comments: ProcessComment[]): Map<string, ProcessComment[]> {
  const rootByTask = new Map<string, string>();
  for (const process of processes) {
    rootByTask.set(process.id, process.id);
    for (const step of process.descendants) rootByTask.set(step.id, process.id);
  }
  const result = new Map<string, ProcessComment[]>();
  for (const comment of comments) {
    const rootId = rootByTask.get(comment.taskId);
    if (!rootId) continue;
    result.set(rootId, [...(result.get(rootId) ?? []), comment]);
  }
  for (const list of result.values()) list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return result;
}

export interface FollowUpItem {
  process: Process;
  /** Último comentário do período (na semana) ou o último de todos (sem acompanhamento). */
  lastComment: ProcessComment | null;
  /** Comentários do período; nas faixas, o total do processo. */
  count: number;
  /** Dias desde o último comentário; null quando nunca houve. */
  daysSince: number | null;
}

export interface FollowUpWeek {
  key: string;
  start: Date;
  end: Date;
  items: FollowUpItem[];
}

export function followUpWindowStart(now: Date, weeks = FOLLOW_UP_WEEKS): Date {
  return subWeeks(startOfWeek(now, { weekStartsOn: 1 }), weeks - 1);
}

/** As últimas semanas (a atual primeiro), com os processos comentados em cada uma. */
export function followUpWeeks(processes: Process[], byProcess: Map<string, ProcessComment[]>, now: Date, weeks = FOLLOW_UP_WEEKS): FollowUpWeek[] {
  const currentStart = startOfWeek(now, { weekStartsOn: 1 });
  return Array.from({ length: weeks }, (_, index) => {
    const start = subWeeks(currentStart, index);
    const end = addDays(start, 7);
    const items = processes.flatMap(process => {
      const inWeek = (byProcess.get(process.id) ?? []).filter(comment => {
        const at = new Date(comment.createdAt);
        return at >= start && at < end;
      });
      if (!inWeek.length) return [];
      return [{ process, lastComment: inWeek[0], count: inWeek.length, daysSince: differenceInCalendarDays(now, new Date(inWeek[0].createdAt)) }];
    }).sort((a, b) => b.lastComment!.createdAt.localeCompare(a.lastComment!.createdAt));
    return { key: start.toISOString().slice(0, 10), start, end: addDays(end, -1), items };
  });
}

export type StaleBucketKey = '30' | '60' | '90' | 'over90';

export const STALE_BUCKETS: { key: StaleBucketKey; label: string; hint: string }[] = [
  { key: '30', label: '30 dias', hint: 'Último comentário há até 30 dias' },
  { key: '60', label: '60 dias', hint: 'Último comentário há 31 a 60 dias' },
  { key: '90', label: '90 dias', hint: 'Último comentário há 61 a 90 dias' },
  { key: 'over90', label: 'Mais de 90 dias', hint: 'Último comentário há mais de 90 dias, ou nunca comentado' },
];

export function staleBucketFor(daysSince: number | null): StaleBucketKey {
  if (daysSince === null || daysSince > 90) return 'over90';
  if (daysSince > 60) return '90';
  if (daysSince > 30) return '60';
  return '30';
}

/**
 * Processos abertos sem comentário nas últimas semanas, agrupados pelo tempo
 * desde o último comentário. Nunca comentado entra em "Mais de 90 dias".
 * Em cada faixa, o maior peso e o mais esquecido vêm primeiro.
 */
export function staleProcesses(processes: Process[], byProcess: Map<string, ProcessComment[]>, now: Date, weeks = FOLLOW_UP_WEEKS): Record<StaleBucketKey, FollowUpItem[]> {
  const windowStart = followUpWindowStart(now, weeks);
  const buckets: Record<StaleBucketKey, FollowUpItem[]> = { '30': [], '60': [], '90': [], over90: [] };
  for (const process of processes) {
    if (!isProcessOpen(process)) continue;
    const comments = byProcess.get(process.id) ?? [];
    const last = comments[0] ?? null;
    if (last && new Date(last.createdAt) >= windowStart) continue;
    const daysSince = last ? differenceInCalendarDays(now, new Date(last.createdAt)) : null;
    buckets[staleBucketFor(daysSince)].push({ process, lastComment: last, count: comments.length, daysSince });
  }
  const forgottenFirst = (a: FollowUpItem, b: FollowUpItem) =>
    b.process.weight - a.process.weight
    || (b.daysSince ?? Number.MAX_SAFE_INTEGER) - (a.daysSince ?? Number.MAX_SAFE_INTEGER)
    || compareProcesses(a.process, b.process);
  for (const list of Object.values(buckets)) list.sort(forgottenFirst);
  return buckets;
}
