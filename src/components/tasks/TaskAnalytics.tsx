import { useMemo, useState } from "react";
import { Trophy, Clock, AlertTriangle, BarChart3, ChevronDown, ChevronUp, CalendarX } from "lucide-react";
import { assigneeMatches } from "@/lib/taskAssignee";
import { Task } from "@/types/task";
import { Client } from "@/types/client";
import { Collaborator } from "@/types/collaborator";

interface OverdueTask extends Task {
  daysOverdue: number;
}

interface TaskAnalyticsProps {
  tasks: Task[];
  clients: Client[];
  getDaysOpen: (task: Task) => number;
  collaborators?: Collaborator[];
  overdueTasks?: OverdueTask[];
}

export function TaskAnalytics({ tasks, clients, getDaysOpen, collaborators = [], overdueTasks = [] }: TaskAnalyticsProps) {
  const [showOverdue, setShowOverdue] = useState(false);

  const clientMap = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach(c => map.set(c.id, c.name));
    return map;
  }, [clients]);

  const rankings = useMemo(() => {
    const pending = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);

    const collabNames = collaborators.map(c => c.name);

    const pendingByCollab = collabNames.map(name => ({
      name,
      color: collaborators.find(c => c.name === name)?.color || '#6B7280',
      count: pending.filter(t => assigneeMatches(t.assigned_to, name)).length,
    })).sort((a, b) => b.count - a.count);

    const completedByCollab = collabNames.map(name => ({
      name,
      color: collaborators.find(c => c.name === name)?.color || '#6B7280',
      count: completed.filter(t => assigneeMatches(t.assigned_to, name)).length,
    })).sort((a, b) => b.count - a.count);

    const oldest = pending.length > 0
      ? pending.reduce((o, t) => new Date(t.created_at) < new Date(o.created_at) ? t : o)
      : null;

    const maxPending = Math.max(...pendingByCollab.map(c => c.count), 1);

    return { pendingByCollab, completedByCollab, oldest, maxPending };
  }, [tasks, collaborators]);

  const topPending = rankings.pendingByCollab[0];
  const topCompleted = rankings.completedByCollab[0];
  const oldest = rankings.oldest;
  const oldestDays = oldest ? getDaysOpen(oldest) : 0;
  const oldestCollab = oldest ? collaborators.find(c => assigneeMatches(oldest.assigned_to, c.name)) : null;

  return (
    <div className="space-y-0">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 px-4 py-3">
        {/* Card 1: Mais Pendências */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mais Pendências</span>
          </div>
          {topPending && topPending.count > 0 ? (
            <>
              <p className="text-lg font-bold capitalize truncate" style={{ color: topPending.color }}>{topPending.name}</p>
              <p className="text-2xl font-bold text-foreground">{topPending.count} <span className="text-sm font-normal text-muted-foreground">tarefas</span></p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma pendência</p>
          )}
        </div>

        {/* Card 2: Mais Concluídas */}
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-7 h-7 text-emerald-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mais Concluídas</span>
          </div>
          {topCompleted && topCompleted.count > 0 ? (
            <>
              <p className="text-lg font-bold capitalize truncate" style={{ color: topCompleted.color }}>{topCompleted.name}</p>
              <p className="text-2xl font-bold text-foreground">{topCompleted.count} <span className="text-sm font-normal text-muted-foreground">tarefas</span></p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma concluída</p>
          )}
        </div>

        {/* Card 3: Mais Antiga */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-7 h-7 text-red-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mais Antiga</span>
          </div>
          {oldest ? (
            <>
              <p className="text-lg font-bold capitalize truncate" style={{ color: oldestCollab?.color || undefined }}>
                {oldest.assigned_to.length > 0 ? oldest.assigned_to.join(', ') : "Sem resp."}
              </p>
              <p className="text-2xl font-bold text-foreground">{oldestDays} <span className="text-sm font-normal text-muted-foreground">dias</span></p>
              <p className="text-xs text-muted-foreground truncate">{clientMap.get(oldest.client_id) || ""}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>

        {/* Card 4: Atrasadas */}
        <div
          className="rounded-xl border border-red-600/30 bg-red-600/10 p-4 space-y-2 cursor-pointer hover:bg-red-600/15 transition-colors"
          onClick={() => overdueTasks.length > 0 && setShowOverdue(!showOverdue)}
        >
          <div className="flex items-center gap-2">
            <CalendarX className="w-7 h-7 text-red-600" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Atrasadas</span>
            {overdueTasks.length > 0 && (
              showOverdue ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-auto" /> : <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
            )}
          </div>
          <p className="text-2xl font-bold text-destructive">{overdueTasks.length}</p>
          {overdueTasks.length > 0 && (
            <p className="text-xs text-muted-foreground">Até {overdueTasks[0].daysOverdue} dias de atraso</p>
          )}
        </div>

        {/* Card 5: Distribuição */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Distribuição</span>
          </div>
          <div className="space-y-1.5">
            {rankings.pendingByCollab.filter(c => c.count > 0).map(collab => (
              <div key={collab.name} className="flex items-center gap-2">
                <span className="text-xs font-medium capitalize w-16 truncate" style={{ color: collab.color }}>{collab.name}</span>
                <div className="h-2 flex-1 rounded-full bg-muted/50 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(collab.count / rankings.maxPending) * 100}%`, backgroundColor: collab.color }} />
                </div>
                <span className="text-xs font-bold text-foreground w-6 text-right">{collab.count}</span>
              </div>
            ))}
            {rankings.pendingByCollab.every(c => c.count === 0) && (
              <p className="text-xs text-muted-foreground">Sem tarefas pendentes</p>
            )}
          </div>
        </div>
      </div>

      {/* Overdue tasks expanded list */}
      {showOverdue && overdueTasks.length > 0 && (
        <div className="mx-4 mb-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <h4 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
            <CalendarX className="w-4 h-4" />
            Tarefas Atrasadas ({overdueTasks.length})
          </h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {overdueTasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-card border text-sm">
                <span className="text-destructive font-bold text-xs whitespace-nowrap">
                  -{task.daysOverdue}d
                </span>
                <span className="flex-1 truncate">{task.title}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {clientMap.get(task.client_id) || ""}
                </span>
                {task.assigned_to.length > 0 && (
                  <div className="flex gap-0.5">
                    {task.assigned_to.map(name => {
                      const collab = collaborators.find(c => c.name.toLowerCase() === name.toLowerCase());
                      return collab ? (
                        <span
                          key={name}
                          className="w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                          style={{ backgroundColor: collab.color }}
                          title={name}
                        >
                          {name[0].toUpperCase()}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  📅 {new Date(task.due_date! + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
