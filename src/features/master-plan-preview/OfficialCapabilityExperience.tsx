import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BookOpen, Check, ClipboardCheck, FileText, GraduationCap, Search, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { criteriaFor, capabilityLevelNames, type CapabilityLevel, type CapabilityRecord, type Criterion, type CriterionResponse, type CriterionReview } from "./capabilityJourney";
import { sourceLines } from "./capabilityDemo";
import { CapabilityCatalogCard, CapabilityHero, CapabilityIdentityStrip, CapabilityQueueThumb } from "./CapabilityVisualIdentity";
import { capabilityVisualStyle } from "./capabilityVisuals";
import { CapabilityPrerequisites, CapabilityPurpose } from "./capabilityPresentation";
import { capabilitySummary, firstLetterUpper } from "./capabilityPresentationData";
import { criterionPrompt, criterionResponsePrompt } from "./criterionGuidance";
import { CapabilityTeamMatrix } from "./CapabilityTeamMatrix";
import { ResponsibilityJourneyPanel } from "./ResponsibilityJourneyPanel";
import { CareerJourneyExperience, CareerStructureExperience } from "./CareerJourneyExperience";
import { approvedLevels } from "./responsibilityEligibility";
import type { PreviewResponsibility } from "./model";
import type { Unit } from "./data";
import {
  applyTeamCertifications, createRemoteAssessment, fetchAssessments, fetchRequests, fetchResponsibilityClaims, fetchTeamCertifications, requestResponsibility, requestTeamTraining,
  fetchTeamTrainingRequests, reviewRequest, reviewResponsibilityClaim, saveRequest,
  type Library, type RequestRow, type TeamTrainingRequestRow,
} from "./journeyRemote";
import "./capability-experience.css";

type Screen = "capacidades" | "capacidade" | "capacitacoes" | "jornada" | "cargos-funcoes";
type Go = (view: Screen | "responsabilidade" | "responsabilidades", id?: string, tab?: string, mode?: string) => void;
type Props = { view: Screen; code: string; tab: string; mode: string; go: Go; library: Library; people: Array<{ id: string; name: string }>; mappedResponsibilities?: PreviewResponsibility[]; sectors?: Unit[]; openSector?: (sectorId: string) => void; capabilityPlans?: Record<string, Record<string, 0 | CapabilityLevel>>; onDeactivateCollaborator?: (collaboratorId: string) => Promise<void> };
const kinds = ["Todas", "Transversal", "Funcional", "Especializada"];
const journeyFilters = ["Todas", "Em desenvolvimento", "Falta Assistido", "Falta Autônomo", "Falta Multiplicador", "Com certificação"];
const answerLabels = ["Preciso de ajuda", "Com apoio", "Sozinho", "Consigo ensinar"];
const emptyResponse = (): CriterionResponse => ({ complete: false, explanation: "", evidenceName: "", reference: "", files: [] });
const prettyDate = (date: string) => new Date(date).toLocaleDateString("pt-BR");

function Heading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return <div className="cap-intro-title mb-5 border-b border-zinc-200 pb-5"><p className="cap-eyebrow">{eyebrow}</p><h1 className="text-2xl font-semibold text-[#172824] sm:text-[28px]">{title}</h1>{children && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">{children}</p>}</div>;
}

function Lines({ value }: { value: string }) {
  const lines = sourceLines(value);
  return <ul className="space-y-2">{lines.map((line, index) => <li key={`${index}-${line}`} className="flex gap-2 text-sm leading-relaxed text-zinc-700"><Check className="mt-1 h-4 w-4 shrink-0 text-teal-600" />{firstLetterUpper(line)}</li>)}</ul>;
}

