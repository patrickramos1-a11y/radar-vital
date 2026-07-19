import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Award,
  BarChart3,
  Box,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Grid2X2,
  History,
  ListChecks,
  MessageSquare,
  PackageOpen,
  Sparkles,
  Star,
  ThumbsUp,
  Trophy,
  Users,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useClients } from "@/contexts/ClientContext";
import { useClientAssignments } from "@/hooks/useClientAssignments";
import { useTasks } from "@/hooks/useTasks";
import { useAllClientsCommentSnippets } from "@/hooks/useAllClientsCommentSnippets";
import { assigneeMatches } from "@/lib/taskAssignee";
import { supabase } from "@/integrations/supabase/client";
import { PRIORITY_CONFIG, Task } from "@/types/task";
import type { Client } from "@/types/client";

type Tab = "overview" | "priorities" | "tasks" | "comments" | "deliverables" | "performance" | "history";

type PriorityRecord = {
  id: string;
  title: string;
  description?: string | null;
  client_id?: string | null;
  assigned_to: string[];
  due_date?: string | null;
  status: "aberta" | "em_andamento" | "concluida" | "cancelada" | string;
  weight?: number | null;
  category?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at?: string | null;
  completed_at?: string | null;
};

type DeliveryRecord = {
  id: string;
  name: string;
  description?: string | null;
  assigned_to: string[];
  due_date?: string | null;
  status: "aberto" | "em_andamento" | "concluido" | "cancelado" | string;
  created_by?: string | null;
  created_at: string;
  updated_at?: string | null;
  completed_at?: string | null;
  requester?: string | null;
};

type DeliverableItem = {
  id: string;
  deliverable_id: string;
  item_type: string;
  item_id: string;
  created_at: string;
};

type DeliverableRating = {
  id: string;
  deliverable_id: string;
  rater_name: string;
  rating_type: string;
  value: number;
  created_at: string;
};

type PdfImportRelation = {
  id: string;
  file_name?: string | null;
  file_url?: string | null;
  status?: string | null;
  created_at?: string | null;
  report_period_month?: number | null;
  report_period_year?: number | null;
};

type PdfDeliverableRow = {
  id: string;
  matched_client_id: string | null;
  client_name_raw?: string | null;
  created_at: string;
  pdf_imports?: PdfImportRelation | PdfImportRelation[] | null;
};

type DeliverableView = {
  id: string;
  title: string;
  clientId: string | null;
  clientName: string;
  date: string;
  status: string;
  type: "delivery" | "task" | "pdf";
  assignedTo: string[];
  url?: string | null;
  score: number;
  stars: number;
  thumbs: number;
};

type PersonStats = {
  name: string;
  color: string;
  clients: number;
  openTasks: number;
  doneTasks: number;
  overdueTasks: number;
  avgDays: number;
  openPriorities: number;
  donePriorities: number;
  deliverables: number;
  doneDeliverables: number;
  pendingDeliverables: number;
  pendingComments: number;
  stars: number;
  thumbs: number;
  superstars: number;
  score: number;
};

type QueryResult<T> = {
  data: T[] | null;
  error: unknown;
};

type LooseQuery<T> = PromiseLike<QueryResult<T>> & {
  select(columns: string): LooseQuery<T>;
  order(column: string, options?: { ascending: boolean }): LooseQuery<T>;
  not(column: string, operator: string, value: unknown): LooseQuery<T>;
  limit(count: number): LooseQuery<T>;
};

type LooseMutation = PromiseLike<{ error: unknown }> & {
  eq(column: string, value: string): LooseMutation;
};

type LooseSupabase = {
  from<T>(table: string): LooseQuery<T> & {
    update(values: Record<string, unknown>): LooseMutation;
  };
};

const tabs: Array<[Tab, string, LucideIcon]> = [
  ["overview", "Visão Geral", Grid2X2],
  ["priorities", "Prioridades", Star],
  ["tasks", "Tarefas", ListChecks],
  ["comments", "Comentários", MessageSquare],
  ["deliverables", "Entregáveis", Box],
  ["performance", "Performance", BarChart3],
  ["history", "Histórico", History],
];

