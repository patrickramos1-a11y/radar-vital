import { useMemo } from 'react';
import { Task } from '@/types/task';
import { Priority } from '@/types/priority';
import { Deliverable } from '@/types/deliverable';
import { assigneeMatches } from '@/lib/taskAssignee';
import { useDeliverableRatings, summarizeRatings } from '@/hooks/useDeliverableRatings';
import { CollaboratorAvatar } from './CollaboratorAvatar';
import { Trophy, Star, Sparkles, ThumbsUp, Package, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RespOption { name: string; color: string; initials: string; }

interface Props {
  responsibleList: RespOption[];
  tasks: Task[];
  priorities: Priority[];
  deliverables: Deliverable[];
}

function computeRow(name: string, tasks: Task[], priorities: Priority[], deliverables: Deliverable[], ratings: any[]) {
  const myTasks = tasks.filter(t => assigneeMatches(t.assigned_to, name));
  const openTasks = myTasks.filter(t => !t.completed);
  const now = Date.now();
  const overdue = openTasks.filter(t => t.due_date && new Date(t.due_date).getTime() < now).length;

  const myPri = priorities.filter(p => assigneeMatches(p.assigned_to, name));
  const donePri = myPri.filter(p => p.status === 'concluida').length;

  const myDeliv = deliverables.filter(d => assigneeMatches(d.assigned_to, name));
  const doneDeliv = myDeliv.filter(d => d.status === 'concluido').length;

  let score = 0, stars = 0, supers = 0, thumbs = 0;
  myDeliv.forEach(d => {
    const rs = ratings.filter(r => r.deliverable_id === d.id);
    if (rs.length === 0) return;
    const s = summarizeRatings(rs);
    const n = Math.max(1, d.assigned_to.length);
    score += s.score / n; stars += s.stars / n; supers += s.superstars / n; thumbs += s.thumbs / n;
  });

  return {
    name,
    stars: Math.round(stars),
    supers: Math.round(supers),
    thumbs: Math.round(thumbs),
    score: Math.round(score * 10) / 10,
    doneDeliv,
    donePri,
    overdue,
    openTasks: openTasks.length,
    general: Math.round((score + doneDeliv * 2 + donePri * 3 - overdue) * 10) / 10,
  };
}

interface RankingProps {
  title: string;
  icon: any;
  color: string;
  rows: { name: string; value: number }[];
  reverse?: boolean;
}

function Ranking({ title, icon: Icon, color, rows, reverse }: RankingProps) {
  const sorted = [...rows].sort((a, b) => reverse ? a.value - b.value : b.value - a.value);
  const max = Math.max(...sorted.map(r => Math.abs(r.value)), 1);
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-3 py-2 flex items-center gap-2 border-b" style={{ background: `${color}0d` }}>
        <Icon className="w-4 h-4" style={{ color }} />
        <h4 className="text-sm font-semibold">{title}</h4>
      </div>
      <div className="divide-y">
        {sorted.map((r, i) => {
          const pct = max > 0 ? Math.max(0, (Math.abs(r.value) / max) * 100) : 0;
          return (
            <div key={r.name} className="px-3 py-2 flex items-center gap-2">
              <span className={cn('text-xs font-bold w-5 text-center',
                i === 0 ? 'text-amber-600' : i === 1 ? 'text-slate-600' : i === 2 ? 'text-orange-600' : 'text-muted-foreground')}>
                {i + 1}º
              </span>
              <CollaboratorAvatar name={r.name} size={24} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium truncate">{r.name}</span>
                  <span className="text-sm font-bold" style={{ color }}>{r.value}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && <div className="p-3 text-xs text-muted-foreground text-center">Sem dados.</div>}
      </div>
    </div>
  );
}

export function TeamOverview({ responsibleList, tasks, priorities, deliverables }: Props) {
  const { ratings } = useDeliverableRatings();

  const rows = useMemo(
    () => responsibleList.map(r => computeRow(r.name, tasks, priorities, deliverables, ratings)),
    [responsibleList, tasks, priorities, deliverables, ratings]
  );

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-gradient-to-r from-amber-50 via-white to-amber-50/40 p-3">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold">Ranking Geral</h3>
          <span className="text-[10px] text-muted-foreground">
            fórmula: pontos + entregáveis✓×2 + prioridades✓×3 − atrasadas
          </span>
        </div>
        <div className="grid gap-1">
          {[...rows].sort((a, b) => b.general - a.general).map((r, i) => (
            <div key={r.name} className={cn('flex items-center gap-2 px-2 py-1.5 rounded-lg',
              i === 0 && 'bg-amber-100', i === 1 && 'bg-slate-100/70', i === 2 && 'bg-orange-100/60')}>
              <span className="font-bold text-sm w-6 text-center">{i + 1}º</span>
              <CollaboratorAvatar name={r.name} size={28} />
              <span className="text-sm font-medium flex-1">{r.name}</span>
              <span className="text-sm font-bold text-amber-700 tabular-nums">{r.general}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <Ranking title="Pontuação oficial" icon={Trophy} color="#F59E0B" rows={rows.map(r => ({ name: r.name, value: r.score }))} />
        <Ranking title="Estrelas ⭐" icon={Star} color="#F59E0B" rows={rows.map(r => ({ name: r.name, value: r.stars }))} />
        <Ranking title="Super Estrelas ✨" icon={Sparkles} color="#EA580C" rows={rows.map(r => ({ name: r.name, value: r.supers }))} />
        <Ranking title="Joinhas 👍" icon={ThumbsUp} color="#10B981" rows={rows.map(r => ({ name: r.name, value: r.thumbs }))} />
        <Ranking title="Entregáveis concluídos" icon={Package} color="#10B981" rows={rows.map(r => ({ name: r.name, value: r.doneDeliv }))} />
        <Ranking title="Prioridades concluídas" icon={CheckCircle2} color="#10B981" rows={rows.map(r => ({ name: r.name, value: r.donePri }))} />
        <Ranking title="Menos atrasadas" icon={AlertTriangle} color="#DC2626" reverse rows={rows.map(r => ({ name: r.name, value: r.overdue }))} />
      </div>
    </div>
  );
}
