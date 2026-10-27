import { useMemo, useState } from "react";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { capabilityLevelInsignia, capabilityLevelNames, type CapabilityLevel } from "./capabilityJourney";
import { isResponsibilityInNucleus } from "./capabilityNuclei";
import type { NucleusId } from "./model";
import type { Library } from "./journeyRemote";
import { competencyReadiness, globalCapabilityMaturity, readinessModeLabel, type CompetencyReadiness } from "./responsibilityJourney";

type Go = (view: "capacidade" | "capacitacoes" | "responsabilidade" | "responsabilidades" | "setor", id?: string, tab?: string, mode?: string) => void;
type Filter = "Todas" | "Assistidas" | "Autônomas" | "Multiplicadoras" | "Em formação" | "Consolidadas" | "Bloqueadas";

const filters: Filter[] = ["Todas", "Assistidas", "Autônomas", "Multiplicadoras", "Em formação", "Consolidadas", "Bloqueadas"];
const statusCopy = { bloqueada: "Bloqueada", em_formacao: "Em formação", consolidada: "Consolidada automaticamente" } as const;

function matchesFilter(item: CompetencyReadiness, filter: Filter) {
  if (filter === "Todas") return true;
  if (filter === "Assistidas") return item.mode === 1;
  if (filter === "Autônomas") return item.mode === 2;
  if (filter === "Multiplicadoras") return item.mode === 3;
  if (filter === "Em formação") return item.status === "em_formacao";
  if (filter === "Consolidadas") return item.status === "consolidada";
  return item.status === "bloqueada";
}

function Status({ item }: { item: CompetencyReadiness }) {
  const color = item.status === "consolidada" ? "text-emerald-800" : item.status === "em_formacao" ? "text-amber-800" : "text-zinc-600";
  return <span className={`text-xs font-semibold ${color}`}>{statusCopy[item.status]}</span>;
}

