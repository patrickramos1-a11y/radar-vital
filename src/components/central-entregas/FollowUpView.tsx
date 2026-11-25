import { useEffect, useMemo, useState } from 'react';
import { format, isSameWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, ChevronDown, ChevronRight, Hourglass, MessageSquarePlus } from 'lucide-react';
import type { Client } from '@/types/client';
import type { Task } from '@/types/task';
import { buildProcesses, processesForAssignee, type Process } from '@/lib/processModel';
import {
  STALE_BUCKETS, commentsByProcess, followUpWeeks, staleProcesses,
  type FollowUpItem, type ProcessComment, type StaleBucketKey,
} from '@/lib/processFollowUp';
import { formatCommentDate, weightVisual } from '@/lib/processDisplay';
import type { AddProcessComment } from '@/hooks/useProcessComments';
import { ProcessCommentDialog } from '@/components/processos/ProcessCommentDialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ClientCell } from './ClientCell';

interface RespOption { name: string; color: string; initials: string }

type Mode = 'weeks' | 'stale';

interface Props {
  collaborator: string;
  isTeamView: boolean;
  tasks: Task[];
  clients: Client[];
  responsibleList: RespOption[];
  comments: ProcessComment[];
  onComment: AddProcessComment;
  /** Para testes: a data de referência. */
  now?: Date;
}

function FollowUpRow({ item, client, responsibleList, showDays, onComment }: {
  item: FollowUpItem; client?: Client; responsibleList: RespOption[]; showDays: boolean; onComment: () => void;
}) {
  const { process, lastComment } = item;
  const weight = weightVisual(process.weight);
  const owner = responsibleList.find(person => process.assignees.includes(person.name));
  return <div className="flex min-w-0 flex-col gap-2 border-b px-3 py-2.5 last:border-b-0 hover:bg-muted/20 sm:flex-row sm:items-center">
    <div className="w-full shrink-0 sm:w-40"><ClientCell client={client} fallbackName={client ? undefined : 'Sem cliente'} size={26} /></div>
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn('text-sm font-medium', process.completed && 'text-muted-foreground line-through')}>{process.title}</span>
        <span className={cn('border px-1.5 py-0.5 text-[10px] font-semibold', weight.className)}>{weight.label}</span>
        <span className="border-l-2 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700" style={{ borderLeftColor: owner?.color || '#94a3b8', backgroundColor: '#f8fafc' }}>{process.assignees.join(', ') || 'Sem responsável'}</span>
      </div>
      {lastComment
        ? <p className="mt-1 line-clamp-2 text-[11px] text-slate-700"><span className="font-semibold">{lastComment.authorName}</span> · {formatCommentDate(lastComment.createdAt)}{showDays && item.daysSince !== null ? ` (há ${item.daysSince} ${item.daysSince === 1 ? 'dia' : 'dias'})` : ''}: {lastComment.text}</p>
        : <p className="mt-1 text-[11px] font-medium text-amber-700">Nunca comentado</p>}
    </div>
    <div className="flex shrink-0 items-center gap-2">
      {item.count > 0 && <span className="text-[10px] text-muted-foreground">{item.count} {item.count === 1 ? 'comentário' : 'comentários'}</span>}
      <Button type="button" size="sm" variant="outline" className="h-8" onClick={onComment} aria-label={`Comentar ${process.title}`}><MessageSquarePlus className="mr-1 h-3.5 w-3.5" />Comentar</Button>
    </div>
  </div>;
}

/**
 * Entregáveis › Em acompanhamento (D-025): o que foi comentado em cada uma
 * das últimas semanas e, à parte, os processos abertos sem comentário recente.
 */