function EvidenceReference({ name, location }: { name?: string; location: string }) {
  const trimmed = location.trim();
  const url = /^https?:\/\/\S+$/i.test(trimmed) ? trimmed : null;
  return <p className="mt-2 break-all text-xs text-zinc-600"><strong>{name?.trim() || "Evidência registrada"}:</strong> {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline">{trimmed}</a> : trimmed}</p>;
}

export function OfficialCapabilityExperience({ view, code, tab, mode, go, library, people, mappedResponsibilities = [], sectors = [], openSector = () => {}, capabilityPlans = {}, onDeactivateCollaborator }: Props) {
  const { currentUser, loading } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = currentUser?.role === "admin";
  const assessments = useQuery({ queryKey: ["master-plan-assessments", currentUser?.id], queryFn: () => fetchAssessments(currentUser!.id), enabled: !!currentUser });
  const requests = useQuery({ queryKey: ["master-plan-requests", currentUser?.id, isAdmin], queryFn: () => fetchRequests(currentUser!.id, isAdmin), enabled: !!currentUser });
  const teamCertifications = useQuery({ queryKey: ["master-plan-team-certifications"], queryFn: fetchTeamCertifications, enabled: !!currentUser, retry: false });
  const teamTrainingRequests = useQuery({ queryKey: ["master-plan-team-training-requests"], queryFn: fetchTeamTrainingRequests, enabled: !!currentUser, retry: false });
  const responsibilityClaims = useQuery({ queryKey: ["master-plan-responsibility-claims"], queryFn: fetchResponsibilityClaims, enabled: !!currentUser, retry: false });
  const selected = library.capabilities.find((item) => item.code === code);
  const ownRequests = requests.data?.filter((request) => request.collaborator_id === currentUser?.id) ?? [];
  const ownCertifiedLevels = currentUser ? approvedLevels(requests.data ?? [], currentUser.id, teamCertifications.data ?? []) : new Map<string, number>();
  const ownTrainingRequests = teamTrainingRequests.data?.filter((request) => request.collaborator_id === currentUser?.id && request.status !== "cancelled") ?? [];
  const approved = selected ? ownCertifiedLevels.get(selected.code) ?? 0 : 0;
  const certifiedLevels = new Map([...ownCertifiedLevels].filter(([, level]) => level > 0)) as Map<string, CapabilityLevel>;
  const teamLevels = useMemo(() => new Map(people.map((person) => [
    person.id,
    approvedLevels(requests.data ?? [], person.id, teamCertifications.data ?? []),
  ])), [people, requests.data, teamCertifications.data]);
  const selectedAssessments = assessments.data?.filter((assessment) => assessment.capability_code === selected?.code && assessment.collaborator_id === currentUser?.id) ?? [];
  const submitResponsibilityClaim = async (responsibilitySourceId: string) => {
    try {
      await requestResponsibility(responsibilitySourceId);
      await queryClient.invalidateQueries({ queryKey: ["master-plan-responsibility-claims"] });
      toast.success("Responsabilidade solicitada para avaliação.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível solicitar a responsabilidade.");
      throw error;
    }
  };
  const decideResponsibilityClaim = async (claimId: string, decision: "approved" | "rejected") => {
    try {
      await reviewResponsibilityClaim(claimId, decision);
      await queryClient.invalidateQueries({ queryKey: ["master-plan-responsibility-claims"] });
      toast.success(decision === "approved" ? "Responsabilidade concedida." : "Solicitação devolvida.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível avaliar a responsabilidade.");
      throw error;
    }
  };
  return <div className="cap-experience cap-themed relative min-w-0" style={selected ? capabilityVisualStyle(selected.code) : undefined} data-testid="official-capability-experience">
    {view === "capacidades" && <Catalog library={library} go={go} certifiedLevels={ownCertifiedLevels} trainingRequests={ownTrainingRequests} />}
    {view === "jornada" && (currentUser ? <CareerJourneyExperience library={library} certifiedLevels={ownCertifiedLevels} claims={responsibilityClaims.data ?? []} collaboratorId={currentUser.id} collaboratorName={currentUser.name} isAdmin={isAdmin} people={people} teamLevels={teamLevels} go={go} /> : <div className="cap-empty">Selecione seu perfil no Radar Vital para consultar sua jornada.</div>)}
    {view === "cargos-funcoes" && <CareerStructureExperience library={library} people={people} teamLevels={teamLevels} claims={responsibilityClaims.data ?? []} isAdmin={isAdmin} go={go} />}
    {view === "capacitacoes" && !selected && <TrainingOverview library={library} go={go} currentUser={currentUser} certifiedLevels={ownCertifiedLevels} trainingRequests={ownTrainingRequests} claims={responsibilityClaims.data ?? []} isAdmin={isAdmin} onRequestResponsibility={submitResponsibilityClaim} onReviewResponsibility={decideResponsibilityClaim} />}
    {view === "capacidade" && !selected && <div className="cap-empty">Capacidade não encontrada.<Button variant="outline" onClick={() => go("capacidades")}>Voltar ao catálogo</Button></div>}
    {view === "capacidade" && selected && <Sheet item={selected} library={library} approved={approved} certifiedLevels={certifiedLevels} assessmentLevel={selectedAssessments[0]?.indicated_level} go={go} tab={tab} mappedResponsibilities={mappedResponsibilities} sectors={sectors} openSector={openSector} />}
    {view === "capacitacoes" && selected && <>
      {mode === "administrador" && isAdmin && tab === "mapa" ? <CapabilityTeamMatrix library={library} people={people} plans={capabilityPlans} onApplyUpdates={(updates) => applyTeamCertifications(currentUser!.id, updates)} onRequestTraining={(collaboratorId, capabilityCode, level) => requestTeamTraining(currentUser!.id, collaboratorId, capabilityCode, level)} onDeactivatePerson={onDeactivateCollaborator} /> : <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><button type="button" onClick={() => go("capacidade", selected.code)} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700"><ArrowLeft className="h-4 w-4" /> Voltar à ficha</button>{currentUser && <span className="text-xs text-zinc-600">Perfil atual: <strong>{currentUser.name}</strong></span>}</div>
      <Heading eyebrow={`Jornada / ${selected.code}`} title={mode === "administrador" && isAdmin ? "Avaliação de capacitações" : `Capacitação · ${selected.title}`}>{selected.summary}</Heading>
      {isAdmin && <div className="mb-4 flex flex-wrap gap-1 border-b pb-3" role="group" aria-label="Visão de capacitações"><button type="button" onClick={() => go("capacitacoes", selected.code, "autoavaliacao", "colaborador")} className="cap-mode">Colaborador</button><button type="button" onClick={() => go("capacitacoes", selected.code, "retorno", "administrador")} className={`cap-mode ${mode === "administrador" ? "cap-mode-active" : ""}`}>Avaliar pedidos</button><button type="button" onClick={() => go("capacitacoes", selected.code, "mapa", "administrador")} className="cap-mode">Mapa da equipe</button></div>}
      {!(mode === "administrador" && isAdmin) && <CapabilityIdentityStrip item={selected} />}
      <p className="mb-4 border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-950">Os registros são atribuídos ao perfil selecionado no Radar Vital. Este perfil pode ser trocado no aplicativo e não comprova identidade individual.</p>
      {loading ? <div className="cap-empty">Carregando perfil...</div> : !currentUser ? <div className="cap-empty">Selecione seu perfil no Radar Vital para iniciar a jornada.</div> : requests.error || assessments.error || teamCertifications.error || teamTrainingRequests.error || responsibilityClaims.error ? <div className="cap-empty">Não foi possível carregar sua jornada. Verifique a conexão e tente atualizar.</div> : requests.isLoading || assessments.isLoading || teamCertifications.isLoading || teamTrainingRequests.isLoading || responsibilityClaims.isLoading ? <div className="cap-empty">Carregando histórico...</div> : mode === "administrador" && isAdmin ? <Reviewer library={library} requests={requests.data ?? []} people={people} reviewerId={currentUser.id} /> : <Journey item={selected} tab={tab} go={go} collaboratorId={currentUser.id} collaboratorName={currentUser.name} approved={approved} trainingLevel={ownTrainingRequests.find((request) => request.capability_code === selected.code && request.target_level > approved)?.target_level} assessments={selectedAssessments} requests={ownRequests.filter((request) => request.capability_code === selected.code)} canReview={isAdmin} />}
      </>}
    </>}
  </div>;
}

function Catalog({ library, go, certifiedLevels, trainingRequests, compact = false }: { library: Library; go: Go; certifiedLevels: Map<string, number>; trainingRequests: TeamTrainingRequestRow[]; compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("Todas");
  const [journeyFilter, setJourneyFilter] = useState("Todas");
  const list = useMemo(() => library.capabilities.filter((item) => (kind === "Todas" || item.nature === kind)
    && `${item.code} ${item.title} ${item.summary} ${item.originLabel}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))
    && (() => { const certifiedLevel = certifiedLevels.get(item.code) ?? 0; const inDevelopment = trainingRequests.some((request) => request.capability_code === item.code && request.target_level > certifiedLevel); return journeyFilter === "Todas" || journeyFilter === "Em desenvolvimento" && inDevelopment || journeyFilter === "Falta Assistido" && certifiedLevel === 0 && !inDevelopment || journeyFilter === "Falta Autônomo" && certifiedLevel === 1 && !inDevelopment || journeyFilter === "Falta Multiplicador" && certifiedLevel === 2 && !inDevelopment || journeyFilter === "Com certificação" && certifiedLevel > 0; })()), [library, kind, query, journeyFilter, certifiedLevels, trainingRequests]);
  return <>{compact ? <div className="mb-4 border-t pt-6"><h2 className="text-lg font-semibold">Mapa completo de capacidades</h2><p className="mt-1 text-sm text-zinc-600">Consulte cada capacidade, seu nível atual e o próximo passo possível.</p></div> : <Heading eyebrow="Plano Mestre / Capacidades" title="Banco de capacidades">Veja as capacidades já certificadas, as que estão em desenvolvimento e as próximas etapas do seu perfil.</Heading>}
    <div className="cap-search-shell mb-4"><Search className="h-5 w-5 text-teal-700" /><input aria-label="Buscar capacidades" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar capacidade, código ou atividade" className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" />{query && <button type="button" aria-label="Limpar busca" onClick={() => setQuery("")}><X className="h-4 w-4" /></button>}</div>
    <div className="mb-4 flex flex-wrap gap-1" role="group" aria-label="Natureza da capacidade">{kinds.map((value) => <button type="button" key={value} aria-pressed={kind === value} onClick={() => setKind(value)} className={`cap-filter ${kind === value ? "cap-filter-active" : ""}`}>{value}</button>)}<span className="ml-auto self-center text-xs text-zinc-500">{list.length} de {library.capabilities.length}</span></div>
    <div className="mb-4 flex flex-wrap gap-1" role="group" aria-label="Situação da jornada">{journeyFilters.map((value) => <button type="button" key={value} aria-pressed={journeyFilter === value} onClick={() => setJourneyFilter(value)} className={`cap-filter ${journeyFilter === value ? "cap-filter-active" : ""}`}>{value}</button>)}</div>
    <div className="cap-catalog-grid">{list.map((item) => { const certifiedLevel = certifiedLevels.get(item.code) ?? 0; const trainingLevel = trainingRequests.find((request) => request.capability_code === item.code && request.target_level > certifiedLevel)?.target_level ?? 0; return <CapabilityCatalogCard key={item.code} item={item} certifiedLevel={certifiedLevel} trainingLevel={trainingLevel} onOpen={() => go("capacidade", item.code)} onRequestLevel={() => go("capacitacoes", item.code, "criterios", "colaborador")} />; })}</div>
    {!list.length && <div className="cap-empty">Nenhuma capacidade encontrada.</div>}
  </>;
}

function TrainingOverview({ library, go, currentUser, certifiedLevels, trainingRequests, claims, isAdmin, onRequestResponsibility, onReviewResponsibility }: { library: Library; go: Go; currentUser: { id: string; name: string } | null; certifiedLevels: Map<string, number>; trainingRequests: TeamTrainingRequestRow[]; claims: import("./responsibilityJourney").ResponsibilityClaim[]; isAdmin: boolean; onRequestResponsibility: (responsibilitySourceId: string) => Promise<void>; onReviewResponsibility: (claimId: string, decision: "approved" | "rejected") => Promise<void> }) {
  const [showCertified, setShowCertified] = useState(false);
  const [showInDevelopment, setShowInDevelopment] = useState(false);
  if (!currentUser) return <div className="cap-empty">Selecione seu perfil no Radar Vital para consultar suas capacitações.</div>;
  const certified = library.capabilities.filter((item) => (certifiedLevels.get(item.code) ?? 0) > 0);
  const inDevelopment = trainingRequests.filter((request) => (certifiedLevels.get(request.capability_code) ?? 0) < request.target_level);
  const recommendations = library.capabilities
    .filter((item) => (certifiedLevels.get(item.code) ?? 0) < 3)
    .sort((a, b) => {
      const aTraining = inDevelopment.some((request) => request.capability_code === a.code);
      const bTraining = inDevelopment.some((request) => request.capability_code === b.code);
      return Number(bTraining) - Number(aTraining) || (certifiedLevels.get(a.code) ?? 0) - (certifiedLevels.get(b.code) ?? 0) || a.code.localeCompare(b.code);
    })
    .slice(0, 6);
  return <><Heading eyebrow={`Jornada de ${currentUser.name}`} title="Minhas capacitações">Acompanhe o que já está certificado, o que está em desenvolvimento e os próximos níveis recomendados para sua evolução.</Heading>
    <div className="mb-7 grid gap-3 sm:grid-cols-3">
      <button type="button" aria-expanded={showCertified} onClick={() => setShowCertified((current) => !current)} className="border-t-4 border-emerald-600 bg-white p-4 text-left transition-colors hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><p className="text-xs font-semibold uppercase text-zinc-500">Certificadas</p><strong className="mt-1 block text-2xl">{certified.length}</strong><p className="mt-1 text-xs text-zinc-600">capacidades com nível reconhecido</p><span className="mt-3 inline-flex text-xs font-semibold text-emerald-800">{showCertified ? "Ocultar certificações" : "Ver certificações"}</span></button>
      <button type="button" aria-expanded={showInDevelopment} onClick={() => setShowInDevelopment((current) => !current)} className="border-t-4 border-sky-500 bg-white p-4 text-left transition-colors hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"><p className="text-xs font-semibold uppercase text-zinc-500">Em desenvolvimento</p><strong className="mt-1 block text-2xl">{inDevelopment.length}</strong><p className="mt-1 text-xs text-zinc-600">capacitações solicitadas</p><span className="mt-3 inline-flex text-xs font-semibold text-sky-800">{showInDevelopment ? "Ocultar capacitações" : "Ver capacitações"}</span></button>
      <div className="border-t-4 border-amber-500 bg-white p-4"><p className="text-xs font-semibold uppercase text-zinc-500">Próximos passos</p><strong className="mt-1 block text-2xl">{recommendations.length}</strong><p className="mt-1 text-xs text-zinc-600">oportunidades para iniciar ou evoluir</p></div>
    </div>
    {showCertified && <section className="mb-7 border-t-4 border-emerald-600 bg-white p-4"><div className="mb-4 flex flex-wrap items-baseline justify-between gap-3"><div><h2 className="text-lg font-semibold">Certificações de {currentUser.name}</h2><p className="mt-1 text-sm text-zinc-600">Capacidades com nível oficialmente reconhecido.</p></div><span className="text-sm font-semibold text-emerald-800">{certified.length} certificadas</span></div><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{certified.map((item) => { const level = certifiedLevels.get(item.code) as CapabilityLevel; return <button key={item.code} type="button" onClick={() => go("capacidade", item.code)} className="flex items-center justify-between gap-3 border px-3 py-3 text-left hover:bg-emerald-50"><span className="min-w-0"><strong className="block text-sm">{item.code} · {item.title}</strong><span className="mt-1 block text-xs text-zinc-600">Nível consolidado: {capabilityLevelNames[level]}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-emerald-700" /></button>; })}</div>{!certified.length && <p className="text-sm text-zinc-600">Nenhuma capacidade certificada neste perfil.</p>}</section>}
    {showInDevelopment && <section className="mb-7 border-t-4 border-sky-500 bg-white p-4"><div className="mb-4 flex flex-wrap items-baseline justify-between gap-3"><div><h2 className="text-lg font-semibold">Capacitações em desenvolvimento</h2><p className="mt-1 text-sm text-zinc-600">Solicitações abertas para ampliar a atuação do perfil.</p></div><span className="text-sm font-semibold text-sky-800">{inDevelopment.length} em desenvolvimento</span></div><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{inDevelopment.map((request) => { const item = library.capabilities.find((capability) => capability.code === request.capability_code); const currentLevel = certifiedLevels.get(request.capability_code) ?? 0; if (!item) return null; return <button key={item.code} type="button" onClick={() => go("capacitacoes", item.code, "criterios", "colaborador")} className="flex items-center justify-between gap-3 border px-3 py-3 text-left hover:bg-sky-50"><span className="min-w-0"><strong className="block text-sm">{item.code} · {item.title}</strong><span className="mt-1 block text-xs text-zinc-600">{currentLevel ? `Nível atual: ${capabilityLevelNames[currentLevel]}` : "Nível atual: ainda não certificado"} · Em desenvolvimento: {capabilityLevelNames[request.target_level]}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-sky-700" /></button>; })}</div>{!inDevelopment.length && <p className="text-sm text-zinc-600">Nenhuma capacitação em desenvolvimento neste perfil.</p>}</section>}
    <ResponsibilityJourneyPanel library={library} certifiedLevels={certifiedLevels} claims={claims} collaboratorId={currentUser.id} isAdmin={isAdmin} onRequest={onRequestResponsibility} onReview={onReviewResponsibility} go={go} />
    <section className="mb-7"><div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-lg font-semibold">Próximas recomendações</h2><p className="mt-1 text-sm text-zinc-600">Priorize o próximo nível de capacidades já reconhecidas ou inicie uma nova jornada.</p></div></div><div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{recommendations.map((item) => { const certifiedLevel = certifiedLevels.get(item.code) ?? 0; const targetLevel = Math.max(1, certifiedLevel + 1) as CapabilityLevel; const requested = inDevelopment.find((request) => request.capability_code === item.code); return <article key={item.code} className="border bg-white p-4"><p className="text-xs font-semibold uppercase text-teal-700">{item.code} · {item.nature}</p><h3 className="mt-1 text-sm font-semibold">{item.title}</h3><p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-600">{capabilitySummary(item)}</p><p className="mt-3 text-xs text-zinc-600">{requested ? <>Em desenvolvimento: <strong>{capabilityLevelNames[requested.target_level]}</strong></> : certifiedLevel > 0 ? <>Certificado: <strong>{capabilityLevelNames[certifiedLevel]}</strong> · Próximo: <strong>{capabilityLevelNames[targetLevel]}</strong></> : <>Próximo passo: <strong>iniciar no nível Assistido</strong></>}</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => go("capacitacoes", item.code, "criterios", "colaborador")} className="text-xs font-semibold text-teal-700 hover:text-teal-900">{requested ? "Acompanhar capacitação" : `Solicitar ${capabilityLevelNames[targetLevel]}`}</button><button type="button" onClick={() => go("capacidade", item.code)} className="text-xs font-semibold text-zinc-700 hover:text-zinc-950">Ver capacidade</button></div></article>; })}</div></section>
    <Catalog library={library} go={go} certifiedLevels={certifiedLevels} trainingRequests={trainingRequests} compact />
  </>;
}

function Sheet({ item, library, approved, certifiedLevels, assessmentLevel, go, tab, mappedResponsibilities, sectors }: { item: CapabilityRecord; library: Library; approved: number; certifiedLevels: Map<string, CapabilityLevel>; assessmentLevel?: number; go: Go; tab: string; mappedResponsibilities: PreviewResponsibility[]; sectors: Unit[]; openSector: (sectorId: string) => void }) {
  const section = ["visao", "niveis", "responsabilidades"].includes(tab) ? tab : "visao";
  const linked = library.responsibilities.filter((responsibility) => responsibility.requiredCapabilities.some((entry) => entry.capabilityCode === item.code));
  return <><button type="button" onClick={() => go("capacidades")} className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-700"><ArrowLeft className="h-4 w-4" /> Banco de capacidades</button>
    <div className="cap-sheet-identity">
      <CapabilityHero item={item} />
      <Heading eyebrow={`${item.nature} / ${item.code}`} title={item.title}>{capabilitySummary(item)}</Heading>
    </div>
    <div className="mb-5 flex gap-1 overflow-x-auto border-b" role="tablist">{[["visao", "Visão geral"], ["niveis", "Níveis e evidências"], ["responsabilidades", `Responsabilidades (${linked.length})`]].map(([key, label]) => <button type="button" role="tab" aria-selected={section === key} key={key} className={`cap-section-tab ${section === key ? "cap-section-tab-active" : ""}`} onClick={() => go("capacidade", item.code, key)}>{label}</button>)}</div>
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_270px]"><div className="space-y-7">
      {section === "visao" && <><section><h2 className="mb-2 text-lg font-semibold">Finalidade</h2><CapabilityPurpose item={item} /></section><section><h2 className="mb-2 text-lg font-semibold">Escopo</h2><Lines value={item.detail.scope} /></section><section><h2 className="mb-2 text-lg font-semibold">Critérios de desempenho</h2><p className="mb-3 text-sm text-zinc-600">Use cada critério como uma declaração da sua prática, sustentada por um exemplo real e uma evidência verificável.</p><div className="space-y-3">{criteriaFor(item, 1).filter((criterion) => criterion.kind === "performance").map((criterion) => <div key={criterion.id} className="border-l-2 border-teal-400 pl-3 text-sm"><strong>{criterionPrompt(criterion.text)}</strong><p className="mt-1 leading-relaxed text-zinc-700">{firstLetterUpper(criterion.text)}</p><p className="mt-1 text-xs leading-relaxed text-zinc-600">{firstLetterUpper(criterion.guidance)}</p></div>)}</div></section><section className="grid gap-5 border-t pt-5 sm:grid-cols-2"><div><h2 className="mb-2 font-semibold">Pré-requisitos</h2><CapabilityPrerequisites value={item.detail.prerequisites} currentCode={item.code} onOpen={(code) => go("capacidade", code)} certifiedLevels={certifiedLevels} /></div><div><h2 className="mb-2 font-semibold">Limites</h2><p className="whitespace-pre-line text-sm leading-relaxed">{item.detail.limits}</p></div></section></>}
      {section === "niveis" && <>{([1, 2, 3] as CapabilityLevel[]).map((level) => <section key={level} className="border-l-4 border-teal-500 bg-white px-4 py-3"><h2 className="font-semibold">{level}. {capabilityLevelNames[level]}</h2><p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-zinc-700">{firstLetterUpper(level === 1 ? item.detail.assisted : level === 2 ? item.detail.autonomous : item.detail.multiplier)}</p><div className="mt-3 border-t pt-2"><p className="mb-1 text-xs font-semibold uppercase text-zinc-500">Evidências</p>{criteriaFor(item, level).filter((criterion) => criterion.level === level).map((criterion) => <div key={criterion.id} className="py-2 text-xs"><strong>{criterionPrompt(criterion.text)}</strong><p className="mt-1 text-zinc-700">{firstLetterUpper(criterion.text)}</p><p className="mt-1 leading-relaxed text-zinc-600">{firstLetterUpper(criterion.guidance)}</p></div>)}</div></section>)}</>}
      {section === "responsabilidades" && <><p className="mb-3 text-sm text-zinc-600">Estas responsabilidades exigem a capacidade em diferentes níveis. Abra as que já estão vinculadas para consultar atividades, setor e pessoas responsáveis.</p><div className="divide-y border-y bg-white">{linked.map((responsibility) => { const mapped = mappedResponsibilities.find((entry) => entry.id === responsibility.sourceId); const sector = sectors.find((entry) => entry.id === mapped?.sectorId); const level = responsibility.requiredCapabilities.find((entry) => entry.capabilityCode === item.code)?.minimumLevel ?? 0; return <button key={responsibility.sourceId} type="button" disabled={!mapped} onClick={() => go("responsabilidade", responsibility.sourceId)} className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left hover:bg-teal-50 disabled:cursor-default disabled:hover:bg-white"><span className="min-w-0"><strong className="block text-sm">{responsibility.title}</strong><span className="mt-1 block text-xs text-zinc-600">{sector ? `Setor responsável: ${sector.name}` : "Vínculo com setor pendente; ficha ainda indisponível"}</span></span><span className={`cap-level-badge cap-level-badge-${level}`}>Nível mínimo <strong>{capabilityLevelNames[level]}</strong> {mapped && <ArrowRight className="h-4 w-4" />}</span></button>; })}</div>{!linked.length && <p className="text-sm text-zinc-500">Nenhuma responsabilidade exige esta capacidade no momento.</p>}</>}
    </div><aside className="self-start border-t-4 border-teal-600 bg-white p-4 shadow-sm xl:sticky xl:top-3"><BookOpen className="h-5 w-5 text-teal-700" /><p className="mt-3 text-xs text-zinc-500">Autoavaliação mais recente</p><strong className="block text-base">{assessmentLevel === undefined ? "Ainda não realizada" : capabilityLevelNames[assessmentLevel]}</strong><p className="mt-4 text-xs text-zinc-500">Nível certificado</p><strong className="block text-base">{approved ? capabilityLevelNames[approved] : "Nenhum"}</strong><Button className="mt-5 w-full bg-[#176f68] hover:bg-[#115b55]" onClick={() => go("capacitacoes", item.code, "autoavaliacao")}>Abrir jornada <ArrowRight className="ml-2 h-4 w-4" /></Button><p className="mt-3 text-xs text-zinc-500">Fonte: {item.sourceVersion}. Certificação interna não substitui habilitação profissional.</p></aside></div>
  </>;
}

function Journey({ item, tab, go, collaboratorId, collaboratorName, approved, trainingLevel, assessments, requests, canReview }: {
  item: CapabilityRecord; tab: string; go: Go; collaboratorId: string; collaboratorName: string; approved: number; trainingLevel?: CapabilityLevel;
  assessments: Awaited<ReturnType<typeof fetchAssessments>>; requests: RequestRow[]; canReview: boolean;
}) {
  const queryClient = useQueryClient();
  const section = ["autoavaliacao", "criterios", "retorno"].includes(tab) ? tab : "autoavaliacao";
  const [answers, setAnswers] = useState([-1, -1, -1, -1]);
  const [comment, setComment] = useState("");
  const [level, setLevel] = useState<CapabilityLevel>(Math.min(3, approved + 1) as CapabilityLevel);
  const [responses, setResponses] = useState<Record<string, CriterionResponse>>({});
  const [requestId, setRequestId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showDeclaration, setShowDeclaration] = useState(false);
  const existing = requests.find((request) => request.target_level === level && request.status !== "approved");
  useEffect(() => { setLevel(Math.min(3, approved + 1) as CapabilityLevel); setAnswers([-1, -1, -1, -1]); setComment(""); }, [item.code, approved]);
  useEffect(() => { setResponses(existing?.responses ?? {}); setRequestId(existing?.id ?? null); }, [existing?.id, existing?.responses, existing?.updated_at, level, item.code]);
  const criteria = criteriaFor(item, level).filter((criterion) => approved === 0 || (criterion.level !== 0 && criterion.level > approved));
  const completedCriteria = criteria.filter((criterion) => responses[criterion.id]?.complete).length;
  const latestAssessment = assessments.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const nextAssessmentAt = latestAssessment ? new Date(new Date(latestAssessment.created_at).getTime() + 15 * 24 * 60 * 60 * 1000) : undefined;
  const canAssess = !nextAssessmentAt || nextAssessmentAt.getTime() <= Date.now();
  const editable = !existing || existing.status === "draft" || existing.status === "changes_requested";
  const complete = criteria.length > 0 && criteria.every((criterion) => {
    const response = responses[criterion.id];
    return response?.complete && response.explanation.trim() && (criterion.kind === "performance" || (response.evidenceName?.trim() && response.reference.trim()));
  });
  const refresh = async () => { await queryClient.invalidateQueries({ queryKey: ["master-plan-requests"] }); };
  const save = async (submit: boolean) => { setBusy(true); try { await saveRequest(collaboratorId, requestId, item.code, level, responses, submit); await refresh(); toast.success(submit ? "Solicitação enviada para avaliação." : "Rascunho salvo."); if (submit) go("capacitacoes", item.code, "retorno"); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar."); } finally { setBusy(false); } };
  const saveAssessment = async () => { if (answers.some((value) => value < 0) || !comment.trim()) { toast.error("Responda às quatro perguntas e explique sua avaliação."); return; } if (!canAssess) { toast.info(`A próxima autoavaliação estará disponível em ${nextAssessmentAt!.toLocaleDateString("pt-BR")}.`); return; } setBusy(true); try { await createRemoteAssessment(collaboratorId, item.code, answers, comment); await queryClient.invalidateQueries({ queryKey: ["master-plan-assessments"] }); setAnswers([-1, -1, -1, -1]); setComment(""); toast.success("Autoavaliação registrada no histórico."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível registrar."); } finally { setBusy(false); } };
  const updateResponse = (id: string, patch: Partial<CriterionResponse>) => setResponses((current) => ({ ...current, [id]: { ...(current[id] ?? emptyResponse()), ...patch } }));
  const nextLevel = approved < 3 ? Math.max(1, approved + 1) as CapabilityLevel : null;
  return <><section className="mb-5 border-l-4 border-teal-600 bg-white px-4 py-3"><p className="text-xs font-semibold uppercase text-teal-700">Capacidade atual consolidada</p><div className="mt-1 flex flex-wrap items-baseline justify-between gap-2"><strong className="text-base">{approved ? capabilityLevelNames[approved] : "Ainda não certificada"}</strong>{trainingLevel ? <span className="text-xs font-semibold text-sky-800">Em desenvolvimento: {capabilityLevelNames[trainingLevel]}</span> : nextLevel ? <span className="text-xs text-zinc-600">Próximo nível: <strong>{capabilityLevelNames[nextLevel]}</strong></span> : <span className="text-xs font-semibold text-emerald-800">Jornada de certificação concluída</span>}</div></section><div className="mb-5 flex gap-1 overflow-x-auto border-b" role="tablist">{[["autoavaliacao", "Autoavaliação"], ["criterios", "Solicitar nível"], ["retorno", "Histórico e retorno"]].map(([key, label]) => <button type="button" role="tab" aria-selected={section === key} key={key} className={`cap-section-tab ${section === key ? "cap-section-tab-active" : ""}`} onClick={() => go("capacitacoes", item.code, key)}>{label}</button>)}{canReview && <button type="button" className="cap-section-tab ml-auto" onClick={() => go("capacitacoes", item.code, "retorno", "administrador")}>Fila administrativa</button>}</div>
    {section === "autoavaliacao" && <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]"><section><h2 className="text-lg font-semibold">Onde estou hoje?</h2><p className="mt-1 text-sm text-zinc-600">Esta reflexão pode ser refeita a qualquer momento. Ela não concede certificação.</p><div className="mt-5 space-y-4">{item.selfAssessmentQuestions.map((question, index) => <fieldset key={question.number} className="border bg-white p-4"><legend className="sr-only">{question.dimension}</legend><p className="text-xs font-semibold uppercase text-teal-700">{question.dimension}</p><p className="mt-1 text-sm font-medium">{question.question}</p><div className="mt-3 flex flex-wrap gap-1">{answerLabels.map((label, value) => <button type="button" key={label} aria-pressed={answers[index] === value} onClick={() => setAnswers((current) => current.map((answer, position) => position === index ? value : answer))} className={`cap-answer border px-2 py-2 text-xs ${answers[index] === value ? "border-teal-700 bg-teal-50 text-teal-800" : "bg-white"}`}>{label}</button>)}</div></fieldset>)}</div><label className="mt-5 block text-sm font-semibold">Minha avaliação<textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} placeholder="O que sustenta suas respostas?" className="mt-1 w-full resize-y border p-3 text-sm font-normal" /></label><p className="mt-3 text-xs text-zinc-600">Nível indicado pela menor resposta: <strong>{answers.some((answer) => answer < 0) ? "Responda tudo" : capabilityLevelNames[Math.min(...answers)]}</strong></p><Button disabled={busy} onClick={() => void saveAssessment()} className="mt-3 bg-[#176f68] hover:bg-[#115b55]">Registrar autoavaliação</Button></section><aside className="self-start border-t-4 border-sky-500 bg-white p-4"><h2 className="text-sm font-semibold">Histórico</h2><div className="mt-3 space-y-3">{assessments.map((assessment) => <div key={assessment.id} className="border-t pt-2 text-xs"><strong>{capabilityLevelNames[assessment.indicated_level]}</strong><span className="ml-2 text-zinc-500">{prettyDate(assessment.created_at)}</span><p className="mt-1 text-zinc-600">{assessment.comment}</p></div>)}{!assessments.length && <p className="text-xs text-zinc-500">Nenhuma autoavaliação registrada.</p>}</div></aside></div>}
    {section === "criterios" && <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]"><section><h2 className="text-lg font-semibold">Solicitar certificação</h2><p className="mt-1 text-sm text-zinc-600">Os critérios são cumulativos. Níveis já aprovados não precisam ser repetidos.</p><div className="my-4 flex flex-wrap gap-2">{([1, 2, 3] as CapabilityLevel[]).map((value) => <button type="button" key={value} disabled={value <= approved} aria-pressed={level === value} onClick={() => setLevel(value)} className={`cap-level-choice ${level === value ? "cap-level-choice-active" : ""}`}>{value}. {capabilityLevelNames[value]}</button>)}</div>{approved < 3 ? <><p className="mb-3 text-xs text-zinc-500">{existing?.status === "submitted" ? "Aguardando revisão; edição bloqueada." : existing?.status === "changes_requested" ? "Ajustes solicitados; revise os critérios indicados." : "Preencha e salve o rascunho antes de sair."}</p><div className="space-y-3">{criteria.map((criterion) => <CriterionEditor key={criterion.id} criterion={criterion} response={responses[criterion.id] ?? emptyResponse()} review={existing?.reviews?.[criterion.id]} editable={editable && !busy} onChange={(patch) => updateResponse(criterion.id, patch)} />)}</div><div className="mt-5 flex flex-wrap gap-2 border-t pt-4"><Button variant="outline" disabled={!criteria.some((criterion) => responses[criterion.id]?.complete)} onClick={() => setShowDeclaration(true)}><FileText className="mr-2 h-4 w-4" /> Ver declaração</Button><Button variant="outline" disabled={busy || !editable} onClick={() => void save(false)}>Salvar rascunho</Button><Button disabled={busy || !editable || !complete} onClick={() => void save(true)} className="bg-[#176f68] hover:bg-[#115b55]">Enviar para avaliação</Button></div></> : <p className="border-l-2 border-teal-500 bg-teal-50 p-3 text-sm">O nível Multiplicador já está certificado.</p>}</section><aside className="self-start border-t-4 border-violet-500 bg-white p-4"><GraduationCap className="h-5 w-5 text-violet-700" /><h3 className="mt-2 font-semibold">Progressão</h3><p className="mt-3 text-xs text-zinc-500">Aprovado</p><strong>{approved ? capabilityLevelNames[approved] : "Nenhum nível"}</strong><p className="mt-3 text-xs text-zinc-500">Critérios nesta etapa</p><strong>{criteria.length}</strong><p className="mt-4 text-xs leading-relaxed text-zinc-500">Dê um nome à evidência e informe seu link ou caminho no repositório. Confira se o avaliador tem acesso; nenhum arquivo é enviado por aqui.</p></aside></div>}
    {section === "retorno" && <section><h2 className="mb-4 text-lg font-semibold">Minhas solicitações</h2><div className="divide-y border-y bg-white">{requests.map((request) => <div key={request.id} className="flex flex-wrap items-start justify-between gap-3 p-4"><div><strong className="text-sm">{capabilityLevelNames[request.target_level]}</strong><p className="mt-1 text-xs text-zinc-500">{prettyDate(request.created_at)} · {request.status === "draft" ? "Rascunho" : request.status === "submitted" ? "Em avaliação" : request.status === "changes_requested" ? "Ajustes solicitados" : "Aprovado"}</p>{Object.values(request.reviews ?? {}).filter((review) => review.decision === "changes_requested").map((review, index) => <p key={index} className="mt-1 text-xs text-rose-700">{review.note}</p>)}</div>{["draft", "changes_requested"].includes(request.status) && <Button size="sm" variant="outline" onClick={() => { setLevel(request.target_level); go("capacitacoes", item.code, "criterios"); }}>Continuar <ArrowRight className="ml-1 h-3 w-3" /></Button>}</div>)}{!requests.length && <p className="p-4 text-sm text-zinc-500">Nenhuma solicitação criada para esta capacidade.</p>}</div></section>}
    <Dialog open={showDeclaration} onOpenChange={setShowDeclaration}><DialogContent className="max-h-[85vh] max-w-2xl overflow-auto"><DialogHeader><DialogTitle>Declaração de critérios realizados</DialogTitle></DialogHeader><p className="border-l-2 border-amber-400 bg-amber-50 p-3 text-xs">Autodeclaração do perfil selecionado. Não é aprovação, certificação ou habilitação profissional.</p><p className="text-sm"><strong>Colaborador:</strong> {collaboratorName}<br /><strong>Capacidade:</strong> {item.code} · {item.title}<br /><strong>Nível pretendido:</strong> {capabilityLevelNames[level]}</p><ol className="list-decimal space-y-3 pl-5 text-sm">{criteria.filter((criterion) => responses[criterion.id]?.complete).map((criterion) => <li key={criterion.id}><strong>{criterion.text}</strong><p className="text-zinc-600">{responses[criterion.id]?.explanation}</p></li>)}</ol></DialogContent></Dialog>
  </>;
}

function CriterionEditor({ criterion, response, review, editable, onChange }: {
  criterion: Criterion;
  response: CriterionResponse;
  review?: CriterionReview;
  editable: boolean;
  onChange: (patch: Partial<CriterionResponse>) => void;
}) {
  return <article className="border bg-white p-4">
    <div className="flex items-start gap-3">
      <input type="checkbox" checked={response.complete} disabled={!editable}
        onChange={(event) => onChange({ complete: event.target.checked })}
        aria-label={`Concluir critério: ${criterion.text}`} className="mt-1 h-4 w-4 accent-teal-700" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase text-teal-700">
          {criterion.kind === "performance" ? "Desempenho" : `Evidência · ${capabilityLevelNames[criterion.level]}`}
        </p>
        <h3 className="mt-1 text-sm font-semibold">{criterionPrompt(criterion.text)}</h3>
        <p className="mt-1 text-sm leading-relaxed text-zinc-700">{criterion.text}</p>
        {criterion.guidance && <p className="mt-2 border-l-2 border-teal-400 pl-3 text-xs leading-relaxed text-zinc-600"><strong>Como comprovar:</strong> {criterion.guidance}</p>}
        {review?.decision === "changes_requested" && <p className="mt-2 text-xs text-rose-700">Ajuste: {review.note}</p>}
        <label className="mt-3 block text-xs font-semibold">Registre sua declaração e a evidência desta prática
          <textarea value={response.explanation} disabled={!editable}
            onChange={(event) => onChange({ explanation: event.target.value })}
            rows={2} placeholder={criterionResponsePrompt(criterion.kind)} className="mt-1 w-full resize-y border p-2 text-sm font-normal" />
        </label>
        {criterion.kind === "evidence" && <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold">Nome da evidência
            <input value={response.evidenceName ?? ""} disabled={!editable}
              onChange={(event) => onChange({ evidenceName: event.target.value })}
              placeholder="Ex.: protocolo da LO" className="mt-1 h-9 w-full border px-2 text-sm font-normal" />
          </label>
          <label className="block text-xs font-semibold">Link ou caminho no repositório
            <input value={response.reference} disabled={!editable}
              onChange={(event) => onChange({ reference: event.target.value })}
              placeholder="https://... ou pasta/subpasta" className="mt-1 h-9 w-full border px-2 text-sm font-normal" />
          </label>
        </div>}
      </div>
    </div>
  </article>;
}

function Reviewer({ library, requests, people, reviewerId }: { library: Library; requests: RequestRow[]; people: Array<{ id: string; name: string }>; reviewerId: string }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [reviews, setReviews] = useState<Record<string, CriterionReview>>({});
  const [busy, setBusy] = useState(false);
  const queue = requests.filter((request) => request.status === "submitted");
  const selected = queue.find((request) => request.id === selectedId) ?? queue[0];
  const item = library.capabilities.find((capability) => capability.code === selected?.capability_code);
  const prior = requests.filter((request) => request.collaborator_id === selected?.collaborator_id && request.capability_code === selected?.capability_code && request.status === "approved").reduce((value, request) => Math.max(value, request.target_level), 0);
  const criteria = item && selected ? criteriaFor(item, selected.target_level).filter((criterion) => prior === 0 || (criterion.level !== 0 && criterion.level > prior)) : [];
  useEffect(() => { setReviews(selected?.reviews ?? {}); }, [selected?.id, selected?.reviews]);
  const ownerName = (collaboratorId: string) => people.find((person) => person.id === collaboratorId)?.name ?? `Perfil ${collaboratorId.slice(0, 8)}`;
  const decide = async (decision: "approved" | "changes_requested") => { if (!selected) return; setBusy(true); try { await reviewRequest(reviewerId, selected.id, reviews, decision); await queryClient.invalidateQueries({ queryKey: ["master-plan-requests"] }); setSelectedId(""); toast.success(decision === "approved" ? "Nível aprovado e registrado." : "Ajustes enviados ao colaborador."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível avaliar."); } finally { setBusy(false); } };
  const allAccepted = criteria.length > 0 && criteria.every((criterion) => reviews[criterion.id]?.decision === "accepted");
  const hasChangeNote = Object.values(reviews).some((review) => review.decision === "changes_requested" && review.note.trim());
  return <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]"><aside className="border-t-4 border-violet-500 bg-white p-3"><h2 className="px-2 py-2 text-sm font-semibold">Aguardando avaliação · {queue.length}</h2><div className="max-h-[620px] overflow-auto">{queue.map((request) => <button type="button" key={request.id} onClick={() => setSelectedId(request.id)} className={`w-full border-t px-2 py-3 text-left text-sm hover:bg-teal-50 ${selected?.id === request.id ? "bg-teal-50" : ""}`}><div className="flex items-start gap-2"><CapabilityQueueThumb code={request.capability_code} /><div><strong className="block">{request.capability_code} · {ownerName(request.collaborator_id)}</strong><span className="text-xs text-zinc-500">Nível {request.target_level} · {prettyDate(request.submitted_at ?? request.created_at)}</span></div></div></button>)}{!queue.length && <p className="px-2 py-4 text-xs text-zinc-500">Nenhum pedido pendente.</p>}</div></aside><section className="min-w-0">{selected && item ? <><CapabilityIdentityStrip item={item} /><div className="mb-4 border-b pb-3"><h2 className="text-lg font-semibold">{item.title}</h2><p className="text-xs text-zinc-500">{ownerName(selected.collaborator_id)} · {capabilityLevelNames[selected.target_level]} · enviado em {prettyDate(selected.submitted_at ?? selected.created_at)}</p></div><div className="space-y-3">{criteria.map((criterion) => { const response = selected.responses[criterion.id]; const review = reviews[criterion.id]; return <article key={criterion.id} className="border bg-white p-4"><p className="text-xs font-semibold uppercase text-violet-700">{criterion.kind === "performance" ? "Desempenho" : "Evidência"}</p><h3 className="mt-1 text-sm font-semibold">{criterion.text}</h3>{criterion.reviewCheck && <p className="mt-2 border-l-2 border-violet-400 pl-2 text-xs text-zinc-600"><strong>Conferir:</strong> {criterion.reviewCheck}</p>}<p className="mt-2 whitespace-pre-line text-sm text-zinc-700">{response?.explanation || "Sem explicação"}</p>{response?.reference && <EvidenceReference name={response.evidenceName} location={response.reference} />}<div className="mt-4 flex flex-wrap gap-2"><button type="button" aria-pressed={review?.decision === "accepted"} onClick={() => setReviews((current) => ({ ...current, [criterion.id]: { decision: "accepted", note: "", at: new Date().toISOString() } }))} className={`cap-filter ${review?.decision === "accepted" ? "cap-filter-active" : ""}`}><Check className="mr-1 inline h-3 w-3" /> Aceitar</button><button type="button" aria-pressed={review?.decision === "changes_requested"} onClick={() => setReviews((current) => ({ ...current, [criterion.id]: { decision: "changes_requested", note: current[criterion.id]?.note ?? "", at: new Date().toISOString() } }))} className={`cap-filter ${review?.decision === "changes_requested" ? "border-rose-600 bg-rose-50 text-rose-700" : ""}`}>Pedir ajuste</button></div>{review?.decision === "changes_requested" && <label className="mt-3 block text-xs font-semibold">O que precisa ser ajustado?<textarea value={review.note} onChange={(event) => setReviews((current) => ({ ...current, [criterion.id]: { ...current[criterion.id], note: event.target.value } }))} className="mt-1 w-full border p-2 text-sm font-normal" rows={2} /></label>}</article>; })}</div><div className="mt-5 flex flex-wrap gap-2 border-t pt-4"><Button disabled={busy || !hasChangeNote} variant="outline" onClick={() => void decide("changes_requested")}>Solicitar ajustes</Button><Button disabled={busy || !allAccepted} onClick={() => void decide("approved")} className="bg-[#176f68] hover:bg-[#115b55]"><ClipboardCheck className="mr-2 h-4 w-4" /> Aprovar nível</Button></div></> : <div className="cap-empty">Selecione um pedido para avaliação.</div>}</section></div>;
}
