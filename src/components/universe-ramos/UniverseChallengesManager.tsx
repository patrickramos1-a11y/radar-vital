import { useMemo, useState } from "react";
import { Check, CircleDollarSign, Pencil, Search, Settings2, Star, Trash2, Upload, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getChallengeRewardStars } from "@/lib/challenge";
import { UniverseChallengeDetailDialog, UniverseChallengeEditDialog } from "@/components/universe-ramos/UniverseChallengeDialogs";
import type { Collaborator } from "@/types/collaborator";
import type { Client } from "@/types/client";
import { CHALLENGE_STATUS_CONFIG, type Challenge, type ChallengeEditData, type ChallengeParticipant, type ChallengeRewardConfig, type ChallengeValueRequest } from "@/types/challenge";
import type { ChallengeCompletionCondition } from "@/types/challenge";
import type { ChallengeDraftImportInput } from "@/types/challenge";
import { UniverseChallengeImportDialog } from "@/components/universe-ramos/UniverseChallengeImportDialog";
import { SuperstarQuickSet } from "@/components/universe-ramos/SuperstarQuickSet";

type RewardFilter = "all" | Challenge["rewardStatus"];
type StatusFilter = "all" | Challenge["status"];

interface Props {
  challenges: Challenge[];
  valueRequests: ChallengeValueRequest[];
  participantsByChallenge: Map<string, ChallengeParticipant[]>;
  conditionsByChallenge: Map<string, ChallengeCompletionCondition[]>;
  units: Client[];
  collaborators: Collaborator[];
  currentUser: Collaborator | null;
  canManage: boolean;
  onRequestValue: (challengeId: string, justification: string) => Promise<boolean>;
  onConfigureReward: (challengeIds: string[], config: ChallengeRewardConfig) => Promise<boolean>;
  onReviewRequest: (requestId: string, status: "reviewed" | "declined", note?: string) => Promise<boolean>;
  onAccept: (challengeId: string, collaboratorId: string) => Promise<boolean>;
  onUpdate: (challengeId: string, data: ChallengeEditData) => Promise<boolean>;
  onDelete: (challengeIds: string[]) => Promise<boolean>;
  onToggleCondition: (conditionId: string, completed: boolean) => Promise<boolean>;
  onImportDrafts: (drafts: ChallengeDraftImportInput[]) => Promise<Array<{ importKey: string; challengeId?: string; error?: string }>>;
}

const rewardLabels: Record<Challenge["rewardStatus"], string> = {
  unpriced: "Sem valor",
  requested: "Valor solicitado",
  configured: "Configurado",
  non_rewarded: "Não remunerado",
};

const rewardClasses: Record<Challenge["rewardStatus"], string> = {
  unpriced: "bg-slate-100 text-slate-700",
  requested: "bg-amber-100 text-amber-800",
  configured: "bg-emerald-100 text-emerald-800",
  non_rewarded: "bg-zinc-100 text-zinc-700",
};

// "open" means the challenge is published and can be accepted by anyone.
function statusLabel(status: Challenge["status"]): string {
  return status === "open" ? "Ativo" : CHALLENGE_STATUS_CONFIG[status].label;
}

function rewardBadgeText(challenge: Challenge): string {
  if (challenge.rewardSuperstars > 0) return `${challenge.rewardSuperstars} Super Estrela${challenge.rewardSuperstars > 1 ? "s" : ""}`;
  if (challenge.rewardStars > 0) return `${challenge.rewardStars} estrela${challenge.rewardStars > 1 ? "s" : ""}`;
  return rewardLabels[challenge.rewardStatus];
}


