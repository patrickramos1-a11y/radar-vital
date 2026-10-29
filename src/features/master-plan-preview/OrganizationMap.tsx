import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Layers3, RotateCcw } from "lucide-react";
import { capabilityLevelInsignia, capabilityLevelNames } from "./capabilityJourney";
import { capabilityStickerPath } from "./CapabilityVisualIdentity";
import { hasCapabilityPoster } from "./capabilityVisuals";
import { nucleoTecnicoCareerLadder, type CareerStepId } from "./careerLadder";
import { competencyStickerPath } from "./competencyVisualAssets";
import { manualCatalog, type ManualCompetency } from "./manualDigitalModel";
import { organizationMap, type OrganizationFunction, type OrganizationNucleus, type OrganizationSector } from "./organizationMapModel";
import "./organizationMap.css";

type Destination = "nucleo" | "setor" | "funcao" | "competencia-manual" | "responsabilidade" | "capacidade" | "capacidade-manual";
type Go = (view: Destination, id?: string, tab?: string) => void;
type ScopeStepId = "current" | CareerStepId;
type CoverageStatus = "complete" | "partial" | "empty";
interface Props { go: Go; officialCompetencyIds: string[]; certifiedLevels?: Record<string, number> | null }

const allFunctions = organizationMap.flatMap((nucleus) => nucleus.sectors.flatMap((sector) => sector.functions));
const functionById = new Map(allFunctions.map((item) => [item.item.id, item]));

function toggle(items: string[], id: string) { return items.includes(id) ? items.filter((item) => item !== id) : [...items, id]; }
function without(items: string[], removed: Iterable<string>) {
  const removedIds = new Set(removed);
  return items.filter((item) => !removedIds.has(item));
}
function selectedFirst<T>(items: T[], ids: string[], key: (item: T) => string): T[] {
  return [...items].sort((a, b) => {
    const ai = ids.indexOf(key(a));
    const bi = ids.indexOf(key(b));
    if (ai < 0 && bi < 0) return 0;
    if (ai < 0) return 1;
    if (bi < 0) return -1;
    return ai - bi;
  });
}
function isEarned(item: ManualCompetency, levels?: Record<string, number> | null) {
  return item.origin === "Original" && !!levels && item.requirements.length > 0 && item.requirements.every((entry) => (levels[entry.code] ?? 0) >= entry.level);
}
function simulatedLevelsFor(stepId: CareerStepId): Record<string, number> {
  const stepIndex = nucleoTecnicoCareerLadder.steps.findIndex((step) => step.id === stepId);
  const levels: Record<string, number> = {};
  nucleoTecnicoCareerLadder.steps.slice(0, stepIndex + 1).forEach((step) => step.capabilityRequirements.forEach((requirement) => {
    levels[requirement.capabilityCode] = Math.max(levels[requirement.capabilityCode] ?? 0, requirement.minimumLevel);
  }));
  return levels;
}
function competencyCovered(item: ManualCompetency, levels: Record<string, number> | null | undefined, officialIds: Set<string>) {
  return isEarned(item, levels) && officialIds.has(item.officialSourceId);
}
function functionCoverage(item: OrganizationFunction, levels: Record<string, number> | null | undefined, officialIds: Set<string>): CoverageStatus {
  const official = item.competencies.filter((competency) => competency.origin === "Original" && officialIds.has(competency.officialSourceId));
  if (!official.length) return "empty";
  const covered = official.filter((competency) => competencyCovered(competency, levels, officialIds)).length;
  return covered === official.length ? "complete" : covered > 0 ? "partial" : "empty";
}
function sectorCoverage(item: OrganizationSector, levels: Record<string, number> | null | undefined, officialIds: Set<string>): CoverageStatus {
  const statuses = item.functions.map((entry) => functionCoverage(entry, levels, officialIds));
  return statuses.length > 0 && statuses.every((status) => status === "complete") ? "complete" : statuses.some((status) => status !== "empty") ? "partial" : "empty";
}
function nucleusCoverage(item: OrganizationNucleus, levels: Record<string, number> | null | undefined, officialIds: Set<string>): CoverageStatus {
  const statuses = item.sectors.map((entry) => sectorCoverage(entry, levels, officialIds));
  return statuses.length > 0 && statuses.every((status) => status === "complete") ? "complete" : statuses.some((status) => status !== "empty") ? "partial" : "empty";
}

