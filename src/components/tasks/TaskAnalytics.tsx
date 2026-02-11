import { useMemo } from "react";
import { Trophy, Clock, AlertTriangle, BarChart3 } from "lucide-react";
import { Task } from "@/types/task";
import { Client, COLLABORATOR_NAMES, COLLABORATOR_COLORS, CollaboratorName } from "@/types/client";

interface TaskAnalyticsProps {
  tasks: Task[];
  clients: Client[];
  getDaysOpen: (task: Task) => number;
}

export function TaskAnalytics({ tasks, clients, getDaysOpen }: TaskAnalyticsProps) {
  const clientMap = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach(c => map.set(c.id, c.name));
    return map;
  }, [clients]);

  const rankings = useMemo(() => {
    const pending = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);

    const pendingByCollab = COLLABORATOR_NAMES.map(name => ({
      name,
      count: pending.filter(t => t.assigned_to === name).length,
    })).sort((a, b) => b.count - a.count);

    const completedByCollab = COLLABORATOR_NAMES.map(name => ({
      name,
      count: completed.filter(t => t.assigned_to === name).length,
    })).sort((a, b) => b.count - a.count);

    const oldest = pending.length > 0
      ? pending.reduce((o, t) => new Date(t.created_at) < new Date(o.created_at) ? t : o)
      : null;

    const maxPending = Math.max(...pendingByCollab.map(c => c.count), 1);

    return { pendingByCollab, completedByCollab, oldest, maxPending };
  }, [tasks]);

  const topPending = rankings.pendingByCollab[0];
  const topCompleted = rankings.completedByCollab[0];
  const oldest = rankings.oldest;
  const oldestDays = oldest ? getDaysOpen(oldest) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 py-3">
      {/* Card 1: Mais Pendências */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mais Pendências</span>
        </div>
        {topPending && topPending.count > 0 ? (
          <>
            <p
              className="text-lg font-bold capitalize truncate"
              style={{ color: COLLABORATOR_COLORS[topPending.name as CollaboratorName] || undefined }}
            >
              {topPending.name}
            </p>
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
            <p
              className="text-lg font-bold capitalize truncate"
              style={{ color: COLLABORATOR_COLORS[topCompleted.name as CollaboratorName] || undefined }}
            >
              {topCompleted.name}
            </p>
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
            <p
              className="text-lg font-bold capitalize truncate"
              style={{ color: COLLABORATOR_COLORS[oldest.assigned_to as CollaboratorName] || undefined }}
            >
              {oldest.assigned_to || "Sem resp."}
            </p>
            <p className="text-2xl font-bold text-foreground">{oldestDays} <span className="text-sm font-normal text-muted-foreground">dias</span></p>
            <p className="text-xs text-muted-foreground truncate">{clientMap.get(oldest.client_id) || ""}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </div>

      {/* Card 4: Distribuição */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-blue-500" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Distribuição</span>
        </div>
        <div className="space-y-1.5">
          {rankings.pendingByCollab.filter(c => c.count > 0).map(collab => (
            <div key={collab.name} className="flex items-center gap-2">
              <span
                className="text-xs font-medium capitalize w-16 truncate"
                style={{ color: COLLABORATOR_COLORS[collab.name as CollaboratorName] || undefined }}
              >
                {collab.name}
              </span>
              <div className="h-2 flex-1 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(collab.count / rankings.maxPending) * 100}%`,
                    backgroundColor: COLLABORATOR_COLORS[collab.name as CollaboratorName] || 'hsl(var(--primary))',
                  }}
                />
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
  );
}
