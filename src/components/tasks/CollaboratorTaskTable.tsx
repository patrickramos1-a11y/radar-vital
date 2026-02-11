import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpDown, Clock, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Task } from "@/types/task";
import { Client, CollaboratorName, COLLABORATOR_COLORS } from "@/types/client";
import { cn } from "@/lib/utils";

interface CollaboratorTaskTableProps {
  collaborator: CollaboratorName;
  tasks: Task[];
  clients: Client[];
  getDaysOpen: (task: Task) => number;
  onClose: () => void;
}

type SortKey = "title" | "client" | "created_at" | "days_open" | "status";
type SortDir = "asc" | "desc";

export function CollaboratorTaskTable({ collaborator, tasks, clients, getDaysOpen, onClose }: CollaboratorTaskTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("days_open");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const clientMap = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach(c => map.set(c.id, c.name));
    return map;
  }, [clients]);

  const collabTasks = useMemo(() => {
    return tasks.filter(t => t.assigned_to === collaborator);
  }, [tasks, collaborator]);

  const sorted = useMemo(() => {
    const arr = [...collabTasks];
    const m = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "title": return a.title.localeCompare(b.title) * m;
        case "client": return (clientMap.get(a.client_id) || "").localeCompare(clientMap.get(b.client_id) || "") * m;
        case "created_at": return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * m;
        case "days_open": return (getDaysOpen(a) - getDaysOpen(b)) * m;
        case "status": return (Number(a.completed) - Number(b.completed)) * m;
        default: return 0;
      }
    });
    return arr;
  }, [collabTasks, sortKey, sortDir, clientMap, getDaysOpen]);

  const stats = useMemo(() => {
    const pending = collabTasks.filter(t => !t.completed);
    const completed = collabTasks.filter(t => t.completed);
    const avgDays = pending.length > 0 
      ? Math.round(pending.reduce((s, t) => s + getDaysOpen(t), 0) / pending.length) 
      : 0;
    const oldest = pending.length > 0
      ? pending.reduce((o, t) => new Date(t.created_at) < new Date(o.created_at) ? t : o)
      : null;
    return { total: collabTasks.length, pending: pending.length, completed: completed.length, avgDays, oldest };
  }, [collabTasks, getDaysOpen]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => toggleSort(field)}>
      {label}
      <ArrowUpDown className={cn("w-3 h-3", sortKey === field ? "text-primary" : "text-muted-foreground/50")} />
    </button>
  );

  return (
    <div className="mx-6 mb-6 rounded-xl border-2 bg-card overflow-hidden" style={{ borderColor: `${COLLABORATOR_COLORS[collaborator]}40` }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: `${COLLABORATOR_COLORS[collaborator]}10` }}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLLABORATOR_COLORS[collaborator] }} />
          <h3 className="font-bold text-foreground capitalize">{collaborator}</h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">{stats.pending} pendentes</Badge>
            <Badge variant="secondary" className="text-xs">{stats.completed} concluídas</Badge>
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Média: {stats.avgDays}d
            </Badge>
            {stats.oldest && (
              <Badge variant="destructive" className="text-xs">
                Mais antiga: {getDaysOpen(stats.oldest)}d ({clientMap.get(stats.oldest.client_id)})
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="max-h-[400px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortHeader label="Tarefa" field="title" /></TableHead>
              <TableHead><SortHeader label="Empresa" field="client" /></TableHead>
              <TableHead><SortHeader label="Criada em" field="created_at" /></TableHead>
              <TableHead><SortHeader label="Dias em aberto" field="days_open" /></TableHead>
              <TableHead><SortHeader label="Status" field="status" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhuma tarefa para {collaborator}
                </TableCell>
              </TableRow>
            ) : sorted.map(task => {
              const days = getDaysOpen(task);
              return (
                <TableRow key={task.id}>
                  <TableCell className="font-medium max-w-[300px]">
                    <span className={cn(task.completed && "line-through text-muted-foreground")}>{task.title}</span>
                  </TableCell>
                  <TableCell className="text-sm">{clientMap.get(task.client_id) || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(task.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "font-bold text-sm",
                      !task.completed && days > 30 ? "text-destructive" : !task.completed && days > 14 ? "text-amber-600" : "text-muted-foreground"
                    )}>
                      {days}d
                    </span>
                  </TableCell>
                  <TableCell>
                    {task.completed ? (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-xs">Concluída</span>
                        {task.completed_at && (
                          <span className="text-[10px] text-muted-foreground ml-1">
                            {format(new Date(task.completed_at), "dd/MM", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-amber-600">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="text-xs">Pendente</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
