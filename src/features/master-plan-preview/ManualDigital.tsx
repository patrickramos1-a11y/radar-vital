import { useState, type CSSProperties, type ReactNode } from "react";
import { ArrowRight, BookOpen, BriefcaseBusiness, CheckCircle2, ClipboardCheck, FileCheck2, Layers3, Network, Search, ShieldCheck, UsersRound } from "lucide-react";
import type { MasterPlanContext, Unit } from "./data";
import { capabilityCoverPath, hasCapabilityPoster } from "./capabilityVisuals";
import { capabilityLevelInsignia } from "./capabilityJourney";
import { competencyStickerPath } from "./competencyVisualAssets";
import { nucleusCoverPath } from "./model";
import { sectorVisuals } from "./manualSectorVisuals";
import { functionStickerPath, nucleusStickerPath, sectorCoverPath, sectorStickerPath } from "./organizationVisualAssets";
import { organizationMap } from "./organizationMapModel";
import "./manualDigital.css";
import {
  essentialFunctionsForSector, essentialSectorIdsForFunction, institutionalSectorId, levelNames, linkedCompetenciesForSector,
  manualCatalog, normalizeManualName, nucleusCatalogId, nucleusRouteId,
  operationalUnitsForSector, type ManualCompetency, type ManualEntity,
  type ManualFunction, type ManualSector,
} from "./manualDigitalModel";

export type ManualView = "nucleos" | "nucleo" | "setores" | "setor" | "funcao" | "competencia-manual" | "capacidade-manual";
type Destination = ManualView | "capacidade" | "responsabilidade" | "pessoa";
type Go = (view: Destination, id?: string, tab?: string) => void;
interface Props {
  view: ManualView;
  id: string;
  tab: string;
  go: Go;
  context?: MasterPlanContext;
  officialCapabilityCodes: string[];
  officialCompetencyIds: string[];
  certifiedLevels?: Record<string, number> | null;
  operationContent?: ReactNode;
}

function Status({ value }: { value: string }) {
  const confirmed = value === "Existente e confirmada";
  const derived = value === "Derivada dos dados" || value.includes("derivado dos dados");
  return <span className={`inline-flex border px-1.5 py-0.5 text-[10px] font-semibold ${confirmed ? "border-emerald-300 bg-emerald-50 text-emerald-800" : derived ? "border-sky-300 bg-sky-50 text-sky-800" : "border-amber-300 bg-amber-50 text-amber-900"}`}>{confirmed ? "Confirmado" : derived ? "Derivado dos dados" : "Proposta para validação"}</span>;
}

function Heading({ eyebrow, title, description, right }: { eyebrow: string; title: string; description?: string; right?: ReactNode }) {
  return <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b pb-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase text-teal-700">{eyebrow}</p><h1 className="mt-1 text-2xl font-semibold text-[#18302c]">{title}</h1>{description && <p className="mt-2 max-w-4xl text-sm leading-relaxed text-zinc-600">{description}</p>}</div>{right}</header>;
}

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return <section className="border-t py-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold text-[#18302c]">{title}</h2>{aside}</div>{children}</section>;
}

function TextField({ item, field, label }: { item: ManualEntity; field: string; label?: string }) {
  const value = item.content[field];
  if (!value) return null;
  return <div className="min-w-0"><h3 className="mb-1 text-xs font-semibold uppercase text-zinc-500">{label ?? field}</h3><p className="whitespace-pre-line break-words text-sm leading-relaxed text-zinc-700">{value}</p></div>;
}

function LinkRow({ title, meta, image, onClick, trailing }: { title: string; meta?: string; image?: string; onClick: () => void; trailing?: ReactNode }) {
  return <button type="button" onClick={onClick} className="flex min-h-14 w-full min-w-0 items-center justify-between gap-3 border-b py-2 text-left hover:bg-teal-50/60">{image && <img src={image} alt="" loading="lazy" className="h-12 w-12 shrink-0 object-contain" />}<span className="min-w-0 flex-1"><strong className="block break-words text-sm text-[#18302c]">{title}</strong>{meta && <span className="mt-1 block break-words text-xs text-zinc-600">{meta}</span>}</span><span className="flex shrink-0 items-center gap-2">{trailing}<ArrowRight className="h-4 w-4 text-teal-700" /></span></button>;
}

function Tabs({ items, current, onChange, className = "" }: { items: Array<{ id: string; label: string }>; current: string; onChange: (id: string) => void; className?: string }) {
  return <div className={`mb-5 flex gap-1 overflow-x-auto border-b ${className}`} role="tablist">{items.map((item) => <button type="button" role="tab" aria-selected={current === item.id} key={item.id} onClick={() => onChange(item.id)} className={`shrink-0 border-b-2 px-3 py-2 text-xs font-semibold ${current === item.id ? "border-teal-700 text-teal-800" : "border-transparent text-zinc-600 hover:text-teal-800"}`}>{item.label}</button>)}</div>;
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="relative block max-w-lg"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-9 w-full border bg-white pl-9 pr-3 text-sm outline-none focus:border-teal-700" /></label>;
}

