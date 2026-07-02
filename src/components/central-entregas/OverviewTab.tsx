import { useMemo } from 'react';
import { Users, CheckSquare, CheckCircle2, Star, MessageSquare, Clock, AlertTriangle, Package } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { Task } from '@/types/task';
import { Priority } from '@/types/priority';
import { Deliverable } from '@/types/deliverable';
import { Client } from '@/types/client';
import { assigneeMatches } from '@/lib/taskAssignee';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  collaborator: string;
  color: string;
  tasks: Task[];
  priorities: Priority[];
  deliverables: Deliverable[];
  clients: Client[];
  comments: any[];
  getDaysOpen: (t: Task) => number;
}

export function OverviewTab({ collaborator, color, tasks, priorities, deliverables, clients, comments, getDaysOpen }: Props) {
  const stats = useMemo(() => {
    const myTasks = tasks.filter(t => assigneeMatches(t.assigned_to, collaborator));
    const openTasks = myTasks.filter(t => !t.completed);
    const doneTasks = myTasks.filter(t => t.completed);

    const myPriorities = priorities.filter(p => assigneeMatches(p.assigned_to, collaborator));
    const openPriorities = myPriorities.filter(p => p.status === 'aberta' || p.status === 'em_andamento');

    const readField = `read_${collaborator.toLowerCase()}`;
    const pendingComments = comments.filter(c => !c.is_archived && !(c as any)[readField]);

    // Clients linked = distinct clients in tasks + priorities where user is assigned
    const clientIds = new Set<string>();
    myTasks.forEach(t => t.client_id && clientIds.add(t.client_id));
    myPriorities.forEach(p => p.client_id && clientIds.add(p.client_id));

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const overdueTasks = openTasks.filter(t => t.due_date && new Date(t.due_date) < today);
    const overduePriorities = openPriorities.filter(p => p.due_date && new Date(p.due_date) < today);

    const avgDays = openTasks.length > 0
      ? Math.round(openTasks.reduce((s, t) => s + getDaysOpen(t), 0) / openTasks.length)
      : 0;

    const myDeliverables = deliverables.filter(d => assigneeMatches(d.assigned_to, collaborator));
    const openDeliverables = myDeliverables.filter(d => d.status !== 'concluido' && d.status !== 'cancelado');

    return {
      clientsLinked: clientIds.size,
      openTasks: openTasks.length,
      doneTasks: doneTasks.length,
      openPriorities: openPriorities.length,
      pendingComments: pendingComments.length,
      avgDays,
      overdue: overdueTasks.length + overduePriorities.length,
      openDeliverables: openDeliverables.length,
    };
  }, [tasks, priorities, deliverables, comments, collaborator, getDaysOpen]);

  const criticalItems = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const items: Array<{ type: 'task' | 'priority'; id: string; title: string; days: number; client?: string }> = [];
    tasks.forEach(t => {
      if (!assigneeMatches(t.assigned_to, collaborator) || t.completed) return;
      const days = getDaysOpen(t);
      const client = clients.find(c => c.id === t.client_id)?.name;
      items.push({ type: 'task', id: t.id, title: t.title, days, client });
    });
    priorities.forEach(p => {
      if (!assigneeMatches(p.assigned_to, collaborator) || p.status === 'concluida' || p.status === 'cancelada') return;
      const days = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const client = clients.find(c => c.id === p.client_id)?.name;
      items.push({ type: 'priority', id: p.id, title: p.title, days, client });
    });
    return items.sort((a, b) => b.days - a.days).slice(0, 5);
  }, [tasks, priorities, clients, collaborator, getDaysOpen]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Clientes vinculados" value={stats.clientsLinked} icon={Users} color={color} />
        <KpiCard label="Tarefas abertas" value={stats.openTasks} icon={CheckSquare} color={color} />
        <KpiCard label="Tarefas concluídas" value={stats.doneTasks} icon={CheckCircle2} variant="success" />
        <KpiCard label="Prioridades abertas" value={stats.openPriorities} icon={Star} color={color} />
        <KpiCard label="Comentários pendentes" value={stats.pendingComments} icon={MessageSquare} variant={stats.pendingComments > 0 ? 'warning' : 'default'} />
        <KpiCard label="Tempo médio (dias)" value={`${stats.avgDays}d`} icon={Clock} />
        <KpiCard label="Itens atrasados" value={stats.overdue} icon={AlertTriangle} variant={stats.overdue > 0 ? 'danger' : 'default'} />
        <KpiCard label="Entregáveis abertos" value={stats.openDeliverables} icon={Package} color={color} />
      </div>

      <div className="rounded-xl border bg-card/60 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-sm">Top 5 itens mais antigos em aberto</h3>
        </div>
        {criticalItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum item em aberto 🎉</p>
        ) : (
          <div className="space-y-2">
            {criticalItems.map(item => (
              <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 p-2 rounded-lg bg-background/50 border">
                <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${item.type === 'priority' ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700'}`}>
                  {item.type === 'priority' ? 'Prioridade' : 'Tarefa'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  {item.client && <p className="text-xs text-muted-foreground truncate">{item.client}</p>}
                </div>
                <div className={`text-sm font-bold ${item.days > 30 ? 'text-red-600' : item.days > 14 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                  {item.days}d
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