export function UniverseChallengesManager({ challenges, valueRequests, participantsByChallenge, conditionsByChallenge, units, collaborators, currentUser, canManage, onRequestValue, onConfigureReward, onReviewRequest, onAccept, onUpdate, onDelete, onToggleCondition, onImportDrafts }: Props) {
  const [view, setView] = useState<"library" | "requests">("library");
  const [query, setQuery] = useState("");
  const [rewardFilter, setRewardFilter] = useState<RewardFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [responsibleFilter, setResponsibleFilter] = useState("all");
  const [sort, setSort] = useState<"recent" | "deadline" | "reward_desc" | "reward_asc" | "requests">("recent");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [requestChallenge, setRequestChallenge] = useState<Challenge | null>(null);
  const [requestText, setRequestText] = useState("");
  const [configIds, setConfigIds] = useState<string[]>([]);
  const [rewardStars, setRewardStars] = useState(0);
  const [superstars, setSuperstars] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [nonRewarded, setNonRewarded] = useState(false);

  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [detailChallenge, setDetailChallenge] = useState<Challenge | null>(null);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("universe-challenges-columns") ?? '["created","age","responsible","requester"]'); } catch { return ["created", "age", "responsible", "requester"]; }
  });

  const unitNames = useMemo(() => new Map(units.map((unit) => [unit.id, unit.name])), [units]);
  const collaboratorNames = useMemo(() => new Map(collaborators.map((person) => [person.id, person.name])), [collaborators]);
  const pendingRequests = valueRequests.filter((request) => request.status === "pending");
  const pendingByChallenge = useMemo(() => new Map(pendingRequests.map((request) => [request.challengeId, request])), [pendingRequests]);
  const latestRequestByChallenge = useMemo(() => new Map(valueRequests.map((request) => [request.challengeId, request])), [valueRequests]);
  const sectorUnits = useMemo(() => units.filter((unit) => unit.universeCategory === "SETOR"), [units]);

  const filteredChallenges = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    const result = challenges.filter((challenge) => {
      if (normalized && ![challenge.title, challenge.description ?? "", challenge.successCriteria].join(" ").toLocaleLowerCase("pt-BR").includes(normalized)) return false;
      if (rewardFilter !== "all" && challenge.rewardStatus !== rewardFilter) return false;
      if (statusFilter !== "all" && challenge.status !== statusFilter) return false;
      if (unitFilter === "general" && challenge.clientId) return false;
      if (unitFilter !== "all" && unitFilter !== "general" && challenge.clientId !== unitFilter) return false;
      const participantIds = participantsByChallenge.get(challenge.id)?.map((item) => item.collaboratorId) ?? [];
      if (responsibleFilter === "unassigned" && participantIds.length > 0) return false;
      if (responsibleFilter !== "all" && responsibleFilter !== "unassigned" && !participantIds.includes(responsibleFilter)) return false;
      return true;
    });
    return result.sort((left, right) => {
      if (sort === "deadline") return (left.dueAt ?? "9999").localeCompare(right.dueAt ?? "9999");
      if (sort === "reward_desc") return getChallengeRewardStars(right) - getChallengeRewardStars(left);
      if (sort === "reward_asc") return getChallengeRewardStars(left) - getChallengeRewardStars(right);
      if (sort === "requests") return Number(pendingByChallenge.has(right.id)) - Number(pendingByChallenge.has(left.id));
      return right.createdAt.localeCompare(left.createdAt);
    });
  }, [challenges, participantsByChallenge, pendingByChallenge, query, responsibleFilter, rewardFilter, sort, statusFilter, unitFilter]);

  const toggleSelected = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const openConfig = (ids: string[]) => {
    setConfigIds(ids);
    setRewardStars(0); setSuperstars(0); setPenalty(0); setNonRewarded(false); setAdminNote("");
  };
  const saveSuperstars = async (challenge: Challenge, amount: number) =>
    onConfigureReward([challenge.id], {
      rewardStars: challenge.rewardStars,
      rewardSuperstars: amount,
      penaltyStars: challenge.penaltyStars,
      rewardStatus: "configured",
    });

  const submitRequest = async () => {
    if (!requestChallenge || !requestText.trim()) return;
    setSaving(true);
    const done = await onRequestValue(requestChallenge.id, requestText.trim());
    setSaving(false);
    if (done) { setRequestChallenge(null); setRequestText(""); }
  };
  const submitConfig = async () => {
    if (!configIds.length) return;
    setSaving(true);
    const done = await onConfigureReward(configIds, {
      rewardStars: Math.max(0, rewardStars), rewardSuperstars: Math.max(0, superstars), penaltyStars: Math.max(0, penalty),
      rewardStatus: nonRewarded ? "non_rewarded" : "configured", note: adminNote.trim() || undefined,
    });
    setSaving(false);
    if (done) { setConfigIds([]); setSelectedIds([]); }
  };
  const hasOwnPendingRequest = (challengeId: string) => Boolean(currentUser && pendingRequests.some((request) => request.challengeId === challengeId && request.collaboratorId === currentUser.id));
  const hasColumn = (column: string) => visibleColumns.includes(column);
  const toggleColumn = (column: string) => setVisibleColumns((current) => current.includes(column) ? current.filter((item) => item !== column) : [...current, column]);
  const saveColumns = () => { localStorage.setItem("universe-challenges-columns", JSON.stringify(visibleColumns)); setColumnsOpen(false); };
  const removeChallenges = async (ids: string[]) => {
    if (!window.confirm(ids.length === 1 ? "Excluir este desafio? Esta ação não pode ser desfeita." : `Excluir os ${ids.length} desafios selecionados? Esta ação não pode ser desfeita.`)) return;
    const done = await onDelete(ids);
    if (done) { setSelectedIds([]); setDetailChallenge(null); }
  };

  return <section className="mx-auto w-full max-w-[1600px] space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3 border bg-card p-3">
      <div>
        <h2 className="font-semibold">Banco de oportunidades</h2>
        <p className="text-xs text-muted-foreground">Biblioteca de desafios internos, solicitações de valor e recompensas.</p>
      </div>
      <div className="flex flex-wrap gap-1">
        <div className="flex gap-1 border p-1">
          <button type="button" onClick={() => setView("library")} className={`h-8 px-3 text-xs font-medium ${view === "library" ? "bg-cyan-700 text-white" : "hover:bg-muted"}`}>Biblioteca</button>
          <button type="button" onClick={() => setView("requests")} className={`h-8 px-3 text-xs font-medium ${view === "requests" ? "bg-cyan-700 text-white" : "hover:bg-muted"}`}>Solicitações {pendingRequests.length > 0 && <span className="ml-1 rounded bg-amber-400 px-1.5 text-[10px] text-amber-950">{pendingRequests.length}</span>}</button>
        </div>
        {canManage && <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4" />Importar rascunhos</Button>}
      </div>
    </div>

    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      <Kpi label="Desafios" value={challenges.length} />
      <Kpi label="Sem valor" value={challenges.filter((item) => item.rewardStatus === "unpriced").length} tone="slate" />
      <Kpi label="Solicitações pendentes" value={pendingRequests.length} tone="amber" />
      <Kpi label="Valores configurados" value={challenges.filter((item) => item.rewardStatus === "configured").length} tone="emerald" />
      <Kpi label="Não remunerados" value={challenges.filter((item) => item.rewardStatus === "non_rewarded").length} tone="zinc" />
    </div>

    {view === "library" ? <>
      <div className="flex flex-wrap items-center gap-2 border bg-card p-2">
        <div className="relative min-w-[230px] flex-1"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-8" placeholder="Buscar desafio, contexto ou condição..." /></div>
        <select value={rewardFilter} onChange={(event) => setRewardFilter(event.target.value as RewardFilter)} className="h-9 border bg-background px-2 text-xs"><option value="all">Todos os valores</option>{Object.entries(rewardLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="h-9 border bg-background px-2 text-xs"><option value="all">Todos os status</option><option value="draft">Rascunho</option><option value="open">Aberto</option><option value="accepted">Aceito</option><option value="in_progress">Em execução</option><option value="awaiting_validation">Aguardando validação</option><option value="won">Concluído</option></select>
        <select value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)} className="h-9 border bg-background px-2 text-xs"><option value="all">Todos os setores</option><option value="general">Geral da empresa</option>{sectorUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select>
        <select value={responsibleFilter} onChange={(event) => setResponsibleFilter(event.target.value)} className="h-9 border bg-background px-2 text-xs"><option value="all">Todos os responsáveis</option><option value="unassigned">Sem responsável</option>{collaborators.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select>
        <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="h-9 border bg-background px-2 text-xs"><option value="recent">Mais recentes</option><option value="deadline">Prazo</option><option value="reward_desc">Maior valor</option><option value="reward_asc">Menor valor</option><option value="requests">Com solicitações</option></select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Filtros por setor, responsável e valor aplicados à biblioteca.</p><Button size="sm" variant="outline" onClick={() => setColumnsOpen(true)}><Settings2 className="h-4 w-4" />Configurar colunas</Button></div>
      {canManage && selectedIds.length > 0 && <div className="flex flex-wrap items-center justify-between gap-2 border border-cyan-200 bg-cyan-50 p-2"><span className="text-xs font-medium">{selectedIds.length} desafio(s) selecionado(s)</span><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>Limpar</Button><Button size="sm" variant="destructive" onClick={() => void removeChallenges(selectedIds)}><Trash2 className="h-4 w-4" />Excluir selecionados</Button><Button size="sm" onClick={() => openConfig(selectedIds)}><CircleDollarSign className="h-4 w-4" /> Configurar em massa</Button></div></div>}
      <div className="hidden overflow-x-auto border bg-card md:block"><table className="w-full min-w-[1080px] text-left text-sm"><thead className="border-b bg-muted/40 text-[10px] uppercase text-muted-foreground"><tr>{canManage && <th className="w-10 p-3"><input aria-label="Selecionar todos" type="checkbox" checked={filteredChallenges.length > 0 && filteredChallenges.every((item) => selectedIds.includes(item.id))} onChange={(event) => setSelectedIds(event.target.checked ? filteredChallenges.map((item) => item.id) : [])} /></th>}<Header label="Desafio" onClick={() => setSort("recent")} /><Header label="Origem" onClick={() => setSort("recent")} /><Header label="Situação" onClick={() => setSort("recent")} /><Header label="Valor" onClick={() => setSort("reward_desc")} /><Header label="Solicitação" onClick={() => setSort("requests")} /><Header label="Prazo" onClick={() => setSort("deadline")} />{hasColumn("created") && <Header label="Criado em" onClick={() => setSort("recent")} />}{hasColumn("age") && <th className="p-3">Tempo aberto</th>}{hasColumn("responsible") && <th className="p-3">Responsável</th>}{hasColumn("requester") && <th className="p-3">Criado por</th>}<th className="p-3 text-right">Ações</th></tr></thead><tbody>{filteredChallenges.map((challenge) => { const request = latestRequestByChallenge.get(challenge.id); const participants = participantsByChallenge.get(challenge.id) ?? []; const responsibleNames = participants.map((item) => collaboratorNames.get(item.collaboratorId)).filter((name): name is string => Boolean(name)); return <tr key={challenge.id} className="border-b last:border-0 hover:bg-muted/20">{canManage && <td className="p-3"><input aria-label={`Selecionar ${challenge.title}`} type="checkbox" checked={selectedIds.includes(challenge.id)} onChange={() => toggleSelected(challenge.id)} /></td>}<td className="max-w-[330px] p-3"><button type="button" onClick={() => setDetailChallenge(challenge)} className="text-left font-medium hover:text-cyan-700 hover:underline">{challenge.title}</button><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{challenge.description || challenge.successCriteria}</p></td><td className="p-3 text-xs">{challenge.clientId ? unitNames.get(challenge.clientId) ?? "Unidade interna" : "Geral da empresa"}</td><td className="p-3"><span className={`px-2 py-1 text-[10px] font-semibold uppercase ${CHALLENGE_STATUS_CONFIG[challenge.status].className}`}>{statusLabel(challenge.status)}</span></td><td className="p-3"><span className={`px-2 py-1 text-[10px] font-semibold ${rewardClasses[challenge.rewardStatus]}`}>{rewardLabels[challenge.rewardStatus]}</span>{challenge.rewardStatus === "configured" && <p className="mt-1 text-xs font-medium"><Star className="mr-1 inline h-3 w-3 text-amber-500" />{rewardBadgeText(challenge)}</p>}</td><td className="p-3 text-xs">{request ? <span className="text-amber-700">{collaboratorNames.get(request.collaboratorId) ?? "Colaborador"}: {request.status === "pending" ? "solicitou valor" : request.status === "reviewed" ? "solicitação revisada" : "solicitação recusada"}</span> : <span className="text-muted-foreground">Sem solicitação</span>}</td><td className="p-3 text-xs">{challenge.dueAt ? new Date(challenge.dueAt).toLocaleDateString("pt-BR") : "Sem prazo"}</td>{hasColumn("created") && <td className="p-3 text-xs">{new Date(challenge.createdAt).toLocaleDateString("pt-BR")}</td>}{hasColumn("age") && <td className="p-3 text-xs">{Math.max(0, Math.floor((Date.now() - new Date(challenge.createdAt).getTime()) / 86400000))} dias</td>}{hasColumn("responsible") && <td className="p-3 text-xs">{responsibleNames.length ? responsibleNames.join(", ") : <span className="text-violet-700">Em aberto</span>}</td>}{hasColumn("requester") && <td className="p-3 text-xs">{challenge.createdBy || "Sistema"}</td>}<td className="p-3 text-right"><div className="flex justify-end gap-2">{challenge.status === "open" && challenge.rewardStatus === "configured" && currentUser && <Button size="sm" variant="outline" title="Aceitar este desafio e assumir a entrega" onClick={() => void onAccept(challenge.id, currentUser.id)}><UserPlus className="h-4 w-4" /> Aceitar</Button>}{challenge.rewardStatus === "unpriced" && currentUser && <Button size="sm" variant="outline" title="Solicitar ao administrador a definição de valor" disabled={hasOwnPendingRequest(challenge.id)} onClick={() => setRequestChallenge(challenge)}>{hasOwnPendingRequest(challenge.id) ? "Solicitado" : "Solicitar valor"}</Button>}{canManage && <><SuperstarQuickSet challenge={challenge} onSave={(amount) => saveSuperstars(challenge, amount)} /><Button size="icon" variant="outline" title="Editar desafio" onClick={() => setEditingChallenge(challenge)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="outline" title="Excluir desafio" onClick={() => void removeChallenges([challenge.id])}><Trash2 className="h-4 w-4" /></Button></>}</div></td></tr>; })}{filteredChallenges.length === 0 && <tr><td colSpan={canManage ? 12 : 11} className="p-10 text-center text-sm text-muted-foreground">Nenhum desafio encontrado com estes filtros.</td></tr>}</tbody></table></div>
      <div className="space-y-2 md:hidden">
        {filteredChallenges.map((challenge) => {
          const participants = participantsByChallenge.get(challenge.id) ?? [];
          const responsibleNames = participants.map((item) => collaboratorNames.get(item.collaboratorId)).filter((name): name is string => Boolean(name));
          const origin = challenge.clientId ? unitNames.get(challenge.clientId) ?? "Unidade interna" : "Geral da empresa";
          const contextPreview = challenge.description?.trim();
          const deliverablePreview = challenge.expectedDeliverable?.trim();
          return <article key={challenge.id} className="space-y-2 border bg-card p-3">
            <div className="flex items-start gap-2">
              {canManage && <input aria-label={`Selecionar ${challenge.title}`} type="checkbox" className="mt-1 h-4 w-4" checked={selectedIds.includes(challenge.id)} onChange={() => toggleSelected(challenge.id)} />}
              <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug">{challenge.title}</h3>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase ${CHALLENGE_STATUS_CONFIG[challenge.status].className}`}>{statusLabel(challenge.status)}</span>
                <span className={`px-1.5 py-0.5 text-[10px] font-semibold ${rewardClasses[challenge.rewardStatus]}`}>{rewardBadgeText(challenge)}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/70">Contexto e objetivo</p>
                <p className="line-clamp-3 text-xs leading-snug">{contextPreview || "Não informado"}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/70">Entregável esperado</p>
                <p className="line-clamp-3 text-xs leading-snug">{deliverablePreview || "Não definido"}</p>
              </div>
            </div>
            <p className="truncate text-[11px] text-muted-foreground">
              {origin} · {responsibleNames.length ? responsibleNames.join(", ") : "Em aberto"} · {challenge.dueAt ? new Date(challenge.dueAt).toLocaleDateString("pt-BR") : "Sem prazo"} · {challenge.createdBy || "Sistema"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setDetailChallenge(challenge)}>Ver detalhes</Button>
              {challenge.status === "open" && challenge.rewardStatus === "configured" && currentUser && <Button size="sm" className="flex-1" onClick={() => void onAccept(challenge.id, currentUser.id)}><UserPlus className="h-4 w-4" /> Aceitar</Button>}
              {!canManage && challenge.rewardStatus === "unpriced" && currentUser && <Button size="sm" variant="outline" className="flex-1" disabled={hasOwnPendingRequest(challenge.id)} onClick={() => setRequestChallenge(challenge)}>{hasOwnPendingRequest(challenge.id) ? "Solicitado" : "Solicitar valor"}</Button>}
              {canManage && <>
                <SuperstarQuickSet challenge={challenge} className="w-full" onSave={(amount) => saveSuperstars(challenge, amount)} />
                <Button size="sm" variant="outline" title="Editar desafio" onClick={() => setEditingChallenge(challenge)}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" title="Excluir desafio" onClick={() => void removeChallenges([challenge.id])}><Trash2 className="h-4 w-4" /></Button>
              </>}
            </div>
          </article>;

        })}
        {filteredChallenges.length === 0 && <div className="border bg-card p-10 text-center text-sm text-muted-foreground">Nenhum desafio encontrado com estes filtros.</div>}
      </div>

    </> : <div className="space-y-2">{valueRequests.length === 0 ? <div className="border bg-card p-10 text-center text-sm text-muted-foreground">Ainda não há solicitações de valor.</div> : valueRequests.map((request) => { const challenge = challenges.find((item) => item.id === request.challengeId); return <article key={request.id} className="flex flex-wrap items-start justify-between gap-3 border bg-card p-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{challenge?.title ?? "Desafio removido"}</h3><span className={`px-2 py-1 text-[10px] font-semibold ${request.status === "pending" ? "bg-amber-100 text-amber-800" : request.status === "declined" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>{request.status === "pending" ? "Pendente" : request.status === "declined" ? "Recusada" : "Revisada"}</span></div><p className="mt-2 text-sm">{request.justification}</p><p className="mt-2 text-xs text-muted-foreground">Solicitado por {collaboratorNames.get(request.collaboratorId) ?? "Colaborador"} em {new Date(request.requestedAt).toLocaleString("pt-BR")}</p>{request.adminNote && <p className="mt-2 border-l-2 pl-2 text-xs text-muted-foreground">Nota administrativa: {request.adminNote}</p>}</div>{canManage && request.status === "pending" && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void onReviewRequest(request.id, "declined")}>Recusar</Button><Button size="sm" onClick={() => openConfig([request.challengeId])}>Definir valor</Button></div>}</article>; })}</div>}

    <Dialog open={Boolean(requestChallenge)} onOpenChange={(open) => !open && setRequestChallenge(null)}><DialogContent><DialogHeader><DialogTitle>Solicitar valor do desafio</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Explique por que este desafio merece recompensa. A solicitação seguirá para a fila do administrador.</p><Label className="grid gap-1.5">Justificativa<Textarea value={requestText} onChange={(event) => setRequestText(event.target.value)} placeholder="Explique o escopo, esforço, impacto e entrega esperada." /></Label><DialogFooter><Button variant="outline" onClick={() => setRequestChallenge(null)}>Cancelar</Button><Button disabled={!requestText.trim() || saving} onClick={() => void submitRequest()}>{saving ? "Enviando..." : "Enviar solicitação"}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={configIds.length > 0} onOpenChange={(open) => !open && setConfigIds([])}><DialogContent><DialogHeader><DialogTitle>{configIds.length > 1 ? `Configurar ${configIds.length} desafios` : "Configurar valor do desafio"}</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">O valor é integral para cada participante quando o desafio for coletivo. Deixe como não remunerado quando a oportunidade não gerar estrelas.</p><div className="grid gap-4 sm:grid-cols-3"><Label className="grid gap-1.5">Estrelas<Input type="number" min={0} disabled={nonRewarded} value={rewardStars} onChange={(event) => setRewardStars(Number(event.target.value))} /></Label><Label className="grid gap-1.5">Super Estrelas<Input type="number" min={0} disabled={nonRewarded} value={superstars} onChange={(event) => setSuperstars(Number(event.target.value))} /></Label><Label className="grid gap-1.5">Penalidade em estrelas<Input type="number" min={0} disabled={nonRewarded} value={penalty} onChange={(event) => setPenalty(Number(event.target.value))} /></Label></div><label className="flex items-center gap-2 border p-3 text-sm"><input type="checkbox" checked={nonRewarded} onChange={(event) => setNonRewarded(event.target.checked)} /> Marcar como oportunidade não remunerada</label><Label className="grid gap-1.5">Nota administrativa (opcional)<Textarea value={adminNote} onChange={(event) => setAdminNote(event.target.value)} placeholder="Critério, observação ou retorno para quem solicitou." /></Label><DialogFooter><Button variant="outline" onClick={() => setConfigIds([])}>Cancelar</Button><Button disabled={saving} onClick={() => void submitConfig()}><Check className="h-4 w-4" />{saving ? "Salvando..." : "Salvar configuração"}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={columnsOpen} onOpenChange={setColumnsOpen}><DialogContent><DialogHeader><DialogTitle>Configurar colunas</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Escolha as informações complementares da tabela. Esta preferência ficará salva neste navegador.</p><div className="grid gap-2">{[{ value: "created", label: "Data de criação" }, { value: "age", label: "Tempo desde a criação" }, { value: "responsible", label: "Responsável" }, { value: "requester", label: "Pessoa que solicitou valor" }].map((column) => <label key={column.value} className="flex items-center gap-2 border p-3 text-sm"><input type="checkbox" checked={hasColumn(column.value)} onChange={() => toggleColumn(column.value)} />{column.label}</label>)}</div><DialogFooter><Button variant="outline" onClick={() => setColumnsOpen(false)}>Cancelar</Button><Button onClick={saveColumns}>Salvar colunas</Button></DialogFooter></DialogContent></Dialog>

    <UniverseChallengeDetailDialog challenge={detailChallenge} open={Boolean(detailChallenge)} onOpenChange={(open) => !open && setDetailChallenge(null)} units={units} collaborators={collaborators} conditions={detailChallenge ? conditionsByChallenge.get(detailChallenge.id) ?? [] : []} onToggleCondition={(id, completed) => void onToggleCondition(id, completed)} canManage={canManage} onEdit={() => { setEditingChallenge(detailChallenge); setDetailChallenge(null); }} onDelete={() => detailChallenge && void removeChallenges([detailChallenge.id])} />
    <UniverseChallengeEditDialog challenge={editingChallenge} open={Boolean(editingChallenge)} onOpenChange={(open) => !open && setEditingChallenge(null)} units={units} conditions={editingChallenge ? conditionsByChallenge.get(editingChallenge.id) ?? [] : []} onSave={onUpdate} />
    <UniverseChallengeImportDialog open={importOpen} onOpenChange={setImportOpen} units={units} collaborators={collaborators} onImport={onImportDrafts} />
  </section>;
}

function Header({ label, onClick }: { label: string; onClick: () => void }) { return <th className="p-3"><button type="button" onClick={onClick} title={`Ordenar por ${label}`} className="font-semibold hover:text-foreground">{label} <span aria-hidden>↕</span></button></th>; }

function Kpi({ label, value, tone = "cyan" }: { label: string; value: number; tone?: "cyan" | "slate" | "amber" | "emerald" | "zinc" }) {
  const colors = { cyan: "border-cyan-200 text-cyan-800", slate: "border-slate-200 text-slate-700", amber: "border-amber-200 text-amber-800", emerald: "border-emerald-200 text-emerald-800", zinc: "border-zinc-200 text-zinc-700" };
  return <div className={`border bg-card p-3 ${colors[tone]}`}><p className="text-2xl font-semibold">{value}</p><p className="text-[10px] font-medium uppercase">{label}</p></div>;
}