function CapabilityRequirement({ code, level, go, officialCodes, certifiedLevels }: { code: string; level: 1 | 2 | 3; go: Go; officialCodes: Set<string>; certifiedLevels?: Record<string, number> | null }) {
  const capability = manualCatalog.capabilities.find((item) => item.code === code);
  const label = `${capability?.name ?? code} · ${levelNames[level]}`;
  const isProposal = capability?.origin === "Nova";
  const unknown = certifiedLevels == null;
  const pending = isProposal || unknown || (certifiedLevels?.[code] ?? 0) < level;
  const levelImage = `/capability-stickers/levels/INSIGNIA_${({ 1: "ASSISTIDO", 2: "AUTONOMO", 3: "MULTIPLICADOR" } as const)[level]}.png`;
  if (isProposal || officialCodes.has(code)) return <button type="button" onClick={() => go(isProposal ? "capacidade-manual" : "capacidade", code)} className={`sector-requirement flex min-w-0 items-center gap-1.5 border-b border-zinc-200 py-1 text-left text-xs hover:underline ${pending ? "sector-requirement-pending" : "text-teal-800"}`}><img src={levelImage} alt="" className="h-5 w-5 shrink-0 object-contain" /><span className="break-words">{label}{isProposal ? " · proposta" : unknown ? "" : pending ? " · pendente" : ""}</span><ArrowRight className="h-3 w-3 shrink-0" /></button>;
  return <span className="border-b border-zinc-200 py-1 text-xs text-zinc-600">{label}</span>;
}

function CompetencyList({ items, go, officialIds, officialCodes, certifiedLevels }: { items: ManualCompetency[]; go: Go; officialIds: Set<string>; officialCodes: Set<string>; certifiedLevels?: Record<string, number> | null }) {
  if (!items.length) return <p className="text-sm text-zinc-600">Nenhuma competência vinculada nesta ficha.</p>;
  return <div className="divide-y border-y">{items.map((item) => <article key={item.id} className="py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 flex-1 items-center gap-3"><img src={competencyStickerPath(item.id)} alt={`Figurinha da competência ${item.name}`} className="h-16 w-16 shrink-0 object-contain drop-shadow-sm" loading="lazy" /><div className="min-w-0"><p className="text-[11px] font-semibold uppercase text-teal-700">{item.id}</p><h3 className="text-sm font-semibold text-[#18302c]">{item.name}</h3></div></div><Status value={item.classification} /></div>{item.content["Objetivo da competência"] && <p className="mt-2 text-xs leading-relaxed text-zinc-600">{item.content["Objetivo da competência"]}</p>}<div className="mt-3 grid gap-x-5 sm:grid-cols-2">{item.requirements.map((requirement) => <CapabilityRequirement key={requirement.code} code={requirement.code} level={requirement.level} go={go} officialCodes={officialCodes} certifiedLevels={certifiedLevels} />)}</div>{item.origin === "Nova" ? <button type="button" onClick={() => go("competencia-manual", item.id)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline">Abrir proposta <ArrowRight className="h-3.5 w-3.5" /></button> : item.officialSourceId && officialIds.has(item.officialSourceId) ? <button type="button" onClick={() => go("responsabilidade", item.officialSourceId)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline">Abrir ficha da competência <ArrowRight className="h-3.5 w-3.5" /></button> : null}</article>)}</div>;
}

function SectorDirectory({ sectors, go, context }: { sectors: ManualSector[]; go: Go; context?: MasterPlanContext }) {
  return <div className="sector-directory">{sectors.map((sector) => {
    const visual = sectorVisuals[sector.id];
    const theme = { "--sector-accent": visual.accent, "--sector-soft": visual.soft } as CSSProperties;
    return <button key={sector.id} type="button" style={theme} onClick={() => go("setor", sector.id)} className="sector-directory-item">
      <span className="sector-directory-image"><img className="sector-directory-cover" src={sectorCoverPath(sector.id) ?? visual.image} alt="" loading="lazy" decoding="async" /><img className="sector-directory-sticker" src={sectorStickerPath(sector.id)} alt="" loading="lazy" decoding="async" /></span>
      <span className="sector-directory-copy"><small>{sector.id} · {visual.concept}</small><strong>{sector.name}</strong><span>{manualCatalog.areas.filter((area) => area.sectorId === sector.id).length} áreas · {essentialFunctionsForSector(sector.id).length} funções essenciais · {operationalUnitsForSector(sector.id, context?.units ?? []).length ? "com registros operacionais" : "sem correspondência operacional"}</span></span>
      <ArrowRight size={18} aria-hidden="true" />
    </button>;
  })}</div>;
}

function NucleiPage({ go, context, tab, operationContent }: Props) {
  return <><Heading eyebrow="Manual Digital / Estrutura" title="Núcleos da Ramos Engenharia" description="Missões, setores e frentes de atuação da estrutura organizacional." /><Tabs current={tab === "cadastro" ? "cadastro" : "visao"} onChange={(next) => go("nucleos", undefined, next)} items={[{ id: "visao", label: "Estrutura institucional" }, { id: "cadastro", label: "Cadastro operacional" }]} />{tab === "cadastro" ? operationContent : <div className="space-y-8">{manualCatalog.nuclei.map((nucleus) => {
    const sectors = manualCatalog.sectors.filter((sector) => sector.nucleusId === nucleus.id);
    const routeId = nucleusRouteId(nucleus.id)!;
    const design = organizationMap.find((item) => item.routeId === routeId);
    return <section key={nucleus.id} className="border-t-4 border-teal-700 pt-5"><div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]"><div className="nucleus-visual" style={{ "--nucleus-tone": design?.tone ?? "#176f68" } as CSSProperties}><img src={nucleusCoverPath(routeId)} alt="" className="nucleus-visual-cover" /><img src={nucleusStickerPath(nucleus.id)} alt={`Figurinha do ${nucleus.name}`} className="nucleus-visual-sticker" /></div><div><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => go("nucleo", routeId)} className="text-left text-lg font-semibold text-[#18302c] hover:text-teal-800 hover:underline">{nucleus.name}</button><Status value={nucleus.classification} /></div><p className="mt-2 text-sm leading-relaxed text-zinc-700">{nucleus.content["Descrição institucional (resumo)"]}</p><p className="mt-2 text-xs text-zinc-600">{sectors.length} setores · {manualCatalog.competencies.filter((item) => item.nucleusId === nucleus.id).length} competências relacionadas</p></div></div><div className="mt-4 grid gap-x-6 sm:grid-cols-2">{sectors.map((sector) => <LinkRow key={sector.id} title={sector.name} image={sectorStickerPath(sector.id)} onClick={() => go("setor", sector.id)} />)}</div></section>;
  })}</div>}</>;
}

