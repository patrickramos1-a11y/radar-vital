import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, GraduationCap, LockKeyhole, Send } from "lucide-react";
import { capabilityLevelNames } from "./capabilityJourney";
import type { Library } from "./journeyRemote";
import { globalCapabilityMaturity, readinessModeLabel, responsibilityReadiness, type ResponsibilityClaim, type ResponsibilityReadiness } from "./responsibilityJourney";

type Go = (view: "capacidade" | "capacitacoes", id?: string, tab?: string, mode?: string) => void;
type Filter = "Todas" | "Assistidas" | "Autônomas" | "Multiplicadoras" | "Disponíveis" | "Em preparo" | "Concedidas";

const filters: Filter[] = ["Todas", "Assistidas", "Autônomas", "Multiplicadoras", "Disponíveis", "Em preparo", "Concedidas"];
const statusCopy = {
  bloqueada: "Bloqueada",
  em_preparo: "Em preparo",
  disponivel: "Disponível para solicitar",
  solicitada: "Solicitada",
  concedida: "Concedida",
} as const;

function matchesFilter(item: ResponsibilityReadiness, filter: Filter) {
  if (filter === "Todas") return true;
  if (filter === "Assistidas") return item.mode === 1;
  if (filter === "Autônomas") return item.mode === 2;
  if (filter === "Multiplicadoras") return item.mode === 3;
  if (filter === "Disponíveis") return item.status === "disponivel";
  if (filter === "Em preparo") return item.status === "em_preparo" || item.status === "bloqueada";
  return item.status === "concedida";
}

function Status({ item }: { item: ResponsibilityReadiness }) {
  const color = item.status === "concedida" ? "text-emerald-800" : item.status === "disponivel" ? "text-teal-800" : item.status === "solicitada" ? "text-sky-800" : item.status === "em_preparo" ? "text-amber-800" : "text-zinc-600";
  return <span className={`text-xs font-semibold ${color}`}>{statusCopy[item.status]}</span>;
}

