import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, BookOpen, BriefcaseBusiness, Building2, CalendarDays, CheckCircle2,
  ChevronRight, ClipboardList, Clock3, FilterX, GitBranch, GraduationCap, History,
  Info, Layers3, ListChecks, Menu, MessageSquare, Pencil, Plus, RefreshCw, Search, ShieldAlert,
  Target, Users, Download, Upload, X, type LucideIcon,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  countsForUnit, fetchMasterPlanContext, sectorRecords, sectorUnits,
  type Challenge, type MasterPlanContext, type Unit,
} from "@/features/master-plan-preview/data";
import {
  nuclei, requestColumn, suggestedNucleus,
  type NucleusId, type PreviewCapability, type PreviewResponsibility,
} from "@/features/master-plan-preview/model";
import {
  emptyMasterPlanDraft, loadMasterPlanDraft, mergeMasterPlanDraft,
  parseMasterPlanDraft, saveMasterPlanDraft,
  type MasterPlanDraft, type RequestPlan,
} from "@/features/master-plan-preview/storage";
import { fetchRemoteMasterPlanDraft, updateRemoteMasterPlanDraft } from "@/features/master-plan-preview/remote";

type MainView = "empresa" | "nucleos" | "setores" | "responsabilidades" | "capacidades" | "capacitacoes" | "solicitacoes" | "cronologia" | "jornada" | "cobertura";
type DetailView = "nucleo" | "setor" | "responsabilidade" | "capacidade" | "pessoa" | "solicitacao";
type View = MainView | DetailView;
type DraftKind = "responsabilidade" | "capacidade" | "solicitacao" | "editarResponsabilidade" | "editarCapacidade" | "editarSolicitacao" | "capacitacao" | "assumir" | "planejamento";
type Go = (view: View, id?: string, tab?: string) => void;
type Draft = { kind: DraftKind; sectorId?: string; capabilityId?: string; responsibilityId?: string; requestId?: string } | null;

const navItems: Array<{ view: MainView; label: string; icon: LucideIcon }> = [
  { view: "empresa", label: "Visão geral", icon: Building2 },
  { view: "nucleos", label: "Núcleos", icon: Layers3 },
  { view: "setores", label: "Setores", icon: BriefcaseBusiness },
  { view: "responsabilidades", label: "Responsabilidades", icon: ShieldAlert },
  { view: "capacidades", label: "Capacidades", icon: BookOpen },
  { view: "capacitacoes", label: "Capacitações", icon: GraduationCap },
  { view: "solicitacoes", label: "Solicitações", icon: ClipboardList },
  { view: "cronologia", label: "Cronologia", icon: CalendarDays },
  { view: "jornada", label: "Minha jornada", icon: Users },
  { view: "cobertura", label: "Cobertura e sucessão", icon: GitBranch },
];
const navGroups: Array<{ label: string; views: MainView[] }> = [
  { label: "Organização", views: ["empresa", "nucleos", "setores", "responsabilidades", "capacidades"] },
  { label: "Trabalho", views: ["solicitacoes", "cronologia"] },
  { label: "Pessoas", views: ["capacitacoes", "jornada", "cobertura"] },
];
type TrailItem = { view: View; id: string; tab: string };
const detailViews: DetailView[] = ["nucleo", "setor", "responsabilidade", "capacidade", "pessoa", "solicitacao"];
const columns = [
  { id: "disponivel", label: "Abertas" }, { id: "andamento", label: "Em andamento" },
  { id: "validacao", label: "Em validação" }, { id: "concluida", label: "Concluídas" },
  { id: "encerrada", label: "Encerradas" },
] as const;
const dateLabel = (value: string | null | undefined) => {
  if (!value) return "Sem data";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? "Data indisponível" : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }).format(date);
};
const findSector = (context: MasterPlanContext, id: string | null) => context.units.find((item) => item.id === id);
const sectorName = (context: MasterPlanContext, id: string | null) => findSector(context, id)?.name ?? "Setor não localizado";
const personName = (context: MasterPlanContext, id: string | null | undefined) => context.collaborators.find((item) => item.id === id)?.name ?? "Não definido";
const textMatch = (value: string, search: string) => value.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"));

function viewLabel(item: TrailItem, context?: MasterPlanContext, responsibilities?: PreviewResponsibility[], capabilities?: PreviewCapability[], requests?: Challenge[]) {
  const main = navItems.find((entry) => entry.view === item.view);
  if (main) return main.label;
  if (item.view === "nucleo") return nuclei.find((entry) => entry.id === item.id)?.name ?? "Núcleo";
  if (item.view === "setor") return context?.units.find((entry) => entry.id === item.id)?.name ?? "Setor";
  if (item.view === "responsabilidade") return responsibilities?.find((entry) => entry.id === item.id)?.title ?? "Responsabilidade";
  if (item.view === "capacidade") return capabilities?.find((entry) => entry.id === item.id)?.title ?? "Capacidade";
  if (item.view === "solicitacao") return requests?.find((entry) => entry.id === item.id)?.title ?? "Solicitação";
  if (item.view === "pessoa") return context?.collaborators.find((entry) => entry.id === item.id)?.name ?? "Pessoa";
  return "Detalhe";
}

function Badge({ kind }: { kind: "real" | "proposal" | "local" | "undefined" }) {
  const styles = { real: "border-emerald-200 bg-emerald-50 text-emerald-800", proposal: "border-amber-200 bg-amber-50 text-amber-900", local: "border-sky-200 bg-sky-50 text-sky-800", undefined: "border-zinc-200 bg-zinc-100 text-zinc-600" };
  const labels = { real: "Cadastrado", proposal: "Proposta visual", local: "No Plano Mestre", undefined: "A definir" };
  return <span className={`inline-flex shrink-0 items-center border px-1.5 py-0.5 text-[10px] font-semibold ${styles[kind]}`}>{labels[kind]}</span>;
}

function Identity({ unit }: { unit: Unit }) {
  return <span className="flex min-w-0 items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden border bg-white">{unit.logo_url ? <img src={unit.logo_url} alt="" className="h-full w-full object-contain p-0.5" /> : <Building2 className="h-4 w-4 text-muted-foreground" />}</span><span className="min-w-0 break-words font-medium">{unit.name}</span></span>;
}

function Heading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b pb-4"><div className="min-w-0"><h2 className="text-xl font-semibold">{title}</h2>{subtitle && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>}</div>{action}</div>;
}

function Metric({ label, value, icon: Icon, onClick }: { label: string; value: string | number; icon: LucideIcon; onClick?: () => void }) {
  const body = <><span className="flex items-center gap-1.5 text-[11px] uppercase text-muted-foreground"><Icon className="h-4 w-4 shrink-0 text-emerald-700" />{label}</span><strong className="mt-2 block text-xl font-semibold">{value}</strong></>;
  return onClick ? <button type="button" onClick={onClick} className="min-w-0 border bg-white px-3 py-3 text-left hover:border-emerald-600">{body}</button> : <div className="min-w-0 border bg-white px-3 py-3">{body}</div>;
}

function Pathway({ items }: { items: Array<{ label: string; value: string; icon: LucideIcon; tone: string; onClick?: () => void }> }) {
  return <div className="mb-6 grid gap-2 md:grid-cols-3" aria-label="Caminho relacionado">{items.map(({ label, value, icon: Icon, tone, onClick }) => {
    const body = <><span className="flex items-center gap-2 text-[11px] font-semibold uppercase"><Icon className="h-4 w-4 shrink-0" />{label}</span><strong className="mt-2 block min-w-0 break-words text-sm leading-snug">{value}</strong>{onClick && <ArrowRight className="mt-2 h-4 w-4" />}</>;
    return onClick ? <button key={label} type="button" onClick={onClick} className={`min-w-0 border-l-4 px-4 py-3 text-left hover:brightness-95 ${tone}`}>{body}</button> : <div key={label} className={`min-w-0 border-l-4 px-4 py-3 ${tone}`}>{body}</div>;
  })}</div>;
}

function Row({ title, meta, onClick, icon: Icon = ChevronRight, badge }: { title: string; meta?: string; onClick: () => void; icon?: LucideIcon; badge?: ReactNode }) {
  return <button type="button" onClick={onClick} className="flex w-full min-w-0 items-center gap-3 border-b px-3 py-3 text-left last:border-0 hover:bg-muted/40"><Icon className="h-4 w-4 shrink-0 text-emerald-700" /><span className="min-w-0 flex-1"><span className="block break-words text-sm font-medium">{title}</span>{meta && <span className="mt-0.5 block break-words text-xs text-muted-foreground">{meta}</span>}</span>{badge}<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" /></button>;
}

