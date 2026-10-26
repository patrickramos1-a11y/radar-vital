import { useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, ClipboardCheck, GraduationCap, ShieldCheck, Target, UserRoundSearch, Users, type LucideIcon } from "lucide-react";
import { capabilityLevelInsignia, capabilityLevelNames } from "./capabilityJourney";
import type { Library } from "./journeyRemote";
import { competencyReadiness, globalCapabilityMaturity, type CompetencyReadiness, type ResponsibilityClaim } from "./responsibilityJourney";
import type { PreviewResponsibility } from "./model";
import { CapabilityQueueThumb } from "./CapabilityVisualIdentity";
import { capabilityVisualStyle } from "./capabilityVisuals";
import { CareerLadderPanel } from "./CareerLadderPanel";
import { careerStepReadiness, nucleoTecnicoCareerLadder } from "./careerLadder";

type Go = (view: "capacidade" | "capacidades" | "capacitacoes" | "cargos-funcoes" | "jornada" | "perfil-profissional" | "responsabilidade" | "responsabilidades" | "setor", id?: string, tab?: string, mode?: string) => void;

type CareerStage = {
  title: string;
  function: string;
  threshold: number;
  points: number;
  scope: string;
  track: "Operação" | "Gestão" | "Estratégico";
};

export const careerStages: CareerStage[] = [
  { title: "Operador Júnior", function: "Operação técnica inicial", threshold: 30, points: 26, scope: "Competências assistidas do setor", track: "Operação" },
  { title: "Operador Pleno", function: "Operação técnica", threshold: 50, points: 42, scope: "Competências autônomas do setor", track: "Operação" },
  { title: "Operador Master", function: "Referência técnica", threshold: 65, points: 55, scope: "Competências críticas e multiplicação", track: "Operação" },
  { title: "Gestão Júnior", function: "Gestão de setor", threshold: 75, points: 63, scope: "Cobertura e desenvolvimento de um setor", track: "Gestão" },
  { title: "Gestão Pleno", function: "Gestão integrada", threshold: 85, points: 72, scope: "Integração de setores ou frente ampliada", track: "Gestão" },
  { title: "Gestão Master", function: "Gestão de núcleo", threshold: 95, points: 80, scope: "Resultado e evolução de um núcleo", track: "Gestão" },
  { title: "Estratégico Júnior", function: "Estratégia do Núcleo Técnico", threshold: 100, points: 84, scope: "100% do Núcleo Técnico: capacidades multiplicadoras e competências do escopo", track: "Estratégico" },
  { title: "Estratégico Pleno", function: "Estratégia integrada", threshold: 100, points: 84, scope: "100% de dois núcleos definidos", track: "Estratégico" },
  { title: "Estratégico Master", function: "Direção estratégica", threshold: 100, points: 84, scope: "100% de três núcleos definidos", track: "Estratégico" },
];

type Tab = "capacidades" | "competencias" | "consolidadas" | "evolucao";

