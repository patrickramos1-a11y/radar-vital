import { useMemo, useState } from 'react';
import { Task } from '@/types/task';
import { Priority } from '@/types/priority';
import { Deliverable } from '@/types/deliverable';
import { Client } from '@/types/client';
import { assigneeMatches } from '@/lib/taskAssignee';
import { useDeliverableRatings, summarizeRatings } from '@/hooks/useDeliverableRatings';
import { KpiCard } from './KpiCard';
import { CollaboratorAvatar } from './CollaboratorAvatar';
import { CheckSquare, CheckCircle2, Clock, Star, MessageSquare, TrendingUp, Package, ThumbsUp, Sparkles, Trophy, AlertTriangle, Users, Percent, ArrowUpDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface RespOption { name: string; color: string; initials: string; }

interface Props {
  collaborator: string;
  color: string;
  tasks: Task[];
  priorities: Priority[];
  deliverables?: Deliverable[];
  comments: any[];
  clients?: Client[];
  responsibleList?: RespOption[];
  getDaysOpen: (t: Task) => number;
}

type MetricKey =
  | 'score' | 'stars' | 'supers' | 'thumbs'
  | 'delivDone' | 'delivPending' | 'delivPct'
  | 'tasksDone' | 'tasksOpen' | 'tasksOverdue' | 'avgDays'
  | 'comments' | 'commentsRead'
  | 'clients' | 'priorities' | 'prioritiesDone';

const METRICS: { key: MetricKey; label: string; icon: any; higherIsBetter?: boolean }[] = [
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
];

function computeStats(name: string, tasks: Task[], priorities: Priority[], comments: any[], deliverables: Deliverable[], ratings: ReturnType<typeof useDeliverableRatings>['ratings']) {
  const myTasks = tasks.filter(t => assigneeMatches(t.assigned_to, name));
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

  const myPriorities = priorities.filter(p => assigneeMatches(p.assigned_to, name));
  const donePriorities = myPriorities.filter(p => p.status === 'concluida').length;

  const myDeliv = deliverables.filter(d => assigneeMatches(d.assigned_to, name));
  const delivDone = myDeliv.filter(d => d.status === 'concluido').length;
  const delivPending = myDeliv.filter(d => d.status !== 'concluido' && d.status !== 'cancelado').length;
  const delivPct = myDeliv.length > 0 ? Math.round((delivDone / myDeliv.length) * 100) : 0;

  // Ratings received by this collaborator through their deliverables (split by assignees)
  let score = 0, stars = 0, supers = 0, thumbs = 0;
  myDeliv.forEach(d => {
    const rs = ratings.filter(r => r.deliverable_id === d.id);
    if (rs.length === 0) return;
    const s = summarizeRatings(rs);
    const n = Math.max(1, d.assigned_to.length);
    score += s.score / n;
    stars += s.stars / n;
    supers += s.superstars / n;
    thumbs += s.thumbs / n;
  });

  const readField = `read_${name.toLowerCase()}`;
  const commentsRead = comments.filter(c => !!(c as any)[readField]).length;
  const commentsAuthored = comments.filter(c => (c.author_name || '').toLowerCase() === name.toLowerCase()).length;

  const clientIds = new Set<string>();
  myTasks.forEach(t => t.client_id && clientIds.add(t.client_id));
  myPriorities.forEach(p => p.client_id && clientIds.add(p.client_id));

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
    score: Math.round(score * 10) / 10,
    stars: Math.round(stars),
    supers: Math.round(supers),
    thumbs: Math.round(thumbs),
    commentsRead,
    commentsAuthored,
    clients: clientIds.size,
  };
}

export function PerformanceTab({ collaborator, color, tasks, priorities, deliverables = [], comments, responsibleList = [], getDaysOpen: _getDaysOpen }: Props) {
  const { ratings } = useDeliverableRatings();
  const [view, setView] = useState<'individual' | 'team'>('individual');
  const [metric, setMetric] = useState<MetricKey>('score');

  const stats = useMemo(
    () => computeStats(collaborator, tasks, priorities, comments, deliverables, ratings),
    [collaborator, tasks, priorities, comments, deliverables, ratings]
  );

  const teamRanking = useMemo(() => {
    return responsibleList.map(r => {
      const s = computeStats(r.name, tasks, priorities, comments, deliverables, ratings);
      const valueMap: Record<MetricKey, number> = {
        score: s.score, stars: s.stars, supers: s.supers, thumbs: s.thumbs,
        delivDone: s.delivDone, delivPending: s.delivPending, delivPct: s.delivPct,
        tasksDone: s.doneTasks, tasksOpen: s.openTasks, tasksOverdue: s.overdue, avgDays: s.avgDays,
        comments: s.commentsAuthored, commentsRead: s.commentsRead,
        clients: s.clients, priorities: s.myPriorities, prioritiesDone: s.donePriorities,
      };
      return { name: r.name, color: r.color, value: valueMap[metric], stats: s };
    });
  }, [responsibleList, tasks, priorities, comments, deliverables, ratings, metric]);

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