function Empty({ children }: { children: ReactNode }) { return <div className="border bg-white px-4 py-5 text-sm text-muted-foreground">{children}</div>; }
function SectionTitle({ children }: { children: ReactNode }) { return <h3 className="mb-2 text-sm font-semibold">{children}</h3>; }
function Note({ children }: { children: ReactNode }) { return <div className="mb-5 border-l-2 border-amber-500 bg-white px-4 py-3 text-sm text-muted-foreground">{children}</div>; }
function SearchBox({ value, setValue, placeholder }: { value: string; setValue: (value: string) => void; placeholder: string }) { return <label className="relative block min-w-[220px] flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} className="h-9 rounded-none bg-white pl-9" /></label>; }

function RequestKanban({ context, requests, requestPlans, go }: { context: MasterPlanContext; requests: Challenge[]; requestPlans: Record<string, RequestPlan>; go: Go }) {
  return <div className="grid auto-cols-[minmax(245px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-3" aria-label="Kanban de solicitações">{columns.map((column) => { const items = requests.filter((item) => requestColumn(item.status) === column.id); return <section key={column.id} className="min-w-0 border bg-white"><div className="flex items-center justify-between border-b bg-zinc-50 px-3 py-2"><h3 className="text-xs font-semibold">{column.label}</h3><span className="text-xs text-muted-foreground">{items.length}</span></div><div className="max-h-[560px] space-y-2 overflow-y-auto p-2">{items.map((item) => { const plan = requestPlans[item.id]; return <button type="button" key={item.id} onClick={() => go("solicitacao", item.id)} className="w-full border-l-2 border-emerald-500 bg-[#f8faf9] px-3 py-2 text-left hover:bg-emerald-50"><span className="block break-words text-sm font-medium">{item.title}</span><span className="mt-1 block text-xs text-muted-foreground">{sectorName(context, item.client_id)}</span><span className="mt-1 flex flex-wrap gap-1"><Badge kind={item.id.startsWith("local-") ? "local" : "real"} />{plan?.blocker && <span className="text-[10px] text-rose-700">{plan.blocker}</span>}{!plan?.responsibilityId && <span className="text-[10px] text-amber-800">A classificar</span>}</span></button>; })}{items.length === 0 && <p className="px-2 py-4 text-xs text-muted-foreground">Sem solicitações</p>}</div></section>; })}</div>;
}

export default function PlanoMestrePreview() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawView = params.get("view") ?? "empresa";
  const view: View = navItems.some((item) => item.view === rawView) || detailViews.includes(rawView as DetailView) ? rawView as View : "empresa";
  const id = params.get("id") ?? "";
  const tab = params.get("tab") ?? "visao";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showDataInfo, setShowDataInfo] = useState(false);
  const [trail, setTrail] = useState<TrailItem[]>([]);
  const [draft, setDraft] = useState<Draft>(null);
  const [initialLoad] = useState(() => {
    try { return { value: loadMasterPlanDraft(), error: "" }; }
    catch { return { value: emptyMasterPlanDraft(), error: "O backup deste navegador está ilegível. Ele não foi apagado; o banco permanece separado." }; }
  });
  const [workspace, setWorkspace] = useState<MasterPlanDraft>(emptyMasterPlanDraft);
  const [hasEdited, setHasEdited] = useState(false);
  const [storageError, setStorageError] = useState(initialLoad.error);
  const importRef = useRef<HTMLInputElement>(null);
  const mutationQueue = useRef<Promise<unknown>>(Promise.resolve());
  const [selectedPerson, setSelectedPerson] = useState("");
  const { data, isLoading, isFetching, error, refetch } = useQuery({ queryKey: ["universo-ramos", "plano-mestre", "contexto"], queryFn: fetchMasterPlanContext, staleTime: 30_000 });
  const { data: remoteDraft, isLoading: isLoadingDraft, error: remoteError, refetch: refetchDraft } = useQuery({ queryKey: ["universo-ramos", "plano-mestre", "documento"], queryFn: fetchRemoteMasterPlanDraft, staleTime: 30_000 });
  const capabilities = workspace.capabilities;
  const responsibilities = workspace.responsibilities.map((item) => ({ ...item, ...workspace.responsibilityOverrides[item.id] }));
  const requests = data ? [...sectorRecords(data).challenges, ...workspace.requests] : [];
  const nucleusOf = (sector: Unit): NucleusId | "" => Object.prototype.hasOwnProperty.call(workspace.nucleusOverrides, sector.id) ? workspace.nucleusOverrides[sector.id] : suggestedNucleus(sector.name);
  const personId = selectedPerson || data?.collaborators[0]?.id || "";

  useEffect(() => {
    if (remoteDraft) setWorkspace((current) =>
      current.savedAt && current.savedAt > remoteDraft.savedAt ? current : remoteDraft);
  }, [remoteDraft]);

  const updateWorkspace = (update: (current: MasterPlanDraft) => MasterPlanDraft): Promise<MasterPlanDraft | null> => {
    const run = mutationQueue.current.then(async () => {
      if (!remoteDraft) { toast.error("O documento do Plano Mestre ainda não está disponível no banco."); return null; }
      try {
        const saved = await updateRemoteMasterPlanDraft(update);
        setWorkspace(saved);
        queryClient.setQueryData(["universo-ramos", "plano-mestre", "documento"], saved);
        setHasEdited(true);
        return saved;
      } catch (cause) {
        toast.error(cause instanceof Error ? cause.message : "Não foi possível salvar no banco.");
        return null;
      }
    });
    mutationQueue.current = run;
    return run;
  };

  useEffect(() => {
    if (!hasEdited) return;
    try {
      saveMasterPlanDraft(workspace);
      setStorageError("");
    } catch {
      setStorageError("A cópia local não pôde ser atualizada. Os dados continuam no banco; exporte um backup JSON.");
    }
  }, [workspace, hasEdited]);

  const exportDraft = () => {
    const content = JSON.stringify(workspace, null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `plano-mestre-ramos-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const importDraft = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 2_000_000) { toast.error("Arquivo acima de 2 MB. Verifique o backup antes de importar."); return; }
    try {
      const imported = parseMasterPlanDraft(JSON.parse(await file.text()));
      const saved = await updateWorkspace((current) => mergeMasterPlanDraft(current, imported));
      if (saved) toast.success("Backup importado e mesclado com os registros do banco.");
    } catch {
      toast.error("Backup inválido ou incompatível. Nenhum cadastro foi alterado.");
    }
  };

  const importBrowserBackup = async () => {
    const saved = await updateWorkspace((current) => mergeMasterPlanDraft(current, initialLoad.value));
    if (saved) toast.success("Rascunho deste navegador incorporado ao Plano Mestre.");
  };

  const go: Go = (next, nextId, nextTab) => {
    if (next === "empresa") {
      setTrail([]);
    } else if (view !== next || id !== (nextId ?? "")) {
      setTrail((items) => [...items.slice(-6), { view, id, tab }]);
    }
    const query = new URLSearchParams({ view: next });
    if (nextId) query.set("id", nextId);
    if (nextTab) query.set("tab", nextTab);
    navigate(`/universo-ramos/plano-mestre?${query.toString()}`);
    setMobileNavOpen(false);
  };

  const jumpTo = (item: TrailItem, index: number) => {
    setTrail((items) => items.slice(0, index));
    const query = new URLSearchParams({ view: item.view });
    if (item.id) query.set("id", item.id);
    if (item.tab !== "visao") query.set("tab", item.tab);
    navigate(`/universo-ramos/plano-mestre?${query.toString()}`);
  };

  const back = () => {
    const previous = trail.at(-1);
    if (previous) jumpTo(previous, trail.length - 1);
    else if (view === "empresa") navigate("/universo-ramos");
    else go("empresa");
  };

  const submitDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || !data) return;
    const fields = new FormData(event.currentTarget);
    const get = (name: string) => String(fields.get(name) ?? "").trim();
    const localId = `local-${crypto.randomUUID()}`;
    let saved: MasterPlanDraft | null = null;
    let destination: DetailView | null = null;
    if (draft.kind === "capacidade") {
      const sectorId = get("sectorId");
      saved = await updateWorkspace((value) => ({ ...value, capabilities: [...value.capabilities, { id: localId, title: get("title"), sectorIds: sectorId ? [sectorId] : [], sourceChallengeIds: [], status: "local" }] }));
      destination = "capacidade";
    } else if (draft.kind === "editarCapacidade" && draft.capabilityId) {
      saved = await updateWorkspace((value) => ({ ...value, capabilities: value.capabilities.map((item) => {
        if (item.id !== draft.capabilityId) return item;
        const sectorId = get("sectorId");
        return { ...item, title: get("title"), sectorIds: [sectorId, ...item.sectorIds.filter((id) => id !== item.sectorIds[0] && id !== sectorId)] };
      }) }));
    } else if (draft.kind === "responsabilidade") {
      saved = await updateWorkspace((value) => ({ ...value, responsibilities: [...value.responsibilities, { id: localId, title: get("title"), sectorId: get("sectorId"), capabilityIds: get("capabilityId") ? [get("capabilityId")] : [], sourceChallengeIds: [], holderId: null, substituteId: null, status: "local" }] }));
      destination = "responsabilidade";
    } else if (draft.kind === "editarResponsabilidade" && draft.responsibilityId) {
      saved = await updateWorkspace((value) => ({ ...value, responsibilities: value.responsibilities.map((item) => item.id === draft.responsibilityId ? { ...item, title: get("title"), sectorId: get("sectorId") } : item) }));
    } else if (draft.kind === "solicitacao") {
      saved = await updateWorkspace((value) => ({ ...value, requests: [...value.requests, { id: localId, client_id: get("sectorId"), title: get("title"), description: get("description"), status: "open", created_at: new Date().toISOString(), due_at: null, expected_deliverable: null, success_criteria: "", previewOnly: true }] }));
      destination = "solicitacao";
    } else if (draft.kind === "editarSolicitacao" && draft.requestId) {
      saved = await updateWorkspace((value) => ({ ...value, requests: value.requests.map((item) => item.id === draft.requestId ? { ...item, title: get("title"), client_id: get("sectorId"), description: get("description") } : item) }));
    } else if (draft.kind === "planejamento" && draft.requestId) {
      const next: RequestPlan = { responsibilityId: get("responsibilityId"), assigneeId: get("assigneeId"), plannedMonth: get("plannedMonth"), dueDate: get("dueDate"), priority: get("priority"), weight: get("weight"), budget: get("budget"), dependencyId: get("dependencyId"), blocker: get("blocker"), subtasks: get("subtasks"), comment: get("comment"), attachment: get("attachment") };
      saved = await updateWorkspace((value) => ({ ...value, requestPlans: { ...value.requestPlans, [draft.requestId!]: next } }));
    } else if (draft.kind === "capacitacao") {
      saved = await updateWorkspace((value) => ({ ...value, trainingRequests: [...value.trainingRequests, { personId: get("personId"), capabilityId: get("capabilityId") }] }));
    } else if (draft.kind === "assumir") {
      saved = await updateWorkspace((value) => ({ ...value, claims: [...value.claims, { personId: get("personId"), responsibilityId: get("responsibilityId") }] }));
    }
    if (!saved) return;
    if (destination) go(destination, localId);
    toast.success("Salvo no Plano Mestre.");
    setDraft(null);
  };

  const page = data && remoteDraft ? <WorkspaceContent context={data} view={view} id={id} tab={tab} go={go} openDraft={setDraft} nucleiOf={nucleusOf} setNucleus={(sectorId, nucleusId) => { void updateWorkspace((value) => ({ ...value, nucleusOverrides: { ...value.nucleusOverrides, [sectorId]: nucleusId } })); }} nucleusThresholds={workspace.nucleusThresholds} setNucleusThreshold={(nucleusId, threshold) => { void updateWorkspace((value) => ({ ...value, nucleusThresholds: { ...value.nucleusThresholds, [nucleusId]: threshold } })); }} capabilities={capabilities} responsibilities={responsibilities} requests={requests} requestPlans={workspace.requestPlans} setResponsibility={(responsibilityId, patch) => { void updateWorkspace((value) => ({ ...value, responsibilityOverrides: { ...value.responsibilityOverrides, [responsibilityId]: { ...value.responsibilityOverrides[responsibilityId], ...patch } } })); }} trainingRequests={workspace.trainingRequests} claims={workspace.claims} personId={personId} setPersonId={setSelectedPerson} /> : null;
  const visibleTrail = trail.map((item, index) => ({ item, index })).filter(({ item }) => item.view !== "empresa").slice(-3);

  return <AppLayout><div className="flex h-full min-h-0 flex-col bg-[#f8faf9]">
    <header className="shrink-0 border-b bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => navigate("/universo-ramos")} aria-label="Voltar ao Universo Ramos" title="Voltar ao Universo Ramos" className="grid h-9 w-9 shrink-0 place-items-center border hover:bg-muted"><ArrowLeft className="h-4 w-4" /></button>
          <div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate text-lg font-semibold">Plano Mestre</h1><span className="border-l-2 border-emerald-500 pl-2 text-[11px] font-semibold text-emerald-700">CADASTROS COMPARTILHADOS</span></div><p className="text-xs text-muted-foreground">Universo Ramos · dados salvos no banco</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden text-xs text-muted-foreground xl:inline">{workspace.savedAt ? `Atualizado em ${dateLabel(workspace.savedAt)}` : "Pronto para cadastrar"}</span>
          {initialLoad.value.savedAt && <Button variant="outline" size="sm" onClick={importBrowserBackup} title="Trazer rascunho deste navegador para o banco">Trazer rascunho local</Button>}
          <Button variant="outline" size="sm" onClick={exportDraft} title="Exportar backup JSON" aria-label="Exportar backup JSON"><Download className="h-4 w-4" /><span className="hidden sm:inline"> Backup</span></Button>
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} title="Importar backup JSON" aria-label="Importar backup JSON"><Upload className="h-4 w-4" /></Button>
          <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={importDraft} aria-label="Arquivo de backup do Plano Mestre" />
          <Button variant="outline" size="sm" onClick={() => setShowDataInfo((open) => !open)} title="Entenda os dados" aria-label="Entenda os dados"><Info className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => { void refetch(); void refetchDraft(); }} title="Atualizar registros" aria-label="Atualizar registros" disabled={isFetching}><RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /></Button>
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileNavOpen((open) => !open)}><Menu className="h-4 w-4" /> Páginas</Button>
        </div>
      </div>
    </header>
    <div className="relative flex min-h-0 flex-1"><aside className={`${mobileNavOpen ? "block" : "hidden"} absolute inset-x-0 top-0 z-30 max-h-[70vh] overflow-y-auto border-b bg-white shadow-lg lg:static lg:block lg:max-h-none lg:w-52 lg:shrink-0 lg:border-b-0 lg:border-r lg:shadow-none`}><nav aria-label="Páginas do Plano Mestre" className="space-y-4 p-3">{navGroups.map((group) => <div key={group.label}><div className="px-3 pb-1 text-[10px] font-semibold uppercase text-muted-foreground">{group.label}</div>{group.views.map((itemView) => { const item = navItems.find((entry) => entry.view === itemView)!; const Icon = item.icon; const active = view === itemView || (itemView === "nucleos" && view === "nucleo") || (itemView === "setores" && view === "setor") || (itemView === "responsabilidades" && view === "responsabilidade") || (itemView === "capacidades" && view === "capacidade") || (itemView === "solicitacoes" && view === "solicitacao") || (itemView === "jornada" && view === "pessoa"); return <button key={itemView} type="button" onClick={() => go(itemView)} className={`flex min-h-9 w-full items-center gap-2.5 border-l-[3px] px-3 text-left text-xs font-medium ${active ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-transparent hover:bg-muted"}`}><Icon className="h-4 w-4 shrink-0" />{item.label}</button>; })}</div>)}</nav></aside>
      <main className="min-w-0 flex-1 overflow-auto"><div className="mx-auto max-w-[1450px] px-4 pb-16 pt-4 sm:px-6">
        <div className="mb-4 flex min-h-9 min-w-0 items-center gap-2 border-b pb-3 text-xs"><button type="button" onClick={back} className="inline-flex h-7 shrink-0 items-center gap-1 border px-2 font-medium hover:bg-muted"><ArrowLeft className="h-3.5 w-3.5" /> Voltar</button><div className="flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap text-muted-foreground"><button type="button" onClick={() => go("empresa")} className="hover:text-foreground">Início</button>{visibleTrail.map(({ item, index }) => <span key={`${item.view}-${item.id}-${index}`} className="inline-flex items-center gap-1"><ChevronRight className="h-3 w-3" /><button type="button" onClick={() => jumpTo(item, index)} className="max-w-36 truncate hover:text-foreground">{viewLabel(item, data, responsibilities, capabilities, requests)}</button></span>)}{view !== "empresa" && <><ChevronRight className="h-3 w-3 shrink-0" /><strong className="max-w-48 truncate text-foreground">{viewLabel({ view, id, tab }, data, responsibilities, capabilities, requests)}</strong></>}</div></div>
        {storageError && <div role="alert" className="mb-4 border-l-4 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-900">{storageError}</div>}
        {showDataInfo && <div className="mb-5 flex flex-wrap items-center gap-3 border-l-2 border-sky-600 bg-sky-50 px-4 py-3 text-xs"><span><strong>Do banco operacional:</strong> setores, desafios, tarefas, comentários e colaboradores.</span><span><strong>Do Plano Mestre:</strong> núcleos, capacidades, responsabilidades, pedidos e planejamento, em um documento versionado com histórico.</span><span><strong>Backup:</strong> exporte o JSON para guardar uma cópia fora do navegador.</span></div>}
        {(isLoading || isLoadingDraft) && <Empty>Carregando o Universo Ramos...</Empty>}
        {error && <div role="alert" className="border-l-2 border-rose-600 bg-white p-4 text-sm">Não foi possível ler os dados atuais: {error instanceof Error ? error.message : "erro desconhecido"}. <Button variant="outline" size="sm" onClick={() => refetch()}>Tentar novamente</Button></div>}
        {remoteError && <div role="alert" className="border-l-2 border-rose-600 bg-white p-4 text-sm">Plano Mestre indisponível no banco: {remoteError instanceof Error ? remoteError.message : "erro desconhecido"}. A migração SQL precisa ser aplicada antes do uso. <Button variant="outline" size="sm" onClick={() => refetchDraft()}>Tentar novamente</Button></div>}
        {page}
      </div></main>
    </div>
    <DraftDialog draft={draft} close={() => setDraft(null)} submit={submitDraft} context={data} capabilities={capabilities} responsibilities={responsibilities} requests={requests} requestPlans={workspace.requestPlans} personId={personId} />
  </div></AppLayout>;
}

interface WorkspaceProps {
  context: MasterPlanContext; view: View; id: string; tab: string; go: Go; openDraft: (draft: Draft) => void;
  nucleiOf: (sector: Unit) => NucleusId | ""; setNucleus: (sectorId: string, nucleusId: NucleusId | "") => void;
  nucleusThresholds: Partial<Record<NucleusId, number>>; setNucleusThreshold: (nucleusId: NucleusId, threshold: number) => void;
  capabilities: PreviewCapability[]; responsibilities: PreviewResponsibility[]; requests: Challenge[];
  requestPlans: Record<string, RequestPlan>; setResponsibility: (id: string, patch: Partial<PreviewResponsibility>) => void;
  trainingRequests: Array<{ personId: string; capabilityId: string }>; claims: Array<{ personId: string; responsibilityId: string }>;
  personId: string; setPersonId: (id: string) => void;
}

function WorkspaceContent(props: WorkspaceProps) {
  switch (props.view) {
    case "empresa": return <Overview {...props} />;
    case "nucleos": return <Nuclei {...props} />;
    case "nucleo": return <NucleusDetail {...props} />;
    case "setores": return <Sectors {...props} />;
    case "setor": return <SectorDetail {...props} />;
    case "responsabilidades": return <Responsibilities {...props} />;
    case "responsabilidade": return <ResponsibilityDetail {...props} />;
    case "capacidades": return <Capabilities {...props} />;
    case "capacidade": return <CapabilityDetail {...props} />;
    case "capacitacoes": return <Training {...props} />;
    case "solicitacoes": return <Requests {...props} />;
    case "solicitacao": return <RequestDetail {...props} />;
    case "cronologia": return <Chronology {...props} />;
    case "jornada": return <Journey {...props} />;
    case "pessoa": return <PersonDetail {...props} />;
    case "cobertura": return <Coverage {...props} />;
  }
}

function Overview({ context, go, nucleiOf, responsibilities, capabilities, requests, openDraft }: WorkspaceProps) {
  const sectors = sectorUnits(context);
  const ungrouped = sectors.filter((sector) => !nucleiOf(sector));
  const steps: Array<{ title: string; subtitle: string; view: MainView; icon: LucideIcon; color: string }> = [
    { title: "Setores", subtitle: `${sectors.length} cadastrados`, view: "setores", icon: Building2, color: "border-teal-500 text-teal-700" },
    { title: "Capacidades", subtitle: `${capabilities.length} ${capabilities.length === 1 ? "mapeada" : "mapeadas"}`, view: "capacidades", icon: BookOpen, color: "border-violet-500 text-violet-700" },
    { title: "Responsabilidades", subtitle: `${responsibilities.length} ${responsibilities.length === 1 ? "mapeada" : "mapeadas"}`, view: "responsabilidades", icon: ShieldAlert, color: "border-orange-500 text-orange-700" },
    { title: "Solicitações", subtitle: `${requests.length} desafios de origem`, view: "solicitacoes", icon: ClipboardList, color: "border-sky-500 text-sky-700" },
  ];
  return <>
    <Heading title="Mapa da Ramos" subtitle="Setores e pessoas já existem. Escolha um setor para começar o mapeamento de capacidades e responsabilidades." action={<Button size="sm" onClick={() => openDraft({ kind: "capacidade" })}><Plus className="h-4 w-4" /> Nova capacidade</Button>} />
    <div className="mb-8 grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Caminho da organização">
      {steps.map(({ title, subtitle, view, icon: Icon, color }, index) => <button key={view} type="button" onClick={() => go(view)} className={`flex min-h-20 items-center gap-3 border-l-4 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${color}`}><span className="grid h-9 w-9 shrink-0 place-items-center border bg-white"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><strong className="block text-sm text-foreground">{title}</strong><span className="block text-xs text-muted-foreground">{subtitle}</span></span><ChevronRight className="h-4 w-4 shrink-0" /></button>)}
    </div>
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h3 className="text-base font-semibold">Núcleos e setores</h3><p className="text-xs text-muted-foreground">Os setores são reais; o agrupamento em núcleos está em discussão.</p></div><Button variant="outline" size="sm" onClick={() => go("nucleos")}>Organizar núcleos <ArrowRight className="h-4 w-4" /></Button></div>
    <div className="grid gap-4 xl:grid-cols-3">{nuclei.map((nucleus) => { const members = sectors.filter((sector) => nucleiOf(sector) === nucleus.id); return <section key={nucleus.id} className="min-w-0"><button type="button" onClick={() => go("nucleo", nucleus.id)} className={`flex min-h-16 w-full items-center justify-between border-b px-4 py-3 text-left ${nucleus.color}`}><span><strong className="block text-sm">{nucleus.name}</strong><small className="text-xs">{members.length} setores associados</small></span><ArrowRight className="h-4 w-4" /></button><div className="grid gap-2 pt-3">{members.map((sector) => { const counts = countsForUnit(context, sector.id); return <button key={sector.id} type="button" onClick={() => go("setor", sector.id)} className="flex min-h-16 items-center gap-3 border bg-white px-3 py-2 text-left hover:border-emerald-500 hover:bg-emerald-50/30"><Identity unit={sector} /><span className="ml-auto shrink-0 text-right text-[11px] text-muted-foreground"><strong className="block text-base text-foreground">{counts.challenges}</strong>desafios</span></button>; })}{members.length === 0 && <p className="px-2 py-4 text-xs text-muted-foreground">Sem setores associados.</p>}</div></section>; })}</div>
    {ungrouped.length > 0 && <section className="mt-6 border-t pt-4"><div className="mb-3 flex items-center gap-2"><h3 className="text-sm font-semibold">Aguardando núcleo</h3><span className="text-xs text-muted-foreground">{ungrouped.length} setor(es)</span></div><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{ungrouped.map((sector) => <button key={sector.id} type="button" onClick={() => go("setor", sector.id)} className="flex min-h-14 items-center justify-between gap-2 border bg-white px-3 text-left hover:border-emerald-500"><Identity unit={sector} /><ChevronRight className="h-4 w-4 shrink-0" /></button>)}</div></section>}
    <section className="mt-8 border-t pt-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold">Pessoas da Ramos</h3><p className="text-xs text-muted-foreground">{context.collaborators.length} {context.collaborators.length === 1 ? "colaborador ativo" : "colaboradores ativos"} no cadastro atual.</p></div><Button variant="outline" size="sm" onClick={() => go("jornada")}>Ver jornada <ArrowRight className="h-4 w-4" /></Button></div><div className="flex flex-wrap gap-2">{context.collaborators.map((person) => <button key={person.id} type="button" onClick={() => go("pessoa", person.id)} className="inline-flex min-h-10 items-center gap-2 border bg-white px-2.5 py-1.5 text-xs font-medium hover:border-sky-500 hover:bg-sky-50"><span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full bg-sky-100 text-sky-800">{person.photo_url ? <img src={person.photo_url} alt="" className="h-full w-full object-cover" /> : person.name.charAt(0)}</span>{person.name}</button>)}</div></section>
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><div><h3 className="text-sm font-semibold">Onde a equipe ainda precisa de definição</h3><p className="text-xs text-muted-foreground">Titulares, substitutos e habilitações não são inferidos das tarefas.</p></div><Button size="sm" variant="outline" onClick={() => go("cobertura")}>Abrir cobertura <ArrowRight className="h-4 w-4" /></Button></div>
  </>;
}

function Nuclei({ context, go, nucleiOf, setNucleus }: WorkspaceProps) {
  const sectors = sectorUnits(context);
  const groups = [...nuclei.map((nucleus) => ({ id: nucleus.id, name: nucleus.name, color: nucleus.color })), { id: "", name: "Ainda sem núcleo", color: "border-zinc-300 bg-zinc-100 text-zinc-700" }] as const;
  return <><Heading title="Núcleos" subtitle="Uma visão do desenho da empresa. Cada setor abaixo é o mesmo cadastro que já existe no Universo Ramos." />
    <div className="space-y-5">{groups.map((group) => { const members = sectors.filter((sector) => nucleiOf(sector) === group.id); return <section key={group.id || "sem-nucleo"} className="border-t-4 border bg-white" style={{ borderTopColor: group.id === "tecnico" ? "#c026d3" : group.id === "suporte" ? "#0284c7" : group.id === "administrativo" ? "#0d9488" : "#a1a1aa" }}><div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3"><button type="button" onClick={() => group.id && go("nucleo", group.id)} className="flex items-center gap-2 text-left text-sm font-semibold hover:text-emerald-700">{group.name}{group.id && <ArrowRight className="h-4 w-4" />}</button><span className="text-xs text-muted-foreground">{members.length} setor(es)</span></div><div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">{members.map((sector) => { const counts = countsForUnit(context, sector.id); return <div key={sector.id} className="min-w-0 border bg-[#fbfcfc] p-3"><button type="button" onClick={() => go("setor", sector.id)} className="flex w-full items-start justify-between gap-2 text-left hover:text-emerald-700"><Identity unit={sector} /><ChevronRight className="h-4 w-4 shrink-0" /></button><div className="mt-3 flex items-center justify-between gap-2 border-t pt-2"><span className="text-xs text-muted-foreground">{counts.challenges} desafios · {counts.tasks} tarefas</span><select aria-label={`Núcleo de ${sector.name}`} value={nucleiOf(sector)} onChange={(event) => { const value = event.target.value; if (value === "" || nuclei.some((item) => item.id === value)) setNucleus(sector.id, value as NucleusId | ""); }} className="h-8 max-w-32 border bg-white px-1 text-[11px]"><option value="">A definir</option>{nuclei.map((nucleus) => <option key={nucleus.id} value={nucleus.id}>{nucleus.name}</option>)}</select></div></div>; })}{members.length === 0 && <p className="p-3 text-xs text-muted-foreground">Nenhum setor associado.</p>}</div></section>; })}</div>
  </>;
}

function NucleusDetail({ context, go, id, nucleiOf, responsibilities, openDraft, nucleusThresholds, setNucleusThreshold }: WorkspaceProps) {
  const [threshold, setThreshold] = useState("");
  const nucleus = nuclei.find((item) => item.id === id);
  useEffect(() => { setThreshold(nucleus ? String(nucleusThresholds[nucleus.id] ?? "") : ""); }, [nucleus, nucleusThresholds]);
  if (!nucleus) return <Empty>Núcleo não encontrado.</Empty>;
  const members = sectorUnits(context).filter((sector) => nucleiOf(sector) === nucleus.id);
  const mapped = responsibilities.filter((item) => members.some((sector) => sector.id === item.sectorId));
  const tone = nucleus.id === "tecnico" ? "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-900" : nucleus.id === "suporte" ? "border-sky-500 bg-sky-50 text-sky-900" : "border-teal-500 bg-teal-50 text-teal-900";
  return <>
    <Heading title={nucleus.name} subtitle="Setores reunidos para coordenar trabalho, capacidades e cobertura." />
    <div className={`mb-6 grid gap-4 border-l-4 p-5 lg:grid-cols-[1fr_280px] ${tone}`}>
      <div><div className="flex items-center gap-2"><Layers3 className="h-5 w-5" /><strong className="text-base">{members.length} setores neste núcleo</strong></div><p className="mt-2 text-sm">{mapped.length} responsabilidades mapeadas no Plano Mestre. A liderança depende de cobertura real, ainda não cadastrada.</p><div className="mt-4 flex flex-wrap gap-2">{members.map((sector) => <button key={sector.id} type="button" onClick={() => go("setor", sector.id)} className="border border-current bg-white px-2 py-1 text-xs font-medium hover:underline">{sector.name}</button>)}</div></div>
      <div className="border-t border-current/20 pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0"><label className="block text-xs font-semibold">Cobertura mínima para liderança<Input type="number" min="1" max="100" value={threshold} onChange={(event) => setThreshold(event.target.value)} onBlur={() => { const value = Number(threshold); if (nucleus && Number.isInteger(value) && value >= 1 && value <= 100 && value !== nucleusThresholds[nucleus.id]) setNucleusThreshold(nucleus.id, value); }} placeholder="Definir percentual" className="mt-2 rounded-none bg-white" /></label><p className="mt-2 text-xs">{nucleusThresholds[nucleus.id] ? `Critério salvo: ${nucleusThresholds[nucleus.id]}% das responsabilidades.` : "Ainda não há percentual ou líder confirmado."}</p><button type="button" onClick={() => go("cobertura")} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold underline">Analisar cobertura <ArrowRight className="h-3.5 w-3.5" /></button></div>
    </div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]"><section><div className="mb-3 flex items-center justify-between"><SectionTitle>Setores</SectionTitle><span className="text-xs text-muted-foreground">{members.length} no agrupamento</span></div><div className="grid gap-3 sm:grid-cols-2">{members.map((sector) => { const counts = countsForUnit(context, sector.id); return <button key={sector.id} type="button" onClick={() => go("setor", sector.id)} className="min-w-0 border bg-white p-4 text-left shadow-sm transition hover:border-emerald-500 hover:shadow-md"><Identity unit={sector} /><span className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground"><span>{counts.challenges} desafio(s) · {counts.tasks} tarefa(s)</span><ArrowRight className="h-4 w-4" /></span></button>; })}{members.length === 0 && <Empty>Associe setores na página Núcleos.</Empty>}</div></section><section><div className="mb-3 flex items-center justify-between gap-2"><SectionTitle>Responsabilidades</SectionTitle><button type="button" onClick={() => openDraft({ kind: "responsabilidade", sectorId: members[0]?.id })} className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 hover:underline"><Plus className="h-3.5 w-3.5" /> Nova</button></div><div className="space-y-2">{mapped.slice(0, 6).map((item) => <button key={item.id} type="button" onClick={() => go("responsabilidade", item.id)} className="flex min-h-14 w-full items-center justify-between gap-2 border-l-4 border-orange-500 bg-white px-3 py-2 text-left text-xs hover:bg-orange-50"><span className="min-w-0"><strong className="block break-words">{item.title}</strong><span className="text-muted-foreground">{sectorName(context, item.sectorId)}</span></span><ChevronRight className="h-4 w-4 shrink-0" /></button>)}{mapped.length === 0 && <Empty>Nenhuma responsabilidade mapeada neste núcleo. Comece por um setor.</Empty>}</div>{mapped.length > 6 && <button type="button" onClick={() => go("responsabilidades")} className="mt-3 text-xs font-semibold text-orange-700 hover:underline">Ver todas <ArrowRight className="inline h-3.5 w-3.5" /></button>}</section></div>
  </>;
}

