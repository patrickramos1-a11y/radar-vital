import { useMemo } from "react";
import { Trophy, Clock, AlertTriangle, TrendingUp } from "lucide-react";
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

    // Most pending tasks
    const pendingByCollab = COLLABORATOR_NAMES.map(name => ({
      name,
      count: pending.filter(t => t.assigned_to === name).length,
    })).sort((a, b) => b.count - a.count);

    // Most completed tasks
    const completedByCollab = COLLABORATOR_NAMES.map(name => ({
      name,
      count: completed.filter(t => t.assigned_to === name).length,
    })).sort((a, b) => b.count - a.count);

    // Oldest pending task
    const oldest = pending.length > 0
      ? pending.reduce((o, t) => new Date(t.created_at) < new Date(o.created_at) ? t : o)
      : null;

    return { pendingByCollab, completedByCollab, oldest };
  }, [tasks]);

  const items = [
    {
      icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
      label: "Mais pendências",
      value: rankings.pendingByCollab[0]?.count > 0 ? rankings.pendingByCollab[0] : null,
    },
    {
      icon: <Trophy className="w-4 h-4 text-emerald-500" />,
      label: "Mais concluídas",
      value: rankings.completedByCollab[0]?.count > 0 ? rankings.completedByCollab[0] : null,
    },
    {
      icon: <Clock className="w-4 h-4 text-destructive" />,
      label: "Mais antiga",
      value: rankings.oldest ? {
        name: rankings.oldest.assigned_to || "Sem resp.",
        detail: `${getDaysOpen(rankings.oldest)}d — ${clientMap.get(rankings.oldest.client_id) || ""}`,
      } : null,
    },
  ];

  return (
    <div className="flex items-center gap-4 px-6 py-2 bg-muted/20 border-b">
      <TrendingUp className="w-4 h-4 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground">Ranking:</span>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs">
          {item.icon}
          <span className="text-muted-foreground">{item.label}:</span>
          {item.value ? (
            <span className="font-semibold capitalize" style={{ color: COLLABORATOR_COLORS[item.value.name as CollaboratorName] || undefined }}>
              {item.value.name}
              {('count' in item.value) && <span className="text-muted-foreground ml-1">({(item.value as any).count})</span>}
              {('detail' in item.value) && <span className="text-muted-foreground ml-1">({(item.value as any).detail})</span>}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ))}
    </div>
  );
}
