import { useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, ClipboardCheck, GraduationCap, ShieldCheck, Target, Users, type LucideIcon } from "lucide-react";
import { capabilityLevelNames } from "./capabilityJourney";
import type { Library } from "./journeyRemote";
import { globalCapabilityMaturity, responsibilityReadiness, type ResponsibilityClaim, type ResponsibilityReadiness } from "./responsibilityJourney";
import type { PreviewResponsibility } from "./model";
import { CapabilityQueueThumb } from "./CapabilityVisualIdentity";
import { capabilityVisualStyle } from "./capabilityVisuals";

type Go = (view: "capacidades" | "capacitacoes" | "cargos-funcoes" | "jornada" | "responsabilidade" | "responsabilidades" | "setor", id?: string, tab?: string, mode?: string) => void;

type CareerStage = {
  title: string;
  function: string;
  threshold: number;
  points: number;
  scope: string;
  track: "Operação" | "Gestão" | "Estratégico";
};

export const careerStages: CareerStage[] = [
  { title: "Operador Júnior", function: "Operação técnica inicial", threshold: 30, points: 26, scope: "Responsabilidades assistidas do setor", track: "Operação" },
  { title: "Operador Pleno", function: "Operação técnica", threshold: 50, points: 42, scope: "Responsabilidades autônomas do setor", track: "Operação" },
  { title: "Operador Master", function: "Referência técnica", threshold: 65, points: 55, scope: "Responsabilidades críticas e multiplicação", track: "Operação" },
  { title: "Gestão Júnior", function: "Gestão de setor", threshold: 75, points: 63, scope: "Cobertura e desenvolvimento de um setor", track: "Gestão" },
  { title: "Gestão Pleno", function: "Gestão integrada", threshold: 85, points: 72, scope: "Integração de setores ou frente ampliada", track: "Gestão" },
  { title: "Gestão Master", function: "Gestão de núcleo", threshold: 95, points: 80, scope: "Resultado e evolução de um núcleo", track: "Gestão" },
  { title: "Estratégico Júnior", function: "Estratégia do Núcleo Técnico", threshold: 100, points: 84, scope: "100% do Núcleo Técnico: capacidades multiplicadoras e responsabilidades do escopo", track: "Estratégico" },
  { title: "Estratégico Pleno", function: "Estratégia integrada", threshold: 100, points: 84, scope: "100% de dois núcleos definidos", track: "Estratégico" },
  { title: "Estratégico Master", function: "Direção estratégica", threshold: 100, points: 84, scope: "100% de três núcleos definidos", track: "Estratégico" },
];

type Tab = "capacidades" | "responsabilidades" | "concedidas" | "evolucao";

