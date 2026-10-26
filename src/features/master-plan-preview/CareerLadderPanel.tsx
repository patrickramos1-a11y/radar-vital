import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { capabilityLevelInsignia, capabilityLevelNames, type CapabilityLevel } from "./capabilityJourney";
import { careerStepReadiness, maximumCapabilityLevelForCareerStep, nucleoTecnicoCareerLadder, responsibilitiesForCareerStep } from "./careerLadder";
import type { Library } from "./journeyRemote";
import { competencyReadiness, competencyRequirements, type ResponsibilityClaim } from "./responsibilityJourney";

type Go = (view: "responsabilidade", id?: string, tab?: string, mode?: string) => void;
type Capability = Library["capabilities"][number];

const levels: CapabilityLevel[] = [1, 2, 3];

function CapabilityScenarioGrid({ requirements, certifiedLevels, scenarioLevels, scenarioChanges, onSelect }: {
  requirements: Array<{ capability: Capability; maximumLevel: CapabilityLevel; requiredLevel: CapabilityLevel | 0 }>;
  certifiedLevels: Map<string, number>;
  scenarioLevels: Map<string, number>;
  scenarioChanges: Map<string, CapabilityLevel>;
  onSelect: (capabilityCode: string, level: CapabilityLevel) => void;
}) {
  return <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">{requirements.map(({ capability, maximumLevel, requiredLevel }) => {
    const certified = certifiedLevels.get(capability.code) ?? 0;
    const selected = scenarioLevels.get(capability.code) ?? 0;
    return <div key={capability.code} className={`border bg-white p-2 ${scenarioChanges.has(capability.code) || requiredLevel > certified ? "border-sky-500 bg-sky-50" : requiredLevel > 0 ? "border-violet-300 bg-violet-50" : "border-zinc-200"}`}>
      <div className="flex items-start justify-between gap-2"><p className="min-w-0 text-xs font-semibold text-zinc-900"><span className="text-sky-800">{capability.code}</span> · {capability.title}</p><span className="shrink-0 text-[10px] text-zinc-500">Real: {certified ? capabilityLevelNames[certified as CapabilityLevel] : "--"}</span></div>
      {requiredLevel > certified && <p className="mt-1 text-[10px] font-semibold text-sky-800">No plano: alcançar {capabilityLevelNames[requiredLevel]}</p>}
      <div className={`mt-2 grid gap-1 ${maximumLevel === 1 ? "grid-cols-1" : maximumLevel === 2 ? "grid-cols-2" : "grid-cols-3"}`} role="group" aria-label={`Nível simulado para ${capability.title}`}>{levels.filter((level) => level <= maximumLevel).map((level) => {
        const achieved = level <= selected;
        const certifiedLevel = level <= certified;
        const neededForPlan = level <= requiredLevel && level > certified;
        return <button key={level} type="button" disabled={level < certified} aria-pressed={selected === level} title={certifiedLevel ? `Certificado: ${capabilityLevelNames[level]}` : neededForPlan ? `Necessário para a competência no plano: ${capabilityLevelNames[level]}` : achieved ? `Simulado: ${capabilityLevelNames[level]}` : `Simular ${capabilityLevelNames[level]}`} onClick={() => onSelect(capability.code, level)} className={`grid h-8 place-items-center border ${certifiedLevel ? "border-emerald-600 bg-emerald-50" : neededForPlan || achieved ? "border-sky-600 bg-sky-50" : "border-zinc-200 bg-white opacity-35 grayscale hover:opacity-100 hover:grayscale-0"} disabled:cursor-not-allowed`}><img src={capabilityLevelInsignia[level]} alt={capabilityLevelNames[level]} className="h-6 w-6 object-contain" loading="lazy" decoding="async" /></button>;
      })}</div>
    </div>;
  })}</div>;
}