export function ResponsibilityJourneyPanel({ library, certifiedLevels, claims, collaboratorId, isAdmin, onRequest, onReview, go }: {
  library: Library;
  certifiedLevels: Map<string, number>;
  claims: ResponsibilityClaim[];
  collaboratorId: string;
  isAdmin: boolean;
  onRequest: (responsibilitySourceId: string) => Promise<void>;
  onReview: (claimId: string, decision: "approved" | "rejected") => Promise<void>;
  go: Go;
}) {
  const [filter, setFilter] = useState<Filter>("Todas");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const ownClaims = claims.filter((claim) => claim.collaborator_id === collaboratorId);
  const items = useMemo(() => library.responsibilities.map((responsibility) => responsibilityReadiness(responsibility, certifiedLevels, ownClaims)), [library, certifiedLevels, ownClaims]);
  const capabilityCodes = useMemo(() => [...new Set(library.responsibilities.flatMap((responsibility) => responsibility.requiredCapabilities.map((requirement) => requirement.capabilityCode)))], [library]);
  const maturity = globalCapabilityMaturity(capabilityCodes, certifiedLevels);
  const visible = items.filter((item) => matchesFilter(item, filter));
  const counts = {
    available: items.filter((item) => item.status === "disponivel").length,
    preparing: items.filter((item) => item.status === "em_preparo" || item.status === "bloqueada").length,
    granted: items.filter((item) => item.status === "concedida").length,
  };
  const queue = isAdmin ? claims.filter((claim) => claim.status === "requested") : [];
  const request = async (sourceId: string) => {
    setPendingId(sourceId);
    try { await onRequest(sourceId); } finally { setPendingId(null); }
  };
  const review = async (claimId: string, decision: "approved" | "rejected") => {
    setPendingId(claimId);
    try { await onReview(claimId, decision); } finally { setPendingId(null); }
  };

  return <section className="mb-7 border-t-4 border-violet-500 bg-white p-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-violet-700">Jornada por responsabilidades</p><h2 className="mt-1 text-lg font-semibold">Disponibilidade para assumir</h2><p className="mt-1 max-w-3xl text-sm text-zinc-600">Cada responsabilidade exige capacidades e níveis próprios. O progresso informa o que falta; a solicitação só é liberada ao cumprir todos os requisitos.</p></div><span className="text-sm font-semibold text-violet-800">{items.length} responsabilidades</span></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="border-t-4 border-violet-500 bg-violet-50 p-3"><p className="text-xs font-semibold uppercase text-zinc-600">Maturidade global</p><strong className="mt-1 block text-xl text-violet-900">{maturity.progress.toLocaleString("pt-BR")} %</strong><p className="mt-1 text-xs text-zinc-600">{maturity.pointsEarned} de {maturity.pointsRequired} pontos</p></div>
      <div className="border-t-4 border-teal-500 bg-teal-50 p-3"><p className="text-xs font-semibold uppercase text-zinc-600">Disponíveis</p><strong className="mt-1 block text-xl text-teal-900">{counts.available}</strong><p className="mt-1 text-xs text-zinc-600">prontas para solicitar</p></div>
      <div className="border-t-4 border-amber-500 bg-amber-50 p-3"><p className="text-xs font-semibold uppercase text-zinc-600">Em preparo</p><strong className="mt-1 block text-xl text-amber-900">{counts.preparing}</strong><p className="mt-1 text-xs text-zinc-600">com requisito pendente</p></div>
      <div className="border-t-4 border-emerald-600 bg-emerald-50 p-3"><p className="text-xs font-semibold uppercase text-zinc-600">Concedidas</p><strong className="mt-1 block text-xl text-emerald-900">{counts.granted}</strong><p className="mt-1 text-xs text-zinc-600">formalmente assumidas</p></div>
    </div>
    <div className="mt-5 flex flex-wrap gap-1" role="group" aria-label="Filtro das responsabilidades">{filters.map((value) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)} className={`cap-filter ${filter === value ? "cap-filter-active" : ""}`}>{value}</button>)}</div>
    <div className="mt-4 divide-y border-y">{visible.map((item) => <article key={item.responsibility.sourceId} className="px-1 py-4 sm:px-2"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold uppercase text-teal-700">{item.responsibility.sourceSector} · {readinessModeLabel(item.mode)}</p><h3 className="mt-1 text-sm font-semibold text-zinc-950">{item.responsibility.title}</h3><div className="mt-2 flex flex-wrap gap-1">{item.responsibility.requiredCapabilities.map((requirement) => <button key={requirement.capabilityCode} type="button" onClick={() => go("capacitacoes", requirement.capabilityCode, "autoavaliacao", "colaborador")} className={`border px-2 py-1 text-[11px] font-medium ${item.unmet.some((unmet) => unmet.capabilityCode === requirement.capabilityCode) ? "border-amber-300 bg-amber-50 text-amber-900" : "border-emerald-300 bg-emerald-50 text-emerald-900"}`}>{requirement.capabilityCode} · {capabilityLevelNames[requirement.minimumLevel]}</button>)}</div></div><div className="min-w-28 text-right"><Status item={item} /><p className="mt-1 text-sm font-semibold text-zinc-900">{item.progress.toLocaleString("pt-BR")}%</p><p className="text-xs text-zinc-500">{item.pointsEarned} de {item.pointsRequired} pontos</p></div></div><div className="mt-3 h-1.5 overflow-hidden bg-zinc-100"><div className={`h-full ${item.status === "concedida" ? "bg-emerald-600" : item.status === "disponivel" ? "bg-teal-600" : "bg-violet-500"}`} style={{ width: `${item.progress}%` }} /></div>{item.unmet.length > 0 && <p className="mt-2 text-xs text-zinc-600">Falta: {item.unmet.map((requirement) => `${requirement.capabilityCode} em ${capabilityLevelNames[requirement.minimumLevel]}`).join(", ")}.</p>}{item.status === "disponivel" && <button type="button" disabled={pendingId === item.responsibility.sourceId} onClick={() => void request(item.responsibility.sourceId)} className="mt-3 inline-flex items-center gap-1 border border-teal-600 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100 disabled:cursor-default"><Send className="h-3.5 w-3.5" />{pendingId === item.responsibility.sourceId ? "Solicitando..." : "Solicitar responsabilidade"}</button>}{item.status === "solicitada" && <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-800"><GraduationCap className="h-3.5 w-3.5" />Solicitação em avaliação administrativa</p>}{item.status === "concedida" && <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" />Responsabilidade formalmente concedida</p>}{item.status === "bloqueada" && <p className="mt-3 inline-flex items-center gap-1 text-xs text-zinc-600"><LockKeyhole className="h-3.5 w-3.5" />Inicie as capacidades-base para liberar esta responsabilidade.</p>}</article>)}</div>
    {!visible.length && <p className="py-5 text-sm text-zinc-600">Nenhuma responsabilidade encontrada neste filtro.</p>}
    {isAdmin && <section className="mt-7 border-t pt-5"><div className="flex flex-wrap items-baseline justify-between gap-2"><div><h2 className="text-base font-semibold">Solicitações para avaliar</h2><p className="mt-1 text-sm text-zinc-600">A concessão confirma a responsabilidade após a conferência da jornada.</p></div><span className="text-sm font-semibold text-zinc-700">{queue.length} aguardando</span></div><div className="mt-3 divide-y border-y">{queue.map((claim) => { const item = library.responsibilities.find((responsibility) => responsibility.sourceId === claim.responsibility_source_id); return <div key={claim.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><strong className="text-sm">{item?.title ?? "Responsabilidade não encontrada"}</strong><p className="mt-1 text-xs text-zinc-600">{item?.sourceSector}</p></div><div className="flex gap-2"><button type="button" disabled={pendingId === claim.id} onClick={() => void review(claim.id, "rejected")} className="border px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50">Devolver</button><button type="button" disabled={pendingId === claim.id} onClick={() => void review(claim.id, "approved")} className="border border-emerald-700 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100">Conceder</button></div></div>; })}{!queue.length && <p className="py-4 text-sm text-zinc-600">Nenhuma solicitação aguardando avaliação.</p>}</div></section>}
  </section>;
}