function activeOrganizationMap(levels: Record<string, number> | null | undefined, officialIds: Set<string>): OrganizationNucleus[] {
  return organizationMap.flatMap((nucleus) => {
    const sectors = nucleus.sectors.flatMap((sector) => {
      const functions = sector.functions.flatMap((item) => {
        const competencies = item.competencies.filter((competency) => competencyCovered(competency, levels, officialIds));
        return competencies.length ? [{ ...item, competencies }] : [];
      });
      return functions.length ? [{ ...sector, functions }] : [];
    });
    return sectors.length ? [{ ...nucleus, sectors }] : [];
  });
}

function Requirements({ item, go, levels }: { item: ManualCompetency; go: Go; levels?: Record<string, number> | null }) {
  return <div className="organization-map-requirements">
    <div className="organization-map-requirements-heading"><span><img src={competencyStickerPath(item.id)} alt="" loading="lazy" /><strong>{item.name}</strong></span><button type="button" onClick={() => item.origin === "Nova" ? go("competencia-manual", item.id) : item.officialSourceId && go("responsabilidade", item.officialSourceId)}>Abrir ficha <ArrowRight aria-hidden="true" /></button></div>
    <div className="organization-map-requirement-list">{item.requirements.map((requirement) => {
      const capability = manualCatalog.capabilities.find((entry) => entry.code === requirement.code);
      const attained = levels?.[requirement.code] ?? 0;
      const met = capability?.origin === "Original" && attained >= requirement.level;
      return <button type="button" key={requirement.code} className={`organization-map-requirement ${met ? "is-met" : "is-pending"}`} onClick={() => go(capability?.origin === "Nova" ? "capacidade-manual" : "capacidade", requirement.code)}>
        {hasCapabilityPoster(requirement.code) ? <img className={`organization-map-requirement-sticker ${attained ? "" : "is-unearned"}`} src={capabilityStickerPath(requirement.code)} alt="" loading="lazy" /> : <span className="organization-map-requirement-placeholder" aria-hidden="true" />}
        <span><strong>{capability?.name ?? requirement.code}</strong><small>{requirement.code} · exige {capabilityLevelNames[requirement.level]}</small>{attained > 0 && attained < requirement.level && <small>Atual: {capabilityLevelNames[attained as 1 | 2 | 3]}</small>}{capability?.origin === "Nova" && <small>Proposta, ainda não certificável</small>}</span>
        <span className={`organization-map-requirement-level ${met ? "is-met" : ""}`} title={`${capabilityLevelNames[requirement.level]} ${met ? "atendido" : "pendente"}`}><img src={capabilityLevelInsignia[requirement.level]} alt="" />{met && <CheckCircle2 aria-label="Atendido" />}</span>
      </button>;
    })}</div>
  </div>;
}