function progressBar(value: number, color: string) {
  return <div className="mt-2 h-2 overflow-hidden bg-zinc-100"><div className={`h-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} /></div>;
}

function stageFor(capabilityPercent: number, responsibilityPercent: number) {
  const shared = Math.min(capabilityPercent, responsibilityPercent);
  return careerStages.slice(0, 7).filter((stage) => shared >= stage.threshold).at(-1);
}

function CapabilityLevelSeals({ code, currentLevel }: { code: string; currentLevel: number }) {
  return <span className="flex items-center gap-1" aria-label={`Níveis de ${code}`}>
    {([1, 2, 3] as const).map((level) => <span key={level} className={`grid h-7 w-7 place-items-center ${level <= currentLevel ? "opacity-100" : "opacity-30 grayscale"}`} title={level <= currentLevel ? `Habilitado: ${capabilityLevelNames[level]}` : `Falta: ${capabilityLevelNames[level]}`}><img src={`/capability-stickers/levels/NIVEL_${level}.png`} alt={level <= currentLevel ? `Nível habilitado: ${capabilityLevelNames[level]}` : `Nível a desenvolver: ${capabilityLevelNames[level]}`} className="h-full w-full object-contain" loading="lazy" decoding="async" /></span>)}
  </span>;
}

function ResponsibilityList({ items, mappedResponsibilities, selectedLevel, go, granted }: { items: ResponsibilityReadiness[]; mappedResponsibilities: PreviewResponsibility[]; selectedLevel: (code: string) => number; go: Go; granted: boolean }) {
  const title = granted ? "Responsabilidades concedidas" : "Responsabilidades em evolução";
  const description = granted ? "Responsabilidades formalmente assumidas. Elas compõem a cobertura do escopo técnico." : "Ordenadas pela prontidão: as responsabilidades mais próximas de serem concluídas aparecem primeiro. A cobertura só começa após a concessão.";
  return <section className="border bg-white"><div className="border-b p-4"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-zinc-600">{description}</p></div><div className="divide-y">{items.map((item) => { const mapped = mappedResponsibilities.find((responsibility) => responsibility.id === item.responsibility.sourceId); return <article key={item.responsibility.sourceId} className="px-4 py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase text-teal-700"><span>Responsabilidade:</span><button type="button" onClick={() => go("responsabilidade", item.responsibility.sourceId)} className="underline decoration-teal-300 underline-offset-2 hover:text-teal-900" aria-label={`Abrir responsabilidade ${item.responsibility.sourceSector}`}>{item.responsibility.sourceSector} · {capabilityLevelNames[item.mode]}</button></div><div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-zinc-950"><span className="text-xs font-semibold uppercase text-zinc-500">Setor:</span><button type="button" onClick={() => { if (mapped) go("setor", mapped.sectorId); }} className="text-left underline decoration-zinc-300 underline-offset-2 hover:text-teal-800" aria-label={`Abrir setor ${item.responsibility.title}`}>{item.responsibility.title}</button></div><p className="mt-2 text-xs text-zinc-600">{item.status === "concedida" ? "Concedida" : item.status === "disponivel" ? "Disponível para solicitar" : item.status === "solicitada" ? "Em avaliação" : item.status === "em_preparo" ? "Em preparo" : "Bloqueada"}</p></div><div className="text-right text-sm"><strong>{item.progress.toLocaleString("pt-BR")}%</strong><p className="text-xs text-zinc-500">{item.pointsEarned} de {item.pointsRequired} pontos</p></div></div><div className="mt-3"><p className="mb-1 text-xs font-semibold uppercase text-zinc-500">Capacitações necessárias e níveis</p><div className="flex flex-wrap gap-1">{item.responsibility.requiredCapabilities.map((requirement) => { const level = selectedLevel(requirement.capabilityCode); return <button key={requirement.capabilityCode} type="button" onClick={() => go("capacitacoes", requirement.capabilityCode, "autoavaliacao", "colaborador")} className={`border px-2 py-1 text-[11px] font-medium ${level >= requirement.minimumLevel ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900"}`}>{requirement.capabilityCode} · Atual: {level ? capabilityLevelNames[level as 1 | 2 | 3] : "Não certificado"} · Exigido: {capabilityLevelNames[requirement.minimumLevel]}</button>; })}</div></div>{progressBar(item.progress, item.status === "concedida" ? "bg-emerald-600" : item.status === "disponivel" ? "bg-teal-600" : "bg-violet-500")}{item.unmet.length > 0 && <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-zinc-600"><span>Para concluir:</span>{item.unmet.map((requirement) => { const level = selectedLevel(requirement.capabilityCode); return <button key={requirement.capabilityCode} type="button" onClick={() => go("capacitacoes", requirement.capabilityCode, "autoavaliacao", "colaborador")} className="font-semibold text-amber-800 underline decoration-amber-300 underline-offset-2 hover:text-amber-950">{requirement.capabilityCode} · atual: {level ? capabilityLevelNames[level as 1 | 2 | 3] : "Não certificado"} · exigido: {capabilityLevelNames[requirement.minimumLevel]}</button>; })}</div>}</article>; })}{!items.length && <p className="p-4 text-sm text-zinc-600">Nenhuma responsabilidade nesta visão.</p>}</div></section>;
}

