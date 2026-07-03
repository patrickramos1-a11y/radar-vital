import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useClients } from "@/contexts/ClientContext";
import { useClientAssignments } from "@/hooks/useClientAssignments";
import { useTasks } from "@/hooks/useTasks";
import { useAllClientsCommentSnippets } from "@/hooks/useAllClientsCommentSnippets";
import { assigneeMatches } from "@/lib/taskAssignee";
import { PRIORITY_CONFIG, Task } from "@/types/task";
import { AlertTriangle, BarChart3, Box, CheckCircle2, Clock3, Grid2X2, ListChecks, MessageSquare, PackageOpen, Star, Users } from "lucide-react";

type Tab = "overview" | "priorities" | "tasks" | "comments" | "deliverables" | "performance";

const tabs = [
  ["overview", "Visão Geral", Grid2X2],
  ["priorities", "Prioridades", Star],
  ["tasks", "Tarefas", ListChecks],
  ["comments", "Comentários", MessageSquare],
  ["deliverables", "Entregáveis", Box],
  ["performance", "Performance", BarChart3],
] as const;

export default function CentralEntregas() {
  const { currentUser, collaborators } = useAuth();
  const { activeClients } = useClients();
  const { assignments } = useClientAssignments();
  const { tasks, isLoading } = useTasks();
  const comments = useAllClientsCommentSnippets();
  const [selectedId, setSelectedId] = useState<string | null>(currentUser?.id || null);
  const [tab, setTab] = useState<Tab>("overview");
  const selected = collaborators.find(c => c.id === selectedId) || collaborators[0];

  const linkedIds = useMemo(() => {
    if (!selected) return new Set<string>();
    const ids = assignments.filter(a => a.collaboratorId === selected.id).map(a => a.clientId);
    tasks.forEach(task => {
      if (assigneeMatches(task.assigned_to, selected.name)) ids.push(task.client_id);
    });
    return new Set(ids);
  }, [assignments, selected, tasks]);

  const selectedTasks = useMemo(
    () => selected ? tasks.filter(task => assigneeMatches(task.assigned_to, selected.name)) : [],
    [selected, tasks],
  );
  const open = selectedTasks.filter(task => !task.completed);
  const completed = selectedTasks.filter(task => task.completed);
  const priorities = open.filter(task => task.priority === "alta" || task.priority === "urgente");
  const overdue = open.filter(task => task.due_date && new Date(task.due_date + "T23:59:59") < new Date());
  const pendingComments = [...linkedIds].reduce((sum, id) => sum + (comments.get(id)?.length || 0), 0);
  const averageDays = open.length ? Math.round(open.reduce((sum, task) => sum + daysSince(task.created_at), 0) / open.length) : 0;
  const clientMap = useMemo(() => new Map(activeClients.map(client => [client.id, client])), [activeClients]);

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto bg-background">
        <div className="mx-auto w-full max-w-[1700px] px-4 py-6 md:px-8">
          <header className="mb-5">
            <h1 className="text-2xl font-bold">Central de Entregas</h1>
            <p className="mt-1 text-sm text-muted-foreground">Visão por responsável - prioridades, tarefas, comentários e entregáveis</p>
          </header>

          <section className="mb-4 flex flex-wrap gap-2 rounded-lg border bg-card p-3">
            {collaborators.map(collaborator => (
              <button key={collaborator.id} type="button" onClick={() => setSelectedId(collaborator.id)}
                className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors ${selected?.id === collaborator.id ? "border-primary bg-primary/10 text-primary shadow-sm" : "bg-background hover:bg-muted"}`}>
                <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: collaborator.color }}>
                  {collaborator.initials}
                </span>
                {collaborator.name}
              </button>
            ))}
          </section>

          <nav className="mb-4 grid grid-cols-2 overflow-hidden rounded-lg border bg-card sm:grid-cols-3 lg:grid-cols-6">
            {tabs.map(([id, label, Icon]) => (
              <button key={id} type="button" onClick={() => setTab(id)}
                className={`flex h-12 items-center justify-center gap-2 border-r text-sm transition-colors ${tab === id ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:bg-muted/60"}`}>
                <Icon className="h-4 w-4" />{label}
              </button>
            ))}
          </nav>

          {tab === "overview" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Clientes vinculados" value={linkedIds.size} icon={Users} color="text-indigo-500" />
              <Metric label="Tarefas abertas" value={open.length} icon={ListChecks} color="text-indigo-500" />
              <Metric label="Tarefas concluídas" value={completed.length} icon={CheckCircle2} color="text-emerald-600" />
              <Metric label="Prioridades abertas" value={priorities.length} icon={Star} color="text-indigo-500" />
              <Metric label="Comentários pendentes" value={pendingComments} icon={MessageSquare} color="text-amber-600" />
              <Metric label="Tempo médio (dias)" value={averageDays + "d"} icon={Clock3} />
              <Metric label="Itens atrasados" value={overdue.length} icon={AlertTriangle} color="text-red-600" />
              <Metric label="Entregáveis abertos" value={0} icon={PackageOpen} color="text-indigo-500" />
            </div>
          )}
          {tab === "priorities" && <TaskList tasks={priorities} clients={clientMap} empty="Nenhuma prioridade aberta." />}
          {tab === "tasks" && <TaskList tasks={open} clients={clientMap} empty="Nenhuma tarefa aberta." />}
          {tab === "comments" && (
            <Panel title="Comentários dos clientes vinculados">
              {[...linkedIds].flatMap(clientId => (comments.get(clientId) || []).map(comment => (
                <div key={comment.id} className="border-b py-3 last:border-0">
                  <div className="flex justify-between gap-3"><strong className="text-sm">{clientMap.get(clientId)?.name || "Cliente"}</strong><span className="text-xs text-muted-foreground">{comment.authorName}</span></div>
                  <p className="mt-1 text-sm text-muted-foreground">{comment.text}</p>
                </div>
              )))}
              {pendingComments === 0 && <Empty text="Nenhum comentário pendente." />}
            </Panel>
          )}
          {tab === "deliverables" && <Panel title="Entregáveis"><Empty text="Nenhum entregável aberto para este responsável." /></Panel>}
          {tab === "performance" && (
            <Panel title="Performance"><div className="grid gap-4 sm:grid-cols-3">
              <Performance label="Taxa de conclusão" value={selectedTasks.length ? Math.round(completed.length / selectedTasks.length * 100) : 0} suffix="%" />
              <Performance label="Tarefas no prazo" value={Math.max(0, open.length - overdue.length)} />
              <Performance label="Clientes atendidos" value={linkedIds.size} />
            </div></Panel>
          )}
          {isLoading && <p className="mt-4 text-sm text-muted-foreground">Atualizando tarefas...</p>}
        </div>
      </div>
    </AppLayout>
  );
}

