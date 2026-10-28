import { useState, type CSSProperties } from "react";
import { ArrowRight, ChevronsRight, X } from "lucide-react";
import { organizationMap, type OrganizationFunction, type OrganizationNucleus, type OrganizationSector } from "./organizationMapModel";
import type { ManualCompetency } from "./manualDigitalModel";
import "./organizationMap.css";

type Destination = "nucleo" | "setor" | "funcao" | "competencia-manual" | "responsabilidade";
type Go = (view: Destination, id?: string, tab?: string) => void;
type Mode = "full" | "nuclei" | "sectors" | "functions";

const modes: Array<{ id: Mode; label: string; status: string }> = [
  { id: "full", label: "Tudo aberto", status: "Tudo aberto" },
  { id: "nuclei", label: "Compactar núcleos", status: "Núcleos compactados" },
  { id: "sectors", label: "Compactar setores", status: "Setores compactados" },
  { id: "functions", label: "Compactar funções", status: "Funções compactadas" },
];

interface Props {
  go: Go;
  officialCompetencyIds: string[];
}

function competencyDestination(item: ManualCompetency, sectorId: string, go: Go, officialIds: Set<string>) {
  if (item.origin === "Nova") go("competencia-manual", item.id);
  else if (item.officialSourceId && officialIds.has(item.officialSourceId)) go("responsabilidade", item.officialSourceId);
  else go("setor", sectorId, "competencias");
}