export function CareerJourneyExperience({ library, certifiedLevels, claims, collaboratorId, collaboratorName, isAdmin, people, teamLevels, mappedResponsibilities, go }: {
  library: Library;
  certifiedLevels: Map<string, number>;
  claims: ResponsibilityClaim[];
  collaboratorId: string;
  collaboratorName: string;
  isAdmin: boolean;
  people: Array<{ id: string; name: string }>;
  teamLevels: Map<string, Map<string, number>>;
  mappedResponsibilities: PreviewResponsibility[];
  go: Go;
}) {
  const [tab, setTab] = useState<Tab>("capacidades");
  const metrics = useMemo(() => journeyMetrics(library, certifiedLevels, claims, collaboratorId), [library, certifiedLevels, claims, collaboratorId]);
  const reached = stageFor(metrics.capability.progress, metrics.responsibilityPercent);
  const next = careerStages.find((stage) => stage.title !== "Estratégico Pleno" && stage.title !== "Estratégico Master" && Math.min(metrics.capability.progress, metrics.responsibilityPercent) < stage.threshold);
  const selectedLevel = (code: string) => certifiedLevels.get(code) ?? 0;
  const evolvingResponsibilities = metrics.items.filter((item) => item.status !== "concedida");
  const grantedResponsibilities = metrics.items.filter((item) => item.status === "concedida");

  return <>
    <header className="mb-6 border-b border-zinc-200 pb-5">
      <p className="cap-eyebrow">Jornada profissional</p>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold text-[#172824] sm:text-[28px]">Minha jornada profissional</h1><p className="mt-2 max-w-3xl text-sm text-zinc-600">Sua evolução une o nível certificado de cada capacidade e as responsabilidades oficialmente concedidas.</p></div>{isAdmin && <button type="button" onClick={() => go("cargos-funcoes")} className="inline-flex items-center gap-2 border border-teal-700 bg-white px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-50"><BriefcaseBusiness className="h-4 w-4" /> Cargos e funções</button>}</div>
    </header>
    <section className="mb-6 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.8fr)]">
      <div className="border-l-4 border-teal-600 bg-white p-5"><p className="text-xs font-semibold uppercase text-teal-700">Referência atual de {collaboratorName}</p><h2 className="mt-2 text-xl font-semibold text-zinc-950">{reached?.title ?? "Em preparação para Operador Júnior"}</h2><p className="mt-1 text-sm font-medium text-zinc-700">Função de referência: {reached?.function ?? "Desenvolvimento técnico inicial"}</p><p className="mt-3 max-w-2xl text-sm text-zinc-600">O cargo é reconhecido após concessão administrativa. Esta leitura mostra os requisitos já consolidados e o próximo escopo possível.</p></div>
      <div className="border-t-4 border-violet-600 bg-white p-5"><p className="text-xs font-semibold uppercase text-zinc-500">Próximo marco</p><strong className="mt-2 block text-lg text-violet-950">{next?.title ?? "Escopo estratégico ampliado"}</strong><p className="mt-1 text-xs leading-relaxed text-zinc-600">{next ? `${next.threshold}% de capacidades e responsabilidades do escopo.` : "A ampliação depende da definição dos próximos núcleos."}</p></div>
    </section>
    <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="border-t-4 border-violet-600 bg-white p-4"><p className="text-xs font-semibold uppercase text-zinc-500">Capacidades</p><strong className="mt-1 block text-2xl">{metrics.capability.progress.toLocaleString("pt-BR")}%</strong><p className="mt-1 text-xs text-zinc-600">{metrics.capability.pointsEarned} de {metrics.capability.pointsRequired} pontos</p>{progressBar(metrics.capability.progress, "bg-violet-600")}</div>
      <div className="border-t-4 border-emerald-600 bg-white p-4"><p className="text-xs font-semibold uppercase text-zinc-500">Responsabilidades</p><strong className="mt-1 block text-2xl">{metrics.responsibilityPercent.toLocaleString("pt-BR")}%</strong><p className="mt-1 text-xs text-zinc-600">{metrics.granted} de {metrics.items.length} concedidas</p>{progressBar(metrics.responsibilityPercent, "bg-emerald-600")}</div>
      <div className="border-t-4 border-teal-600 bg-white p-4"><p className="text-xs font-semibold uppercase text-zinc-500">Prontas para solicitar</p><strong className="mt-1 block text-2xl">{metrics.available}</strong><p className="mt-1 text-xs text-zinc-600">requisitos técnicos completos</p></div>
      <div className="border-t-4 border-amber-500 bg-white p-4"><p className="text-xs font-semibold uppercase text-zinc-500">Em preparação</p><strong className="mt-1 block text-2xl">{metrics.preparing}</strong><p className="mt-1 text-xs text-zinc-600">ainda dependem de capacitação</p></div>
    </section>
    <div className="mb-5 flex flex-wrap gap-1 border-b" role="tablist" aria-label="Jornada profissional"><TabButton label="Capacidades" active={tab === "capacidades"} onClick={() => setTab("capacidades")} /><TabButton label="Responsabilidades" active={tab === "responsabilidades"} onClick={() => setTab("responsabilidades")} /><TabButton label={`Concedidas (${grantedResponsibilities.length})`} active={tab === "concedidas"} onClick={() => setTab("concedidas")} /><TabButton label="Evolução de cargo" active={tab === "evolucao"} onClick={() => setTab("evolucao")} /></div>
    {tab === "capacidades" && <section className="border bg-white"><div className="flex flex-wrap items-end justify-between gap-3 border-b p-4"><div><h2 className="text-lg font-semibold">Capacidades consolidadas</h2><p className="mt-1 text-sm text-zinc-600">A pontuação usa Assistido = 1, Autônomo = 2 e Multiplicador = 3. O teto da jornada do Núcleo Técnico é 84 pontos.</p></div><button type="button" onClick={() => go("capacitacoes")} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline">Abrir capacitações <ArrowRight className="h-4 w-4" /></button></div><div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">{library.capabilities.map((capability) => { const level = selectedLevel(capability.code); return <button key={capability.code} type="button" onClick={() => go("capacitacoes", capability.code, "autoavaliacao", "colaborador")} style={{ ...capabilityVisualStyle(capability.code), borderLeftColor: "var(--cap-accent, #176f68)" }} className="flex min-w-0 items-center gap-3 border-l-4 px-4 py-3 text-left hover:bg-zinc-50"><CapabilityQueueThumb code={capability.code} alt={`Figurinha ${capability.code}: ${capability.title}`} /><span className="min-w-0 flex-1"><strong className="block text-sm" style={{ color: "var(--cap-ink, #172824)" }}>{capability.code} · {capability.title}</strong><span className="mt-1 block text-xs text-zinc-600">{level ? `Nível consolidado: ${capabilityLevelNames[level as 1 | 2 | 3]}` : "Ainda não certificado"}</span><span className="mt-2 block"><CapabilityLevelSeals code={capability.code} currentLevel={level} /></span></span><ArrowRight className="h-4 w-4 shrink-0" style={{ color: "var(--cap-ink, #176f68)" }} /></button>; })}</div></section>}
    {tab === "responsabilidades" && <ResponsibilityList items={evolvingResponsibilities} mappedResponsibilities={mappedResponsibilities} selectedLevel={selectedLevel} go={go} granted={false} />}
    {tab === "concedidas" && <ResponsibilityList items={grantedResponsibilities} mappedResponsibilities={mappedResponsibilities} selectedLevel={selectedLevel} go={go} granted />}
    {tab === "evolucao" && <section className="border bg-white"><div className="border-b p-4"><h2 className="text-lg font-semibold">Trilha de cargos e funções</h2><p className="mt-1 text-sm text-zinc-600">A evolução requer que os dois indicadores atinjam o patamar: capacidades certificadas e responsabilidades concedidas.</p></div><div className="divide-y">{careerStages.map((stage, index) => { const achieved = index < 7 && Math.min(metrics.capability.progress, metrics.responsibilityPercent) >= stage.threshold; return <div key={stage.title} className="grid gap-3 px-4 py-4 md:grid-cols-[190px_minmax(0,1fr)_140px]"><div className="flex items-center gap-2"><span className={`grid h-7 w-7 place-items-center border ${achieved ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-zinc-300 text-zinc-500"}`}>{achieved ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span><strong className="text-sm">{stage.title}</strong></div><div><p className="text-sm font-medium">{stage.function}</p><p className="mt-1 text-xs text-zinc-600">{stage.scope}</p></div><div className="text-left md:text-right"><strong className="text-sm">{stage.threshold}%</strong><p className="text-xs text-zinc-500">{stage.points} de 84 pontos</p></div></div>; })}</div></section>}
  </>;
}

export function CareerStructureExperience({ library, people, teamLevels, claims, isAdmin, go }: {
  library: Library;
  people: Array<{ id: string; name: string }>;
  teamLevels: Map<string, Map<string, number>>;
  claims: ResponsibilityClaim[];
  isAdmin: boolean;
  go: Go;
}) {
  if (!isAdmin) return <div className="cap-empty">A arquitetura de cargos e funções é administrada pelo perfil responsável.</div>;
  const rows = people.map((person) => ({ person, metrics: journeyMetrics(library, teamLevels.get(person.id) ?? new Map(), claims, person.id) }));
  const pendingClaims = claims.filter((claim) => claim.status === "requested");
  const approvedClaims = claims.filter((claim) => claim.status === "approved");
  return <>
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200 pb-5"><div><p className="cap-eyebrow">Administração da jornada</p><h1 className="text-2xl font-semibold text-[#172824] sm:text-[28px]">Cargos e funções</h1><p className="mt-2 max-w-3xl text-sm text-zinc-600">Estruture a evolução da equipe a partir das capacidades certificadas e das responsabilidades oficialmente concedidas.</p></div><button type="button" onClick={() => go("jornada")} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline">Voltar à minha jornada <ArrowRight className="h-4 w-4" /></button></header>
    <section className="mb-6 border-t-4 border-violet-600 bg-white p-5"><div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]"><div><p className="text-xs font-semibold uppercase text-violet-700">Regra de elegibilidade</p><h2 className="mt-2 text-lg font-semibold">A função é liberada por cobertura real, não por título.</h2><p className="mt-2 text-sm leading-relaxed text-zinc-700">Para alcançar cada marco, a pessoa precisa cumprir o percentual de capacidades e o mesmo percentual de responsabilidades concedidas. Estratégico Júnior exige 100% das capacidades no nível Multiplicador e 100% das responsabilidades do Núcleo Técnico.</p></div><div className="grid grid-cols-2 gap-3"><Metric icon={GraduationCap} label="Capacidades" value="84 pontos" /><Metric icon={ShieldCheck} label="Responsabilidades" value={`${library.responsibilities.length} publicadas`} /><Metric icon={Target} label="Marco estratégico" value="100%" /><Metric icon={Users} label="Pessoas visíveis" value={people.length} /></div></div></section>
    <section className="mb-6 border-t-4 border-teal-600 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase text-teal-700">Gestão de responsabilidades</p><h2 className="mt-2 text-lg font-semibold">Solicitações e vínculos da equipe</h2><p className="mt-2 max-w-3xl text-sm text-zinc-600">Uma mesma responsabilidade pode ser concedida a várias pessoas. A aprovação atualiza o vínculo oficial e passa a compor a cobertura da jornada de cada colaborador.</p></div><button type="button" onClick={() => go("responsabilidades", undefined, "solicitacoes")} className="inline-flex items-center gap-2 border border-teal-700 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100"><ShieldCheck className="h-4 w-4" /> Gerir solicitações{pendingClaims.length ? ` (${pendingClaims.length})` : ""}</button></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric icon={ClipboardCheck} label="Aguardando decisão" value={pendingClaims.length} /><Metric icon={ShieldCheck} label="Vínculos concedidos" value={approvedClaims.length} /><Metric icon={Users} label="Pessoas com vínculo" value={new Set(approvedClaims.map((claim) => claim.collaborator_id)).size} /></div></section>
    <section className="mb-6 border bg-white"><div className="border-b p-4"><h2 className="text-lg font-semibold">Arquitetura de cargos e funções</h2><p className="mt-1 text-sm text-zinc-600">Os marcos estratégicos mantêm 100% de maturidade e ampliam o número de núcleos pelo qual a função responde.</p></div><div className="divide-y">{careerStages.map((stage) => <div key={stage.title} className="grid gap-3 px-4 py-4 md:grid-cols-[180px_220px_minmax(0,1fr)_130px]"><div><p className="text-xs font-semibold uppercase text-teal-700">{stage.track}</p><strong className="mt-1 block text-sm">{stage.title}</strong></div><p className="text-sm font-medium">{stage.function}</p><p className="text-sm text-zinc-600">{stage.scope}</p><div className="text-left md:text-right"><strong className="text-sm">{stage.threshold}%</strong><p className="text-xs text-zinc-500">{stage.points}/84 pontos</p></div></div>)}</div></section>
    <section className="border bg-white"><div className="border-b p-4"><h2 className="text-lg font-semibold">Leitura da equipe</h2><p className="mt-1 text-sm text-zinc-600">Acompanhe a cobertura de cada pessoa, suas solicitações pendentes e os vínculos já concedidos.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-zinc-50 text-xs"><tr><th className="px-4 py-3">Colaborador</th><th className="px-4 py-3">Capacidades</th><th className="px-4 py-3">Responsabilidades</th><th className="px-4 py-3">Solicitações</th><th className="px-4 py-3">Marco de jornada</th></tr></thead><tbody>{rows.map(({ person, metrics }) => { const stage = stageFor(metrics.capability.progress, metrics.responsibilityPercent); const personPending = pendingClaims.filter((claim) => claim.collaborator_id === person.id).length; const personApproved = approvedClaims.filter((claim) => claim.collaborator_id === person.id).length; return <tr key={person.id} className="border-t"><td className="px-4 py-3 font-semibold">{person.name}</td><td className="px-4 py-3">{metrics.capability.progress.toLocaleString("pt-BR")}% <span className="text-xs text-zinc-500">({metrics.capability.pointsEarned}/84)</span></td><td className="px-4 py-3">{metrics.responsibilityPercent.toLocaleString("pt-BR")}% <span className="text-xs text-zinc-500">({metrics.granted}/{metrics.items.length})</span></td><td className="px-4 py-3"><span className="font-medium text-teal-800">{personApproved} concedida(s)</span>{personPending > 0 && <span className="block text-xs text-amber-800">{personPending} aguardando avaliação</span>}</td><td className="px-4 py-3">{stage?.title ?? "Em preparação para Operador Júnior"}</td></tr>; })}</tbody></table></div></section>
  </>;
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`border-b-2 px-3 py-2 text-sm font-semibold ${active ? "border-teal-700 text-teal-800" : "border-transparent text-zinc-600 hover:text-zinc-950"}`}>{label}</button>;
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return <div className="border bg-zinc-50 p-3"><p className="flex items-center gap-1 text-[11px] font-semibold uppercase text-zinc-500"><Icon className="h-3.5 w-3.5" />{label}</p><strong className="mt-1 block text-lg">{value}</strong></div>;
}

function journeyMetrics(library: Library, levels: Map<string, number>, claims: ResponsibilityClaim[], collaboratorId: string) {
  const capability = globalCapabilityMaturity(library.capabilities.map((item) => item.code), levels);
  const ownClaims = claims.filter((claim) => claim.collaborator_id === collaboratorId);
  const items = library.responsibilities
    .map((responsibility) => responsibilityReadiness(responsibility, levels, ownClaims))
    .sort((a, b) => b.progress - a.progress || a.responsibility.title.localeCompare(b.responsibility.title, "pt-BR"));
  const granted = items.filter((item) => item.status === "concedida").length;
  return {
    capability,
    items,
    granted,
    responsibilityPercent: items.length ? Math.round(granted / items.length * 1000) / 10 : 0,
    available: items.filter((item) => item.status === "disponivel").length,
    preparing: items.filter((item) => item.status === "em_preparo" || item.status === "bloqueada").length,
  };
}