function Metric({ label, value, icon: Icon, color = "text-muted-foreground" }: { label: string; value: string | number; icon: typeof Users; color?: string }) {
  return <div className="min-h-[88px] rounded-lg border bg-card p-3"><div className="flex justify-between gap-2"><span className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</span><Icon className={`h-4 w-4 ${color}`} /></div><div className={`mt-3 text-2xl font-bold ${color === "text-muted-foreground" ? "text-foreground" : color}`}>{value}</div></div>;
}
function TaskList({ tasks, clients, empty }: { tasks: Task[]; clients: Map<string, { name: string }>; empty: string }) {
  return <Panel title="Itens do responsável">{tasks.map(task => <div key={task.id} className="flex flex-col gap-2 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{task.title}</p><p className="text-xs text-muted-foreground">{clients.get(task.client_id)?.name || "Cliente"}</p></div><span className={`rounded px-2 py-1 text-xs font-medium ${PRIORITY_CONFIG[task.priority].bgClass} ${PRIORITY_CONFIG[task.priority].textClass}`}>{PRIORITY_CONFIG[task.priority].label}</span></div>)}{tasks.length === 0 && <Empty text={empty} />}</Panel>;
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-lg border bg-card p-4"><h2 className="mb-2 text-sm font-semibold">{title}</h2>{children}</section>; }
function Empty({ text }: { text: string }) { return <div className="py-10 text-center text-sm text-muted-foreground">{text}</div>; }
function Performance({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) { return <div className="border-l-2 border-primary pl-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}{suffix}</p></div>; }
function daysSince(date: string) { return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000)); }
