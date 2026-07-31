import { useMemo, useState } from 'react';
import { Task } from '@/types/task';
import { Priority } from '@/types/priority';
import { Deliverable } from '@/types/deliverable';
import { Client } from '@/types/client';
import { assigneeMatches } from '@/lib/taskAssignee';
import { useDeliverableRatings, summarizeRatings } from '@/hooks/useDeliverableRatings';
import { useAudits } from '@/hooks/useAudits';
import { useChallenges } from '@/hooks/useChallenges';
import { useCollaborators } from '@/hooks/useCollaborators';
import { useTreasury } from '@/hooks/useTreasury';
import { getEffectiveChallengeStatus } from '@/lib/challenge';
import type { AuditClientItem } from '@/types/audit';
import type { Challenge, ChallengeParticipant } from '@/types/challenge';
import type { Collaborator } from '@/types/collaborator';
import type { StarTransaction } from '@/types/treasury';
import { KpiCard } from './KpiCard';
import { CollaboratorAvatar } from './CollaboratorAvatar';
import { CheckSquare, CheckCircle2, Clock, Star, MessageSquare, TrendingUp, Package, ThumbsUp, Sparkles, Trophy, AlertTriangle, Users, Percent, ArrowUpDown, type LucideIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface RespOption { name: string; color: string; initials: string; }
interface ClientCommentRow {
  author_name?: string | null;
  [field: string]: unknown;
}

interface Props {
  collaborator: string;
  color: string;
  tasks: Task[];
  priorities: Priority[];
  deliverables?: Deliverable[];
  comments: ClientCommentRow[];
  clients?: Client[];
  responsibleList?: RespOption[];
  getDaysOpen: (t: Task) => number;
}

type MetricKey =
  | 'score' | 'stars' | 'supers' | 'thumbs'
  | 'delivDone' | 'delivPending' | 'delivPct'
  | 'tasksDone' | 'tasksOpen' | 'tasksOverdue' | 'avgDays'
  | 'comments' | 'commentsRead'
  | 'clients' | 'priorities' | 'prioritiesDone'
  | 'auditsAssigned' | 'auditsDone' | 'challengesActive' | 'challengesWon';

type PerformancePeriod = 'all' | 'month' | 'year';

interface PerformanceSources {
  collaborators: Collaborator[];
  auditItems: AuditClientItem[];
  challenges: Challenge[];
  challengeParticipants: ChallengeParticipant[];
  starTransactions: StarTransaction[];
  scopedClientIds: Set<string>;
  period: PerformancePeriod;
}

const METRICS: { key: MetricKey; label: string; icon: LucideIcon; higherIsBetter?: boolean }[] = [
  { key: 'score', label: 'Pontuação oficial', icon: Trophy },
  { key: 'stars', label: 'Estrelas', icon: Star },
  { key: 'supers', label: 'Super estrelas', icon: Sparkles },
  { key: 'thumbs', label: 'Joinhas', icon: ThumbsUp },
  { key: 'delivDone', label: 'Entregáveis concluídos', icon: Package },
  { key: 'delivPending', label: 'Entregáveis pendentes', icon: Clock },
  { key: 'delivPct', label: '% de conclusão (entregáveis)', icon: Percent },
  { key: 'tasksDone', label: 'Tarefas concluídas', icon: CheckCircle2 },
  { key: 'tasksOpen', label: 'Tarefas em aberto', icon: CheckSquare },
  { key: 'tasksOverdue', label: 'Tarefas atrasadas', icon: AlertTriangle },
  { key: 'avgDays', label: 'Menor tempo médio (dias)', icon: Clock, higherIsBetter: false },
  { key: 'comments', label: 'Comentários realizados', icon: MessageSquare },
  { key: 'commentsRead', label: 'Comentários lidos', icon: MessageSquare },
  { key: 'clients', label: 'Clientes vinculados', icon: Users },
  { key: 'priorities', label: 'Prioridades sob responsabilidade', icon: Star },
  { key: 'prioritiesDone', label: 'Prioridades concluídas', icon: CheckCircle2 },
  { key: 'auditsAssigned', label: 'Auditorias atribuídas', icon: CheckSquare },
  { key: 'auditsDone', label: 'Auditorias concluídas', icon: CheckCircle2 },
  { key: 'challengesActive', label: 'Desafios em andamento', icon: Sparkles },
  { key: 'challengesWon', label: 'Desafios cumpridos', icon: Trophy },
];

function isInPeriod(value: string | null | undefined, period: PerformancePeriod) {
  if (!value || period === 'all') return true;
  const date = new Date(value);
  const now = new Date();
  if (period === 'month') {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  return date.getFullYear() === now.getFullYear();
}

function computeStats(name: string, tasks: Task[], priorities: Priority[], comments: ClientCommentRow[], deliverables: Deliverable[], ratings: ReturnType<typeof useDeliverableRatings>['ratings'], sources: PerformanceSources) {
  const isCurrent = (value: string | null | undefined) => isInPeriod(value, sources.period);
  const myTasks = tasks.filter(t => assigneeMatches(t.assigned_to, name) && isCurrent(t.created_at));
  const doneTasks = myTasks.filter(t => t.completed);
  const openTasks = myTasks.filter(t => !t.completed);
  const now = Date.now();
  const overdue = openTasks.filter(t => t.due_date && new Date(t.due_date).getTime() < now).length;

  const avgDays = doneTasks.length > 0
    ? Math.round(doneTasks.reduce((s, t) => {
        const start = new Date(t.created_at).getTime();
        const end = t.completed_at ? new Date(t.completed_at).getTime() : now;
        return s + (end - start) / (1000 * 60 * 60 * 24);
      }, 0) / doneTasks.length)
    : 0;

  const myPriorities = priorities.filter(p => assigneeMatches(p.assigned_to, name) && isCurrent(p.created_at));
  const donePriorities = myPriorities.filter(p => p.status === 'concluida').length;

  const myDeliv = deliverables.filter(d => assigneeMatches(d.assigned_to, name) && isCurrent(d.created_at));
  const delivDone = myDeliv.filter(d => d.status === 'concluido').length;
  const delivPending = myDeliv.filter(d => d.status !== 'concluido' && d.status !== 'cancelado').length;
  const delivPct = myDeliv.length > 0 ? Math.round((delivDone / myDeliv.length) * 100) : 0;

  // Deliverable recognition is integral for every responsible collaborator.
  let stars = 0, supers = 0, thumbs = 0;
  myDeliv.forEach(d => {
    const rs = ratings.filter(r => r.deliverable_id === d.id && isCurrent(r.created_at));
    if (rs.length === 0) return;
    const s = summarizeRatings(rs);
    stars += s.stars;
    supers += s.superstars;
    thumbs += s.thumbs;
  });

  const readField = `read_${name.toLowerCase()}`;
  const commentsInPeriod = comments.filter(comment => isCurrent(String(comment.created_at ?? '')));
  const commentsRead = commentsInPeriod.filter(c => c[readField] === true).length;
  const commentsAuthored = commentsInPeriod.filter(c => (c.author_name || '').toLowerCase() === name.toLowerCase()).length;

  const clientIds = new Set<string>();
  myTasks.forEach(t => t.client_id && clientIds.add(t.client_id));
  myPriorities.forEach(p => p.client_id && clientIds.add(p.client_id));
  myDeliv.forEach(deliverable => {
    deliverable.items.forEach(item => {
      const task = tasks.find(candidate => candidate.id === item.item_id);
      if (task?.client_id) clientIds.add(task.client_id);
      const priority = priorities.find(candidate => candidate.id === item.item_id);
      if (priority?.client_id) clientIds.add(priority.client_id);
    });
  });

  const collaboratorId = sources.collaborators.find(
    collaborator => collaborator.name.toLowerCase() === name.toLowerCase(),
  )?.id;
  const myAuditItems = sources.auditItems.filter(
    item =>
      item.assigneeId === collaboratorId &&
      sources.scopedClientIds.has(item.clientId) &&
      isCurrent(item.createdAt),
  );
  myAuditItems.forEach(item => clientIds.add(item.clientId));

  const challengeIds = new Set(
    sources.challengeParticipants
      .filter(participant => participant.collaboratorId === collaboratorId)
      .map(participant => participant.challengeId),
  );
  const myChallenges = sources.challenges.filter(
    challenge =>
      challengeIds.has(challenge.id) &&
      (!challenge.clientId || sources.scopedClientIds.has(challenge.clientId)) &&
      isCurrent(challenge.createdAt),
  );
  myChallenges.forEach(challenge => challenge.clientId && clientIds.add(challenge.clientId));
  const activeChallenges = myChallenges.filter(
    challenge => ['active', 'awaiting_validation'].includes(getEffectiveChallengeStatus(challenge)),
  ).length;
  const wonChallenges = myChallenges.filter(
    challenge => getEffectiveChallengeStatus(challenge) === 'won',
  ).length;

  const score = sources.starTransactions
    .filter(transaction => transaction.collaboratorId === collaboratorId && isCurrent(transaction.createdAt))
    .reduce((total, transaction) => total + transaction.amount, 0);

  return {
    doneTasks: doneTasks.length,
    openTasks: openTasks.length,
    overdue,
    avgDays,
    myPriorities: myPriorities.length,
    donePriorities,
    myDeliv: myDeliv.length,
    delivDone,
    delivPending,
    delivPct,
    score,
    stars: Math.round(stars),
    supers: Math.round(supers),
    thumbs: Math.round(thumbs),
    commentsRead,
    commentsAuthored,
    clients: clientIds.size,
    auditsAssigned: myAuditItems.length,
    auditsDone: myAuditItems.filter(item => ['completed', 'validated'].includes(item.status)).length,
    challengesActive: activeChallenges,
    challengesWon: wonChallenges,
  };
}

export function PerformanceTab({ collaborator, color, tasks, priorities, deliverables = [], comments, clients = [], responsibleList = [], getDaysOpen: _getDaysOpen }: Props) {
  const { ratings } = useDeliverableRatings();
  const { collaborators } = useCollaborators();
  const audits = useAudits();
  const challenges = useChallenges();
  const treasury = useTreasury();
  const [view, setView] = useState<'individual' | 'team'>('individual');
  const [metric, setMetric] = useState<MetricKey>('score');
  const [period, setPeriod] = useState<PerformancePeriod>('all');
  const scopedClientIds = useMemo(
    () => new Set(clients.map(client => client.id)),
    [clients],
  );
  const sources = useMemo<PerformanceSources>(
    () => ({
      collaborators,
      auditItems: audits.items,
      challenges: challenges.challenges,
      challengeParticipants: challenges.participants,
      starTransactions: treasury.transactions,
      scopedClientIds,
      period,
    }),
    [
      audits.items,
      challenges.challenges,
      challenges.participants,
      collaborators,
      period,
      scopedClientIds,
      treasury.transactions,
    ],
  );

  const stats = useMemo(
    () => computeStats(collaborator, tasks, priorities, comments, deliverables, ratings, sources),
    [collaborator, tasks, priorities, comments, deliverables, ratings, sources]
  );

  const teamRanking = useMemo(() => {
    return responsibleList.map(r => {
      const s = computeStats(r.name, tasks, priorities, comments, deliverables, ratings, sources);
      const valueMap: Record<MetricKey, number> = {
        score: s.score, stars: s.stars, supers: s.supers, thumbs: s.thumbs,
        delivDone: s.delivDone, delivPending: s.delivPending, delivPct: s.delivPct,
        tasksDone: s.doneTasks, tasksOpen: s.openTasks, tasksOverdue: s.overdue, avgDays: s.avgDays,
        comments: s.commentsAuthored, commentsRead: s.commentsRead,
        clients: s.clients, priorities: s.myPriorities, prioritiesDone: s.donePriorities,
        auditsAssigned: s.auditsAssigned, auditsDone: s.auditsDone,
        challengesActive: s.challengesActive, challengesWon: s.challengesWon,
      };
      return { name: r.name, color: r.color, value: valueMap[metric], stats: s };
    });
  }, [responsibleList, tasks, priorities, comments, deliverables, ratings, metric, sources]);

  const metricCfg = METRICS.find(m => m.key === metric)!;
  const sortedTeam = useMemo(() => {
    const list = [...teamRanking];
    const higher = metricCfg.higherIsBetter !== false;
    list.sort((a, b) => higher ? b.value - a.value : a.value - b.value);
    return list;
  }, [teamRanking, metricCfg]);

  const chartData = useMemo(() => {
    const now = new Date();
    const months: { month: string; concluidas: number; criadas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d).getTime();
      const end = endOfMonth(d).getTime();
      const myTasks = tasks.filter(t => assigneeMatches(t.assigned_to, collaborator));
      const concluidas = myTasks.filter(t => t.completed_at && new Date(t.completed_at).getTime() >= start && new Date(t.completed_at).getTime() <= end).length;
      const criadas = myTasks.filter(t => new Date(t.created_at).getTime() >= start && new Date(t.created_at).getTime() <= end).length;
      months.push({ month: format(d, 'MMM', { locale: ptBR }), concluidas, criadas });
    }
    return months;
  }, [tasks, collaborator]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-xl border bg-card/60 p-1 w-fit">
          <button
            onClick={() => setView('individual')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition',
              view === 'individual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
            Visão Individual
          </button>
          <button
            onClick={() => setView('team')}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition',
              view === 'team' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}>
            Performance da Equipe
          </button>
        </div>
        <div className="inline-flex border bg-card p-0.5 text-xs">
          {([
            ['all', 'Todo período'],
            ['month', 'Este mês'],
            ['year', 'Este ano'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={cn(
                'px-2.5 py-1.5 transition-colors',
                period === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === 'individual' ? (
        <>
          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" /> Reconhecimento
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <KpiCard label="Pontuação oficial" value={stats.score} icon={Trophy} variant="success" />
              <KpiCard label="Estrelas" value={stats.stars} icon={Star} />
              <KpiCard label="Super estrelas" value={stats.supers} icon={Sparkles} />
              <KpiCard label="Joinhas" value={stats.thumbs} icon={ThumbsUp} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" style={{ color }} /> Entregáveis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <KpiCard label="Total" value={stats.myDeliv} icon={Package} color={color} />
              <KpiCard label="Concluídos" value={stats.delivDone} icon={CheckCircle2} variant="success" />
              <KpiCard label="Pendentes" value={stats.delivPending} icon={Clock} />
              <KpiCard label="% Conclusão" value={`${stats.delivPct}%`} icon={Percent} color={color} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" style={{ color }} /> Tarefas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <KpiCard label="Concluídas" value={stats.doneTasks} icon={CheckCircle2} variant="success" />
              <KpiCard label="Em aberto" value={stats.openTasks} icon={CheckSquare} color={color} />
              <KpiCard label="Atrasadas" value={stats.overdue} icon={AlertTriangle} variant="danger" />
              <KpiCard label="Tempo médio" value={`${stats.avgDays}d`} icon={Clock} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-red-500" /> Prioridades & Clientes
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <KpiCard label="Prioridades" value={stats.myPriorities} icon={Star} />
              <KpiCard label="Prioridades concluídas" value={stats.donePriorities} icon={CheckCircle2} variant="success" />
              <KpiCard label="Clientes vinculados" value={stats.clients} icon={Users} color={color} />
              <KpiCard label="Comentários lidos" value={stats.commentsRead} icon={MessageSquare} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color }} /> Auditorias & Desafios
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <KpiCard label="Auditorias atribuídas" value={stats.auditsAssigned} icon={CheckSquare} color={color} />
              <KpiCard label="Auditorias concluídas" value={stats.auditsDone} icon={CheckCircle2} variant="success" />
              <KpiCard label="Desafios em andamento" value={stats.challengesActive} icon={Sparkles} color={color} />
              <KpiCard label="Desafios cumpridos" value={stats.challengesWon} icon={Trophy} variant="success" />
            </div>
          </section>

          <div className="rounded-xl border bg-card/60 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4" style={{ color }} />
              <h3 className="font-semibold text-sm">Evolução mensal (últimos 6 meses)</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="criadas" stroke="#94a3b8" strokeWidth={2} name="Criadas" />
                  <Line type="monotone" dataKey="concluidas" stroke={color} strokeWidth={2} name="Concluídas" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <section>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Ordenar por:</span>
            <select
              value={metric}
              onChange={e => setMetric(e.target.value as MetricKey)}
              className="px-2 py-1 border rounded-md text-sm bg-background"
            >
              {METRICS.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border bg-card divide-y">
            {sortedTeam.map((row, idx) => {
              const max = Math.max(...sortedTeam.map(r => r.value), 1);
              const pct = max > 0 ? (row.value / max) * 100 : 0;
              const Icon = metricCfg.icon;
              return (
                <div key={row.name} className="p-3 flex items-center gap-3">
                  <span className={cn('font-bold text-sm w-6 text-center',
                    idx === 0 ? 'text-amber-600' : idx === 1 ? 'text-slate-600' : idx === 2 ? 'text-orange-600' : 'text-muted-foreground')}>
                    {idx + 1}º
                  </span>
                  <CollaboratorAvatar name={row.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{row.name}</span>
                      <span className="flex items-center gap-1 text-sm font-bold" style={{ color: row.color }}>
                        <Icon className="w-3.5 h-3.5" />
                        {row.value}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: row.color }} />
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground mt-1 flex-wrap">
                      <span>{row.stats.score} pts</span>
                      <span>{row.stats.stars}⭐</span>
                      <span>{row.stats.supers}🌟</span>
                      <span>{row.stats.thumbs}👍</span>
                      <span>{row.stats.doneTasks} tarefas ✓</span>
                      <span>{row.stats.delivDone} entregáveis ✓</span>
                      <span>{row.stats.overdue} atrasadas</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {sortedTeam.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">Nenhum colaborador disponível.</div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