export function CareerLadderPanel({ library, certifiedLevels, claims, collaboratorId, go }: { library: Library; certifiedLevels: Map<string, number>; claims: ResponsibilityClaim[]; collaboratorId: string; go: Go }) {
  const ladder = nucleoTecnicoCareerLadder;
  const [scenarioChangesByStep, setScenarioChangesByStep] = useState<Map<string, Map<string, CapabilityLevel>>>(new Map());
  const [selectedResponsibilityIdsByStep, setSelectedResponsibilityIdsByStep] = useState<Map<string, Set<string>>>(new Map());
  const [expandedConsolidations, setExpandedConsolidations] = useState<Set<string>>(new Set());
  const scenarioLevelsByStep = useMemo(() => new Map(ladder.steps.map((step) => {
    const next = new Map(certifiedLevels);
    scenarioChangesByStep.get(step.id)?.forEach((level, code) => next.set(code, level));
    return [step.id, next] as const;
  })), [certifiedLevels, scenarioChangesByStep]);
  const selectedRequirementsByStep = useMemo(() => new Map(ladder.steps.map((step) => {
    const requirements = new Map<string, CapabilityLevel>();
    const selectedIds = selectedResponsibilityIdsByStep.get(step.id) ?? new Set<string>();
    library.responsibilities.filter((responsibility) => selectedIds.has(responsibility.sourceId)).forEach((responsibility) => {
      competencyRequirements(responsibility).forEach((requirement) => requirements.set(requirement.capabilityCode, Math.max(requirements.get(requirement.capabilityCode) ?? 0, requirement.minimumLevel) as CapabilityLevel));
    });
    return [step.id, requirements] as const;
  })), [library.responsibilities, selectedResponsibilityIdsByStep]);
  const firstIncompleteStep = useMemo(() => ladder.steps.find((step) => !careerStepReadiness(library, ladder, step.id, scenarioLevelsByStep.get(step.id)!, claims, collaboratorId).eligible) ?? ladder.steps.at(-1)!, [claims, collaboratorId, ladder.steps, library, scenarioLevelsByStep]);

  const setScenarioLevel = (stepId: string, capabilityCode: string, level: CapabilityLevel) => {
    const certified = (certifiedLevels.get(capabilityCode) ?? 0) as CapabilityLevel | 0;
    setScenarioChangesByStep((current) => {
      const next = new Map(current);
      const stepChanges = new Map(next.get(stepId));
      if (stepChanges.get(capabilityCode) === level || level <= certified) stepChanges.delete(capabilityCode);
      else stepChanges.set(capabilityCode, level);
      if (stepChanges.size > 0) next.set(stepId, stepChanges);
      else next.delete(stepId);
      return next;
    });
  };

  const toggleResponsibility = (stepId: string, responsibilityId: string, maximumSelections: number) => {
    setSelectedResponsibilityIdsByStep((current) => {
      const next = new Map(current);
      const selectedIds = new Set(next.get(stepId));
      if (selectedIds.has(responsibilityId)) selectedIds.delete(responsibilityId);
      else if (selectedIds.size < maximumSelections) selectedIds.add(responsibilityId);
      if (selectedIds.size > 0) next.set(stepId, selectedIds);
      else next.delete(stepId);
      return next;
    });
  };

  const toggleConsolidation = (stepId: string) => setExpandedConsolidations((current) => {
    const next = new Set(current);
    if (next.has(stepId)) next.delete(stepId);
    else next.add(stepId);
    return next;
  });

  return <section className="border bg-white">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
      <div>
        <p className="text-xs font-semibold uppercase text-violet-700">Matriz de jornada</p>
        <h2 className="mt-2 text-lg font-semibold">{ladder.title}</h2>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600">{ladder.summary} A promoção exige pontos certificados e competências consolidadas automaticamente.</p>
        <p className="mt-3 text-xs font-semibold uppercase text-violet-800">Escopo integrado: {ladder.scope}</p>
        <p className="mt-3 text-sm font-semibold text-violet-900">Próximo cargo: {firstIncompleteStep.title}</p>
      </div>
      {(scenarioChangesByStep.size > 0 || selectedResponsibilityIdsByStep.size > 0) && <button type="button" onClick={() => { setScenarioChangesByStep(new Map()); setSelectedResponsibilityIdsByStep(new Map()); setExpandedConsolidations(new Set()); }} className="inline-flex items-center gap-1 border border-sky-700 bg-white px-3 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-50"><RotateCcw className="h-3.5 w-3.5" /> Limpar marcações</button>}
    </div>

    <div className="divide-y">
      {ladder.steps.map((step, index) => {
        const scenarioLevels = scenarioLevelsByStep.get(step.id)!;
        const selectedResponsibilityIds = selectedResponsibilityIdsByStep.get(step.id) ?? new Set<string>();
        const selectedRequirements = selectedRequirementsByStep.get(step.id) ?? new Map<string, CapabilityLevel>();
        const readiness = careerStepReadiness(library, ladder, step.id, scenarioLevels, claims, collaboratorId);
        const capabilityByCode = new Map(library.capabilities.map((capability) => [capability.code, capability]));
        const maximumLevel = maximumCapabilityLevelForCareerStep(library, ladder, step.id);
        const scenarioCapabilities = [...library.capabilities]
          .sort((left, right) => left.code.localeCompare(right.code))
          .map((capability) => ({ capability: capabilityByCode.get(capability.code), maximumLevel, requiredLevel: selectedRequirements.get(capability.code) ?? 0 }))
          .filter((item): item is { capability: Capability; maximumLevel: CapabilityLevel; requiredLevel: CapabilityLevel | 0 } => Boolean(item.capability));
        const responsibilityOptions = responsibilitiesForCareerStep(library, ladder, step.id)
          .map((responsibility) => competencyReadiness(responsibility, scenarioLevels))
          .sort((left, right) => {
            const leftSelected = selectedResponsibilityIds.has(left.responsibility.sourceId);
            const rightSelected = selectedResponsibilityIds.has(right.responsibility.sourceId);
            return Number(left.unmet.length > 0) - Number(right.unmet.length > 0)
              || Number(rightSelected) - Number(leftSelected)
              || left.unmet.length - right.unmet.length
              || left.responsibility.title.localeCompare(right.responsibility.title, "pt-BR");
          });
        const isCrossNucleus = step.nucleiRequired > 1;
        const availableSelections = Math.max(0, readiness.competencyTarget - readiness.earnedCompetencies);
        const isActivePersonalizationStep = step.id === firstIncompleteStep.id;
        const consolidationExpanded = expandedConsolidations.has(step.id);
        const consolidatedCapabilities = library.capabilities
          .filter((capability) => (scenarioLevels.get(capability.code) ?? 0) > 0)
          .sort((left, right) => left.code.localeCompare(right.code));
        return <article key={step.id} className="px-4 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><span className={`grid h-7 w-7 place-items-center border text-xs font-bold ${readiness.eligible ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-violet-300 bg-violet-50 text-violet-800"}`}>{readiness.eligible ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span><div><h3 className="text-base font-semibold">{step.title}</h3><p className="text-xs text-zinc-600">{step.function}</p></div></div>
              <p className={`mt-3 text-xs font-semibold ${readiness.eligible ? "text-emerald-800" : "text-amber-800"}`}>{readiness.eligible ? "Elegível para solicitação administrativa" : isCrossNucleus ? `Requer cobertura de ${step.nucleiRequired} núcleos` : "Em desenvolvimento"}</p>
            </div>
            <div className="grid min-w-48 grid-cols-2 gap-2 text-right text-xs"><div><strong className="block text-base">{readiness.completedCapabilityPoints}/{readiness.capabilityPoints}</strong><span className="text-zinc-600">pontos no cenário</span></div><div><strong className="block text-base">{readiness.earnedCompetencies}/{readiness.competencyTarget}</strong><span className="text-zinc-600">competências</span></div></div>
          </div>

          {readiness.eligible ? <div className="mt-4"><div className="flex flex-wrap items-center justify-between gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900"><p>Marco concluído com {readiness.earnedCompetencies} competências consolidadas automaticamente. O próximo cargo fica disponível para personalizar a evolução.</p><button type="button" aria-expanded={consolidationExpanded} onClick={() => toggleConsolidation(step.id)} className="inline-flex shrink-0 items-center gap-1 font-semibold underline decoration-emerald-400 underline-offset-2 hover:text-emerald-950">{consolidationExpanded ? "Ocultar consolidação" : "Ver consolidação"}{consolidationExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</button></div>{consolidationExpanded && <div className="border-x border-b border-emerald-200 bg-white p-3"><div className="grid gap-4 lg:grid-cols-2"><div><p className="text-xs font-semibold uppercase text-zinc-500">Capacidades consideradas no cenário</p><p className="mt-1 text-xs text-zinc-600">{consolidatedCapabilities.length} certificadas, somando {readiness.completedCapabilityPoints} pontos.</p><div className="mt-2 flex max-h-40 flex-wrap gap-1 overflow-y-auto pr-1">{consolidatedCapabilities.map((capability) => <span key={capability.code} className="border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-900">{capability.code} · {capabilityLevelNames[scenarioLevels.get(capability.code) as CapabilityLevel]}</span>)}</div></div><div><p className="text-xs font-semibold uppercase text-zinc-500">Competências consolidadas</p><p className="mt-1 text-xs text-zinc-600">Cada uma já atende todos os seus requisitos correlacionados.</p><div className="mt-2 grid max-h-40 gap-1 overflow-y-auto pr-1 sm:grid-cols-2">{readiness.allCompetencyCandidates.map((item) => <span key={item.responsibility.sourceId} className="border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-900">{item.responsibility.title}</span>)}</div></div></div></div>}</div> : !isActivePersonalizationStep ? <p className="mt-4 border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">Este marco será aberto para personalização quando o cargo anterior estiver concluído.</p> : <div className="mt-4 space-y-4">
            <div className="border bg-zinc-50 p-3">
              <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase text-zinc-500">Competências possíveis</p><span className="text-xs font-semibold text-violet-800">{readiness.earnedCompetencies}/{readiness.competencyTarget} consolidadas</span></div>
              <p className="mt-1 text-xs text-zinc-600">Cada competência é formada automaticamente quando todas as capacidades exigidas são alcançadas. Marque as que quer priorizar no seu plano.</p>
              <div className="mt-3 grid max-h-40 gap-1 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{responsibilityOptions.map((item) => {
                const selected = selectedResponsibilityIds.has(item.responsibility.sourceId);
                const locked = !selected && selectedResponsibilityIds.size >= availableSelections;
                const status = selected ? "No plano" : item.unmet.length === 0 ? "Consolidada" : `${item.unmet.length} capacidade(s) pendente(s)`;
                return <button key={item.responsibility.sourceId} type="button" disabled={locked} aria-pressed={selected} onClick={() => toggleResponsibility(step.id, item.responsibility.sourceId, availableSelections)} title={locked ? `Limite de ${availableSelections} competências no plano deste cargo` : `${selected ? "Remover" : "Adicionar"} ${item.responsibility.title} ${selected ? "do" : "ao"} plano`} className={`min-h-11 border px-2 py-1.5 text-left text-[10px] font-medium ${selected ? "border-sky-600 bg-sky-50 text-sky-950" : item.unmet.length === 0 ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-zinc-200 bg-white text-zinc-700 hover:border-sky-400 hover:bg-sky-50"} disabled:cursor-not-allowed disabled:opacity-45`}><span className="block leading-tight">{item.responsibility.title}</span><span className="mt-0.5 block text-[9px] font-normal opacity-80">{status}</span></button>;
              })}</div>
              {readiness.allCompetencyCandidates.length > readiness.competencyTarget && <p className="mt-3 text-xs text-zinc-600">{readiness.allCompetencyCandidates.length - readiness.competencyTarget} competências já consolidadas também fortalecem os próximos marcos.</p>}
              {readiness.missingCompetencyCount > 0 && <p className="mt-3 text-xs text-amber-800">Faltam {readiness.missingCompetencyCount} competências consolidadas para este marco.</p>}
              {isCrossNucleus && <p className="mt-3 text-xs text-violet-800">Depois da maturidade total do Núcleo Técnico, este marco depende da cobertura dos demais núcleos.</p>}
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2"><div><p className="text-xs font-semibold uppercase text-zinc-500">Capacidades disponíveis para este cargo</p><p className="mt-1 text-xs text-zinc-600">Escolha as capacidades e os níveis permitidos para este cargo. As competências acima se consolidam automaticamente quando seus requisitos são completados; o contorno violeta identifica uma capacidade exigida por uma competência incluída no plano.</p></div><span className="text-xs font-semibold text-sky-800">{readiness.certifiedCapabilityCount} certificadas</span></div>
              <CapabilityScenarioGrid requirements={scenarioCapabilities} certifiedLevels={certifiedLevels} scenarioLevels={scenarioLevels} scenarioChanges={scenarioChangesByStep.get(step.id) ?? new Map()} onSelect={(capabilityCode, level) => setScenarioLevel(step.id, capabilityCode, level)} />
              {readiness.missingCapabilityPoints > 0 && <p className="mt-3 text-xs text-amber-800">Faltam {readiness.missingCapabilityPoints} pontos no cenário para este cargo.</p>}
            </div>
          </div>}
        </article>;
      })}
    </div>
  </section>;
}