export function OrganizationMap({ go, officialCompetencyIds, certifiedLevels }: Props) {
  const [nucleusIds, setNucleusIds] = useState<string[]>([]);
  const [sectorIds, setSectorIds] = useState<string[]>([]);
  const [functionIds, setFunctionIds] = useState<string[]>([]);
  const [competencyIds, setCompetencyIds] = useState<string[]>([]);
  const [scopeStepId, setScopeStepId] = useState<ScopeStepId>("current");
  const officialIds = useMemo(() => new Set(officialCompetencyIds), [officialCompetencyIds]);
  const scopeStep = scopeStepId === "current" ? null : nucleoTecnicoCareerLadder.steps.find((step) => step.id === scopeStepId) ?? null;
  const effectiveLevels = useMemo(() => scopeStepId === "current" ? certifiedLevels : simulatedLevelsFor(scopeStepId), [certifiedLevels, scopeStepId]);
  const simulationActive = scopeStepId !== "current";
  const visibleOrganizationMap = useMemo(() => activeOrganizationMap(effectiveLevels, officialIds), [effectiveLevels, officialIds]);
  const visibleStructureKey = useMemo(() => visibleOrganizationMap.map((nucleus) => `${nucleus.id}:${nucleus.sectors.map((sector) => `${sector.item.id}:${sector.functions.map((item) => item.item.id).join(",")}`).join("|")}`).join(";"), [visibleOrganizationMap]);

  const scopeStats = useMemo(() => {
    const competencies = new Map<string, ManualCompetency>();
    allFunctions.forEach((item) => item.competencies.forEach((competency) => {
      if (competency.origin === "Original" && officialIds.has(competency.officialSourceId)) competencies.set(competency.id, competency);
    }));
    const coveredCompetencies = [...competencies.values()].filter((item) => competencyCovered(item, effectiveLevels, officialIds)).length;
    const activeFunctions = visibleOrganizationMap.flatMap((nucleus) => nucleus.sectors.flatMap((sector) => sector.functions)).length;
    const activeSectors = visibleOrganizationMap.flatMap((nucleus) => nucleus.sectors).length;
    return { coveredCompetencies, activeFunctions, activeSectors, activeNuclei: visibleOrganizationMap.length };
  }, [effectiveLevels, officialIds, visibleOrganizationMap]);

  useEffect(() => {
    setNucleusIds([]);
    setSectorIds([]);
    setFunctionIds([]);
    setCompetencyIds([]);
  }, [scopeStepId, visibleStructureKey]);

  const removeFunctions = (ids: Iterable<string>) => {
    const removedIds = new Set(ids);
    const remainingFunctions = without(functionIds, removedIds);
    const remainingCompetencies = new Set(remainingFunctions.flatMap((id) => functionById.get(id)?.competencies.map((item) => item.id) ?? []));
    setFunctionIds(remainingFunctions);
    setCompetencyIds((current) => current.filter((id) => remainingCompetencies.has(id)));
  };
  const openNucleus = (id: string) => {
    if (nucleusIds.includes(id)) {
      const nucleus = visibleOrganizationMap.find((item) => item.id === id);
      const closingSectors = nucleus?.sectors.map((sector) => sector.item.id) ?? [];
      const closingFunctions = nucleus?.sectors.flatMap((sector) => sector.functions.map((item) => item.item.id)) ?? [];
      setSectorIds((current) => without(current, closingSectors));
      removeFunctions(closingFunctions);
    }
    setNucleusIds((current) => toggle(current, id));
  };
  const openSector = (sector: OrganizationSector, nucleus: OrganizationNucleus) => {
    if (!nucleusIds.includes(nucleus.id)) setNucleusIds((current) => [...current, nucleus.id]);
    if (sectorIds.includes(sector.item.id)) removeFunctions(sector.functions.map((item) => item.item.id));
    setSectorIds((current) => toggle(current, sector.item.id));
  };
  const openFunction = (item: OrganizationFunction) => {
    if (functionIds.includes(item.item.id)) removeFunctions([item.item.id]);
    else setFunctionIds((current) => [...current, item.item.id]);
  };
  const openSectorCompetencies = (sector: OrganizationSector) => {
    const ids = sector.functions.map((item) => item.item.id);
    const allOpen = ids.every((id) => functionIds.includes(id));
    if (allOpen) removeFunctions(ids);
    else setFunctionIds((current) => [...current, ...ids.filter((id) => !current.includes(id))]);
  };
  const reset = () => { setNucleusIds([]); setSectorIds([]); setFunctionIds([]); setCompetencyIds([]); };

  return <div className={`organization-map ${simulationActive ? "is-simulating" : ""}`}>
    <section className="organization-map-scope" aria-label="Filtro de abrangência da jornada">
      <div className="organization-map-scope-control"><label htmlFor="organization-map-scope-step">Abrangência da jornada</label><select id="organization-map-scope-step" value={scopeStepId} onChange={(event) => setScopeStepId(event.target.value as ScopeStepId)}><option value="current">Perfil atual · usar certificações</option>{nucleoTecnicoCareerLadder.steps.map((step) => <option key={step.id} value={step.id}>{step.title}</option>)}</select><p>{scopeStep ? `${scopeStep.function} Simulação com ${scopeStep.capabilityTarget} pontos-alvo e abrangência de ${scopeStep.nucleiRequired} ${scopeStep.nucleiRequired === 1 ? "núcleo" : "núcleos"}.` : "Leitura real do perfil selecionado, conforme as capacidades já certificadas."}</p>{simulationActive && <span>Simulação: credenciais pessoais ignoradas</span>}</div>
      <div className="organization-map-scope-stats" aria-live="polite"><span><strong>{scopeStats.coveredCompetencies}</strong> competências ativas</span><span><strong>{scopeStats.activeFunctions}</strong> funções envolvidas</span><span><strong>{scopeStats.activeSectors}</strong> setores alcançados</span><span><strong>{scopeStats.activeNuclei}</strong> núcleos alcançados</span></div>
    </section>
    {visibleOrganizationMap.length > 0 && <nav className="organization-map-nuclei" aria-label="Núcleos ativos">{visibleOrganizationMap.map((nucleus) => <button type="button" key={nucleus.id} aria-pressed={nucleusIds.includes(nucleus.id)} onClick={() => openNucleus(nucleus.id)} style={{ "--org-tone": nucleus.tone, "--org-soft": nucleus.soft } as CSSProperties}><strong>{String(organizationMap.indexOf(organizationMap.find((item) => item.id === nucleus.id) ?? nucleus) + 1).padStart(2, "0")}</strong><span>{nucleus.label}<small>{nucleus.animal} · {nucleus.sectors.length} {nucleus.sectors.length === 1 ? "setor ativo" : "setores ativos"}</small></span><ChevronDown aria-hidden="true" /></button>)}</nav>}
    <div className="organization-map-tools"><span>{nucleusIds.length ? `${nucleusIds.length} ${nucleusIds.length === 1 ? "núcleo aberto" : "núcleos abertos"} · ${sectorIds.length} ${sectorIds.length === 1 ? "setor aberto" : "setores abertos"} · ${functionIds.length} ${functionIds.length === 1 ? "função aberta" : "funções abertas"}` : "Selecione um núcleo para explorar sua estrutura"}</span><button type="button" onClick={reset}><RotateCcw aria-hidden="true" /> Recolher tudo</button></div>
    <section className="organization-map-scroll" aria-label="Organograma interativo">{visibleOrganizationMap.length === 0 ? <div className="organization-map-empty"><strong>Nenhuma atuação encontrada neste perfil.</strong><span>Este perfil ainda não possui competências atendidas pelas capacidades e níveis exigidos no organograma.</span></div> : <div className={`organization-map-board ${competencyIds.length ? "has-capabilities" : functionIds.length ? "has-competencies" : ""}`}>{selectedFirst(visibleOrganizationMap, nucleusIds, (item) => item.id).map((nucleus) => {
      const nucleusOpen = nucleusIds.includes(nucleus.id);
      const nucleusDeep = nucleus.sectors.some((sector) => sector.functions.some(({ item }) => functionIds.includes(item.id)));
      const nucleusScope = simulationActive ? `is-scope-${nucleusCoverage(nucleus, effectiveLevels, officialIds)}` : "";
      return <article key={nucleus.id} className={`organization-map-lane ${nucleusOpen ? "is-open" : "is-compact"} ${nucleusDeep ? "is-deep" : ""} ${nucleusScope}`} style={{ "--org-tone": nucleus.tone } as CSSProperties}>
        <button type="button" className="organization-map-nucleus" aria-label={`${nucleusOpen ? "Recolher" : "Expandir"} ${nucleus.label}`} aria-expanded={nucleusOpen} onClick={() => openNucleus(nucleus.id)}>
          <img className="organization-map-nucleus-art" src={nucleus.image} alt="" loading="lazy" /><img className="organization-map-sticker" src={nucleus.sticker} alt="" loading="lazy" />
          <span className="organization-map-number">{String(organizationMap.findIndex((item) => item.id === nucleus.id) + 1).padStart(2, "0")}</span><span className="organization-map-nucleus-copy"><strong>{nucleus.label}</strong><small>{nucleus.animal}</small><span>{nucleus.summary}</span></span><ChevronDown className="organization-map-toggle" aria-hidden="true" />
        </button>
        {nucleusOpen && <div className="organization-map-sector-rows" aria-label={`Setores de ${nucleus.label}`}>{selectedFirst(nucleus.sectors, sectorIds, (item) => item.item.id).map((sector) => {
          const sectorOpen = sectorIds.includes(sector.item.id);
          const selectedFunctions = sector.functions.filter(({ item }) => functionIds.includes(item.id));
          const selectedCompetencies = [...new Map(selectedFunctions.flatMap((item) => item.competencies).filter((item) => competencyIds.includes(item.id)).map((item) => [item.id, item])).values()];
          const allFunctionsOpen = sector.functions.every(({ item }) => functionIds.includes(item.id));
          const sectorScope = simulationActive ? `is-scope-${sectorCoverage(sector, effectiveLevels, officialIds)}` : "";
          return <section key={sector.item.id} className={`organization-map-sector-row ${sectorOpen ? "is-open" : "is-compact"} ${selectedFunctions.length ? "is-deep" : ""} ${sectorScope}`} style={{ "--org-sector": sector.tone, "--org-sector-cover": `url("${sector.image}")` } as CSSProperties}>
            <button type="button" className="organization-map-sector" aria-expanded={sectorOpen} onClick={() => openSector(sector, nucleus)}><img src={sector.sticker} alt="" loading="lazy" /><span><small>{sector.functions.length} funções essenciais</small><strong>{sector.label}</strong></span><ChevronDown aria-hidden="true" /></button>
            {sectorOpen && <div className={`organization-map-functions ${selectedFunctions.length ? "is-deep" : ""}`} aria-label={`Funções de ${sector.label}`}><div className="organization-map-function-list"><button type="button" className="organization-map-sector-sheet" aria-label={`${allFunctionsOpen ? "Recolher" : "Abrir"} competências de ${sector.label}`} onClick={() => openSectorCompetencies(sector)}><Layers3 aria-hidden="true" /> {allFunctionsOpen ? "Recolher competências" : "Abrir competências"}</button>{sector.functions.map((item) => {
              const functionOpen = functionIds.includes(item.item.id);
              const functionScope = simulationActive ? `is-scope-${functionCoverage(item, effectiveLevels, officialIds)}` : "";
              return <div key={item.item.id} className={`organization-map-function ${functionOpen ? "is-open" : ""} ${functionScope}`}>
                <button type="button" className="organization-map-function-name" aria-expanded={functionOpen} onClick={() => openFunction(item)}><img src={item.image} alt="" loading="lazy" /><span>{item.item.name}</span><ChevronDown aria-hidden="true" /></button>
              </div>;
            })}</div>{selectedFunctions.length > 0 && <div className={`organization-map-competencies ${selectedCompetencies.length ? "is-deep" : ""}`} aria-label={`Competências selecionadas de ${sector.label}`}><div className="organization-map-competency-list">{selectedFunctions.map((selectedFunction) => <section key={selectedFunction.item.id} className="organization-map-competency-group"><div className="organization-map-competency-group-heading"><img src={selectedFunction.image} alt="" /><strong>{selectedFunction.item.name}</strong><span>{selectedFunction.competencies.length}</span></div>{selectedFunction.competencies.map((competency) => {
                  const available = competencyCovered(competency, effectiveLevels, officialIds);
                  const selected = competencyIds.includes(competency.id);
                  return <div key={competency.id} className={`organization-map-competency ${available ? "is-earned" : "is-pending"} ${selected ? "is-open" : ""}`}><button type="button" aria-expanded={selected} onClick={() => setCompetencyIds((current) => toggle(current, competency.id))}><img className="organization-map-competency-sticker" src={competencyStickerPath(competency.id)} alt="" loading="lazy" /><span>{competency.name}{competency.origin === "Nova" && <small>Proposta</small>}</span><ChevronDown aria-hidden="true" /></button></div>;
                })}</section>)}</div>{selectedCompetencies.length > 0 && <div className="organization-map-requirements-stack">{selectedCompetencies.map((item) => <Requirements key={item.id} item={item} go={go} levels={effectiveLevels} />)}</div>}</div>}</div>}
          </section>;
        })}</div>}
      </article>;
    })}</div>}</section>
  </div>;
}