function NucleusPage({ id, tab, go, context, officialCapabilityCodes, officialCompetencyIds, operationContent }: Props) {
  const nucleus = manualCatalog.nuclei.find((item) => item.id === nucleusCatalogId(id));
  if (!nucleus) return <p role="alert">Núcleo não encontrado.</p>;
  const routeId = nucleusRouteId(id)!;
  const sectors = manualCatalog.sectors.filter((item) => item.nucleusId === nucleus.id);
  const competencies = manualCatalog.competencies.filter((item) => item.nucleusId === nucleus.id);
  const currentTab = ["visao", "setores", "competencias", "cadastro"].includes(tab) ? tab : "visao";
  return <><Heading eyebrow="Manual Digital / Núcleo" title={nucleus.name} description={nucleus.content["Descrição institucional (resumo)"]} right={<Status value={nucleus.classification} />} /><Tabs current={currentTab} onChange={(next) => go("nucleo", routeId, next)} items={[{ id: "visao", label: "Visão geral" }, { id: "setores", label: `Setores (${sectors.length})` }, { id: "competencias", label: `Competências (${competencies.length})` }, { id: "cadastro", label: "Gestão atual" }]} />{currentTab === "cadastro" ? operationContent : currentTab === "setores" ? <SectorDirectory sectors={sectors} go={go} context={context} /> : currentTab === "competencias" ? <CompetencyList items={competencies} go={go} officialIds={new Set(officialCompetencyIds)} officialCodes={new Set(officialCapabilityCodes)} /> : <><div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]"><div className="nucleus-visual"><img src={nucleusCoverPath(routeId)} alt="" className="nucleus-visual-cover" /><img src={nucleusStickerPath(nucleus.id)} alt="" className="nucleus-visual-sticker" /></div><div className="grid gap-4 sm:grid-cols-2"><TextField item={nucleus} field="Missão" /><TextField item={nucleus} field="Finalidade na Ramos Engenharia" /></div></div><Section title="Atuação e resultados"><div className="grid gap-5 md:grid-cols-2"><TextField item={nucleus} field="Escopo de atuação" /><TextField item={nucleus} field="Principais processos e áreas de responsabilidade" /><TextField item={nucleus} field="Responsabilidades estratégicas" /><TextField item={nucleus} field="Resultados organizacionais" /><TextField item={nucleus} field="Interfaces e dependências com outros núcleos" /></div></Section><Section title="Gestão e desenvolvimento"><div className="grid gap-5 md:grid-cols-2"><TextField item={nucleus} field="Funções de coordenação e gestão" /><TextField item={nucleus} field="Responsabilidades de gestão do núcleo" /><TextField item={nucleus} field="Possibilidades de atuação" /><TextField item={nucleus} field="Áreas de especialização" /><TextField item={nucleus} field="Relação com a Jornada do Colaborador" /></div></Section><Section title="Setores" aside={<span className="text-xs text-zinc-600">{sectors.length} integrantes</span>}><SectorDirectory sectors={sectors} go={go} context={context} /></Section></>}</>;
}