export function ResponsibilityJourneyPanel({ library, certifiedLevels, nucleusId, onOpenSector, go, initialFilter }: {
  library: Library;
  certifiedLevels: Map<string, number>;
  nucleusId: NucleusId;
  onOpenSector: (responsibilitySourceId: string) => void;
  go: Go;
  initialFilter?: Filter;
}) {
  const [filter, setFilter] = useState<Filter>(initialFilter ?? "Todas");
  const items = useMemo(() => library.responsibilities.filter((responsibility) => isResponsibilityInNucleus(responsibility, nucleusId)).map((responsibility) => competencyReadiness(responsibility, certifiedLevels)), [library, certifiedLevels, nucleusId]);
  const capabilityByCode = useMemo(() => new Map(library.capabilities.map((capability) => [capability.code, capability])), [library]);
  const capabilityCodes = useMemo(() => [...new Set(items.flatMap((item) => item.responsibility.requiredCapabilities.map((requirement) => requirement.capabilityCode)))], [items]);
  const maturity = globalCapabilityMaturity(capabilityCodes, certifiedLevels);
  const visible = items.filter((item) => matchesFilter(item, filter)).sort((left, right) => right.progress - left.progress || right.pointsEarned - left.pointsEarned || left.responsibility.title.localeCompare(right.responsibility.title, "pt-BR"));
  const counts = {
    consolidated: items.filter((item) => item.status === "consolidada").length,
    forming: items.filter((item) => item.status === "em_formacao").length,
    blocked: items.filter((item) => item.status === "bloqueada").length,
  };

  return <section className="mb-7 border-t-4 border-violet-500 bg-white p-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-violet-700">Jornada por competências</p><h2 className="mt-1 text-lg font-semibold">Competências formadas pelas capacidades</h2><p className="mt-1 max-w-3xl text-sm text-zinc-600">Cada competência é um grupo de capacidades e níveis do núcleo selecionado. Ao concluir todos os requisitos, o sistema a consolida automaticamente e ela passa a compor apenas a jornada deste núcleo.</p></div><span className="text-sm font-semibold text-violet-800">{items.length} competências</span></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric title="Maturidade global" value={`${maturity.progress.toLocaleString("pt-BR")} %`} note={`${maturity.pointsEarned} de ${maturity.pointsRequired} pontos`} tone="violet" />
      <Metric title="Consolidadas" value={counts.consolidated} note="requisitos completos" tone="emerald" />
      <Metric title="Em formação" value={counts.forming} note="com capacidade pendente" tone="amber" />
      <Metric title="Bloqueadas" value={counts.blocked} note="sem capacidade-base iniciada" tone="zinc" />
    </div>
    <div className="mt-5 flex flex-wrap gap-1" role="group" aria-label="Filtro das competências">{filters.map((value) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)} className={`cap-filter ${filter === value ? "cap-filter-active" : ""}`}>{value}</button>)}</div>
    <div className="mt-4 divide-y border-y">{visible.map((item) => {
      const requirements = [...item.responsibility.requiredCapabilities].sort((left, right) => {
        const leftPending = item.unmet.some((unmet) => unmet.capabilityCode === left.capabilityCode);
        const rightPending = item.unmet.some((unmet) => unmet.capabilityCode === right.capabilityCode);
        return Number(rightPending) - Number(leftPending) || left.capabilityCode.localeCompare(right.capabilityCode);
      });
      return <article key={item.responsibility.sourceId} className="px-1 py-4 sm:px-2"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase text-teal-700"><span>Competência:</span><button type="button" onClick={() => go("responsabilidade", item.responsibility.sourceId)} className="underline decoration-teal-300 underline-offset-2 hover:text-teal-900">{item.responsibility.title}</button><span>· {readinessModeLabel(item.mode)}</span></div><div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-700"><span className="text-xs font-semibold uppercase text-zinc-500">Setor:</span><button type="button" onClick={() => onOpenSector(item.responsibility.sourceId)} className="text-left underline decoration-zinc-300 underline-offset-2 hover:text-teal-800">{item.responsibility.sourceSector}</button></div><div className="mt-3"><p className="mb-1 text-xs font-semibold uppercase text-zinc-500">Capacidades que formam esta competência</p><div className="flex flex-wrap gap-2">{requirements.map((requirement) => { const pending = item.unmet.some((unmet) => unmet.capabilityCode === requirement.capabilityCode); const capability = capabilityByCode.get(requirement.capabilityCode); return <button key={requirement.capabilityCode} type="button" onClick={() => go("capacidade", requirement.capabilityCode)} className={`inline-flex items-center gap-1.5 px-1 py-1 text-left text-[11px] font-medium ${pending ? "border-b border-amber-400 text-amber-900" : "text-zinc-700"}`} title={`${pending ? "Falta" : "Atendida"}: ${capability?.title ?? requirement.capabilityCode} em ${capabilityLevelNames[requirement.minimumLevel]}`}><img src={capabilityLevelInsignia[requirement.minimumLevel as CapabilityLevel]} alt="" className="h-5 w-5 shrink-0 object-contain" loading="lazy" decoding="async" /><span>{capability?.title ?? requirement.capabilityCode}</span></button>; })}</div></div></div><div className="min-w-28 text-right"><Status item={item} /><p className="mt-1 text-sm font-semibold text-zinc-900">{item.progress.toLocaleString("pt-BR")}%</p><p className="text-xs text-zinc-500">{item.pointsEarned} de {item.pointsRequired} pontos</p></div></div><div className="mt-3 h-1.5 overflow-hidden bg-zinc-100"><div className={`h-full ${item.status === "consolidada" ? "bg-emerald-600" : item.status === "em_formacao" ? "bg-violet-500" : "bg-zinc-300"}`} style={{ width: `${item.progress}%` }} /></div>{item.unmet.length > 0 && <p className="mt-2 text-xs text-zinc-600">Falta: {item.unmet.map((requirement) => `${requirement.capabilityCode} em ${capabilityLevelNames[requirement.minimumLevel]}`).join(", ")}.</p>}{item.status === "consolidada" && <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" />Competência consolidada automaticamente</p>}{item.status === "bloqueada" && <p className="mt-3 inline-flex items-center gap-1 text-xs text-zinc-600"><LockKeyhole className="h-3.5 w-3.5" />Inicie as capacidades-base para começar esta competência.</p>}</article>;
    })}</div>
    {!visible.length && <p className="py-5 text-sm text-zinc-600">Nenhuma competência encontrada neste filtro.</p>}
  </section>;
}

function Metric({ title, value, note, tone }: { title: string; value: string | number; note: string; tone: "violet" | "emerald" | "amber" | "zinc" }) {
  const styles = { violet: "border-violet-500 bg-violet-50 text-violet-900", emerald: "border-emerald-600 bg-emerald-50 text-emerald-900", amber: "border-amber-500 bg-amber-50 text-amber-900", zinc: "border-zinc-500 bg-zinc-50 text-zinc-900" }[tone];
  return <div className={`border-t-4 p-3 ${styles}`}><p className="text-xs font-semibold uppercase text-zinc-600">{title}</p><strong className="mt-1 block text-xl">{value}</strong><p className="mt-1 text-xs text-zinc-600">{note}</p></div>;
}