export function OrganizationMap({ go, officialCompetencyIds }: Props) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [selectedFunctionId, setSelectedFunctionId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("full");
  const officialIds = new Set(officialCompetencyIds);
  const focused = organizationMap.find((item) => item.id === focusedId);
  const selectedSector = organizationMap.flatMap((item) => item.sectors).find((item) => item.item.id === selectedSectorId);
  const selectedFunction = selectedSector?.functions.find((item) => item.item.id === selectedFunctionId);
  const focusLabel = selectedFunction?.item.name ?? selectedSector?.label ?? focused?.label ?? "Visão geral";

  const reset = () => {
    setFocusedId(null);
    setSelectedSectorId(null);
    setSelectedFunctionId(null);
    setMode("full");
  };
  const focusNucleus = (id: string) => {
    setFocusedId((current) => current === id ? null : id);
    setSelectedSectorId(null);
    setSelectedFunctionId(null);
  };
  const focusSector = (sector: OrganizationSector, nucleus: OrganizationNucleus) => {
    setFocusedId(nucleus.id);
    setSelectedSectorId((current) => current === sector.item.id ? null : sector.item.id);
    setSelectedFunctionId(null);
  };
  const focusFunction = (item: OrganizationFunction, sector: OrganizationSector, nucleus: OrganizationNucleus) => {
    setFocusedId(nucleus.id);
    setSelectedSectorId(sector.item.id);
    setSelectedFunctionId((current) => current === item.item.id ? null : item.item.id);
  };

  return <div className="organization-map">
    <header className="organization-map-intro">
      <div>
        <p className="organization-map-eyebrow">Universo Ramos / Mapa da Ramos</p>
        <h1>Como a empresa se <span>organiza e atua.</span></h1>
        <p>Núcleos, setores, funções essenciais e competências em uma leitura contínua da organização.</p>
      </div>
      <div className="organization-map-path" aria-label="Estrutura da organização"><span>Núcleo</span><ChevronsRight aria-hidden="true" /><span>Setor</span><ChevronsRight aria-hidden="true" /><span>Função</span><ChevronsRight aria-hidden="true" /><span>Competência</span></div>
    </header>

    <nav className="organization-map-nuclei" aria-label="Navegação por núcleo">{organizationMap.map((nucleus, index) => <button key={nucleus.id} type="button" aria-pressed={focusedId === nucleus.id} onClick={() => focusNucleus(nucleus.id)} style={{ "--org-tone": nucleus.tone, "--org-soft": nucleus.soft } as CSSProperties}>
      <strong>{String(index + 1).padStart(2, "0")}</strong><span>{nucleus.label}<small>{nucleus.animal} · {nucleus.sectors.length} setores</small></span>
    </button>)}</nav>

    <div className="organization-map-tools">
      <div className="organization-map-current"><span>Em foco</span><strong>{focusLabel}</strong></div>
      <div className="organization-map-modes" role="group" aria-label="Modo de leitura">{modes.map((option) => <button key={option.id} type="button" aria-pressed={mode === option.id} onClick={() => setMode(option.id)}>{option.label}</button>)}</div>
      <button className="organization-map-reset" type="button" onClick={reset}>Ver empresa inteira</button>
    </div>

    <section className="organization-map-scroll" aria-label="Organograma panorâmico" tabIndex={0}>
      <div className={`organization-map-board organization-map-mode-${mode}`}>
        <div className="organization-map-legend"><span>01 · Núcleo</span><span>02 · Setores</span><span>03 · Funções</span><span>04 · Competências</span></div>
        {organizationMap.map((nucleus, index) => {
          const hidden = selectedSectorId && !nucleus.sectors.some((sector) => sector.item.id === selectedSectorId);
          return <article key={nucleus.id} className={`organization-map-lane ${focusedId === nucleus.id ? "is-focused" : ""} ${focusedId && focusedId !== nucleus.id ? "is-muted" : ""} ${hidden ? "is-filtered" : ""}`} style={{ "--org-tone": nucleus.tone } as CSSProperties}>
            <button type="button" className="organization-map-nucleus" aria-label={`Focar ${nucleus.label}`} aria-pressed={focusedId === nucleus.id} onClick={() => focusNucleus(nucleus.id)}>
              <img className="organization-map-nucleus-art" src={nucleus.image} alt="" loading="lazy" decoding="async" />
              <img className="organization-map-sticker" src={nucleus.sticker} alt="" loading="lazy" decoding="async" />
              <span className="organization-map-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="organization-map-nucleus-copy"><strong>{nucleus.label}</strong><small>{nucleus.animal}</small><span>{nucleus.summary}</span></span>
            </button>
            <div className="organization-map-sector-rows">{nucleus.sectors.map((sector) => <section key={sector.item.id} className={`organization-map-sector-row ${selectedSectorId && selectedSectorId !== sector.item.id ? "is-filtered" : ""}`} style={{ "--org-sector": sector.tone } as CSSProperties}>
              <button type="button" className="organization-map-sector" aria-pressed={selectedSectorId === sector.item.id} onClick={() => focusSector(sector, nucleus)}>
                <img src={sector.image} alt="" loading="lazy" decoding="async" /><span><small>Setor · {sector.functions.length} funções</small><strong>{sector.label}</strong></span>
              </button>
              <div className="organization-map-functions">{sector.functions.map((item) => <div key={item.item.id} className={`organization-map-function ${selectedFunctionId === item.item.id && selectedSectorId === sector.item.id ? "is-selected" : ""}`}>
                <button type="button" className="organization-map-function-name" aria-pressed={selectedFunctionId === item.item.id && selectedSectorId === sector.item.id} onClick={() => focusFunction(item, sector, nucleus)}>{item.item.name}</button>
                <div className="organization-map-competencies">{item.competencies.map((competency) => <button type="button" key={competency.id} title={`${competency.origin === "Nova" ? "Proposta · " : ""}${competency.name}`} aria-label={`Abrir competência ${competency.origin === "Nova" ? "proposta " : ""}${competency.name}`} onClick={() => competencyDestination(competency, sector.item.id, go, officialIds)} className={competency.origin === "Nova" ? "is-proposal" : ""}>{competency.id}</button>)}</div>
              </div>)}</div>
            </section>)}</div>
          </article>;
        })}
      </div>
    </section>

    {(selectedFunction || selectedSector || focused) && <aside className="organization-map-inspector" aria-live="polite">
      <img src={selectedSector?.image ?? focused?.sticker} alt="" />
      <div><small>{selectedFunction ? `Função · ${selectedSector?.label}` : selectedSector ? focused?.label : "Núcleo em foco"}</small><strong>{selectedFunction?.item.name ?? selectedSector?.label ?? focused?.label}</strong><p>{selectedFunction ? `${selectedFunction.competencies.length} competências vinculadas` : selectedSector ? `${selectedSector.functions.length} funções essenciais` : focused?.summary}</p>
        <button type="button" onClick={() => selectedFunction ? go("funcao", selectedFunction.item.id) : selectedSector ? go("setor", selectedSector.item.id) : focused && go("nucleo", focused.routeId)}>Abrir ficha <ArrowRight aria-hidden="true" /></button>
      </div>
      <button type="button" className="organization-map-inspector-close" aria-label="Fechar seleção" title="Fechar seleção" onClick={reset}><X aria-hidden="true" /></button>
    </aside>}
    <span className="sr-only" role="status">{modes.find((item) => item.id === mode)?.status}</span>
  </div>;
}