function Sectors({ context, go, nucleiOf, responsibilities }: WorkspaceProps) {
  const [search, setSearch] = useState("");
  const sectors = sectorUnits(context).filter((item) => textMatch(item.name, search));
  return <><Heading title="Setores" subtitle="Escolha um setor para acompanhar responsabilidades, capacidades e solicitações relacionadas." /><SearchBox value={search} setValue={setSearch} placeholder="Buscar setor" /><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{sectors.map((sector) => { const nucleus = nuclei.find((item) => item.id === nucleiOf(sector)); const count = countsForUnit(context, sector.id); const linked = responsibilities.filter((item) => item.sectorId === sector.id).length; return <button type="button" key={sector.id} onClick={() => go("setor", sector.id)} className="flex min-h-36 min-w-0 flex-col border-t-4 border-teal-500 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><Identity unit={sector} /><span className="mt-3 text-xs text-teal-700">{nucleus?.name ?? "Núcleo a definir"}</span><span className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground"><span>{linked} responsabilidade(s) · {count.challenges} desafio(s)</span><ArrowRight className="h-4 w-4 shrink-0" /></span></button>; })}</div>{sectors.length === 0 && <Empty>Nenhum setor encontrado.</Empty>}</>;
}

function SectorOverview({ sector, responsibilities, capabilities, requests, tasks, comments, go, openDraft }: {
  sector: Unit; responsibilities: PreviewResponsibility[]; capabilities: PreviewCapability[];
  requests: Challenge[]; tasks: number; comments: number; go: Go; openDraft: (draft: Draft) => void;
}) {
  const layers: Array<{ title: string; source: string; tone: string; icon: LucideIcon; items: Array<{ id: string; title: string }>; view: DetailView; tab: string; draftKind?: DraftKind }> = [
    { title: "Capacidades", source: "O que é preciso saber fazer", tone: "border-violet-500 bg-violet-50 text-violet-900", icon: BookOpen, items: capabilities, view: "capacidade", tab: "capacidades", draftKind: "capacidade" },
    { title: "Responsabilidades", source: "Quem sustenta o trabalho", tone: "border-orange-500 bg-orange-50 text-orange-900", icon: ShieldAlert, items: responsibilities, view: "responsabilidade", tab: "responsabilidades", draftKind: "responsabilidade" },
    { title: "Solicitações", source: "O que precisa avançar", tone: "border-sky-500 bg-sky-50 text-sky-900", icon: ClipboardList, items: requests, view: "solicitacao", tab: "solicitacoes" },
  ];
  return <>
    <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-b pb-4 text-xs text-muted-foreground"><span><strong className="mr-1 text-base text-foreground">{requests.length}</strong> desafios</span><span><strong className="mr-1 text-base text-foreground">{tasks}</strong> tarefas</span><span><strong className="mr-1 text-base text-foreground">{comments}</strong> comentários</span><button type="button" onClick={() => go("setor", sector.id, "historico")} className="ml-auto inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline">Ver histórico <ArrowRight className="h-3.5 w-3.5" /></button></div>
    <div className="divide-y border-y">{layers.map((layer) => { const Icon = layer.icon; return <section key={layer.title} className="grid gap-3 bg-white px-3 py-4 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-5"><button type="button" onClick={() => go("setor", sector.id, layer.tab)} className={`flex min-h-20 items-center justify-between gap-3 border-l-4 px-4 py-3 text-left hover:brightness-95 ${layer.tone}`}><span><span className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 shrink-0" />{layer.title}</span><span className="mt-1 block text-xs">{layer.source}</span></span><strong className="text-xl">{layer.items.length}</strong></button><div className="flex min-w-0 flex-wrap items-stretch gap-2">{layer.items.slice(0, 4).map((item) => <button key={item.id} type="button" onClick={() => go(layer.view, item.id)} className={`flex min-h-14 min-w-40 flex-1 items-center justify-between gap-2 border-l-2 px-3 py-2 text-left text-xs font-medium hover:brightness-95 ${layer.tone}`}><span className="min-w-0 break-words">{item.title}</span><ChevronRight className="h-4 w-4 shrink-0" /></button>)}{layer.items.length === 0 && (layer.draftKind ? <button type="button" onClick={() => openDraft({ kind: layer.draftKind!, sectorId: sector.id })} className={`inline-flex min-h-14 items-center gap-2 border-l-2 px-3 text-left text-xs font-semibold hover:brightness-95 ${layer.tone}`}><Plus className="h-4 w-4 shrink-0" /> Cadastrar primeira {layer.draftKind}</button> : <p className="self-center px-2 text-xs text-muted-foreground">Nenhum desafio neste setor.</p>)}{layer.items.length > 4 && <button type="button" onClick={() => go("setor", sector.id, layer.tab)} className="inline-flex items-center gap-1 px-2 text-xs font-semibold text-emerald-700 hover:underline">Ver mais {layer.items.length - 4} <ArrowRight className="h-3.5 w-3.5" /></button>}</div></section>; })}</div>
  </>;
}

function SectorDetail({ context, go, id, tab, nucleiOf, capabilities, responsibilities, requests, requestPlans, openDraft }: WorkspaceProps) {
  const sector = sectorUnits(context).find((item) => item.id === id);
  if (!sector) return <Empty>Setor não encontrado no cadastro atual.</Empty>;
  const nucleus = nuclei.find((item) => item.id === nucleiOf(sector));
  const sectorResponsibilities = responsibilities.filter((item) => item.sectorId === id);
  const sectorCapabilities = capabilities.filter((item) => item.sectorIds.includes(id));
  const sectorRequests = requests.filter((item) => item.client_id === id);
  const tasks = context.tasks.filter((item) => item.client_id === id);
  const comments = context.comments.filter((item) => item.client_id === id);
  const tabs = [{ id: "visao", label: "Visão geral" }, { id: "responsabilidades", label: "Responsabilidades" }, { id: "capacidades", label: "Capacidades" }, { id: "solicitacoes", label: "Solicitações" }, { id: "pessoas", label: "Pessoas" }, { id: "historico", label: "Histórico" }];
  return <><Heading title={sector.name} subtitle={`${nucleus?.name ?? "Núcleo a definir"} · setor existente no Universo Ramos`} action={<Badge kind="real" />} /><div className="mb-5 flex gap-1 overflow-x-auto border-b" role="tablist" aria-label={`Abas de ${sector.name}`}>{tabs.map((item) => <button role="tab" aria-selected={tab === item.id} key={item.id} type="button" onClick={() => go("setor", id, item.id)} className={`shrink-0 border-b-2 px-3 py-2 text-xs font-medium ${tab === item.id ? "border-emerald-600 text-emerald-800" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{item.label}</button>)}</div>
    {tab === "visao" && <SectorOverview sector={sector} responsibilities={sectorResponsibilities} capabilities={sectorCapabilities} requests={sectorRequests} tasks={tasks.length} comments={comments.length} go={go} openDraft={openDraft} />}
    {tab === "responsabilidades" && <><div className="mb-3"><Button size="sm" onClick={() => openDraft({ kind: "responsabilidade", sectorId: id })}><Plus className="h-4 w-4" /> Cadastrar responsabilidade</Button></div><div className="border bg-white">{sectorResponsibilities.map((item) => <Row key={item.id} title={item.title} meta={`${item.capabilityIds.length} capacidade(s) vinculada(s) · titular ${personName(context, item.holderId)}`} onClick={() => go("responsabilidade", item.id)} badge={<Badge kind={item.status === "local" ? "local" : "proposal"} />} />)}{sectorResponsibilities.length === 0 && <Empty>Nenhuma responsabilidade mapeada neste setor.</Empty>}</div></>}
    {tab === "capacidades" && <><div className="mb-3"><Button size="sm" onClick={() => openDraft({ kind: "capacidade", sectorId: id })}><Plus className="h-4 w-4" /> Cadastrar capacidade</Button></div><div className="border bg-white">{sectorCapabilities.map((item) => <Row key={item.id} title={item.title} meta={"Capacidade salva no Plano Mestre"} onClick={() => go("capacidade", item.id)} badge={<Badge kind={item.status === "local" ? "local" : "proposal"} />} />)}{sectorCapabilities.length === 0 && <Empty>Capacidades necessárias ainda não foram mapeadas.</Empty>}</div></>}
    {tab === "solicitacoes" && <><div className="mb-3 flex gap-2"><Button size="sm" onClick={() => go("solicitacoes", undefined, id)}>Abrir Kanban do setor <ArrowRight className="h-4 w-4" /></Button><Button size="sm" variant="outline" onClick={() => openDraft({ kind: "solicitacao", sectorId: id })}><Plus className="h-4 w-4" /> Registrar solicitação</Button></div><RequestKanban context={context} requests={sectorRequests} requestPlans={requestPlans} go={go} /></>}
    {tab === "pessoas" && <><Note>Nenhum vínculo de titular, substituto ou habilitação foi confirmado. Tarefas atribuídas não comprovam responsabilidade setorial.</Note><div className="border bg-white">{context.collaborators.map((person) => <Row key={person.id} title={person.name} meta="Colaborador ativo; vínculo com o setor a definir" onClick={() => go("pessoa", person.id)} badge={<Badge kind="undefined" />} />)}</div></>}
    {tab === "historico" && <div className="grid gap-6 lg:grid-cols-2"><section><SectionTitle>Tarefas cadastradas ({tasks.length})</SectionTitle><div className="border bg-white">{tasks.map((item) => <div key={item.id} className="border-b px-3 py-3 text-sm last:border-0"><p className="font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.completed ? "Concluída" : "Pendente"} · {dateLabel(item.created_at)}</p></div>)}{tasks.length === 0 && <Empty>Sem tarefas neste setor.</Empty>}</div></section><section><SectionTitle>Comentários cadastrados ({comments.length})</SectionTitle><div className="border bg-white">{comments.map((item) => <div key={item.id} className="border-b px-3 py-3 text-sm last:border-0"><p className="whitespace-pre-wrap">{item.comment_text}</p><p className="mt-1 text-xs text-muted-foreground">{item.author_name} · {dateLabel(item.created_at)}</p></div>)}{comments.length === 0 && <Empty>Sem comentários neste setor.</Empty>}</div></section></div>}
  </>;
}

function Responsibilities({ context, go, responsibilities, capabilities, openDraft }: WorkspaceProps) {
  const [sectorId, setSectorId] = useState("all");
  const [search, setSearch] = useState("");
  const list = responsibilities.filter((item) => (sectorId === "all" || item.sectorId === sectorId) && textMatch(`${item.title} ${sectorName(context, item.sectorId)}`, search));
  return <>
    <Heading title="Responsabilidades" subtitle="O trabalho contínuo que precisa ter titular, substituto e capacidades claras." action={<Button size="sm" onClick={() => openDraft({ kind: "responsabilidade" })}><Plus className="h-4 w-4" /> Nova responsabilidade</Button>} />
    <div className="mb-5 flex flex-wrap gap-2"><SearchBox value={search} setValue={setSearch} placeholder="Buscar responsabilidade ou setor" /><select aria-label="Filtrar responsabilidades por setor" value={sectorId} onChange={(event) => setSectorId(event.target.value)} className="h-9 border bg-white px-2 text-xs"><option value="all">Todos os setores</option>{sectorUnits(context).map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}</select></div>
    <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground"><strong className="text-sm text-foreground">{list.length}</strong> responsabilidades nesta visão <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> <span>{list.filter((item) => !item.holderId).length} sem titular</span></div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{list.map((item) => { const sector = findSector(context, item.sectorId); const firstCapability = capabilities.find((capability) => item.capabilityIds.includes(capability.id)); return <button key={item.id} type="button" onClick={() => go("responsabilidade", item.id)} className="flex min-h-44 min-w-0 flex-col border-l-4 border-orange-500 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground"><span className="min-w-0 truncate">{sector?.name ?? "Setor a definir"}</span><ShieldAlert className="h-4 w-4 shrink-0 text-orange-600" /></span><strong className="mt-3 min-w-0 break-words text-sm leading-snug">{item.title}</strong><span className="mt-2 min-w-0 break-words text-xs text-violet-700">{firstCapability?.title ?? "Capacidade a definir"}</span><span className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs"><span className={item.holderId ? "text-emerald-700" : "text-orange-700"}>{item.holderId ? personName(context, item.holderId) : "Titular pendente"}</span><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" /></span></button>; })}</div>
    {list.length === 0 && <div className="border-l-4 border-orange-500 bg-orange-50 px-4 py-5 text-sm text-orange-950"><strong className="block">O mapeamento começa vazio.</strong><p className="mt-1">Defina o trabalho contínuo de cada setor e vincule as capacidades necessárias.</p><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => openDraft({ kind: "responsabilidade", sectorId: sectorId === "all" ? undefined : sectorId })}><Plus className="h-4 w-4" /> Cadastrar responsabilidade</Button><Button size="sm" variant="outline" onClick={() => go("capacidades")}>Ver capacidades <ArrowRight className="h-4 w-4" /></Button></div></div>}
  </>;
}

function ResponsibilityDetail({ context, go, id, responsibilities, capabilities, requests, openDraft, setResponsibility, claims }: WorkspaceProps) {
  const item = responsibilities.find((candidate) => candidate.id === id);
  if (!item) return <div className="border-l-4 border-orange-500 bg-orange-50 p-5 text-sm"><h2 className="font-semibold">Responsabilidade indisponível</h2><p className="mt-1 text-muted-foreground">Este cadastro não está no Plano Mestre. Importe o backup se foi criado em outro endereço ou dispositivo.</p><Button size="sm" className="mt-4" onClick={() => go("responsabilidades")}>Ver responsabilidades <ArrowRight className="h-4 w-4" /></Button></div>;
  const relatedRequests = requests.filter((request) => item.sourceChallengeIds.includes(request.id));
  const relatedClaims = claims.filter((claim) => claim.responsibilityId === id);
  return <><Heading title={item.title} subtitle="Responsabilidade mapeada no Plano Mestre" action={<div className="flex items-center gap-2"><Badge kind={item.status === "local" ? "local" : "proposal"} /><Button size="sm" variant="outline" onClick={() => openDraft({ kind: "editarResponsabilidade", responsibilityId: id })}><Pencil className="h-4 w-4" /> Editar</Button></div>} /><Pathway items={[{ label: "Setor", value: sectorName(context, item.sectorId), icon: Building2, tone: "border-teal-500 bg-teal-50 text-teal-900", onClick: () => go("setor", item.sectorId) }, { label: "Responsabilidade", value: item.title, icon: ShieldAlert, tone: "border-orange-500 bg-orange-50 text-orange-900" }, { label: "Capacidade", value: capabilities.find((candidate) => item.capabilityIds.includes(candidate.id))?.title ?? "A definir", icon: BookOpen, tone: "border-violet-500 bg-violet-50 text-violet-900", onClick: item.capabilityIds[0] ? () => go("capacidade", item.capabilityIds[0]) : undefined }]} /><div className="mb-5 flex flex-wrap gap-x-6 gap-y-2 border-b pb-4 text-xs text-muted-foreground"><span><strong className="text-foreground">{item.capabilityIds.length}</strong> capacidade(s)</span><span><strong className="text-foreground">{relatedRequests.length}</strong> solicitação(ões) relacionadas</span><span>Titular: <strong className="text-foreground">{personName(context, item.holderId)}</strong></span><span>Substituto: <strong className="text-foreground">{personName(context, item.substituteId)}</strong></span></div><div className="mt-5 grid gap-6 lg:grid-cols-2"><section><SectionTitle>Capacidades necessárias</SectionTitle><div className="border bg-white">{item.capabilityIds.map((capabilityId) => { const capability = capabilities.find((candidate) => candidate.id === capabilityId); return capability && <div key={capabilityId} className="flex items-center border-b last:border-0"><div className="min-w-0 flex-1"><Row title={capability.title} meta="Capacidade vinculada" onClick={() => go("capacidade", capabilityId)} badge={<Badge kind={capability.status === "local" ? "local" : "proposal"} />} /></div><button type="button" title={`Desvincular ${capability.title}`} aria-label={`Desvincular ${capability.title}`} onClick={() => setResponsibility(id, { capabilityIds: item.capabilityIds.filter((value) => value !== capabilityId) })} className="mr-2 grid h-8 w-8 shrink-0 place-items-center border hover:bg-rose-50"><X className="h-4 w-4" /></button></div>; })}{item.capabilityIds.length === 0 && <Empty>Nenhuma capacidade vinculada.</Empty>}</div><label className="mt-3 block text-xs font-medium">Vincular capacidade<select aria-label="Vincular capacidade" defaultValue="" onChange={(event) => { const value = event.target.value; if (value && !item.capabilityIds.includes(value)) setResponsibility(id, { capabilityIds: [...item.capabilityIds, value] }); event.target.value = ""; }} className="mt-1 h-9 w-full border bg-white px-2 text-xs"><option value="">Escolha uma capacidade</option>{capabilities.filter((capability) => !item.capabilityIds.includes(capability.id)).map((capability) => <option key={capability.id} value={capability.id}>{capability.title}</option>)}</select></label><Button size="sm" variant="outline" className="mt-2" onClick={() => openDraft({ kind: "capacidade", sectorId: item.sectorId })}><Plus className="h-4 w-4" /> Cadastrar nova capacidade</Button></section><section><SectionTitle>Pessoas e sucessão</SectionTitle><div className="space-y-3 border bg-white p-4"><label className="block text-xs font-medium">Titular (salvo no Plano Mestre)<select aria-label="Titular da responsabilidade" value={item.holderId ?? ""} onChange={(event) => setResponsibility(id, { holderId: event.target.value || null })} className="mt-1 h-9 w-full border bg-white px-2 text-xs"><option value="">A definir</option>{context.collaborators.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label className="block text-xs font-medium">Substituto (salvo no Plano Mestre)<select aria-label="Substituto da responsabilidade" value={item.substituteId ?? ""} onChange={(event) => setResponsibility(id, { substituteId: event.target.value || null })} className="mt-1 h-9 w-full border bg-white px-2 text-xs"><option value="">A definir</option>{context.collaborators.filter((person) => person.id !== item.holderId).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><p className="text-xs text-muted-foreground">Selecionar uma pessoa aqui não comprova habilitação nem delega a responsabilidade no sistema atual.</p>{relatedClaims.map((claim, index) => <p key={`${claim.personId}-${index}`} className="text-xs text-sky-800">Pedido registrado: {personName(context, claim.personId)} quer assumir esta responsabilidade.</p>)}<Button size="sm" variant="outline" onClick={() => openDraft({ kind: "assumir", responsibilityId: id })}>Solicitar responsabilidade</Button></div></section></div><div className="mt-6"><SectionTitle>Solicitações relacionadas por origem</SectionTitle><div className="border bg-white">{relatedRequests.map((request) => <Row key={request.id} title={request.title} meta="Desafio cadastrado; vínculo de responsabilidade ainda não confirmado" onClick={() => go("solicitacao", request.id)} badge={<Badge kind="real" />} />)}{relatedRequests.length === 0 && <Empty>Sem solicitação relacionada no Plano Mestre.</Empty>}</div></div></>;
}

function Capabilities({ context, go, capabilities, responsibilities, openDraft }: WorkspaceProps) {
  const [search, setSearch] = useState("");
  const list = capabilities.filter((item) => textMatch(item.title, search));
  return <>
    <Heading title="Banco de capacidades" subtitle="Conhecimentos e práticas que a Ramos precisa dominar para sustentar suas responsabilidades." action={<Button size="sm" onClick={() => openDraft({ kind: "capacidade" })}><Plus className="h-4 w-4" /> Nova capacidade</Button>} />
    <div className="mb-4 flex flex-wrap items-center gap-3"><SearchBox value={search} setValue={setSearch} placeholder="Buscar capacidade" /><span className="text-xs text-muted-foreground">{list.length} capacidade(s) nesta visão</span></div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{list.map((item) => { const linked = responsibilities.filter((responsibility) => responsibility.capabilityIds.includes(item.id)); return <button key={item.id} type="button" onClick={() => go("capacidade", item.id)} className="flex min-h-44 min-w-0 flex-col border-l-4 border-violet-500 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="flex items-center justify-between text-xs text-violet-700"><BookOpen className="h-5 w-5" /><span>{item.sectorIds.length} setor(es)</span></span><strong className="mt-4 min-w-0 break-words text-sm leading-snug">{item.title}</strong><span className="mt-2 text-xs text-muted-foreground">{item.sectorIds.map((id) => sectorName(context, id)).join(", ") || "Setor a definir"}</span><span className="mt-auto flex items-center justify-between border-t pt-3 text-xs text-muted-foreground"><span>{linked.length} responsabilidade(s) relacionada(s)</span><ArrowRight className="h-4 w-4" /></span></button>; })}</div>
    {list.length === 0 && <div className="border-l-4 border-violet-500 bg-violet-50 px-4 py-5 text-sm text-violet-950"><strong className="block">Nenhuma capacidade mapeada ainda.</strong><p className="mt-1">Comece pelo que cada setor precisa saber fazer. Depois associe essas capacidades às responsabilidades.</p><Button size="sm" className="mt-4" onClick={() => openDraft({ kind: "capacidade" })}><Plus className="h-4 w-4" /> Cadastrar capacidade</Button></div>}
  </>;
}

function CapabilityDetail({ context, go, id, capabilities, responsibilities, requests, openDraft, trainingRequests }: WorkspaceProps) {
  const item = capabilities.find((candidate) => candidate.id === id);
  if (!item) return <div className="border-l-4 border-violet-500 bg-violet-50 p-5 text-sm"><h2 className="font-semibold">Capacidade indisponível</h2><p className="mt-1 text-muted-foreground">Este cadastro não está no Plano Mestre. Importe o backup se foi criado em outro endereço ou dispositivo.</p><Button size="sm" className="mt-4" onClick={() => go("capacidades")}>Ver capacidades <ArrowRight className="h-4 w-4" /></Button></div>;
  const linkedResponsibilities = responsibilities.filter((responsibility) => responsibility.capabilityIds.includes(id));
  const sourceRequests = requests.filter((request) => item.sourceChallengeIds.includes(request.id));
  const requestsForTraining = trainingRequests.filter((request) => request.capabilityId === id);
  return <><Heading title={item.title} subtitle="Capacidade organizacional; diferente de curso ou certificado individual" action={<div className="flex items-center gap-2"><Badge kind={item.status === "local" ? "local" : "proposal"} /><Button size="sm" variant="outline" onClick={() => openDraft({ kind: "editarCapacidade", capabilityId: id })}><Pencil className="h-4 w-4" /> Editar</Button></div>} /><Pathway items={[{ label: "Setor", value: sectorName(context, item.sectorIds[0] ?? null), icon: Building2, tone: "border-teal-500 bg-teal-50 text-teal-900", onClick: item.sectorIds[0] ? () => go("setor", item.sectorIds[0]) : undefined }, { label: "Capacidade", value: item.title, icon: BookOpen, tone: "border-violet-500 bg-violet-50 text-violet-900" }, { label: "Capacitação", value: requestsForTraining.length ? `${requestsForTraining.length} pedido(s) no Plano Mestre` : "Trilha a definir", icon: GraduationCap, tone: "border-sky-500 bg-sky-50 text-sky-900", onClick: () => go("capacitacoes") }]} /><div className="mb-5 flex flex-wrap gap-x-6 gap-y-2 border-b pb-4 text-xs text-muted-foreground"><span><strong className="text-foreground">{linkedResponsibilities.length}</strong> responsabilidade(s)</span><span><strong className="text-foreground">{sourceRequests.length}</strong> desafio(s) de origem</span><span>Habilitação de pessoas: <strong className="text-foreground">a definir</strong></span></div><Note>Capacitação é o percurso de aprendizagem. Habilitação exige confirmação de aptidão. Nenhum colaborador é marcado como habilitado com base apenas em tarefas ou cursos.</Note><div className="grid gap-6 lg:grid-cols-2"><section><SectionTitle>Responsabilidades que exigem esta capacidade</SectionTitle><div className="border bg-white">{linkedResponsibilities.map((responsibility) => <Row key={responsibility.id} title={responsibility.title} meta={sectorName(context, responsibility.sectorId)} onClick={() => go("responsabilidade", responsibility.id)} />)}{linkedResponsibilities.length === 0 && <Empty>Sem responsabilidade vinculada.</Empty>}</div></section><section><SectionTitle>Capacitação e pessoas</SectionTitle><div className="border bg-white p-4 text-sm"><p className="text-muted-foreground">Trilha, critérios de certificação e responsáveis pela validação ainda precisam ser definidos.</p>{requestsForTraining.map((request, index) => <p key={`${request.personId}-${index}`} className="mt-2 text-xs text-sky-800">Pedido registrado de capacitação: {personName(context, request.personId)}</p>)}<div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => openDraft({ kind: "capacitacao", capabilityId: id })}>Solicitar capacitação</Button><Button size="sm" variant="outline" onClick={() => go("capacitacoes")}>Ver oportunidades <ArrowRight className="h-4 w-4" /></Button></div></div></section></div><div className="mt-6"><SectionTitle>Solicitações vinculadas</SectionTitle><div className="border bg-white">{sourceRequests.map((request) => <Row key={request.id} title={request.title} meta="Desafio cadastrado" onClick={() => go("solicitacao", request.id)} badge={<Badge kind="real" />} />)}{sourceRequests.length === 0 && <Empty>Nenhuma solicitação vinculada a esta capacidade.</Empty>}</div></div></>;
}

function Training({ context, go, capabilities, responsibilities, openDraft, trainingRequests, claims, personId, setPersonId }: WorkspaceProps) {
  return <>
    <Heading title="Capacitações e oportunidades" subtitle="Explore o que aprender e as responsabilidades que podem ser assumidas." />
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-4"><label className="text-xs font-medium">Visualizar como <select aria-label="Colaborador para consulta" value={personId} onChange={(event) => setPersonId(event.target.value)} className="ml-2 h-9 border bg-white px-2 text-xs">{context.collaborators.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><span className="text-xs text-muted-foreground">Solicitações no Plano Mestre não concedem acesso nem habilitação.</span></div>
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="min-w-0"><div className="mb-3 flex items-center gap-2 text-violet-700"><BookOpen className="h-5 w-5" /><h3 className="text-sm font-semibold">Capacidades para desenvolver</h3><span className="ml-auto text-xs">{capabilities.length}</span></div><div className="space-y-3">{capabilities.map((capability) => { const requested = trainingRequests.some((request) => request.personId === personId && request.capabilityId === capability.id); return <div key={capability.id} className="border-l-4 border-violet-500 bg-white px-4 py-3 shadow-sm"><button type="button" onClick={() => go("capacidade", capability.id)} className="flex w-full items-start justify-between gap-2 text-left hover:text-violet-700"><span className="min-w-0"><strong className="block break-words text-sm">{capability.title}</strong><span className="mt-1 block text-xs text-muted-foreground">{capability.sectorIds.map((id) => sectorName(context, id)).join(", ") || "Setor a definir"}</span></span><ChevronRight className="h-4 w-4 shrink-0" /></button><div className="mt-3 flex items-center justify-between border-t pt-2"><span className="text-xs text-muted-foreground">{requested ? "Pedido feito no Plano Mestre" : "Capacitação disponível para solicitar"}</span><Button size="sm" variant="outline" disabled={requested} onClick={() => openDraft({ kind: "capacitacao", capabilityId: capability.id })}>{requested ? "Solicitada" : "Solicitar"}</Button></div></div>; })}{capabilities.length === 0 && <Empty>Nenhuma capacidade cadastrada no Plano Mestre.</Empty>}</div></section>
      <section className="min-w-0"><div className="mb-3 flex items-center gap-2 text-orange-700"><ShieldAlert className="h-5 w-5" /><h3 className="text-sm font-semibold">Responsabilidades para assumir</h3><span className="ml-auto text-xs">{responsibilities.length}</span></div><div className="space-y-3">{responsibilities.map((responsibility) => { const requested = claims.some((claim) => claim.personId === personId && claim.responsibilityId === responsibility.id); return <div key={responsibility.id} className="border-l-4 border-orange-500 bg-white px-4 py-3 shadow-sm"><button type="button" onClick={() => go("responsabilidade", responsibility.id)} className="flex w-full items-start justify-between gap-2 text-left hover:text-orange-700"><span className="min-w-0"><strong className="block break-words text-sm">{responsibility.title}</strong><span className="mt-1 block text-xs text-muted-foreground">{sectorName(context, responsibility.sectorId)} · {responsibility.capabilityIds.length} capacidade(s) necessária(s)</span></span><ChevronRight className="h-4 w-4 shrink-0" /></button><div className="mt-3 flex items-center justify-between border-t pt-2"><span className="text-xs text-muted-foreground">{requested ? "Pedido feito no Plano Mestre" : "Titularidade sujeita a validação"}</span><Button size="sm" variant="outline" disabled={requested} onClick={() => openDraft({ kind: "assumir", responsibilityId: responsibility.id })}>{requested ? "Solicitada" : "Solicitar"}</Button></div></div>; })}{responsibilities.length === 0 && <Empty>Nenhuma responsabilidade cadastrada no Plano Mestre.</Empty>}</div></section>
    </div>
  </>;
}

function Requests({ context, go, tab, requests, responsibilities, requestPlans, openDraft }: WorkspaceProps) {
  const [search, setSearch] = useState("");
  const [sectorId, setSectorId] = useState(tab && tab !== "visao" ? tab : "all");
  const [mode, setMode] = useState<"kanban" | "lista">("kanban");
  const list = requests.filter((item) => (sectorId === "all" || item.client_id === sectorId) && textMatch(`${item.title} ${sectorName(context, item.client_id)}`, search));
  return <><Heading title="Solicitações" subtitle="Leitura dos desafios existentes como futuras solicitações. Nenhum desafio foi convertido, duplicado ou movido de tabela." action={<Button size="sm" onClick={() => openDraft({ kind: "solicitacao", sectorId: sectorId === "all" ? undefined : sectorId })}><Plus className="h-4 w-4" /> Registrar solicitação</Button>} /><Note>O status operacional vem do desafio. Planejamento, responsabilidade, orçamento e bloqueios só aparecem quando salvos no Plano Mestre. Sem vínculo confirmado, a solicitação permanece “A classificar”.</Note><div className="mb-3 flex flex-wrap gap-2"><SearchBox value={search} setValue={setSearch} placeholder="Buscar solicitação ou setor" /><select aria-label="Filtrar solicitações por setor" value={sectorId} onChange={(event) => setSectorId(event.target.value)} className="h-9 max-w-full border bg-white px-2 text-xs"><option value="all">Todos os setores</option>{sectorUnits(context).map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}</select><Button variant="outline" size="sm" onClick={() => { setSearch(""); setSectorId("all"); }} title="Limpar filtros" aria-label="Limpar filtros"><FilterX className="h-4 w-4" /></Button></div><div className="mb-3 flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{list.length} solicitação(ões) nesta visão</p><div className="inline-flex border bg-white"><button type="button" onClick={() => setMode("kanban")} aria-pressed={mode === "kanban"} className={`px-3 py-1.5 text-xs ${mode === "kanban" ? "bg-emerald-700 text-white" : "hover:bg-muted"}`}>Kanban</button><button type="button" onClick={() => setMode("lista")} aria-pressed={mode === "lista"} className={`px-3 py-1.5 text-xs ${mode === "lista" ? "bg-emerald-700 text-white" : "hover:bg-muted"}`}>Lista</button></div></div>{mode === "kanban" ? <RequestKanban context={context} requests={list} requestPlans={requestPlans} go={go} /> : <div className="border bg-white">{list.map((item) => { const plan = requestPlans[item.id]; const responsibility = responsibilities.find((candidate) => candidate.id === plan?.responsibilityId); return <Row key={item.id} title={item.title} meta={`${sectorName(context, item.client_id)} · ${columns.find((column) => column.id === requestColumn(item.status))?.label} · ${responsibility?.title ?? "A classificar"}`} onClick={() => go("solicitacao", item.id)} badge={<Badge kind={item.id.startsWith("local-") ? "local" : "real"} />} />; })}{list.length === 0 && <Empty>Sem solicitações nesta seleção.</Empty>}</div>}</>;
}

function RequestDetail({ context, go, id, requests, responsibilities, requestPlans, openDraft }: WorkspaceProps) {
  const item = requests.find((candidate) => candidate.id === id);
  if (!item) return <Empty>Solicitação não encontrada no Plano Mestre.</Empty>;
  const plan = requestPlans[id];
  const responsibility = responsibilities.find((candidate) => candidate.id === plan?.responsibilityId);
  const dependency = requests.find((candidate) => candidate.id === plan?.dependencyId);
  const isLocal = id.startsWith("local-");
  return <><Heading title={item.title} subtitle={`${sectorName(context, item.client_id)} · ${isLocal ? "solicitação cadastrada no Plano Mestre" : "desafio cadastrado, exibido como solicitação"}`} action={<div className="flex items-center gap-2"><Badge kind={isLocal ? "local" : "real"} />{isLocal && <Button size="sm" variant="outline" onClick={() => openDraft({ kind: "editarSolicitacao", requestId: id })}><Pencil className="h-4 w-4" /> Editar</Button>}</div>} /><div className="grid grid-cols-2 gap-2 md:grid-cols-4"><Metric label="Status de origem" value={columns.find((column) => column.id === requestColumn(item.status))?.label ?? item.status} icon={ClipboardList} /><Metric label="Criada em" value={dateLabel(item.created_at)} icon={CalendarDays} /><Metric label="Prazo de origem" value={dateLabel(item.due_at)} icon={Clock3} /><Metric label="Responsabilidade" value={responsibility ? "Vinculada no Plano Mestre" : "A classificar"} icon={ShieldAlert} /></div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => openDraft({ kind: "planejamento", requestId: id })}><CalendarDays className="h-4 w-4" /> Planejar solicitação</Button>{responsibility && <Button size="sm" variant="outline" onClick={() => go("responsabilidade", responsibility.id)}>Abrir responsabilidade <ArrowRight className="h-4 w-4" /></Button>}</div><div className="mt-6 grid gap-6 lg:grid-cols-2"><section><SectionTitle>Registro de origem</SectionTitle><div className="space-y-3 border bg-white p-4 text-sm"><p className="whitespace-pre-wrap">{item.description || "Sem descrição cadastrada."}</p>{item.success_criteria && <p><strong>Critério:</strong> {item.success_criteria}</p>}{item.expected_deliverable && <p><strong>Entregável esperado:</strong> {item.expected_deliverable}</p>}<p className="border-t pt-3 text-xs text-muted-foreground">{isLocal ? "Solicitação cadastrada no Plano Mestre." : `ID de origem preservado: ${item.id}`}</p></div></section><section><SectionTitle>Planejamento da solicitação</SectionTitle><div className="grid grid-cols-2 gap-3 border bg-white p-4 text-sm"><div><span className="block text-xs text-muted-foreground">Tratamento previsto</span>{plan?.plannedMonth || "A definir"}</div><div><span className="block text-xs text-muted-foreground">Prazo planejado</span>{dateLabel(plan?.dueDate)}</div><div><span className="block text-xs text-muted-foreground">Responsável</span>{personName(context, plan?.assigneeId)}</div><div><span className="block text-xs text-muted-foreground">Prioridade / peso</span>{plan?.priority || "A definir"} / {plan?.weight || "A definir"}</div><div><span className="block text-xs text-muted-foreground">Orçamento estimado</span>{plan?.budget || "A definir"}</div><div><span className="block text-xs text-muted-foreground">Condição de avanço</span>{plan?.blocker || "Não avaliada"}</div><div className="col-span-2"><span className="block text-xs text-muted-foreground">Dependência</span>{dependency ? <button type="button" className="text-left text-emerald-700 hover:underline" onClick={() => go("solicitacao", dependency.id)}>{dependency.title}</button> : "A definir"}</div></div></section></div><div className="mt-6 grid gap-6 lg:grid-cols-3"><section><SectionTitle>Subtarefas</SectionTitle><div className="border bg-white p-4 text-sm">{plan?.subtasks ? <ul className="space-y-1">{plan.subtasks.split("\n").filter(Boolean).map((text, index) => <li key={`${text}-${index}`} className="flex gap-2"><span className="text-emerald-700">○</span>{text}</li>)}</ul> : <p className="text-muted-foreground">Não há subtarefas vinculadas no Plano Mestre.</p>}</div></section><section><SectionTitle>Comentários</SectionTitle><div className="border bg-white p-4 text-sm">{plan?.comment || <p className="text-muted-foreground">Comentários do setor permanecem no histórico de origem; não foram vinculados automaticamente a esta solicitação.</p>}</div><Button variant="outline" size="sm" className="mt-2" onClick={() => go("setor", item.client_id ?? "", "historico")}>Ver histórico do setor</Button></section><section><SectionTitle>Anexos</SectionTitle><div className="border bg-white p-4 text-sm">{plan?.attachment || <p className="text-muted-foreground">Nenhuma referência de anexo registrada. Arquivos existentes não foram copiados.</p>}</div></section></div></>;
}

function Chronology({ context, go, requests, requestPlans }: WorkspaceProps) {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const entries = requests.flatMap((item) => {
    const plan = requestPlans[item.id];
    const list: Array<{ id: string; title: string; month: string; kind: string; sectorId: string | null }> = [];
    if (plan?.plannedMonth) list.push({ id: item.id, title: item.title, month: plan.plannedMonth, kind: plan.blocker || "Planejada no Plano Mestre", sectorId: item.client_id });
    if (item.due_at) list.push({ id: item.id, title: item.title, month: item.due_at.slice(0, 7), kind: "Prazo cadastrado", sectorId: item.client_id });
    return list;
  });
  const months = Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`);
  return <><Heading title="Cronologia" subtitle="Visão mensal de prazos cadastrados e planejamento salvo no Plano Mestre. Metas anuais e checkpoints ainda não foram registrados." /><div className="mb-4 flex items-center gap-2"><label className="text-xs font-medium">Ano <Input aria-label="Ano da cronologia" type="number" min="2020" max="2100" value={year} onChange={(event) => setYear(event.target.value)} className="ml-2 inline-flex h-9 w-24 rounded-none bg-white" /></label><Badge kind="local" /></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{months.map((month) => { const items = entries.filter((entry) => entry.month === month); return <section key={month} className="border bg-white"><h3 className="border-b bg-zinc-50 px-3 py-2 text-sm font-semibold">{new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(`${month}-01T12:00:00`))} <span className="text-xs font-normal text-muted-foreground">{items.length}</span></h3><div className="max-h-64 overflow-y-auto">{items.map((entry, index) => <Row key={`${entry.id}-${entry.kind}-${index}`} title={entry.title} meta={`${sectorName(context, entry.sectorId)} · ${entry.kind}`} onClick={() => go("solicitacao", entry.id)} />)}{items.length === 0 && <p className="px-3 py-4 text-xs text-muted-foreground">Sem data registrada ou planejada.</p>}</div></section>; })}</div><Note>Planejar para um mês não significa que a solicitação esteja liberada. Dependências e disponibilidade de equipe habilitada precisam ser verificadas antes da execução.</Note></>;
}

function Journey({ context, go, responsibilities, capabilities, trainingRequests, claims, personId, setPersonId }: WorkspaceProps) {
  const person = context.collaborators.find((item) => item.id === personId);
  const assignedTasks = context.tasks.filter((task) => task.assigned_to.some((name) => name.localeCompare(person?.name ?? "", "pt-BR", { sensitivity: "base" }) === 0));
  const localResponsibilities = responsibilities.filter((item) => item.holderId === personId);
  return <><Heading title="Minha jornada" subtitle="Visão de um colaborador selecionado para explorar capacitação, responsabilidades e oportunidades. A seleção não altera o usuário do Radar Vital." /><label className="mb-5 inline-block text-xs font-medium">Colaborador<select aria-label="Selecionar colaborador da jornada" value={personId} onChange={(event) => setPersonId(event.target.value)} className="ml-2 h-9 border bg-white px-2 text-xs">{context.collaborators.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="grid grid-cols-2 gap-2 md:grid-cols-4"><Metric label="Tarefas atribuídas" value={assignedTasks.length} icon={ListChecks} /><Metric label="Responsabilidades no Plano Mestre" value={localResponsibilities.length} icon={ShieldAlert} /><Metric label="Capacitações solicitadas" value={trainingRequests.filter((item) => item.personId === personId).length} icon={GraduationCap} /><Metric label="Habilitações confirmadas" value="A definir" icon={CheckCircle2} /></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><section><SectionTitle>Responsabilidades e pedidos</SectionTitle><div className="border bg-white">{localResponsibilities.map((item) => <Row key={item.id} title={item.title} meta="Titularidade definida no Plano Mestre" onClick={() => go("responsabilidade", item.id)} badge={<Badge kind="local" />} />)}{claims.filter((item) => item.personId === personId).map((claim, index) => { const item = responsibilities.find((candidate) => candidate.id === claim.responsibilityId); return item && <Row key={`${claim.responsibilityId}-${index}`} title={item.title} meta="Pedido registrado, ainda não aprovado" onClick={() => go("responsabilidade", item.id)} badge={<Badge kind="local" />} />; })}{localResponsibilities.length === 0 && !claims.some((item) => item.personId === personId) && <Empty>Nenhuma responsabilidade formal registrada.</Empty>}</div><Button size="sm" variant="outline" className="mt-2" onClick={() => go("capacitacoes")}>Explorar oportunidades <ArrowRight className="h-4 w-4" /></Button></section><section><SectionTitle>Capacitação e operação</SectionTitle><div className="border bg-white">{trainingRequests.filter((item) => item.personId === personId).map((request, index) => { const capability = capabilities.find((item) => item.id === request.capabilityId); return capability && <Row key={`${request.capabilityId}-${index}`} title={capability.title} meta="Pedido registrado, sem aprovação" onClick={() => go("capacidade", capability.id)} badge={<Badge kind="local" />} />; })}{assignedTasks.slice(0, 8).map((task) => <div key={task.id} className="border-b px-3 py-3 text-sm"><p className="font-medium">{task.title}</p><p className="text-xs text-muted-foreground">Tarefa cadastrada · {sectorName(context, task.client_id)}</p></div>)}{assignedTasks.length === 0 && !trainingRequests.some((item) => item.personId === personId) && <Empty>Nenhuma tarefa atribuída nesta leitura.</Empty>}</div></section></div></>;
}

function PersonDetail({ context, go, id, responsibilities, trainingRequests }: WorkspaceProps) {
  const person = context.collaborators.find((item) => item.id === id);
  if (!person) return <Empty>Colaborador não encontrado.</Empty>;
  const assignments = responsibilities.filter((item) => item.holderId === id || item.substituteId === id);
  return <><Heading title={person.name} subtitle="Colaborador cadastrado. Titularidade está salva no Plano Mestre; habilitações ainda não são confirmadas." action={<Badge kind="real" />} /><div className="border bg-white">{assignments.map((item) => <Row key={item.id} title={item.title} meta={item.holderId === id ? "Titular designado" : "Substituto designado"} onClick={() => go("responsabilidade", item.id)} badge={<Badge kind="local" />} />)}{assignments.length === 0 && <Empty>Sem responsabilidade formal vinculada.</Empty>}</div><p className="mt-3 text-xs text-muted-foreground">{trainingRequests.filter((request) => request.personId === id).length} pedido(s) de capacitação registrados no Plano Mestre.</p></>;
}

function Coverage({ context, go, responsibilities, capabilities, personId, setPersonId }: WorkspaceProps) {
  const person = context.collaborators.find((item) => item.id === personId);
  const held = responsibilities.filter((item) => item.holderId === personId);
  const withoutBackup = held.filter((item) => !item.substituteId);
  const tasks = context.tasks.filter((item) => item.assigned_to.some((name) => name.localeCompare(person?.name ?? "", "pt-BR", { sensitivity: "base" }) === 0));
  return <>
    <Heading title="Cobertura e sucessão" subtitle="Entenda quais áreas precisam de titular, reserva e formação antes de delegar trabalho." />
    <div className="mb-5 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-xs text-amber-950">Leitura exploratória: responsabilidades e vínculos nesta tela estão salvos no Plano Mestre. Nenhuma tarefa atribuída comprova habilitação.</div>
    <div className="mb-7 grid gap-2 sm:grid-cols-3"><div className="border-l-4 border-orange-500 bg-orange-50 p-4"><strong className="block text-2xl text-orange-900">{responsibilities.filter((item) => !item.holderId).length}</strong><span className="text-xs text-orange-800">sem titular</span></div><div className="border-l-4 border-rose-500 bg-rose-50 p-4"><strong className="block text-2xl text-rose-900">{responsibilities.filter((item) => !item.substituteId).length}</strong><span className="text-xs text-rose-800">sem substituto</span></div><div className="border-l-4 border-violet-500 bg-violet-50 p-4"><strong className="block text-2xl text-violet-900">{capabilities.length}</strong><span className="text-xs text-violet-800">capacidades mapeadas no Plano Mestre</span></div></div>
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]"><section><SectionTitle>Setores e responsabilidades</SectionTitle><div className="grid gap-2 sm:grid-cols-2">{sectorUnits(context).map((sector) => { const items = responsibilities.filter((item) => item.sectorId === sector.id); const withHolder = items.filter((item) => item.holderId).length; const withBackup = items.filter((item) => item.substituteId).length; return <button key={sector.id} type="button" onClick={() => go("setor", sector.id, "responsabilidades")} className="min-w-0 border-l-4 border-teal-500 bg-white p-3 text-left shadow-sm hover:bg-teal-50"><Identity unit={sector} /><div className="mt-3 flex items-center justify-between gap-2 border-t pt-2 text-xs"><span>{items.length} {items.length === 1 ? "mapeada" : "mapeadas"}</span><ArrowRight className="h-4 w-4" /></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">{items.length ? <><span>Titular {withHolder}/{items.length}</span><span>Reserva {withBackup}/{items.length}</span></> : <span>Responsabilidades ainda não mapeadas</span>}</div></button>; })}</div></section><section><SectionTitle>Impacto por pessoa</SectionTitle><div className="border-t-4 border-sky-500 bg-white p-4"><label className="block text-xs font-medium">Colaborador<select aria-label="Colaborador para analisar sucessão" value={personId} onChange={(event) => setPersonId(event.target.value)} className="mt-2 h-9 w-full border bg-white px-2 text-xs">{context.collaborators.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="mt-5 grid grid-cols-2 gap-3 border-y py-4 text-center"><div><strong className="block text-xl text-sky-800">{held.length}</strong><span className="text-[11px] text-muted-foreground">titularidades no Plano Mestre</span></div><div><strong className="block text-xl text-rose-700">{withoutBackup.length}</strong><span className="text-[11px] text-muted-foreground">sem reserva</span></div></div><p className="mt-4 text-xs text-muted-foreground">{tasks.length} tarefa(s) atribuídas no cadastro operacional. Isso não transfere responsabilidades.</p><p className="mt-3 text-xs font-medium text-amber-900">Ao perder cobertura, o setor precisa de redistribuição ou contratação; Patrick não assume automaticamente.</p></div><div className="mt-6"><SectionTitle>Capacidades para verificar</SectionTitle><div className="flex flex-wrap gap-2">{capabilities.map((item) => <button key={item.id} type="button" onClick={() => go("capacidade", item.id)} className="inline-flex max-w-full items-center gap-2 border-l-2 border-violet-500 bg-violet-50 px-3 py-2 text-left text-xs text-violet-900 hover:bg-violet-100"><BookOpen className="h-4 w-4 shrink-0" /><span className="break-words">{item.title}</span></button>)}{capabilities.length === 0 && <Empty>Nenhuma capacidade mapeada.</Empty>}</div></div></section></div>
  </>;
}

function DraftDialog({ draft, close, submit, context, capabilities, responsibilities, requests, requestPlans, personId }: {
  draft: Draft; close: () => void; submit: (event: FormEvent<HTMLFormElement>) => void; context?: MasterPlanContext;
  capabilities: PreviewCapability[]; responsibilities: PreviewResponsibility[]; requests: Challenge[];
  requestPlans: Record<string, RequestPlan>; personId: string;
}) {
  const titles: Record<DraftKind, string> = { responsabilidade: "Cadastrar responsabilidade", capacidade: "Cadastrar capacidade", solicitacao: "Registrar solicitação", editarResponsabilidade: "Editar responsabilidade", editarCapacidade: "Editar capacidade", editarSolicitacao: "Editar solicitação", capacitacao: "Solicitar capacitação", assumir: "Solicitar responsabilidade", planejamento: "Planejar solicitação" };
  const plan = draft?.requestId ? requestPlans[draft.requestId] : undefined;
  const editedCapability = capabilities.find((item) => item.id === draft?.capabilityId);
  const editedResponsibility = responsibilities.find((item) => item.id === draft?.responsibilityId);
  const editedRequest = requests.find((item) => item.id === draft?.requestId);
  const isEntityForm = draft?.kind === "capacidade" || draft?.kind === "responsabilidade" || draft?.kind === "solicitacao" || draft?.kind === "editarCapacidade" || draft?.kind === "editarResponsabilidade" || draft?.kind === "editarSolicitacao";
  const initialSectorId = editedCapability?.sectorIds[0] ?? editedResponsibility?.sectorId ?? editedRequest?.client_id ?? draft?.sectorId ?? "";
  const initialTitle = editedCapability?.title ?? editedResponsibility?.title ?? editedRequest?.title ?? "";
  const fieldClass = "mt-1 h-9 w-full border bg-white px-2 text-xs";
  return <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && close()}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{draft ? titles[draft.kind]  : "Cadastro"}</DialogTitle><DialogDescription>Esta ação grava no Plano Mestre. Selecionar pessoas não comprova habilitação nem altera permissões do Radar Vital.</DialogDescription></DialogHeader>{draft && context && <form key={`${draft.kind}-${draft.requestId ?? draft.sectorId ?? draft.capabilityId ?? draft.responsibilityId ?? "new"}`} onSubmit={submit} className="space-y-4">
    {isEntityForm && <><label className="block text-xs font-medium">Título<Input name="title" defaultValue={initialTitle} required className="mt-1 rounded-none" placeholder="Nome claro e específico" /></label><label className="block text-xs font-medium">Setor existente<select name="sectorId" required defaultValue={initialSectorId} className={fieldClass}><option value="" disabled>Selecione o setor</option>{sectorUnits(context).map((sector) => <option key={sector.id} value={sector.id}>{sector.name}</option>)}</select></label></>}
    {draft.kind === "responsabilidade" && <label className="block text-xs font-medium">Capacidade necessária<select name="capabilityId" defaultValue={draft.capabilityId ?? ""} className={fieldClass}><option value="">Vincular depois</option>{capabilities.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
    {(draft.kind === "solicitacao" || draft.kind === "editarSolicitacao") && <label className="block text-xs font-medium">Descrição<textarea name="description" defaultValue={editedRequest?.description ?? ""} rows={3} className="mt-1 w-full border bg-white px-3 py-2 text-sm" placeholder="Qual trabalho ou melhoria é necessária?" /></label>}
    {(draft.kind === "capacitacao" || draft.kind === "assumir") && <><label className="block text-xs font-medium">Colaborador<select name="personId" required defaultValue={personId} className={fieldClass}>{context.collaborators.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>{draft.kind === "capacitacao" ? <label className="block text-xs font-medium">Capacidade<select name="capabilityId" required defaultValue={draft.capabilityId ?? ""} className={fieldClass}><option value="" disabled>Selecione</option>{capabilities.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label> : <label className="block text-xs font-medium">Responsabilidade<select name="responsibilityId" required defaultValue={draft.responsibilityId ?? ""} className={fieldClass}><option value="" disabled>Selecione</option>{responsibilities.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}</>}
    {draft.kind === "planejamento" && <><div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs font-medium">Responsabilidade<select name="responsibilityId" defaultValue={plan?.responsibilityId ?? ""} className={fieldClass}><option value="">A classificar</option>{responsibilities.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className="block text-xs font-medium">Responsável<select name="assigneeId" defaultValue={plan?.assigneeId ?? ""} className={fieldClass}><option value="">A definir</option>{context.collaborators.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label className="block text-xs font-medium">Mês de tratamento<Input name="plannedMonth" type="month" defaultValue={plan?.plannedMonth ?? ""} className="mt-1 rounded-none" /></label><label className="block text-xs font-medium">Prazo planejado<Input name="dueDate" type="date" defaultValue={plan?.dueDate ?? ""} className="mt-1 rounded-none" /></label><label className="block text-xs font-medium">Prioridade<select name="priority" defaultValue={plan?.priority ?? ""} className={fieldClass}><option value="">A definir</option><option>Baixa</option><option>Normal</option><option>Alta</option><option>Urgente</option></select></label><label className="block text-xs font-medium">Peso<Input name="weight" type="number" min="1" max="10" defaultValue={plan?.weight ?? ""} className="mt-1 rounded-none" /></label><label className="block text-xs font-medium">Orçamento estimado (R$)<Input name="budget" type="number" min="0" step="0.01" defaultValue={plan?.budget ?? ""} className="mt-1 rounded-none" /></label><label className="block text-xs font-medium">Condição de avanço<select name="blocker" defaultValue={plan?.blocker ?? ""} className={fieldClass}><option value="">Não avaliada</option><option value="Aguardando dependência">Aguardando dependência</option><option value="Aguardando equipe habilitada">Aguardando equipe habilitada</option><option value="Planejada para depois">Planejada para depois</option><option value="Liberada para análise">Liberada para análise</option></select></label></div><label className="block text-xs font-medium">Depende de outra solicitação<select name="dependencyId" defaultValue={plan?.dependencyId ?? ""} className={fieldClass}><option value="">Nenhuma definida</option>{requests.filter((item) => item.id !== draft.requestId).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className="block text-xs font-medium">Subtarefas (uma por linha)<textarea name="subtasks" rows={3} defaultValue={plan?.subtasks ?? ""} className="mt-1 w-full border bg-white px-3 py-2 text-sm" /></label><label className="block text-xs font-medium">Comentário de planejamento<textarea name="comment" rows={2} defaultValue={plan?.comment ?? ""} className="mt-1 w-full border bg-white px-3 py-2 text-sm" /></label><label className="block text-xs font-medium">Referência de anexo (sem upload)<Input name="attachment" defaultValue={plan?.attachment ?? ""} className="mt-1 rounded-none" placeholder="Nome ou descrição do documento" /></label></>}
    <div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="outline" onClick={close}>Cancelar</Button><Button type="submit">{draft.kind === "capacitacao" || draft.kind === "assumir" ? "Registrar pedido" : "Salvar no Plano Mestre"}</Button></div>
  </form>}</DialogContent></Dialog>;
}