function SectorsPage({ go, context }: Props) {
  const [search, setSearch] = useState("");
  const [nucleusId, setNucleusId] = useState("all");
  const list = manualCatalog.sectors.filter((sector) => (nucleusId === "all" || sector.nucleusId === nucleusId) && normalizeManualName(`${sector.name} ${sector.content["Missão"]}`).includes(normalizeManualName(search)));
  return <><Heading eyebrow="Manual Digital / Estrutura" title="Setores" description="Onze setores organizados por núcleo, com suas áreas, funções e requisitos profissionais." /><div className="mb-4 flex flex-wrap gap-3"><SearchBox value={search} onChange={setSearch} placeholder="Buscar setor ou missão" /><select aria-label="Filtrar por núcleo" value={nucleusId} onChange={(event) => setNucleusId(event.target.value)} className="h-9 max-w-full border bg-white px-3 text-sm"><option value="all">Todos os núcleos</option>{manualCatalog.nuclei.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>{manualCatalog.nuclei.filter((item) => nucleusId === "all" || nucleusId === item.id).map((nucleus) => { const sectors = list.filter((item) => item.nucleusId === nucleus.id); return sectors.length ? <Section key={nucleus.id} title={nucleus.name} aside={<button type="button" onClick={() => go("nucleo", nucleusRouteId(nucleus.id))} className="text-xs font-semibold text-teal-800 hover:underline">Abrir núcleo <ArrowRight className="inline h-3.5 w-3.5" /></button>}><SectorDirectory sectors={sectors} go={go} context={context} /></Section> : null; })}{list.length === 0 && <p className="py-6 text-sm text-zinc-600">Nenhum setor encontrado.</p>}</>;
}

function FunctionList({ items, go, sectorId }: { items: ManualFunction[]; go: Go; sectorId: string }) {
  const [search, setSearch] = useState("");
  const filtered = items.filter((item) => normalizeManualName(`${item.name} ${item.content["Objetivo da função"]}`).includes(normalizeManualName(search)));
  return <><p className="mb-3 text-xs text-zinc-600">Funções essenciais do {manualCatalog.sectors.find((item) => item.id === sectorId)?.name}. Não representam cargos ocupados ou atribuições pessoais.</p><SearchBox value={search} onChange={setSearch} placeholder="Buscar função" /><div className="mt-3 divide-y border-y">{filtered.map((item) => <LinkRow key={item.id} title={item.name} meta={item.content["Objetivo da função"]} image={functionStickerPath(item.id)} onClick={() => go("funcao", item.id)} trailing={<Status value={item.classification} />} />)}{!filtered.length && <p className="py-4 text-sm text-zinc-600">Nenhuma função encontrada neste setor.</p>}</div></>;
}

function SectorStructureOverview({ functions, competencies, go, officialIds }: { functions: ManualFunction[]; competencies: ManualCompetency[]; go: Go; officialIds: Set<string> }) {
  return <section className="sector-structure-overview" aria-label="Funções e competências do setor">
    <div className="sector-structure-panel"><div className="sector-structure-heading"><div><p>Estrutura profissional</p><h2>Funções essenciais</h2></div><span>{functions.length}</span></div><div className="sector-structure-list">{functions.map((item) => <LinkRow key={item.id} title={item.name} image={functionStickerPath(item.id)} onClick={() => go("funcao", item.id)} />)}</div></div>
    <div className="sector-structure-panel"><div className="sector-structure-heading"><div><p>Capacidades em atuação</p><h2>Competências relacionadas</h2></div><span>{competencies.length}</span></div><div className="sector-structure-list">{competencies.map((item) => <LinkRow key={item.id} title={item.name} meta={item.id} image={competencyStickerPath(item.id)} onClick={() => item.origin === "Nova" ? go("competencia-manual", item.id) : item.officialSourceId && officialIds.has(item.officialSourceId) ? go("responsabilidade", item.officialSourceId) : go("setor", item.sectorId, "competencias")} />)}</div></div>
  </section>;
}

function SectorHero({ sector, nucleusName, go }: { sector: ManualSector; nucleusName: string; go: Go }) {
  const visual = sectorVisuals[sector.id];
  const Icon = visual.icon;
  const nucleusRoute = nucleusRouteId(sector.nucleusId)!;
  return <>
    <nav aria-label="Localização do setor" className="sector-breadcrumb">
      <span>Universo Ramos</span><span aria-hidden="true">/</span>
      <button type="button" onClick={() => go("nucleo", nucleusRoute)}>{nucleusName}</button><span aria-hidden="true">/</span><span>{sector.name}</span>
    </nav>
    <header className="sector-hero">
      <div className="sector-hero-copy">
        <div className="sector-identity-line">
          <span className="sector-nucleus-stamp"><img src={nucleusStickerPath(sector.nucleusId)} alt={`Símbolo do ${nucleusName}`} /></span>
          <span className="sector-code">{sector.id}</span><Status value={sector.classification} /><span className="sector-review-tag">Textos em validação</span>
        </div>
        <div className="sector-concept"><Icon size={18} strokeWidth={1.9} aria-hidden="true" /><span>{visual.concept}</span></div>
        <h1>{sector.name}</h1>
        <p>{sector.content["Apresentação (resumo)"]}</p>
      </div>
      <div className="sector-hero-art"><img className="sector-hero-cover" src={sectorCoverPath(sector.id) ?? visual.image} alt={visual.imageAlt} loading="eager" decoding="async" /><img className="sector-hero-sticker" src={sectorStickerPath(sector.id)} alt={`Figurinha do ${sector.name}`} loading="eager" decoding="async" /></div>
    </header>
  </>;
}

function sectorAssignedPeople(sectorId: string, context?: MasterPlanContext) {
  const unitIds = new Set(operationalUnitsForSector(sectorId, context?.units ?? []).map((item) => item.id));
  const mapped = unitIds.size > 0;
  const openTasks = (context?.tasks ?? []).filter((task) => unitIds.has(task.client_id) && !task.completed);
  const assignedIds = new Set(openTasks.flatMap((task) => task.assigned_to));
  const people = (context?.collaborators ?? []).filter((person) => person.is_active && assignedIds.has(person.id));
  return { mapped, people };
}

function SectorQuickFacts({ sectorId, context, functionCount, capabilityCount, competencyCount, go }: { sectorId: string; context?: MasterPlanContext; functionCount: number; capabilityCount: number; competencyCount: number; go: Go }) {
  const { mapped, people } = sectorAssignedPeople(sectorId, context);
  const facts = [
    { label: "Funções", value: String(functionCount), detail: "essenciais do setor", icon: BriefcaseBusiness, tab: "funcoes" },
    { label: "Capacidades", value: String(capabilityCount), detail: "exigidas nas competências", icon: BookOpen, tab: "capacidades" },
    { label: "Competências", value: String(competencyCount), detail: "relacionadas ao setor", icon: ShieldCheck, tab: "competencias" },
    { label: "Pessoas em tarefas", value: mapped ? String(people.length) : "—", detail: mapped ? "com atribuição ativa" : "sem vínculo operacional", icon: UsersRound, tab: "pessoas" },
  ];
  return <section className="sector-facts" aria-label="Leitura rápida do setor">{facts.map(({ label, value, detail, icon: Icon, tab }) => <button type="button" key={label} onClick={() => go("setor", sectorId, tab)} className="sector-fact" aria-label={`Abrir ${label.toLocaleLowerCase("pt-BR")} do setor`}><Icon size={20} strokeWidth={1.9} aria-hidden="true" /><span className="sector-fact-content"><span className="sector-fact-label">{label}</span><strong>{value}</strong><small>{detail}</small></span><ArrowRight className="sector-fact-arrow" size={15} aria-hidden="true" /></button>)}</section>;
}

function SectorOutputs({ sector }: { sector: ManualSector }) {
  const outputs = sector.content["Entregas esperadas"].split(";").map((item) => item.trim().replace(/\.$/, "")).filter(Boolean).slice(0, 5);
  const icons = [FileCheck2, ClipboardCheck, Layers3, CheckCircle2, BookOpen];
  return <Section title="O que o setor entrega"><div className="sector-outputs">{outputs.map((output, index) => { const Icon = icons[index]; return <div key={output} className="sector-output"><Icon size={24} strokeWidth={1.9} aria-hidden="true" /><p>{output}</p></div>; })}</div></Section>;
}

function SectorFlow({ sectorId }: { sectorId: string }) {
  const visual = sectorVisuals[sectorId];
  const stages = ["Entrada", "Tratamento", "Entrega", "Interface"];
  return <Section title="Como o trabalho flui"><div className="sector-flow" aria-label="Fluxo do trabalho">{visual.flow.map((description, index) => <div key={stages[index]} className="sector-flow-step"><span>{String(index + 1).padStart(2, "0")} · {stages[index]}</span><strong>{description}</strong>{index < 3 && <ArrowRight size={18} aria-hidden="true" />}</div>)}</div></Section>;
}

function SectorInterfaces({ sector, go }: { sector: ManualSector; go: Go }) {
  const links = sectorVisuals[sector.id].interfaces;
  return <Section title="Rede de interfaces" aside={<span className="text-xs text-zinc-600">{links.length} setores relacionados</span>}>
    <p className="mb-4 max-w-4xl text-sm leading-relaxed text-zinc-600">{sector.content["Interfaces com outros setores"]}</p>
    <div className="sector-network"><div className="sector-network-hub"><Network size={20} aria-hidden="true" /><strong>{sector.name}</strong></div><div className="sector-network-links">{links.map((link) => { const target = manualCatalog.sectors.find((item) => item.id === link.id); return target && <button key={link.id} type="button" onClick={() => go("setor", link.id)}><span><strong>{target.name}</strong><small>{link.label}</small></span><ArrowRight size={16} aria-hidden="true" /></button>; })}</div></div>
  </Section>;
}

function SectorCapabilities({ competencies, go, officialCodes, certifiedLevels }: { competencies: ManualCompetency[]; go: Go; officialCodes: Set<string>; certifiedLevels?: Record<string, number> | null }) {
  const requiredLevels = new Map<string, 1 | 2 | 3>();
  for (const competency of competencies) {
    for (const requirement of competency.requirements) {
      if (requirement.level > (requiredLevels.get(requirement.code) ?? 0)) requiredLevels.set(requirement.code, requirement.level);
    }
  }
  const capabilities = [...requiredLevels.keys()].map((code) => manualCatalog.capabilities.find((item) => item.code === code)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  return <><p className="mb-4 text-sm text-zinc-600">Cada insígnia mostra o maior nível exigido pelas competências deste setor. A marca indica que o perfil já atende ao requisito. Propostas não geram certificação nem pontos na jornada.</p><div className="sector-capability-grid">{capabilities.map((item) => {
    const isProposal = item.origin === "Nova";
    const canOpen = isProposal || officialCodes.has(item.code);
    const level = certifiedLevels?.[item.code] ?? 0;
    const pending = isProposal || certifiedLevels == null || level === 0;
    const requiredLevel = requiredLevels.get(item.code)!;
    const requirementMet = !isProposal && certifiedLevels != null && level >= requiredLevel;
    return <button key={item.code} type="button" disabled={!canOpen} onClick={() => go(isProposal ? "capacidade-manual" : "capacidade", item.code)} className={`sector-capability ${pending ? "sector-capability-pending" : ""}`}>
      <span className="sector-capability-image">{hasCapabilityPoster(item.code) ? <img className="sector-capability-poster" src={`/capability-stickers/posters/${item.code}.png`} alt="" loading="lazy" decoding="async" /> : capabilityCoverPath(item.code) ? <img className="sector-capability-poster" src={capabilityCoverPath(item.code)} alt="" loading="lazy" decoding="async" /> : <BookOpen size={34} aria-hidden="true" />}<span className={`sector-required-insignia ${requirementMet ? "sector-required-insignia-met" : ""}`} title={`Nível exigido: ${levelNames[requiredLevel]}${requirementMet ? " — atendido" : " — pendente"}`} aria-label={`Nível exigido: ${levelNames[requiredLevel]}${requirementMet ? ", atendido" : ", pendente"}`}><img src={capabilityLevelInsignia[requiredLevel]} alt="" loading="lazy" decoding="async" />{requirementMet && <CheckCircle2 aria-hidden="true" />}</span></span>
      <span className="sector-capability-copy"><small>{item.code} · {item.nature}{isProposal ? " · Proposta" : ""}</small><strong>{item.name}</strong><span className="sector-capability-required">Exige {levelNames[requiredLevel]}</span><span className="sector-capability-state">{isProposal ? "Ainda não certificável" : certifiedLevels == null ? "Certificação não disponível" : level > 0 ? `Conquistada · ${levelNames[level as 1 | 2 | 3]}` : "Ainda não conquistada"}</span></span>{canOpen && <ArrowRight size={16} aria-hidden="true" />}
    </button>;
  })}</div></>;
}

function SectorPage({ id, tab, go, context, officialCapabilityCodes, officialCompetencyIds, certifiedLevels }: Props) {
  const sector = manualCatalog.sectors.find((item) => item.id === id);
  if (!sector) return <p role="alert">Setor não encontrado no manual.</p>;
  const nucleus = manualCatalog.nuclei.find((item) => item.id === sector.nucleusId);
  const areas = manualCatalog.areas.filter((item) => item.sectorId === id);
  const functions = essentialFunctionsForSector(id);
  const competencies = linkedCompetenciesForSector(id);
  const operational = operationalUnitsForSector(id, context?.units ?? []);
  const { mapped: hasPeopleMapping, people: assignedPeople } = sectorAssignedPeople(id, context);
  const capabilityCount = new Set(competencies.flatMap((item) => item.requirements.map((requirement) => requirement.code))).size;
  const currentTab = ["visao", "funcoes", "competencias", "capacidades", "pessoas", "operacao"].includes(tab) ? tab : "visao";
  const activityFields = ["Escopo", "Limites de atuação", "Principais atividades", "Processos sob responsabilidade", "Entregas esperadas", "Resultados que o setor garante", "Interfaces com outros setores"];
  const developmentFields = ["Gestão — competências que o gestor demonstra pessoalmente", "Gestão — competências que precisam existir na equipe", "Gestão — resultados que o gestor assegura", "Crescimento — atuação técnica inicial", "Crescimento — autonomia e especialização", "Crescimento — responsabilidades adicionais, coordenação e gestão"];
  const theme = { "--sector-accent": sectorVisuals[id].accent, "--sector-soft": sectorVisuals[id].soft } as CSSProperties;
  return <div className="sector-page" style={theme}>
    <SectorHero sector={sector} nucleusName={nucleus?.name ?? "Núcleo"} go={go} />
    <SectorQuickFacts sectorId={id} context={context} functionCount={functions.length} capabilityCount={capabilityCount} competencyCount={competencies.length} go={go} />
    <Tabs className="sector-tabs" current={currentTab} onChange={(next) => go("setor", id, next)} items={[{ id: "visao", label: "Visão geral" }, { id: "funcoes", label: `Funções (${functions.length})` }, { id: "competencias", label: `Competências (${competencies.length})` }, { id: "capacidades", label: `Capacidades (${capabilityCount})` }, { id: "pessoas", label: "Pessoas" }, { id: "operacao", label: "Registros atuais" }]} />
    {currentTab === "funcoes" ? <FunctionList items={functions} go={go} sectorId={id} />
      : currentTab === "competencias" ? <>{certifiedLevels == null && <p className="mb-3 text-xs text-zinc-600">Selecione um perfil com certificações carregadas para ver quais requisitos já foram conquistados.</p>}<CompetencyList items={competencies} go={go} officialIds={new Set(officialCompetencyIds)} officialCodes={new Set(officialCapabilityCodes)} certifiedLevels={certifiedLevels} /></>
      : currentTab === "capacidades" ? <>{certifiedLevels == null && <p className="mb-3 text-xs text-zinc-600">Selecione um perfil com certificações carregadas para ver quais capacidades já foram conquistadas.</p>}<SectorCapabilities competencies={competencies} go={go} officialCodes={new Set(officialCapabilityCodes)} certifiedLevels={certifiedLevels} /></>
      : currentTab === "pessoas" ? <Section title="Pessoas em tarefas">{hasPeopleMapping ? assignedPeople.length ? <div className="divide-y border-y">{assignedPeople.map((person) => <LinkRow key={person.id} title={person.name} meta="Com atribuição em tarefa aberta deste setor" onClick={() => go("pessoa", person.id)} />)}</div> : <p className="text-sm text-zinc-600">Nenhuma pessoa com tarefa aberta vinculada a este setor.</p> : <p className="text-sm text-zinc-600">Sem correspondência operacional segura para identificar pessoas deste setor.</p>}</Section>
      : currentTab === "operacao" ? <Section title="Cadastros operacionais relacionados">{operational.length ? <div className="divide-y border-y">{operational.map((unit) => <LinkRow key={unit.id} title={unit.name} meta="Abrir tarefas, solicitações e histórico do cadastro atual" onClick={() => go("setor", unit.id)} />)}</div> : <p className="text-sm text-zinc-600">Nenhum cadastro operacional foi associado com segurança a este setor.</p>}</Section>
      : <>
        <div className="sector-mission"><TextField item={sector} field="Missão" /><TextField item={sector} field="Justificativa de existência" /></div>
        <SectorStructureOverview functions={functions} competencies={competencies} go={go} officialIds={new Set(officialCompetencyIds)} />
        <SectorOutputs sector={sector} />
        <SectorFlow sectorId={id} />
        <Section title="Atuação e resultados"><div className="grid gap-5 md:grid-cols-2">{activityFields.filter((field) => field !== "Entregas esperadas" && field !== "Interfaces com outros setores").map((field) => <TextField key={field} item={sector} field={field} />)}</div></Section>
        <Section title="Gestão e desenvolvimento"><div className="grid gap-5 md:grid-cols-2">{developmentFields.map((field) => <TextField key={field} item={sector} field={field} />)}</div></Section>
        <Section title="Áreas"><div className="grid gap-2 sm:grid-cols-2">{areas.map((area) => <div key={area.id} className="border-l-2 border-teal-500 px-3 py-2 text-sm"><strong>{area.name}</strong><p className="mt-1 text-xs text-zinc-600">{area.content["Descrição"]}</p></div>)}</div></Section>
        <SectorInterfaces sector={sector} go={go} />
      </>}
  </div>;
}

function FunctionPage({ id, go, officialCapabilityCodes, officialCompetencyIds }: Props) {
  const item = manualCatalog.functions.find((candidate) => candidate.id === id);
  if (!item) return <p role="alert">Função não encontrada.</p>;
  const sectorIds = essentialSectorIdsForFunction(id);
  const competencyIds = [...item.content["Competências requeridas (IDs)"].matchAll(/COMP-\d{3}/g)].map((match) => match[0]);
  const competencies = manualCatalog.competencies.filter((candidate) => competencyIds.includes(candidate.id));
  return <><Heading eyebrow={`Manual Digital / Função ${item.id}`} title={item.name} description={item.content["Objetivo da função"]} right={<span className="function-heading-art"><img src={functionStickerPath(id)} alt={`Figurinha de ${item.name}`} /><Status value={item.classification} /></span>} /><Section title="Setores onde é essencial">{sectorIds.length ? <div className="grid gap-x-6 sm:grid-cols-2">{sectorIds.map((sectorId) => { const sector = manualCatalog.sectors.find((candidate) => candidate.id === sectorId); return sector && <LinkRow key={sectorId} title={sector.name} onClick={() => go("setor", sectorId)} />; })}</div> : <p className="text-sm text-zinc-600">Esta função não integra a lista de funções essenciais por setor.</p>}</Section><Section title="Escopo da função"><div className="grid gap-5 md:grid-cols-2"><TextField item={item} field="Justificativa da necessidade" /><TextField item={item} field="Escopo de atuação" /><TextField item={item} field="Principais atribuições" /><TextField item={item} field="Grau de autonomia" /><TextField item={item} field="Criticidade" /><TextField item={item} field="Relação com outras funções" /></div></Section><Section title="Competências requeridas"><CompetencyList items={competencies} go={go} officialIds={new Set(officialCompetencyIds)} officialCodes={new Set(officialCapabilityCodes)} /></Section></>;
}

function ProposalCompetencyPage({ id, go, officialCapabilityCodes }: Props) {
  const item = manualCatalog.competencies.find((candidate) => candidate.id === id && candidate.origin === "Nova");
  if (!item) return <p role="alert">Competência proposta não encontrada.</p>;
  const sector = manualCatalog.sectors.find((candidate) => candidate.id === item.sectorId);
  return <><Heading eyebrow={`Manual Digital / Competência ${item.id}`} title={item.name} description={item.content["Objetivo da competência"]} right={<span className="function-heading-art"><img src={competencyStickerPath(item.id)} alt={`Figurinha da competência ${item.name}`} /><Status value={item.classification} /></span>} /><div className="grid gap-4 border-y py-4 sm:grid-cols-3"><div><p className="text-xs text-zinc-500">Núcleo</p><p className="text-sm font-semibold">{manualCatalog.nuclei.find((candidate) => candidate.id === item.nucleusId)?.name}</p></div><div><p className="text-xs text-zinc-500">Capacidades exigidas</p><p className="text-sm font-semibold">{item.requirements.length}</p></div><div><p className="text-xs text-zinc-500">Pontos mínimos da composição</p><p className="text-sm font-semibold">{item.content["Pontos mínimos"]}</p></div></div><Section title="Setor relacionado">{sector && <LinkRow title={sector.name} image={sectorStickerPath(sector.id)} onClick={() => go("setor", sector.id)} />}</Section><Section title="Capacidades e níveis exigidos"><div className="grid gap-x-6 sm:grid-cols-2">{item.requirements.map((requirement) => <CapabilityRequirement key={requirement.code} code={requirement.code} level={requirement.level} go={go} officialCodes={new Set(officialCapabilityCodes)} />)}</div></Section><p className="mt-6 text-xs text-zinc-500">Fonte: {item.source}</p></>;
}

function ProposalCapabilityPage({ id, go }: Props) {
  const item = manualCatalog.capabilities.find((candidate) => candidate.code === id && candidate.origin === "Nova");
  if (!item) return <p role="alert">Capacidade proposta não encontrada.</p>;
  const related = manualCatalog.competencies.filter((candidate) => candidate.requirements.some((requirement) => requirement.code === id));
  const fields = ["Descrição detalhada do nível", "O que se espera na prática", "Autonomia e decisões esperadas", "Resultados/comportamentos observáveis", "Limites do nível", "Diferença em relação ao nível anterior"];
  return <><Heading eyebrow={`Manual Digital / Capacidade ${item.code}`} title={item.name} description={item.nature} right={<Status value="Proposta para validação" />} /><div className="grid gap-5 lg:grid-cols-3">{item.levels.map((level) => <section key={level.level} className="border-t-4 border-teal-700 bg-white px-4 py-5"><p className="text-xs font-semibold uppercase text-teal-700">Nível {level.level}</p><h2 className="mt-1 text-lg font-semibold text-[#18302c]">{level.name}</h2><div className="mt-4 space-y-5">{fields.map((field) => level.content[field] ? <div key={field}><h3 className="mb-1 text-xs font-semibold text-zinc-500">{field}</h3><p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700">{level.content[field]}</p></div> : null)}</div></section>)}</div><Section title="Competências relacionadas"><div className="grid gap-x-6 sm:grid-cols-2">{related.map((competency) => <LinkRow key={competency.id} title={competency.name} meta={competency.origin === "Nova" ? "Proposta para validação" : "Competência oficial"} onClick={() => go(competency.origin === "Nova" ? "competencia-manual" : "setor", competency.origin === "Nova" ? competency.id : competency.sectorId, competency.origin === "Nova" ? undefined : "competencias")} />)}</div></Section><p className="mt-6 text-xs text-zinc-500">{item.levels[0]?.content["Responsabilidades usadas como referência"]}</p></>;
}

export function ManualDigital(props: Props) {
  if (props.view === "nucleos") return <NucleiPage {...props} />;
  if (props.view === "nucleo") return <NucleusPage {...props} />;
  if (props.view === "setores") return <SectorsPage {...props} />;
  if (props.view === "setor") return <SectorPage {...props} />;
  if (props.view === "funcao") return <FunctionPage {...props} />;
  if (props.view === "competencia-manual") return <ProposalCompetencyPage {...props} />;
  return <ProposalCapabilityPage {...props} />;
}

export function ManualSectorLink({ unit, go }: { unit: Unit; go: Go }) {
  const sectorId = institutionalSectorId(unit);
  if (!sectorId) return null;
  const sector = manualCatalog.sectors.find((item) => item.id === sectorId);
  if (!sector) return null;
  return <button type="button" onClick={() => go("setor", sectorId)} className="mb-4 inline-flex items-center gap-2 border border-teal-300 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-900 hover:bg-teal-100"><Layers3 className="h-4 w-4" />Ver ficha institucional: {sector.name}<ArrowRight className="h-3.5 w-3.5" /></button>;
}