export function FollowUpView({ collaborator, isTeamView, tasks, clients, responsibleList, comments, onComment, now: nowProp }: Props) {
  const [mode, setMode] = useState<Mode>('weeks');
  const defaultPerson = isTeamView ? 'all' : collaborator;
  const [person, setPerson] = useState(defaultPerson);
  useEffect(() => setPerson(defaultPerson), [defaultPerson]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [commenting, setCommenting] = useState<Process | null>(null);
  // Data de referência fixa enquanto a aba está aberta.
  const now = useMemo(() => nowProp ?? new Date(), [nowProp]);

  const clientById = useMemo(() => new Map(clients.map(client => [client.id, client])), [clients]);
  const allProcesses = useMemo(() => buildProcesses(tasks), [tasks]);
  const byProcess = useMemo(() => commentsByProcess(allProcesses, comments), [allProcesses, comments]);
  const processes = useMemo(
    () => person === 'all' ? allProcesses : processesForAssignee(allProcesses, person),
    [allProcesses, person],
  );
  const weeks = useMemo(() => followUpWeeks(processes, byProcess, now), [processes, byProcess, now]);
  const stale = useMemo(() => staleProcesses(processes, byProcess, now), [processes, byProcess, now]);
  const weeksCount = new Set(weeks.flatMap(week => week.items.map(item => item.process.id))).size;
  const staleCount = STALE_BUCKETS.reduce((total, bucket) => total + stale[bucket.key].length, 0);

  const isOpen = (key: string, fallback: boolean) => expanded[key] ?? fallback;
  const toggle = (key: string, fallback: boolean) => setExpanded(current => ({ ...current, [key]: !(current[key] ?? fallback) }));
  const weekTitle = (start: Date, end: Date) => {
    const prefix = isSameWeek(start, now, { weekStartsOn: 1 }) ? 'Semana atual' : `Semana de ${format(start, "dd 'de' MMMM", { locale: ptBR })}`;
    return `${prefix} · ${format(start, 'dd/MM')} a ${format(end, 'dd/MM')}`;
  };
  const row = (item: FollowUpItem, showDays: boolean) => <FollowUpRow
    key={item.process.id}
    item={item}
    client={clientById.get(item.process.clientId)}
    responsibleList={responsibleList}
    showDays={showDays}
    onComment={() => setCommenting(item.process)}
  />;

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="inline-flex border bg-white" role="group" aria-label="Acompanhamento">
        <button type="button" aria-pressed={mode === 'weeks'} onClick={() => setMode('weeks')} className={cn('inline-flex h-8 items-center gap-1.5 px-3 text-xs font-medium', mode === 'weeks' ? 'bg-slate-900 text-white' : 'text-slate-600')}><CalendarDays className="h-3.5 w-3.5" />Semanas <span className="tabular-nums">{weeksCount}</span></button>
        <button type="button" aria-pressed={mode === 'stale'} onClick={() => setMode('stale')} className={cn('inline-flex h-8 items-center gap-1.5 border-l px-3 text-xs font-medium', mode === 'stale' ? 'bg-slate-900 text-white' : 'text-slate-600')}><Hourglass className="h-3.5 w-3.5" />Sem acompanhamento <span className="tabular-nums">{staleCount}</span></button>
      </div>
      <select aria-label="Filtrar acompanhamento por responsável" value={person} onChange={event => setPerson(event.target.value)} className="h-8 max-w-full border bg-background px-2 text-xs">
        <option value="all">Todos os responsáveis</option>
        {responsibleList.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
      </select>
    </div>

    {mode === 'weeks' && <div className="overflow-hidden border bg-card">
      {weeks.map((week, index) => {
        const open = isOpen(week.key, index === 0 || week.items.length > 0 && index < 2);
        return <section key={week.key}>
          <button type="button" onClick={() => toggle(week.key, index === 0 || week.items.length > 0 && index < 2)} aria-expanded={open} className="flex w-full items-center justify-between border-b bg-sky-50/70 px-3 py-2 text-left hover:bg-sky-50">
            <span className="flex items-center gap-2 text-sm font-semibold text-sky-900">{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}<CalendarDays className="h-4 w-4" />{weekTitle(week.start, week.end)}</span>
            <span className="text-xs font-medium text-sky-700">{week.items.length} {week.items.length === 1 ? 'processo' : 'processos'}</span>
          </button>
          {open && (week.items.length
            ? week.items.map(item => row(item, false))
            : <p className="border-b px-3 py-3 text-xs text-muted-foreground">Nenhum processo comentado nesta semana.</p>)}
        </section>;
      })}
    </div>}

    {mode === 'stale' && <div className="overflow-hidden border bg-card">
      {STALE_BUCKETS.map(bucket => {
        const items = stale[bucket.key as StaleBucketKey];
        const fallback = bucket.key !== 'over90' && items.length > 0;
        const open = isOpen(`stale-${bucket.key}`, fallback);
        return <section key={bucket.key}>
          <button type="button" onClick={() => toggle(`stale-${bucket.key}`, fallback)} aria-expanded={open} className="flex w-full items-center justify-between border-b bg-amber-50/70 px-3 py-2 text-left hover:bg-amber-50">
            <span className="flex items-center gap-2 text-sm font-semibold text-amber-900">{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}<Hourglass className="h-4 w-4" />{bucket.label}<span className="hidden text-[11px] font-normal text-amber-800 sm:inline">· {bucket.hint}</span></span>
            <span className="text-xs font-medium text-amber-800">{items.length} {items.length === 1 ? 'processo' : 'processos'}</span>
          </button>
          {open && (items.length
            ? items.map(item => row(item, true))
            : <p className="border-b px-3 py-3 text-xs text-muted-foreground">Nenhum processo nesta faixa.</p>)}
        </section>;
      })}
    </div>}

    <ProcessCommentDialog
      open={Boolean(commenting)}
      onOpenChange={open => { if (!open) setCommenting(null); }}
      processTitle={commenting?.title ?? ''}
      clientName={commenting ? clientById.get(commenting.clientId)?.name : undefined}
      comments={commenting ? byProcess.get(commenting.id) ?? [] : []}
      onSubmit={text => commenting
        ? onComment({ taskId: commenting.id, clientId: commenting.clientId, clientName: clientById.get(commenting.clientId)?.name }, text)
        : Promise.resolve(false)}
    />
  </div>;
}
