import { useMemo } from 'react';
import { Task } from '@/types/task';
import { Priority } from '@/types/priority';
import { assigneeMatches } from '@/lib/taskAssignee';
import { KpiCard } from './KpiCard';
import { CheckSquare, CheckCircle2, Clock, Star, MessageSquare, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  collaborator: string;
  color: string;
  tasks: Task[];
  priorities: Priority[];
  comments: any[];
  getDaysOpen: (t: Task) => number;
}

export function PerformanceTab({ collaborator, color, tasks, priorities, comments, getDaysOpen }: Props) {
  const readField = `read_${collaborator.toLowerCase()}`;

  const stats = useMemo(() => {
    const myTasks = tasks.filter(t => assigneeMatches(t.assigned_to, collaborator));
    const doneTasks = myTasks.filter(t => t.completed);
    const openTasks = myTasks.filter(t => !t.completed);
    const myPriorities = priorities.filter(p => assigneeMatches(p.assigned_to, collaborator));
    const donePriorities = myPriorities.filter(p => p.status === 'concluida');
    const avgDays = doneTasks.length > 0
      ? Math.round(doneTasks.reduce((s, t) => {
          const start = new Date(t.created_at).getTime();
          const end = t.completed_at ? new Date(t.completed_at).getTime() : Date.now();
          return s + (end - start) / (1000 * 60 * 60 * 24);
        }, 0) / doneTasks.length)
      : 0;
    const readComments = comments.filter(c => !!(c as any)[readField]).length;
    return {
      doneTasks: doneTasks.length,
      openTasks: openTasks.length,
      donePriorities: donePriorities.length,
      avgDays,
      readComments,
    };
  }, [tasks, priorities, comments, collaborator, readField]);

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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Tarefas concluídas" value={stats.doneTasks} icon={CheckCircle2} variant="success" />
        <KpiCard label="Tarefas pendentes" value={stats.openTasks} icon={CheckSquare} color={color} />
        <KpiCard label="Prioridades concluídas" value={stats.donePriorities} icon={Star} variant="success" />
        <KpiCard label="Tempo médio (dias)" value={`${stats.avgDays}d`} icon={Clock} />
        <KpiCard label="Comentários lidos" value={stats.readComments} icon={MessageSquare} color={color} />
      </div>

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
    </div>
  );
}