const statusConfig: Record<string, { label: string; className: string }> = {
  aberta: { label: "Aberta", className: "border-sky-200 bg-sky-50 text-sky-700" },
  aberto: { label: "Aberto", className: "border-sky-200 bg-sky-50 text-sky-700" },
  em_andamento: { label: "Em andamento", className: "border-amber-200 bg-amber-50 text-amber-700" },
  concluida: { label: "Concluída", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  concluido: { label: "Concluído", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  cancelada: { label: "Cancelada", className: "border-slate-200 bg-slate-50 text-slate-500" },
  cancelado: { label: "Cancelado", className: "border-slate-200 bg-slate-50 text-slate-500" },
};

export default function CentralEntregas() {
  const { currentUser, collaborators } = useAuth();
  const { activeClients } = useClients();
  const { assignments } = useClientAssignments();
  const { tasks, isLoading, toggleComplete } = useTasks();
  const comments = useAllClientsCommentSnippets();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [manualSelection, setManualSelection] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [priorities, setPriorities] = useState<PriorityRecord[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [deliveryItems, setDeliveryItems] = useState<DeliverableItem[]>([]);
  const [ratings, setRatings] = useState<DeliverableRating[]>([]);
  const [pdfDeliverables, setPdfDeliverables] = useState<DeliverableView[]>([]);
  const [opsLoading, setOpsLoading] = useState(true);

  const responsibleList = useMemo(
    () => collaborators.filter(collaborator => collaborator.isActive !== false),
    [collaborators],
  );

  const central = responsibleList.find(collaborator => collaborator.name.toLowerCase() === "central") || null;
  const selected = responsibleList.find(collaborator => collaborator.id === selectedId)
    || central
    || currentUser
    || responsibleList[0]
    || null;
  const isTeamView = !selected || selected.name.toLowerCase() === "central";
  const selectedName = selected?.name || "CENTRAL";

  const clientMap = useMemo(() => new Map(activeClients.map(client => [client.id, client])), [activeClients]);
  const taskMap = useMemo(() => new Map(tasks.map(task => [task.id, task])), [tasks]);
  const priorityMap = useMemo(() => new Map(priorities.map(priority => [priority.id, priority])), [priorities]);

  const fetchOperationalData = useCallback(async () => {
    setOpsLoading(true);
    try {
      const db = supabase as unknown as LooseSupabase;
      const [priorityResult, deliveryResult, itemResult, ratingResult, pdfResult] = await Promise.all([
        db.from<PriorityRecord>("priorities").select("*").order("created_at", { ascending: false }),
        db.from<DeliveryRecord>("deliverables").select("*").order("created_at", { ascending: false }),
        db.from<DeliverableItem>("deliverable_items").select("*").order("created_at", { ascending: false }),
        db.from<DeliverableRating>("deliverable_ratings").select("*").order("created_at", { ascending: false }),
        db
          .from<PdfDeliverableRow>("pdf_detected_clients")
          .select(`
            id,
            matched_client_id,
            client_name_raw,
            created_at,
            pdf_imports (
              id,
              file_name,
              file_url,
              status,
              created_at,
              report_period_month,
              report_period_year
            )
          `)
          .not("matched_client_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(250),
      ]);

      if (priorityResult.error) console.error("Error fetching priorities:", priorityResult.error);
      if (deliveryResult.error) console.error("Error fetching deliverables:", deliveryResult.error);
      if (itemResult.error) console.error("Error fetching deliverable items:", itemResult.error);
      if (ratingResult.error) console.error("Error fetching deliverable ratings:", ratingResult.error);
      if (pdfResult.error) console.error("Error fetching PDF deliverables:", pdfResult.error);

      setPriorities(normalizeRows<PriorityRecord>(priorityResult.data));
      setDeliveries(normalizeRows<DeliveryRecord>(deliveryResult.data));
      setDeliveryItems(normalizeRows<DeliverableItem>(itemResult.data));
      setRatings(normalizeRows<DeliverableRating>(ratingResult.data));
      setPdfDeliverables(normalizeRows<PdfDeliverableRow>(pdfResult.data).map(row => mapPdfDeliverable(row, clientMap)));
    } finally {
      setOpsLoading(false);
    }
  }, [clientMap]);

  useEffect(() => {
    if (manualSelection) return;
    if (currentUser) {
      setSelectedId(currentUser.id);
      return;
    }
    if (central) {
      setSelectedId(central.id);
    }
  }, [central, currentUser, manualSelection]);

  useEffect(() => {
    fetchOperationalData();
    const channel = supabase
      .channel("central_entregas_operational")
      .on("postgres_changes", { event: "*", schema: "public", table: "priorities" }, fetchOperationalData)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliverables" }, fetchOperationalData)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliverable_items" }, fetchOperationalData)
      .on("postgres_changes", { event: "*", schema: "public", table: "deliverable_ratings" }, fetchOperationalData)
      .on("postgres_changes", { event: "*", schema: "public", table: "pdf_detected_clients" }, fetchOperationalData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOperationalData]);

  const deliveryViews = useMemo(
    () => deliveries.map(delivery => mapDeliveryView(delivery, deliveryItems, ratings, clientMap, taskMap, priorityMap)),
    [clientMap, deliveries, deliveryItems, priorityMap, ratings, taskMap],
  );

  const allDeliverables = useMemo(
    () => [
      ...deliveryViews,
      ...tasks.filter(task => task.completed).map(task => mapTaskDeliverable(task, clientMap)),
      ...pdfDeliverables,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [clientMap, deliveryViews, pdfDeliverables, tasks],
  );

  const visibleTasks = useMemo(
    () => isTeamView ? tasks : tasks.filter(task => assigneeMatches(task.assigned_to, selectedName)),
    [isTeamView, selectedName, tasks],
  );

  const visiblePriorities = useMemo(
    () => isTeamView ? priorities : priorities.filter(priority => assigneeMatches(priority.assigned_to, selectedName)),
    [isTeamView, priorities, selectedName],
  );

  const visibleDeliverables = useMemo(
    () => isTeamView ? allDeliverables : allDeliverables.filter(delivery => assigneeMatches(delivery.assignedTo, selectedName)),
    [allDeliverables, isTeamView, selectedName],
  );

  const linkedIds = useMemo(
    () => getLinkedClientIds({
      assignments,
      tasks: visibleTasks,
      priorities: visiblePriorities,
      deliverables: visibleDeliverables,
      selectedId: selected?.id || null,
      isTeamView,
      activeClients,
    }),
    [activeClients, assignments, isTeamView, selected?.id, visibleDeliverables, visiblePriorities, visibleTasks],
  );

  const visibleComments = useMemo(
    () => [...linkedIds].flatMap(clientId => (comments.get(clientId) || []).map(comment => ({ ...comment, clientId }))),
    [comments, linkedIds],
  );

  const selectedStats = useMemo(
    () => calculateStats({
      name: selectedName,
      color: selected?.color || "#0EA5E9",
      collaboratorId: selected?.id || null,
      isTeamView,
      assignments,
      activeClients,
      tasks,
      priorities,
      deliverables: allDeliverables,
      comments,
    }),
    [activeClients, allDeliverables, assignments, comments, isTeamView, priorities, selected?.color, selected?.id, selectedName, tasks],
  );

  const teamStats = useMemo(
    () => responsibleList
      .filter(collaborator => collaborator.name.toLowerCase() !== "central")
      .map(collaborator => calculateStats({
        name: collaborator.name,
        color: collaborator.color,
        collaboratorId: collaborator.id,
        isTeamView: false,
        assignments,
        activeClients,
        tasks,
        priorities,
        deliverables: allDeliverables,
        comments,
      })),
    [activeClients, allDeliverables, assignments, comments, priorities, responsibleList, tasks],
  );

  const teamSummary = useMemo(() => {
    const openTasks = tasks.filter(task => !task.completed).length;
    const openPriorities = priorities.filter(priority => !isClosed(priority.status)).length;
    const doneThisMonth = allDeliverables.filter(delivery => isClosed(delivery.status) && isCurrentMonth(delivery.date)).length;
    const pendingComments = [...comments.values()].reduce((sum, rows) => sum + rows.length, 0);
    const topPerformer = [...teamStats].sort((a, b) => b.score - a.score)[0] || null;
    const topStars = [...teamStats].sort((a, b) => b.stars - a.stars)[0] || null;
    return { openTasks, openPriorities, doneThisMonth, pendingComments, topPerformer, topStars };
  }, [allDeliverables, comments, priorities, tasks, teamStats]);

  const openTasks = visibleTasks.filter(task => !task.completed);
  const doneTasks = visibleTasks.filter(task => task.completed);
  const openPriorities = visiblePriorities.filter(priority => !isClosed(priority.status));
  const donePriorities = visiblePriorities.filter(priority => isClosed(priority.status));
  const openDeliverables = visibleDeliverables.filter(delivery => !isClosed(delivery.status));
  const doneDeliverables = visibleDeliverables.filter(delivery => isClosed(delivery.status));
  const historyItems = [
    ...doneTasks.map(task => ({ id: `task-${task.id}`, title: task.title, date: task.completed_at || task.created_at, type: "Tarefa", clientId: task.client_id })),
    ...donePriorities.map(priority => ({ id: `priority-${priority.id}`, title: priority.title, date: priority.completed_at || priority.created_at, type: "Prioridade", clientId: priority.client_id || null })),
    ...doneDeliverables.map(delivery => ({ id: `delivery-${delivery.id}`, title: delivery.title, date: delivery.date, type: "Entregável", clientId: delivery.clientId })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSelectResponsible = (id: string) => {
    setManualSelection(true);
    setSelectedId(id);
  };

  const handleCompletePriority = async (priorityId: string) => {
    const db = supabase as unknown as LooseSupabase;
    const { error } = await db
      .from("priorities")
      .update({ status: "concluida", completed_at: new Date().toISOString() })
      .eq("id", priorityId);
    if (error) {
      console.error("Error completing priority:", error);
      return;
    }
    fetchOperationalData();
  };

  return (
    <AppLayout>
      <div className="h-full overflow-y-auto bg-background">
        <div className="mx-auto w-full max-w-[1800px] px-4 py-5 md:px-8">
          <header className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Central de Entregas</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Responsabilidades, prioridades, entregáveis e performance operacional da equipe.
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              {isLoading || opsLoading ? "Atualizando dados..." : "Dados sincronizados com tarefas, prioridades e entregáveis"}
            </div>
          </header>

          <TeamSummary summary={teamSummary} />

          <section className="my-4 flex flex-wrap gap-2 rounded-xl border bg-card/70 p-2">
            {responsibleList.map(collaborator => {
              const stat = collaborator.name.toLowerCase() === "central"
                ? selectedStats
                : teamStats.find(item => item.name === collaborator.name);
              const active = selected?.id === collaborator.id || (!selected && collaborator.name.toLowerCase() === "central");
              return (
                <button
                  key={collaborator.id}
                  type="button"
                  onClick={() => handleSelectResponsible(collaborator.id)}
                  className={`flex min-h-12 items-center gap-2 rounded-lg border px-3 text-left transition-colors ${
                    active ? "border-primary bg-primary/10 text-primary shadow-sm" : "bg-background hover:bg-muted"
                  }`}
                >
                  <Avatar name={collaborator.name} color={collaborator.color} initials={collaborator.initials} size={30} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{collaborator.name}</span>
                    <span className="block text-[10px] text-muted-foreground">
                      {collaborator.name.toLowerCase() === "central"
                        ? "visão da equipe"
                        : `${stat?.openTasks || 0} tarefas · ${stat?.openPriorities || 0} prioridades · ${stat?.score || 0} pts`}
                    </span>
                  </span>
                </button>
              );
            })}
          </section>

          <PersonSnapshot stats={selectedStats} isTeamView={isTeamView} />

          <nav className="my-4 grid grid-cols-2 overflow-hidden rounded-lg border bg-card sm:grid-cols-4 xl:grid-cols-7">
            {tabs.map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex h-11 items-center justify-center gap-2 border-r text-sm transition-colors last:border-r-0 ${
                  tab === id ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>

          {tab === "overview" && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <Panel title="O que precisa de ação agora">
                <div className="grid gap-3 lg:grid-cols-2">
                  <FocusList
                    title="Prioridades críticas"
                    icon={Star}
                    items={openPriorities
                      .slice()
                      .sort(sortPriority)
                      .slice(0, 6)
                      .map(priority => ({
                        id: priority.id,
                        title: priority.title,
                        meta: clientMap.get(priority.client_id || "")?.name || "Sem cliente vinculado",
                        clientId: priority.client_id || null,
                        right: priority.due_date ? formatDate(priority.due_date) : `${priority.weight || 3} pts`,
                      }))}
                  />
                  <FocusList
                    title="Tarefas mais antigas"
                    icon={Clock3}
                    items={openTasks
                      .slice()
                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                      .slice(0, 6)
                      .map(task => ({
                        id: task.id,
                        title: task.title,
                        meta: clientMap.get(task.client_id)?.name || "Cliente",
                        clientId: task.client_id,
                        right: `${daysSince(task.created_at)}d`,
                      }))}
                  />
                </div>
              </Panel>
              <Panel title="Caixa de comentários">
                <CommentList comments={visibleComments.slice(0, 6)} clients={clientMap} compact />
              </Panel>
            </div>
          )}

          {tab === "priorities" && (
            <PriorityList priorities={openPriorities} clients={clientMap} onComplete={handleCompletePriority} />
          )}

          {tab === "tasks" && (
            <TaskList tasks={openTasks} clients={clientMap} onToggle={toggleComplete} />
          )}

          {tab === "comments" && (
            <Panel title="Comentários dos clientes vinculados">
              <CommentList comments={visibleComments} clients={clientMap} />
            </Panel>
          )}

          {tab === "deliverables" && (
            <DeliverablesList deliverables={visibleDeliverables} clients={clientMap} />
          )}

          {tab === "performance" && (
            <PerformancePanel selectedStats={selectedStats} teamStats={teamStats} isTeamView={isTeamView} />
          )}

          {tab === "history" && (
            <Panel title="Histórico de produtividade">
              <HistoryList items={historyItems} clients={clientMap} />
            </Panel>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function TeamSummary({ summary }: { summary: { openTasks: number; openPriorities: number; doneThisMonth: number; pendingComments: number; topPerformer: PersonStats | null; topStars: PersonStats | null } }) {
  return (
    <section className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
      <SummaryMetric label="Tarefas abertas" value={summary.openTasks} icon={ListChecks} tone="text-sky-600" />
      <SummaryMetric label="Prioridades abertas" value={summary.openPriorities} icon={Star} tone="text-red-600" />
      <SummaryMetric label="Entregáveis / mês" value={summary.doneThisMonth} icon={PackageOpen} tone="text-emerald-600" />
      <SummaryMetric label="Comentários pendentes" value={summary.pendingComments} icon={MessageSquare} tone="text-amber-600" />
      <TopPerson label="Melhor performance" person={summary.topPerformer} icon={Trophy} tone="#F59E0B" />
      <TopPerson label="Mais estrelas" person={summary.topStars} icon={Sparkles} tone="#EA580C" />
    </section>
  );
}

function SummaryMetric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: LucideIcon; tone: string }) {
  return (
    <div className="min-h-[86px] rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
    </div>
  );
}

function TopPerson({ label, person, icon: Icon, tone }: { label: string; person: PersonStats | null; icon: LucideIcon; tone: string }) {
  return (
    <div className="min-h-[86px] rounded-xl border bg-card p-3">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" style={{ color: tone }} />
        {label}
      </div>
      {person ? (
        <div className="mt-3 flex items-center gap-2">
          <Avatar name={person.name} color={person.color} size={28} />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{person.name}</div>
            <div className="text-[11px] font-semibold" style={{ color: tone }}>{person.score} pts</div>
          </div>
        </div>
      ) : (
        <div className="mt-3 text-sm text-muted-foreground">Sem dados</div>
      )}
    </div>
  );
}

function PersonSnapshot({ stats, isTeamView }: { stats: PersonStats; isTeamView: boolean }) {
  const metrics = [
    { label: "Clientes", value: stats.clients, icon: Users },
    { label: "Tarefas abertas", value: stats.openTasks, icon: ListChecks },
    { label: "Prioridades", value: stats.openPriorities, icon: Star },
    { label: "Tarefas concluídas", value: stats.doneTasks, icon: CheckCircle2, success: true },
    { label: "Entregáveis", value: stats.doneDeliverables, icon: PackageOpen, success: true },
    { label: "Comentários", value: stats.pendingComments, icon: MessageSquare, danger: stats.pendingComments > 0 },
    { label: "Atrasadas", value: stats.overdueTasks, icon: AlertTriangle, danger: stats.overdueTasks > 0 },
    { label: "Pontuação", value: stats.score, icon: Award, success: true },
  ];

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="mb-3 flex items-center gap-3">
        <Avatar name={stats.name} color={stats.color} size={46} ring />
        <div>
          <h2 className="text-lg font-bold" style={{ color: stats.color }}>{stats.name}</h2>
          <p className="text-xs text-muted-foreground">
            {isTeamView ? "Visão consolidada da equipe" : "Visão de ação, entregas e reconhecimento"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
        {metrics.map(metric => (
          <MiniMetric key={metric.label} {...metric} />
        ))}
      </div>
    </section>
  );
}

function MiniMetric({ label, value, icon: Icon, success, danger }: { label: string; value: string | number; icon: LucideIcon; success?: boolean; danger?: boolean }) {
  return (
    <div className={`rounded-lg border bg-background px-2.5 py-2 ${danger ? "border-red-200 bg-red-50/50" : ""} ${success ? "border-emerald-200 bg-emerald-50/40" : ""}`}>
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className={`h-3 w-3 ${danger ? "text-red-500" : success ? "text-emerald-600" : ""}`} />
        <span className="truncate">{label}</span>
      </div>
      <div className={`mt-1 text-xl font-bold ${danger ? "text-red-600" : success ? "text-emerald-700" : ""}`}>{value}</div>
    </div>
  );
}

function PriorityList({ priorities, clients, onComplete }: { priorities: PriorityRecord[]; clients: Map<string, Client>; onComplete: (id: string) => void }) {
  const sorted = priorities.slice().sort(sortPriority);
  return (
    <Panel title="Prioridades abertas">
      <div className="space-y-2">
        {sorted.map(priority => {
          const client = clients.get(priority.client_id || "");
          const status = statusConfig[priority.status] || statusConfig.aberta;
          return (
            <div key={priority.id} className="grid gap-3 rounded-lg border bg-card p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <ClientBadge client={client} fallback="Sem cliente" />
                  <Badge className={status.className}>{status.label}</Badge>
                  <Badge className="border-violet-200 bg-violet-50 text-violet-700">{priority.weight || 3} pts</Badge>
                  {priority.due_date && <span className="text-xs text-muted-foreground">Prazo {formatDate(priority.due_date)}</span>}
                </div>
                <p className="truncate text-sm font-semibold" title={priority.title}>{priority.title}</p>
                {priority.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{priority.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => onComplete(priority.id)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-emerald-200 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Concluir
              </button>
            </div>
          );
        })}
        {sorted.length === 0 && <Empty text="Nenhuma prioridade aberta." />}
      </div>
    </Panel>
  );
}

function TaskList({ tasks, clients, onToggle }: { tasks: Task[]; clients: Map<string, Client>; onToggle: (taskId: string, clientName?: string) => Promise<boolean> }) {
  const sorted = tasks.slice().sort((a, b) => {
    const priorityDiff = (PRIORITY_CONFIG[a.priority]?.order ?? 9) - (PRIORITY_CONFIG[b.priority]?.order ?? 9);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return (
    <Panel title="Tarefas abertas">
      <div className="space-y-2">
        {sorted.map(task => {
          const client = clients.get(task.client_id);
          const priority = PRIORITY_CONFIG[task.priority];
          return (
            <div key={task.id} className="grid gap-3 rounded-lg border bg-card p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <ClientBadge client={client} fallback="Cliente" />
                  <Badge className={`${priority.bgClass} ${priority.textClass} border-current/20`}>{priority.label}</Badge>
                  <span className="text-xs text-muted-foreground">{daysSince(task.created_at)}d em aberto</span>
                  {task.due_date && <span className="text-xs text-muted-foreground">Prazo {formatDate(task.due_date)}</span>}
                </div>
                <p className="truncate text-sm font-semibold" title={task.title}>{task.title}</p>
                {task.assigned_to.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">Responsáveis: {task.assigned_to.join(", ")}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onToggle(task.id, client?.name)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-emerald-200 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Concluir
              </button>
            </div>
          );
        })}
        {sorted.length === 0 && <Empty text="Nenhuma tarefa aberta." />}
      </div>
    </Panel>
  );
}

function CommentList({ comments, clients, compact = false }: { comments: Array<{ id: string; text: string; authorName: string; createdAt: string; clientId: string }>; clients: Map<string, Client>; compact?: boolean }) {
  if (comments.length === 0) return <Empty text="Nenhum comentário pendente." />;
  return (
    <div className="space-y-2">
      {comments.map(comment => {
        const client = clients.get(comment.clientId);
        return (
          <div key={comment.id} className="rounded-lg border bg-card p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <ClientBadge client={client} fallback="Cliente" />
              <span className="text-xs text-muted-foreground">{comment.authorName} · {formatDate(comment.createdAt)}</span>
            </div>
            <p className={`${compact ? "line-clamp-2" : ""} text-sm text-muted-foreground`}>{comment.text}</p>
          </div>
        );
      })}
    </div>
  );
}

function DeliverablesList({ deliverables }: { deliverables: DeliverableView[]; clients: Map<string, Client> }) {
  return (
    <Panel title="Entregáveis e reconhecimentos">
      <div className="space-y-2">
        {deliverables.map(item => {
          const status = statusConfig[item.status] || statusConfig.concluido;
          return (
            <div key={`${item.type}-${item.id}`} className="grid gap-3 rounded-lg border bg-card p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <ClientBadge client={null} fallback={item.clientName} />
                  <Badge className={status.className}>{status.label}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                </div>
                <p className="truncate text-sm font-semibold" title={item.title}>{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.assignedTo.length ? item.assignedTo.join(", ") : "Sem responsável informado"}</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-amber-700"><Star className="h-3 w-3" /> {item.stars}</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-emerald-700"><ThumbsUp className="h-3 w-3" /> {item.thumbs}</span>
                {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Abrir <ExternalLink className="h-3 w-3" /></a>}
              </div>
            </div>
          );
        })}
        {deliverables.length === 0 && <Empty text="Nenhum entregável encontrado." />}
      </div>
    </Panel>
  );
}

function PerformancePanel({ selectedStats, teamStats, isTeamView }: { selectedStats: PersonStats; teamStats: PersonStats[]; isTeamView: boolean }) {
  return (
    <div className="space-y-4">
      {!isTeamView && (
        <Panel title={`Performance de ${selectedStats.name}`}>
          <div className="grid gap-2 md:grid-cols-4">
            <MiniMetric label="Pontuação oficial" value={selectedStats.score} icon={Award} success />
            <MiniMetric label="Estrelas" value={selectedStats.stars} icon={Star} />
            <MiniMetric label="Joinhas" value={selectedStats.thumbs} icon={ThumbsUp} />
            <MiniMetric label="Tempo médio" value={`${selectedStats.avgDays}d`} icon={Clock3} />
            <MiniMetric label="Entregáveis concluídos" value={selectedStats.doneDeliverables} icon={PackageOpen} success />
            <MiniMetric label="Prioridades concluídas" value={selectedStats.donePriorities} icon={CheckCircle2} success />
            <MiniMetric label="Tarefas concluídas" value={selectedStats.doneTasks} icon={ListChecks} success />
            <MiniMetric label="Atrasadas" value={selectedStats.overdueTasks} icon={AlertTriangle} danger={selectedStats.overdueTasks > 0} />
          </div>
        </Panel>
      )}
      <Panel title="Performance da Equipe">
        <div className="mb-3 rounded-xl border bg-amber-50/60 p-3 text-xs text-amber-800">
          Ranking geral: pontuação + entregáveis concluídos x2 + prioridades concluídas x3 - tarefas atrasadas x2.
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          <Ranking title="Ranking Geral" icon={Trophy} color="#F59E0B" rows={teamStats.map(stat => ({ name: stat.name, color: stat.color, value: stat.score }))} />
          <Ranking title="Estrelas" icon={Star} color="#F59E0B" rows={teamStats.map(stat => ({ name: stat.name, color: stat.color, value: stat.stars }))} />
          <Ranking title="Joinhas" icon={ThumbsUp} color="#10B981" rows={teamStats.map(stat => ({ name: stat.name, color: stat.color, value: stat.thumbs }))} />
          <Ranking title="Entregáveis concluídos" icon={PackageOpen} color="#10B981" rows={teamStats.map(stat => ({ name: stat.name, color: stat.color, value: stat.doneDeliverables }))} />
          <Ranking title="Prioridades concluídas" icon={CheckCircle2} color="#10B981" rows={teamStats.map(stat => ({ name: stat.name, color: stat.color, value: stat.donePriorities }))} />
          <Ranking title="Menos atrasadas" icon={AlertTriangle} color="#DC2626" reverse rows={teamStats.map(stat => ({ name: stat.name, color: stat.color, value: stat.overdueTasks }))} />
        </div>
      </Panel>
    </div>
  );
}

function Ranking({ title, icon: Icon, color, rows, reverse = false }: { title: string; icon: LucideIcon; color: string; rows: Array<{ name: string; color: string; value: number }>; reverse?: boolean }) {
  const sorted = rows.slice().sort((a, b) => reverse ? a.value - b.value : b.value - a.value);
  const max = Math.max(...sorted.map(row => Math.abs(row.value)), 1);
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2" style={{ backgroundColor: `${color}12` }}>
        <Icon className="h-4 w-4" style={{ color }} />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="divide-y">
        {sorted.map((row, index) => {
          const width = Math.max(4, Math.abs(row.value) / max * 100);
          return (
            <div key={row.name} className="flex items-center gap-2 px-3 py-2">
              <span className={`w-6 text-center text-xs font-bold ${index === 0 ? "text-amber-600" : "text-muted-foreground"}`}>{index + 1}º</span>
              <Avatar name={row.name} color={row.color} size={26} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{row.name}</span>
                  <span className="text-sm font-bold" style={{ color }}>{row.value}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoryList({ items, clients }: { items: Array<{ id: string; title: string; date: string; type: string; clientId: string | null | undefined }>; clients: Map<string, Client> }) {
  if (items.length === 0) return <Empty text="Nenhum histórico encontrado para esta visão." />;
  return (
    <div className="space-y-2">
      {items.slice(0, 120).map(item => (
        <div key={item.id} className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge className="border-slate-200 bg-slate-50 text-slate-700">{item.type}</Badge>
              <ClientBadge client={clients.get(item.clientId || "")} fallback="Cliente" />
            </div>
            <p className="truncate text-sm font-medium" title={item.title}>{item.title}</p>
          </div>
          <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
        </div>
      ))}
    </div>
  );
}

function FocusList({ title, icon: Icon, items }: { title: string; icon: LucideIcon; items: Array<{ id: string; title: string; meta: string; right: string; clientId: string | null }> }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4" /> {title}</h3>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="truncate text-xs text-muted-foreground">{item.meta}</p>
            </div>
            <span className="text-xs font-bold text-red-600">{item.right}</span>
          </div>
        ))}
        {items.length === 0 && <Empty text="Nada crítico nesta visão." />}
      </div>
    </div>
  );
}

function ClientBadge({ client, fallback }: { client?: Client | null; fallback: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 rounded-md border bg-background px-2 py-1 text-xs font-medium">
      {client?.logoUrl ? (
        <img src={client.logoUrl} alt="" className="h-5 w-7 object-contain" />
      ) : (
        <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[9px] font-bold">{client?.initials || fallback.slice(0, 2).toUpperCase()}</span>
      )}
      <span className="max-w-[180px] truncate">{client?.name || fallback}</span>
    </span>
  );
}

function Avatar({ name, color, initials, size = 30, ring = false }: { name: string; color: string; initials?: string; size?: number; ring?: boolean }) {
  return (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${ring ? "ring-2 ring-offset-2" : ""}`}
      style={{ width: size, height: size, backgroundColor: color, ringColor: color }}
      title={name}
    >
      {initials || getInitials(name)}
    </span>
  );
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${className}`}>{children}</span>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border bg-card p-4"><h2 className="mb-3 text-sm font-semibold">{title}</h2>{children}</section>;
}

function Empty({ text }: { text: string }) {
  return <div className="py-8 text-center text-sm text-muted-foreground">{text}</div>;
}

function normalizeRows<T>(rows: unknown): T[] {
  return Array.isArray(rows) ? rows as T[] : [];
}

function normalizeAssignees(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return value ? [String(value)] : [];
}

function mapPdfDeliverable(row: PdfDeliverableRow, clients: Map<string, Client>): DeliverableView {
  const pdf = Array.isArray(row.pdf_imports) ? row.pdf_imports[0] : row.pdf_imports;
  const period = pdf?.report_period_month && pdf?.report_period_year
    ? ` - ${String(pdf.report_period_month).padStart(2, "0")}/${pdf.report_period_year}`
    : "";
  return {
    id: row.id,
    title: `${pdf?.file_name || "Relatório importado"}${period}`,
    clientId: row.matched_client_id,
    clientName: clients.get(row.matched_client_id)?.name || row.client_name_raw || "Cliente",
    date: pdf?.created_at || row.created_at,
    status: pdf?.status || "concluido",
    type: "pdf",
    assignedTo: [],
    url: pdf?.file_url,
    score: 0,
    stars: 0,
    thumbs: 0,
  };
}

function mapTaskDeliverable(task: Task, clients: Map<string, Client>): DeliverableView {
  return {
    id: task.id,
    title: task.title,
    clientId: task.client_id,
    clientName: clients.get(task.client_id)?.name || "Cliente",
    date: task.completed_at || task.created_at,
    status: "concluido",
    type: "task",
    assignedTo: task.assigned_to,
    score: 0,
    stars: 0,
    thumbs: 0,
  };
}

function mapDeliveryView(
  delivery: DeliveryRecord,
  items: DeliverableItem[],
  ratings: DeliverableRating[],
  clients: Map<string, Client>,
  tasks: Map<string, Task>,
  priorities: Map<string, PriorityRecord>,
): DeliverableView {
  const linkedItems = items.filter(item => item.deliverable_id === delivery.id);
  const clientId = linkedItems.reduce<string | null>((found, item) => {
    if (found) return found;
    if (item.item_type === "task") return tasks.get(item.item_id)?.client_id || null;
    if (item.item_type === "priority") return priorities.get(item.item_id)?.client_id || null;
    return null;
  }, null);
  const deliveryRatings = ratings.filter(rating => rating.deliverable_id === delivery.id);
  const stars = sumRatings(deliveryRatings, ["star"]);
  const thumbs = sumRatings(deliveryRatings, ["thumbs", "thumb"]);
  const superstars = sumRatings(deliveryRatings, ["super", "superstar"]);
  return {
    id: delivery.id,
    title: delivery.name,
    clientId,
    clientName: clientId ? clients.get(clientId)?.name || "Cliente" : delivery.requester || "Sem cliente vinculado",
    date: delivery.completed_at || delivery.updated_at || delivery.created_at,
    status: delivery.status,
    type: "delivery",
    assignedTo: normalizeAssignees(delivery.assigned_to),
    score: stars * 10 + superstars * 20 + thumbs,
    stars,
    thumbs,
  };
}

function calculateStats(input: {
  name: string;
  color: string;
  collaboratorId: string | null;
  isTeamView: boolean;
  assignments: Array<{ clientId: string; collaboratorId: string }>;
  activeClients: Client[];
  tasks: Task[];
  priorities: PriorityRecord[];
  deliverables: DeliverableView[];
  comments: Map<string, Array<{ id: string }>>;
}): PersonStats {
  const personTasks = input.isTeamView ? input.tasks : input.tasks.filter(task => assigneeMatches(task.assigned_to, input.name));
  const personPriorities = input.isTeamView ? input.priorities : input.priorities.filter(priority => assigneeMatches(priority.assigned_to, input.name));
  const personDeliverables = input.isTeamView ? input.deliverables : input.deliverables.filter(delivery => assigneeMatches(delivery.assignedTo, input.name));
  const openTasks = personTasks.filter(task => !task.completed);
  const doneTasks = personTasks.filter(task => task.completed);
  const openPriorities = personPriorities.filter(priority => !isClosed(priority.status));
  const donePriorities = personPriorities.filter(priority => isClosed(priority.status));
  const doneDeliverables = personDeliverables.filter(delivery => isClosed(delivery.status));
  const pendingDeliverables = personDeliverables.filter(delivery => !isClosed(delivery.status));
  const overdueTasks = openTasks.filter(task => task.due_date && new Date(task.due_date + "T23:59:59") < new Date()).length;
  const avgDays = openTasks.length
    ? Math.round(openTasks.reduce((sum, task) => sum + daysSince(task.created_at), 0) / openTasks.length)
    : 0;
  const clientIds = getLinkedClientIds({
    assignments: input.assignments,
    tasks: personTasks,
    priorities: personPriorities,
    deliverables: personDeliverables,
    selectedId: input.collaboratorId,
    isTeamView: input.isTeamView,
    activeClients: input.activeClients,
  });
  const pendingComments = [...clientIds].reduce((sum, id) => sum + (input.comments.get(id)?.length || 0), 0);
  const stars = personDeliverables.reduce((sum, delivery) => sum + delivery.stars, 0);
  const thumbs = personDeliverables.reduce((sum, delivery) => sum + delivery.thumbs, 0);
  const score = stars * 10 + thumbs + doneDeliverables.length * 2 + donePriorities.length * 3 - overdueTasks * 2;

  return {
    name: input.name,
    color: input.color,
    clients: clientIds.size,
    openTasks: openTasks.length,
    doneTasks: doneTasks.length,
    overdueTasks,
    avgDays,
    openPriorities: openPriorities.length,
    donePriorities: donePriorities.length,
    deliverables: personDeliverables.length,
    doneDeliverables: doneDeliverables.length,
    pendingDeliverables: pendingDeliverables.length,
    pendingComments,
    stars,
    thumbs,
    superstars: 0,
    score,
  };
}

function getLinkedClientIds(input: {
  assignments: Array<{ clientId: string; collaboratorId: string }>;
  tasks: Task[];
  priorities: PriorityRecord[];
  deliverables: DeliverableView[];
  selectedId: string | null;
  isTeamView: boolean;
  activeClients: Client[];
}) {
  if (input.isTeamView) return new Set(input.activeClients.map(client => client.id));
  const ids = input.assignments
    .filter(assignment => assignment.collaboratorId === input.selectedId)
    .map(assignment => assignment.clientId);
  input.tasks.forEach(task => ids.push(task.client_id));
  input.priorities.forEach(priority => {
    if (priority.client_id) ids.push(priority.client_id);
  });
  input.deliverables.forEach(delivery => {
    if (delivery.clientId) ids.push(delivery.clientId);
  });
  return new Set(ids);
}

function sumRatings(ratings: DeliverableRating[], types: string[]) {
  return ratings
    .filter(rating => types.some(type => rating.rating_type.toLowerCase().includes(type)))
    .reduce((sum, rating) => sum + Number(rating.value || 0), 0);
}

function sortPriority(a: PriorityRecord, b: PriorityRecord) {
  const statusRank = Number(isClosed(a.status)) - Number(isClosed(b.status));
  if (statusRank !== 0) return statusRank;
  const weightRank = (b.weight || 0) - (a.weight || 0);
  if (weightRank !== 0) return weightRank;
  const dateA = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
  const dateB = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
  return dateA - dateB;
}

function isClosed(status: string) {
  return ["concluida", "concluido", "cancelada", "cancelado", "imported"].includes(status);
}

function isCurrentMonth(date: string) {
  const target = new Date(date);
  const now = new Date();
  return target.getMonth() === now.getMonth() && target.getFullYear() === now.getFullYear();
}

function daysSince(date: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR");
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join("");
}
