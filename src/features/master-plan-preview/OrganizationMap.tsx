import { useState, type CSSProperties } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, RotateCcw } from "lucide-react";
import { capabilityLevelInsignia, capabilityLevelNames } from "./capabilityJourney";
import { capabilityStickerPath } from "./CapabilityVisualIdentity";
import { hasCapabilityPoster } from "./capabilityVisuals";
import { manualCatalog, type ManualCompetency } from "./manualDigitalModel";
import { organizationMap, type OrganizationFunction, type OrganizationNucleus, type OrganizationSector } from "./organizationMapModel";
import "./organizationMap.css";

type Destination = "nucleo" | "setor" | "funcao" | "competencia-manual" | "responsabilidade" | "capacidade" | "capacidade-manual";
type Go = (view: Destination, id?: string, tab?: string) => void;
interface Props { go: Go; officialCompetencyIds: string[]; certifiedLevels?: Record<string, number> | null }

function toggle(items: string[], id: string) { return items.includes(id) ? items.filter((item) => item !== id) : [...items, id]; }
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

function Requirements({ item, go, levels }: { item: ManualCompetency; go: Go; levels?: Record<string, number> | null }) {
  return <div className="organization-map-requirements">
    <div className="organization-map-requirements-heading"><strong>{item.name}</strong><button type="button" onClick={() => item.origin === "Nova" ? go("competencia-manual", item.id) : item.officialSourceId && go("responsabilidade", item.officialSourceId)}>Abrir ficha <ArrowRight aria-hidden="true" /></button></div>
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
  const [functionId, setFunctionId] = useState<string | null>(null);
  const [competencyId, setCompetencyId] = useState<string | null>(null);
  const officialIds = new Set(officialCompetencyIds);
  const openNucleus = (id: string) => {
    const next = toggle(nucleusIds, id);
    setNucleusIds(next);
    setSectorIds((current) => current.filter((sectorId) => next.some((nucleusId) => organizationMap.find((entry) => entry.id === nucleusId)?.sectors.some((sector) => sector.item.id === sectorId))));
    setFunctionId(null);
    setCompetencyId(null);
  };
  const openSector = (sector: OrganizationSector, nucleus: OrganizationNucleus) => {
    if (!nucleusIds.includes(nucleus.id)) setNucleusIds((current) => [...current, nucleus.id]);
    setSectorIds((current) => toggle(current, sector.item.id));
    setFunctionId(null);
    setCompetencyId(null);
  };
  const openFunction = (item: OrganizationFunction) => { setFunctionId((current) => current === item.item.id ? null : item.item.id); setCompetencyId(null); };
  const reset = () => { setNucleusIds([]); setSectorIds([]); setFunctionId(null); setCompetencyId(null); };

  return <div className="organization-map">
    <header className="organization-map-intro"><div><p className="organization-map-eyebrow">Universo Ramos / Mapa da Ramos</p><h1>Como a empresa se <span>organiza e atua.</span></h1><p>Explore núcleos, setores, funções essenciais, competências e capacidades.</p></div></header>
    <nav className="organization-map-nuclei" aria-label="Núcleos">{organizationMap.map((nucleus, index) => <button type="button" key={nucleus.id} aria-pressed={nucleusIds.includes(nucleus.id)} onClick={() => openNucleus(nucleus.id)} style={{ "--org-tone": nucleus.tone, "--org-soft": nucleus.soft } as CSSProperties}><strong>{String(index + 1).padStart(2, "0")}</strong><span>{nucleus.label}<small>{nucleus.animal} · {nucleus.sectors.length} setores</small></span><ChevronDown aria-hidden="true" /></button>)}</nav>
    <div className="organization-map-tools"><span>{nucleusIds.length ? `${nucleusIds.length} ${nucleusIds.length === 1 ? "núcleo aberto" : "núcleos abertos"} · ${sectorIds.length} ${sectorIds.length === 1 ? "setor aberto" : "setores abertos"}` : "Selecione um núcleo para explorar sua estrutura"}</span><button type="button" onClick={reset}><RotateCcw aria-hidden="true" /> Recolher tudo</button></div>
    <section className="organization-map-scroll" aria-label="Organograma interativo"><div className="organization-map-board">{selectedFirst(organizationMap, nucleusIds, (item) => item.id).map((nucleus) => {
      const nucleusOpen = nucleusIds.includes(nucleus.id);
      return <article key={nucleus.id} className={`organization-map-lane ${nucleusOpen ? "is-open" : "is-compact"}`} style={{ "--org-tone": nucleus.tone } as CSSProperties}>
        <button type="button" className="organization-map-nucleus" aria-label={`${nucleusOpen ? "Recolher" : "Expandir"} ${nucleus.label}`} aria-expanded={nucleusOpen} onClick={() => openNucleus(nucleus.id)}>
          <img className="organization-map-nucleus-art" src={nucleus.image} alt="" loading="lazy" /><img className="organization-map-sticker" src={nucleus.sticker} alt="" loading="lazy" />
          <span className="organization-map-number">{String(organizationMap.indexOf(nucleus) + 1).padStart(2, "0")}</span><span className="organization-map-nucleus-copy"><strong>{nucleus.label}</strong><small>{nucleus.animal}</small><span>{nucleus.summary}</span></span><ChevronDown className="organization-map-toggle" aria-hidden="true" />
        </button>
        {nucleusOpen && <div className="organization-map-sector-rows" aria-label={`Setores de ${nucleus.label}`}>{selectedFirst(nucleus.sectors, sectorIds, (item) => item.item.id).map((sector) => {
          const sectorOpen = sectorIds.includes(sector.item.id);
          return <section key={sector.item.id} className={`organization-map-sector-row ${sectorOpen ? "is-open" : "is-compact"}`} style={{ "--org-sector": sector.tone, "--org-sector-cover": `url("${sector.image}")` } as CSSProperties}>
            <button type="button" className="organization-map-sector" aria-expanded={sectorOpen} onClick={() => openSector(sector, nucleus)}><img src={sector.sticker} alt="" loading="lazy" /><span><small>{sector.functions.length} funções essenciais</small><strong>{sector.label}</strong></span><ChevronDown aria-hidden="true" /></button>
            {sectorOpen && <div className="organization-map-functions" aria-label={`Funções de ${sector.label}`}><button type="button" className="organization-map-sector-sheet" onClick={() => go("setor", sector.item.id)}>Abrir ficha do setor <ArrowRight aria-hidden="true" /></button>{sector.functions.map((item) => {
              const functionOpen = functionId === item.item.id;
              return <div key={item.item.id} className={`organization-map-function ${functionOpen ? "is-open" : ""}`}>
                <button type="button" className="organization-map-function-name" aria-expanded={functionOpen} onClick={() => openFunction(item)}><img src={item.image} alt="" loading="lazy" /><span>{item.item.name}</span><ChevronDown aria-hidden="true" /></button>
                {functionOpen && <div className="organization-map-competencies">{item.competencies.map((competency) => {
                  const available = isEarned(competency, certifiedLevels) && officialIds.has(competency.officialSourceId);
                  const selected = competencyId === competency.id;
                  return <div key={competency.id} className={`organization-map-competency ${available ? "is-earned" : "is-pending"} ${selected ? "is-open" : ""}`}><button type="button" aria-expanded={selected} onClick={() => setCompetencyId((current) => current === competency.id ? null : competency.id)}>{competency.name}{competency.origin === "Nova" && <small>Proposta</small>}<ChevronDown aria-hidden="true" /></button>{selected && <Requirements item={competency} go={go} levels={certifiedLevels} />}</div>;
                })}</div>}
              </div>;
            })}</div>}
          </section>;
        })}</div>}
      </article>;
    })}</div></section>
  </div>;
}