function progressBar(value: number, color: string) {
  return <div className="mt-2 h-2 overflow-hidden bg-zinc-100"><div className={`h-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} /></div>;
}

function stageFor(library: Library, levels: Map<string, number>, claims: ResponsibilityClaim[], collaboratorId: string) {
  return nucleoTecnicoCareerLadder.steps
    .filter((step) => step.nucleiRequired === 1)
    .find((step) => careerStepReadiness(library, nucleoTecnicoCareerLadder, step.id, levels, claims, collaboratorId).eligible);
}

export function ProfessionalProfile({ library, certifiedLevels, claims, collaboratorId, collaboratorName, go }: {
  library: Library;
  certifiedLevels: Map<string, number>;
  claims: ResponsibilityClaim[];
  collaboratorId: string;
  collaboratorName: string;
  go: Go;
}) {
  const competencies = useMemo(() => library.responsibilities.map((item) => competencyReadiness(item, certifiedLevels)), [library, certifiedLevels]);
  const consolidated = competencies.filter((item) => item.status === "consolidada");
  const developing = competencies.filter((item) => item.status === "em_formacao").sort((left, right) => right.progress - left.progress).slice(0, 4);
  const capabilities = library.capabilities.filter((item) => (certifiedLevels.get(item.code) ?? 0) > 0).sort((left, right) => left.title.localeCompare(right.title, "pt-BR"));
  const sectors = [...new Set(consolidated.map((item) => item.responsibility.sourceSector))].sort((left, right) => left.localeCompare(right, "pt-BR"));
  const stage = stageFor(library, certifiedLevels, claims, collaboratorId);
  const points = [...certifiedLevels.values()].reduce((total, level) => total + Math.min(level, 3), 0);
  return <>
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5"><div><p className="cap-eyebrow">Leitura direcionada do perfil</p><h1 className="text-2xl font-semibold text-[#172824] sm:text-[28px]">Perfil profissional de {collaboratorName}</h1><p className="mt-2 max-w-3xl text-sm text-zinc-600">Síntese automática das capacidades certificadas e das competências que elas já formam. Esta leitura indica onde o perfil pode contribuir hoje e quais desenvolvimentos ampliam sua atuação.</p></div><button type="button" onClick={() => go("jornada")} className="inline-flex items-center gap-1 border border-teal-700 bg-white px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-50">Voltar à jornada <ArrowRight className="h-4 w-4" /></button></header>
    <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="border-t-4 border-teal-600 bg-white p-4"><p className="text-xs font-semibold uppercase text-zinc-500">Momento de carreira</p><strong className="mt-1 block text-lg">{stage?.title ?? "Em preparação"}</strong><p className="mt-1 text-xs text-zinc-600">{stage?.function ?? "Construindo a base de operação"}</p></div><div className="border-t-4 border-violet-600 bg-white p-4"><p className="text-xs font-semibold uppercase text-zinc-500">Capacidades certificadas</p><strong className="mt-1 block text-2xl">{capabilities.length}</strong><p className="mt-1 text-xs text-zinc-600">{points} pontos de capacidade reconhecidos</p></div><div className="border-t-4 border-emerald-600 bg-white p-4"><p className="text-xs font-semibold uppercase text-zinc-500">Competências formadas</p><strong className="mt-1 block text-2xl">{consolidated.length}</strong><p className="mt-1 text-xs text-zinc-600">formadas automaticamente</p></div><div className="border-t-4 border-amber-500 bg-white p-4"><p className="text-xs font-semibold uppercase text-zinc-500">Próximos avanços</p><strong className="mt-1 block text-2xl">{developing.length}</strong><p className="mt-1 text-xs text-zinc-600">competências próximas de formação</p></div></section>
    <section className="mb-6 grid gap-5 lg:grid-cols-2"><div className="border bg-white p-5"><p className="text-xs font-semibold uppercase text-teal-700">Onde pode contribuir</p><h2 className="mt-2 text-lg font-semibold">Frentes já habilitadas</h2><p className="mt-1 text-sm text-zinc-600">As competências consolidadas indicam os processos e entregas que o perfil já consegue apoiar dentro do escopo técnico.</p><div className="mt-4 flex flex-wrap gap-1">{sectors.map((sector) => <span key={sector} className="border border-teal-300 bg-teal-50 px-2 py-1 text-xs font-medium text-teal-950">{sector}</span>)}{!sectors.length && <p className="text-sm text-zinc-600">Ainda não há uma competência completa para indicar uma frente de atuação.</p>}</div></div><div className="border bg-white p-5"><p className="text-xs font-semibold uppercase text-violet-700">O que já consegue sustentar</p><h2 className="mt-2 text-lg font-semibold">Competências consolidadas</h2><p className="mt-1 text-sm text-zinc-600">Cada item foi formado pelas capacidades e níveis certificados no perfil.</p><div className="mt-4 space-y-2">{consolidated.slice(0, 8).map((item) => <button key={item.responsibility.sourceId} type="button" onClick={() => go("responsabilidade", item.responsibility.sourceId)} className="flex w-full items-center justify-between gap-3 border-l-2 border-emerald-600 px-3 py-2 text-left text-sm hover:bg-emerald-50"><span>{item.responsibility.title}</span><span className="text-xs text-emerald-800">{item.responsibility.sourceSector}</span></button>)}{!consolidated.length && <p className="text-sm text-zinc-600">Nenhuma competência está consolidada ainda.</p>}</div></div></section>
    <section className="mb-6 border bg-white"><div className="flex flex-wrap items-end justify-between gap-3 border-b p-4"><div><p className="text-xs font-semibold uppercase text-violet-700">Base técnica reconhecida</p><h2 className="mt-1 text-lg font-semibold">Capacidades certificadas</h2></div><button type="button" onClick={() => go("capacitacoes")} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline">Abrir capacitações <ArrowRight className="h-4 w-4" /></button></div><div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">{capabilities.map((capability) => { const level = certifiedLevels.get(capability.code)!; return <button key={capability.code} type="button" onClick={() => go("capacidade", capability.code)} className="flex min-w-0 items-center gap-2 border px-3 py-2 text-left hover:bg-zinc-50"><img src={capabilityLevelInsignia[level as 1 | 2 | 3]} alt={capabilityLevelNames[level as 1 | 2 | 3]} className="h-7 w-7 shrink-0 object-contain" loading="lazy" decoding="async" /><span className="min-w-0"><strong className="block truncate text-sm">{capability.title}</strong><span className="text-xs text-zinc-600">{capabilityLevelNames[level as 1 | 2 | 3]}</span></span></button>; })}{!capabilities.length && <p className="text-sm text-zinc-600">Nenhuma capacidade certificada neste perfil.</p>}</div></section>
    <section className="border bg-white"><div className="border-b p-4"><p className="text-xs font-semibold uppercase text-amber-700">Direção de desenvolvimento</p><h2 className="mt-1 text-lg font-semibold">Competências mais próximas de formar</h2><p className="mt-1 text-sm text-zinc-600">Ao completar as capacidades abaixo, o sistema atualiza automaticamente o perfil e a leitura de atuação.</p></div><div className="divide-y">{developing.map((item) => <div key={item.responsibility.sourceId} className="px-4 py-3"><div className="flex flex-wrap items-center justify-between gap-3"><strong className="text-sm">{item.responsibility.title}</strong><span className="text-xs font-semibold text-amber-800">{item.progress.toLocaleString("pt-BR")}% concluída</span></div><p className="mt-1 text-xs text-zinc-600">Falta: {item.unmet.map((requirement) => `${requirement.capabilityCode} em ${capabilityLevelNames[requirement.minimumLevel]}`).join(", ")}.</p></div>)}{!developing.length && <p className="p-4 text-sm text-zinc-600">Não há competências em formação no momento.</p>}</div></section>
  </>;
}

function CapabilityLevelSeals({ code, currentLevel }: { code: string; currentLevel: number }) {
  return <span className="flex items-center gap-1" aria-label={`Níveis de ${code}`}>
    {([1, 2, 3] as const).map((level) => <span key={level} className={`grid h-7 w-7 place-items-center ${level <= currentLevel ? "opacity-100" : "opacity-30 grayscale"}`} title={level <= currentLevel ? `Habilitado: ${capabilityLevelNames[level]}` : `Falta: ${capabilityLevelNames[level]}`}><img src={capabilityLevelInsignia[level]} alt={level <= currentLevel ? `Nível habilitado: ${capabilityLevelNames[level]}` : `Nível a desenvolver: ${capabilityLevelNames[level]}`} className="h-full w-full object-contain" loading="lazy" decoding="async" /></span>)}
  </span>;
}

function ResponsibilityList({ items, mappedResponsibilities, selectedLevel, go, granted }: { items: CompetencyReadiness[]; mappedResponsibilities: PreviewResponsibility[]; selectedLevel: (code: string) => number; go: Go; granted: boolean }) {
  const title = granted ? "Competências consolidadas" : "Competências em formação";
  const description = granted ? "Formadas automaticamente pelas capacidades já certificadas." : "Ordenadas pela proximidade de conclusão. Ao completar os requisitos, cada competência passa a contar na progressão.";
  return <section className="border bg-white"><div className="border-b p-4"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-zinc-600">{description}</p></div><div className="divide-y">{items.map((item) => { const mapped = mappedResponsibilities.find((responsibility) => responsibility.id === item.responsibility.sourceId); return <article key={item.responsibility.sourceId} className="px-4 py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold uppercase text-teal-700"><span>Competência:</span><button type="button" onClick={() => go("responsabilidade", item.responsibility.sourceId)} className="underline decoration-teal-300 underline-offset-2 hover:text-teal-900" aria-label={`Abrir competência ${item.responsibility.sourceSector}`}>{item.responsibility.sourceSector} · {capabilityLevelNames[item.mode]}</button></div><div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-zinc-950"><span className="text-xs font-semibold uppercase text-zinc-500">Escopo:</span><button type="button" onClick={() => { if (mapped) go("setor", mapped.sectorId); }} className="text-left underline decoration-zinc-300 underline-offset-2 hover:text-teal-800">{item.responsibility.title}</button></div><p className="mt-2 text-xs text-zinc-600">{item.status === "consolidada" ? "Consolidada automaticamente" : item.status === "em_formacao" ? "Em formação" : "Bloqueada"}</p></div><div className="text-right text-sm"><strong>{item.progress.toLocaleString("pt-BR")}%</strong><p className="text-xs text-zinc-500">{item.pointsEarned} de {item.pointsRequired} pontos</p></div></div><div className="mt-3"><p className="mb-1 text-xs font-semibold uppercase text-zinc-500">Capacidades necessárias e níveis</p><div className="flex flex-wrap gap-1">{item.responsibility.requiredCapabilities.map((requirement) => { const level = selectedLevel(requirement.capabilityCode); return <button key={requirement.capabilityCode} type="button" onClick={() => go("capacidade", requirement.capabilityCode)} className={`border px-2 py-1 text-[11px] font-medium ${level >= requirement.minimumLevel ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900"}`}>{requirement.capabilityCode} · Atual: {level ? capabilityLevelNames[level as 1 | 2 | 3] : "Não certificado"} · Exigido: {capabilityLevelNames[requirement.minimumLevel]}</button>; })}</div></div>{progressBar(item.progress, item.status === "consolidada" ? "bg-emerald-600" : item.status === "em_formacao" ? "bg-violet-500" : "bg-zinc-400")}{item.unmet.length > 0 && <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-zinc-600"><span>Para concluir:</span>{item.unmet.map((requirement) => { const level = selectedLevel(requirement.capabilityCode); return <button key={requirement.capabilityCode} type="button" onClick={() => go("capacidade", requirement.capabilityCode)} className="font-semibold text-amber-800 underline decoration-amber-300 underline-offset-2 hover:text-amber-950">{requirement.capabilityCode} · atual: {level ? capabilityLevelNames[level as 1 | 2 | 3] : "Não certificado"} · exigido: {capabilityLevelNames[requirement.minimumLevel]}</button>; })}</div>}</article>; })}{!items.length && <p className="p-4 text-sm text-zinc-600">Nenhuma competência nesta visão.</p>}</div></section>;
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
  const selectedLevel = (code: string) => certifiedLevels.get(code) ?? 0;
  const evolvingResponsibilities = metrics.items.filter((item) => item.status !== "consolidada");
  const grantedResponsibilities = metrics.items.filter((item) => item.status === "consolidada");

  return <>
    <header className="mb-6 border-b border-zinc-200 pb-5">
      <p className="cap-eyebrow">Jornada profissional</p>
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold text-[#172824] sm:text-[28px]">Minha jornada profissional</h1><p className="mt-2 max-w-3xl text-sm text-zinc-600">Sua evolução une o nível certificado de cada capacidade e as competências que o sistema consolida automaticamente.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => go("perfil-profissional")} className="inline-flex items-center gap-2 border border-teal-700 bg-white px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-50"><UserRoundSearch className="h-4 w-4" /> Ver perfil profissional</button>{isAdmin && <button type="button" onClick={() => go("cargos-funcoes")} className="inline-flex items-center gap-2 border border-teal-700 bg-white px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-50"><BriefcaseBusiness className="h-4 w-4" /> Cargos e funções</button>}</div></div>
    </header>
    <section className="mb-6 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.8fr)]">
      <div className="border-l-4 border-teal-600 bg-white p-5"><p className="text-xs font-semibold uppercase text-teal-700">Maturidade geral de {collaboratorName}</p><h2 className="mt-2 text-xl font-semibold text-zinc-950">Capacidades e competências consolidadas</h2><p className="mt-1 text-sm font-medium text-zinc-700">Indicador geral do Núcleo Técnico</p><p className="mt-3 max-w-2xl text-sm text-zinc-600">Esta leitura acompanha a evolução no catálogo inteiro. O cargo é calculado pelo PAC acumulado e pelas competências automaticamente formadas no Núcleo Técnico.</p></div>
      <div className="border-t-4 border-violet-600 bg-white p-5"><p className="text-xs font-semibold uppercase text-zinc-500">Próximo marco de cargo</p><strong className="mt-2 block text-lg text-violet-950">Ver escada corporativa</strong><button type="button" onClick={() => setTab("evolucao")} className="mt-2 text-left text-xs font-semibold text-violet-800 hover:underline">Consultar PAC e competências exigidas</button></div>
    </section>
    <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="border-t-4 border-violet-600 bg-white p-4"><p className="text-xs font-semibold uppercase text-zinc-500">Capacidades</p><strong className="mt-1 block text-2xl">{metrics.capability.progress.toLocaleString("pt-BR")}%</strong><p className="mt-1 text-xs text-zinc-600">{metrics.capability.pointsEarned} de {metrics.capability.pointsRequired} pontos</p>{progressBar(metrics.capability.progress, "bg-violet-600")}</div>
      <div className="border-t-4 border-emerald-600 bg-white p-4"><p className="text-xs font-semibold uppercase text-zinc-500">Competências</p><strong className="mt-1 block text-2xl">{metrics.competencyPercent.toLocaleString("pt-BR")}%</strong><p className="mt-1 text-xs text-zinc-600">{metrics.consolidated} de {metrics.items.length} consolidadas</p>{progressBar(metrics.competencyPercent, "bg-emerald-600")}</div>
      <div className="border-t-4 border-teal-600 bg-white p-4"><p className="text-xs font-semibold uppercase text-zinc-500">Consolidadas agora</p><strong className="mt-1 block text-2xl">{metrics.consolidated}</strong><p className="mt-1 text-xs text-zinc-600">requisitos técnicos completos</p></div>
      <div className="border-t-4 border-amber-500 bg-white p-4"><p className="text-xs font-semibold uppercase text-zinc-500">Em preparação</p><strong className="mt-1 block text-2xl">{metrics.preparing}</strong><p className="mt-1 text-xs text-zinc-600">ainda dependem de capacitação</p></div>
    </section>
    <div className="mb-5 flex flex-wrap gap-1 border-b" role="tablist" aria-label="Jornada profissional"><TabButton label="Capacidades" active={tab === "capacidades"} onClick={() => setTab("capacidades")} /><TabButton label="Competências" active={tab === "competencias"} onClick={() => setTab("competencias")} /><TabButton label={`Consolidadas (${grantedResponsibilities.length})`} active={tab === "consolidadas"} onClick={() => setTab("consolidadas")} /><TabButton label="Escada de cargo" active={tab === "evolucao"} onClick={() => setTab("evolucao")} /></div>
    {tab === "capacidades" && <section className="border bg-white"><div className="flex flex-wrap items-end justify-between gap-3 border-b p-4"><div><h2 className="text-lg font-semibold">Capacidades consolidadas</h2><p className="mt-1 text-sm text-zinc-600">A pontuação usa Assistido = 1, Autônomo = 2 e Multiplicador = 3. O teto da jornada do Núcleo Técnico é 84 pontos.</p></div><button type="button" onClick={() => go("capacitacoes")} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline">Abrir capacitações <ArrowRight className="h-4 w-4" /></button></div><div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">{library.capabilities.map((capability) => { const level = selectedLevel(capability.code); return <button key={capability.code} type="button" onClick={() => go("capacidade", capability.code)} style={{ ...capabilityVisualStyle(capability.code), borderLeftColor: "var(--cap-accent, #176f68)" }} className="flex min-w-0 items-center gap-3 border-l-4 px-4 py-3 text-left hover:bg-zinc-50"><CapabilityQueueThumb code={capability.code} alt={`Figurinha ${capability.code}: ${capability.title}`} /><span className="min-w-0 flex-1"><strong className="block text-sm" style={{ color: "var(--cap-ink, #172824)" }}>{capability.code} · {capability.title}</strong><span className="mt-1 block text-xs text-zinc-600">{level ? `Nível consolidado: ${capabilityLevelNames[level as 1 | 2 | 3]}` : "Ainda não certificado"}</span><span className="mt-2 block"><CapabilityLevelSeals code={capability.code} currentLevel={level} /></span></span><ArrowRight className="h-4 w-4 shrink-0" style={{ color: "var(--cap-ink, #176f68)" }} /></button>; })}</div></section>}
    {tab === "competencias" && <ResponsibilityList items={evolvingResponsibilities} mappedResponsibilities={mappedResponsibilities} selectedLevel={selectedLevel} go={go} granted={false} />}
    {tab === "consolidadas" && <ResponsibilityList items={grantedResponsibilities} mappedResponsibilities={mappedResponsibilities} selectedLevel={selectedLevel} go={go} granted />}
    {tab === "evolucao" && <CareerLadderPanel library={library} certifiedLevels={certifiedLevels} claims={claims} collaboratorId={collaboratorId} go={go} />}
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
  const rows = people.map((person) => {
    const levels = teamLevels.get(person.id) ?? new Map();
    return { person, levels, metrics: journeyMetrics(library, levels, claims, person.id) };
  });
  const pendingClaims = claims.filter((claim) => claim.status === "requested");
  const approvedClaims = claims.filter((claim) => claim.status === "approved");
  return <>
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200 pb-5"><div><p className="cap-eyebrow">Administração da jornada</p><h1 className="text-2xl font-semibold text-[#172824] sm:text-[28px]">Cargos e funções</h1><p className="mt-2 max-w-3xl text-sm text-zinc-600">Estruture a evolução da equipe a partir das capacidades certificadas e das competências consolidadas automaticamente.</p></div><button type="button" onClick={() => go("jornada")} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline">Voltar à minha jornada <ArrowRight className="h-4 w-4" /></button></header>
    <section className="mb-6 border-t-4 border-violet-600 bg-white p-5"><div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]"><div><p className="text-xs font-semibold uppercase text-violet-700">Regra de elegibilidade</p><h2 className="mt-2 text-lg font-semibold">A função é liberada por competências comprovadas, não por título.</h2><p className="mt-2 text-sm leading-relaxed text-zinc-700">Cada marco exige uma meta de pontos certificados e uma quantidade de competências formadas pelas capacidades da pessoa. Estratégico Júnior fecha o Núcleo Técnico com 84 pontos, todas as capacidades em Multiplicador e 52 competências do escopo.</p></div><div className="grid grid-cols-2 gap-3"><Metric icon={GraduationCap} label="Capacidades" value="84 pontos" /><Metric icon={ShieldCheck} label="Competências" value="52 do Núcleo Técnico" /><Metric icon={Target} label="Marco estratégico" value="100%" /><Metric icon={Users} label="Pessoas visíveis" value={people.length} /></div></div></section>
    <section className="mb-6 border-t-4 border-teal-600 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase text-teal-700">Gestão de responsabilidades</p><h2 className="mt-2 text-lg font-semibold">Solicitações e vínculos da equipe</h2><p className="mt-2 max-w-3xl text-sm text-zinc-600">Uma mesma responsabilidade pode ser concedida a várias pessoas. A aprovação atualiza o vínculo oficial e passa a compor a cobertura da jornada de cada colaborador.</p></div><button type="button" onClick={() => go("responsabilidades", undefined, "solicitacoes")} className="inline-flex items-center gap-2 border border-teal-700 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100"><ShieldCheck className="h-4 w-4" /> Gerir solicitações{pendingClaims.length ? ` (${pendingClaims.length})` : ""}</button></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric icon={ClipboardCheck} label="Aguardando decisão" value={pendingClaims.length} /><Metric icon={ShieldCheck} label="Vínculos concedidos" value={approvedClaims.length} /><Metric icon={Users} label="Pessoas com vínculo" value={new Set(approvedClaims.map((claim) => claim.collaborator_id)).size} /></div></section>
    <section className="mb-6 border bg-white"><div className="border-b p-4"><h2 className="text-lg font-semibold">Arquitetura de cargos e funções</h2><p className="mt-1 text-sm text-zinc-600">Os marcos estratégicos mantêm 100% de maturidade e ampliam o número de núcleos pelo qual a função responde.</p></div><div className="divide-y">{careerStages.map((stage) => <div key={stage.title} className="grid gap-3 px-4 py-4 md:grid-cols-[180px_220px_minmax(0,1fr)_130px]"><div><p className="text-xs font-semibold uppercase text-teal-700">{stage.track}</p><strong className="mt-1 block text-sm">{stage.title}</strong></div><p className="text-sm font-medium">{stage.function}</p><p className="text-sm text-zinc-600">{stage.scope}</p><div className="text-left md:text-right"><strong className="text-sm">{stage.threshold}%</strong><p className="text-xs text-zinc-500">{stage.points}/84 pontos</p></div></div>)}</div></section>
    <section className="border bg-white"><div className="border-b p-4"><h2 className="text-lg font-semibold">Leitura da equipe</h2><p className="mt-1 text-sm text-zinc-600">Acompanhe as capacidades, competências consolidadas e o próximo marco de cada pessoa.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-zinc-50 text-xs"><tr><th className="px-4 py-3">Colaborador</th><th className="px-4 py-3">Capacidades</th><th className="px-4 py-3">Competências</th><th className="px-4 py-3">Marco de jornada</th></tr></thead><tbody>{rows.map(({ person, levels, metrics }) => { const stage = stageFor(library, levels, claims, person.id); return <tr key={person.id} className="border-t"><td className="px-4 py-3 font-semibold">{person.name}</td><td className="px-4 py-3">{metrics.capability.progress.toLocaleString("pt-BR")}% <span className="text-xs text-zinc-500">({metrics.capability.pointsEarned}/84)</span></td><td className="px-4 py-3">{metrics.competencyPercent.toLocaleString("pt-BR")}% <span className="text-xs text-zinc-500">({metrics.consolidated}/{metrics.items.length})</span></td><td className="px-4 py-3">{stage?.title ?? "Em preparação para Operador Júnior"}</td></tr>; })}</tbody></table></div></section>
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
  const items = library.responsibilities
    .map((responsibility) => competencyReadiness(responsibility, levels))
    .sort((a, b) => b.progress - a.progress || a.responsibility.title.localeCompare(b.responsibility.title, "pt-BR"));
  const consolidated = items.filter((item) => item.status === "consolidada").length;
  return {
    capability,
    items,
    consolidated,
    competencyPercent: items.length ? Math.round(consolidated / items.length * 1000) / 10 : 0,
    preparing: items.filter((item) => item.status === "em_formacao" || item.status === "bloqueada").length,
  };
}
