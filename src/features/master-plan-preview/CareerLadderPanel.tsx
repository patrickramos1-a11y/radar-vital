import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, RotateCcw, UserRoundSearch } from "lucide-react";
import { capabilityLevelInsignia, capabilityLevelNames, type CapabilityLevel } from "./capabilityJourney";
import { careerStepReadiness, competenciesForCareerTrack, competenciesIntroducedForCareerStep, maximumCapabilityLevelForCareerStep, nucleoTecnicoCareerLadder } from "./careerLadder";
import type { Library } from "./journeyRemote";
import { competencyReadiness, competencyRequirements, type ResponsibilityClaim } from "./responsibilityJourney";

type Go = (view: "capacidade" | "capacitacoes" | "cargos-funcoes" | "jornada" | "perfil-profissional" | "responsabilidade" | "responsabilidades" | "setor", id?: string, tab?: string, mode?: string) => void;
type Capability = Library["capabilities"][number];

const levels: CapabilityLevel[] = [1, 2, 3];
const capabilityPoints = (scenarioLevels: Map<string, number>) => [...scenarioLevels.values()].reduce((total, level) => {
  const numericLevel = Number(level);
  return total + (Number.isFinite(numericLevel) ? Math.min(Math.max(numericLevel, 0), 3) : 0);
}, 0);

function ConsolidatedCapabilityPill({ capability, level, certifiedLevel }: { capability: Capability; level: CapabilityLevel; certifiedLevel: number }) {
  const alreadyCertified = certifiedLevel >= level;
  return <span className={`inline-flex min-w-0 items-center gap-1.5 border px-2 py-1 text-[10px] font-medium text-emerald-950 ${alreadyCertified ? "border-zinc-200 bg-zinc-50" : "border-emerald-300 bg-emerald-50"}`} title={`${capability.title} · ${capabilityLevelNames[level]}`}><img src={capabilityLevelInsignia[level]} alt={`${capabilityLevelNames[level]}${alreadyCertified ? " já certificado" : " previsto no cenário"}`} className={`h-4 w-4 shrink-0 object-contain ${alreadyCertified ? "opacity-35 grayscale" : ""}`} loading="lazy" decoding="async" /><span className="truncate">{capability.title}</span></span>;
}

function CapabilityScenarioGrid({ requirements, certifiedLevels, scenarioLevels, scenarioChanges, capabilityTarget, onSelect }: {
  requirements: Array<{ capability: Capability; maximumLevel: CapabilityLevel; requiredLevel: CapabilityLevel | 0 }>;
  certifiedLevels: Map<string, number>;
  scenarioLevels: Map<string, number>;
  scenarioChanges: Map<string, CapabilityLevel>;
  capabilityTarget: number;
  onSelect: (capabilityCode: string, level: CapabilityLevel) => void;
}) {
  const scenarioPoints = capabilityPoints(scenarioLevels);
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
        const projectedPoints = scenarioPoints + Math.max(0, level - selected);
        const exceedsTarget = !achieved && projectedPoints > capabilityTarget;
        const disabled = level < certified || exceedsTarget;
        return <button key={level} type="button" disabled={disabled} aria-label={capabilityLevelNames[level]} aria-pressed={selected === level} title={certifiedLevel ? `Certificado: ${capabilityLevelNames[level]}` : exceedsTarget ? `Ultrapassa a meta de ${capabilityTarget} pontos deste cargo` : neededForPlan ? `Necessário para a competência no plano: ${capabilityLevelNames[level]}` : achieved ? `Simulado: ${capabilityLevelNames[level]}` : `Simular ${capabilityLevelNames[level]}`} onClick={() => onSelect(capability.code, level)} className={`grid min-h-11 place-items-center border py-1 ${certifiedLevel ? "border-emerald-600 bg-emerald-50" : neededForPlan || achieved ? "border-sky-600 bg-sky-50" : "border-zinc-200 bg-white opacity-35 grayscale hover:opacity-100 hover:grayscale-0"} disabled:cursor-not-allowed`}><img src={capabilityLevelInsignia[level]} alt={capabilityLevelNames[level]} className="h-5 w-5 object-contain" loading="lazy" decoding="async" /><span aria-hidden="true" className="text-[9px] font-semibold text-zinc-700">+{level}</span></button>;
      })}</div>
    </div>;
  })}</div>;
}

export function CareerLadderPanel({ library, certifiedLevels, claims, collaboratorId, go }: { library: Library; certifiedLevels: Map<string, number>; claims: ResponsibilityClaim[]; collaboratorId: string; go: Go }) {
  const ladder = nucleoTecnicoCareerLadder;
  const [scenarioChangesByStep, setScenarioChangesByStep] = useState<Map<string, Map<string, CapabilityLevel>>>(new Map());
  const [selectedResponsibilityIdsByStep, setSelectedResponsibilityIdsByStep] = useState<Map<string, Set<string>>>(new Map());
  const [expandedConsolidations, setExpandedConsolidations] = useState<Set<string>>(new Set());
  const [consolidatedSimulationSteps, setConsolidatedSimulationSteps] = useState<Set<string>>(new Set());
  // Existing certifications establish the current starting point only. Every
  // subsequent promotion is intentionally confirmed through its own scenario.
  const baselineConsolidatedStepId = useMemo(() => ladder.steps.find((step) => careerStepReadiness(library, ladder, step.id, certifiedLevels, claims, collaboratorId).eligible)?.id, [certifiedLevels, claims, collaboratorId, ladder.steps, library]);
  const selectedRequirementsByStep = useMemo(() => new Map(ladder.steps.map((step) => {
    const requirements = new Map<string, CapabilityLevel>();
    const selectedIds = selectedResponsibilityIdsByStep.get(step.id) ?? new Set<string>();
    library.responsibilities.filter((responsibility) => selectedIds.has(responsibility.sourceId)).forEach((responsibility) => {
      competencyRequirements(responsibility).forEach((requirement) => requirements.set(requirement.capabilityCode, Math.max(requirements.get(requirement.capabilityCode) ?? 0, requirement.minimumLevel) as CapabilityLevel));
    });
    return [step.id, requirements] as const;
  })), [library.responsibilities, selectedResponsibilityIdsByStep]);
  const inheritedPlanByStep = useMemo(() => {
    const baselineIndex = ladder.steps.findIndex((step) => step.id === baselineConsolidatedStepId);
    const baselineCompetencyIds = baselineIndex < 0 ? new Set<string>() : new Set(
      ladder.steps.slice(0, baselineIndex + 1)
        .flatMap((step) => competenciesIntroducedForCareerStep(library, ladder, step.id))
        .filter((responsibility) => competencyReadiness(responsibility, certifiedLevels).status === "consolidada")
        .map((responsibility) => responsibility.sourceId),
    );
    const inheritedCompetencyIds = new Set<string>();
    const inheritedRequirements = new Map<string, CapabilityLevel>();
    const inheritedChanges = new Map<string, CapabilityLevel>();
    return new Map(ladder.steps.map((step, index) => {
      const current = {
        competencyIds: new Set(inheritedCompetencyIds),
        requirements: new Map(inheritedRequirements),
        changes: new Map(inheritedChanges),
      };
      if (index === baselineIndex) baselineCompetencyIds.forEach((id) => inheritedCompetencyIds.add(id));
      if (consolidatedSimulationSteps.has(step.id)) {
        (selectedResponsibilityIdsByStep.get(step.id) ?? new Set<string>()).forEach((id) => inheritedCompetencyIds.add(id));
        selectedRequirementsByStep.get(step.id)?.forEach((level, code) => inheritedRequirements.set(code, Math.max(inheritedRequirements.get(code) ?? 0, level) as CapabilityLevel));
        scenarioChangesByStep.get(step.id)?.forEach((level, code) => inheritedChanges.set(code, Math.max(inheritedChanges.get(code) ?? 0, level) as CapabilityLevel));
      }
      return [step.id, current] as const;
    }));
  }, [baselineConsolidatedStepId, certifiedLevels, consolidatedSimulationSteps, ladder.steps, library, scenarioChangesByStep, selectedRequirementsByStep, selectedResponsibilityIdsByStep]);
  const scenarioLevelsByStep = useMemo(() => new Map(ladder.steps.map((step) => {
    const next = new Map(certifiedLevels);
    const inherited = inheritedPlanByStep.get(step.id);
    inherited?.changes.forEach((level, code) => next.set(code, Math.max(next.get(code) ?? 0, level)));
    inherited?.requirements.forEach((level, code) => next.set(code, Math.max(next.get(code) ?? 0, level)));
    scenarioChangesByStep.get(step.id)?.forEach((level, code) => next.set(code, Math.max(next.get(code) ?? 0, level)));
    selectedRequirementsByStep.get(step.id)?.forEach((level, code) => next.set(code, Math.max(next.get(code) ?? 0, level)));
    return [step.id, next] as const;
  })), [certifiedLevels, inheritedPlanByStep, scenarioChangesByStep, selectedRequirementsByStep]);
  const firstIncompleteStep = useMemo(() => ladder.steps.find((step) => step.id !== baselineConsolidatedStepId && !consolidatedSimulationSteps.has(step.id)) ?? ladder.steps.at(-1)!, [baselineConsolidatedStepId, consolidatedSimulationSteps, ladder.steps]);

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

  const toggleResponsibility = (stepId: string, responsibilityId: string) => {
    setSelectedResponsibilityIdsByStep((current) => {
      const next = new Map(current);
      const selectedIds = new Set(next.get(stepId));
      if (selectedIds.has(responsibilityId)) selectedIds.delete(responsibilityId);
      else selectedIds.add(responsibilityId);
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

  const consolidateSimulation = (stepId: string) => setConsolidatedSimulationSteps((current) => new Set(current).add(stepId));

  return <section className="border bg-white">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
      <div>
        <p className="text-xs font-semibold uppercase text-violet-700">Matriz de jornada</p>
        <h2 className="mt-2 text-lg font-semibold">{ladder.title}</h2>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600">{ladder.summary} A promoção exige pontos certificados e competências consolidadas automaticamente.</p>
        <p className="mt-3 text-xs font-semibold uppercase text-violet-800">Escopo integrado: {ladder.scope}</p>
        <p className="mt-3 text-sm font-semibold text-violet-900">Próximo cargo: {firstIncompleteStep.title}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => go("perfil-profissional")} className="inline-flex items-center gap-1 border border-teal-700 bg-white px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-50"><UserRoundSearch className="h-3.5 w-3.5" /> Ver perfil profissional</button>{(scenarioChangesByStep.size > 0 || selectedResponsibilityIdsByStep.size > 0 || consolidatedSimulationSteps.size > 0) && <button type="button" onClick={() => { setScenarioChangesByStep(new Map()); setSelectedResponsibilityIdsByStep(new Map()); setExpandedConsolidations(new Set()); setConsolidatedSimulationSteps(new Set()); }} className="inline-flex items-center gap-1 border border-sky-700 bg-white px-3 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-50"><RotateCcw className="h-3.5 w-3.5" /> Limpar marcações</button>}</div>
    </div>

    <div className="divide-y">
      {ladder.steps.map((step, index) => {
        const scenarioLevels = scenarioLevelsByStep.get(step.id)!;
        const selectedResponsibilityIds = selectedResponsibilityIdsByStep.get(step.id) ?? new Set<string>();
        const selectedRequirements = selectedRequirementsByStep.get(step.id) ?? new Map<string, CapabilityLevel>();
        const inheritedPlan = inheritedPlanByStep.get(step.id)!;
        const plannedRequirements = new Map(inheritedPlan.requirements);
        selectedRequirements.forEach((level, code) => plannedRequirements.set(code, Math.max(plannedRequirements.get(code) ?? 0, level) as CapabilityLevel));
        const plannedChanges = new Map(inheritedPlan.changes);
        scenarioChangesByStep.get(step.id)?.forEach((level, code) => plannedChanges.set(code, Math.max(plannedChanges.get(code) ?? 0, level) as CapabilityLevel));
        const readiness = careerStepReadiness(library, ladder, step.id, scenarioLevels, claims, collaboratorId);
        const capabilityByCode = new Map(library.capabilities.map((capability) => [capability.code, capability]));
        const maximumLevel = maximumCapabilityLevelForCareerStep(library, ladder, step.id);
        const scenarioCapabilities = [...library.capabilities]
          .sort((left, right) => left.code.localeCompare(right.code))
          .map((capability) => {
            const requiredLevel = plannedRequirements.get(capability.code) ?? 0;
            return {
              capability: capabilityByCode.get(capability.code),
              maximumLevel: Math.max(maximumLevel, requiredLevel) as CapabilityLevel,
              requiredLevel,
            };
          })
          .filter((item): item is { capability: Capability; maximumLevel: CapabilityLevel; requiredLevel: CapabilityLevel | 0 } => Boolean(item.capability));
        const responsibilityOptions = competenciesForCareerTrack(library, ladder, step.id)
          .map((responsibility) => competencyReadiness(responsibility, scenarioLevels))
          .sort((left, right) => {
            const leftInherited = inheritedPlan.competencyIds.has(left.responsibility.sourceId);
            const rightInherited = inheritedPlan.competencyIds.has(right.responsibility.sourceId);
            return Number(rightInherited) - Number(leftInherited)
              || left.responsibility.title.localeCompare(right.responsibility.title, "pt-BR");
          });
        const isCrossNucleus = step.nucleiRequired > 1;
        const isActivePersonalizationStep = step.id === firstIncompleteStep.id;
        const simulationConsolidated = consolidatedSimulationSteps.has(step.id);
        const stepConsolidated = step.id === baselineConsolidatedStepId || simulationConsolidated;
        const readyToConsolidate = readiness.eligible && !stepConsolidated;
        const competenciesAtStep = competenciesIntroducedForCareerStep(library, ladder, step.id)
          .map((responsibility) => competencyReadiness(responsibility, scenarioLevels))
          .filter((item) => item.status === "consolidada");
        const competenciesInPlan = stepConsolidated && index === ladder.steps.findIndex((item) => item.id === baselineConsolidatedStepId)
          ? competenciesAtStep.length
          : inheritedPlan.competencyIds.size + selectedResponsibilityIds.size;
        const displayedCapabilityPoints = Math.min(readiness.completedCapabilityPoints, readiness.capabilityPoints);
        const scenarioPoints = capabilityPoints(scenarioLevels);
        const inheritedResponsibilityOptions = responsibilityOptions.filter((item) => inheritedPlan.competencyIds.has(item.responsibility.sourceId));
        const selectableResponsibilityOptions = responsibilityOptions.filter((item) => !inheritedPlan.competencyIds.has(item.responsibility.sourceId));
        const necessaryCapabilities = scenarioCapabilities.filter(({ capability, requiredLevel }) => requiredLevel > (certifiedLevels.get(capability.code) ?? 0) || plannedChanges.has(capability.code));
        const renderCompetencyOption = (item: typeof responsibilityOptions[number]) => {
          const selected = selectedResponsibilityIds.has(item.responsibility.sourceId);
          const projectedLevels = new Map(scenarioLevels);
          competencyRequirements(item.responsibility).forEach((requirement) => projectedLevels.set(requirement.capabilityCode, Math.max(projectedLevels.get(requirement.capabilityCode) ?? 0, requirement.minimumLevel)));
          const exceedsTarget = !selected && capabilityPoints(projectedLevels) > readiness.capabilityPoints;
          const atTarget = !selected && scenarioPoints >= readiness.capabilityPoints;
          const disabled = exceedsTarget || atTarget;
          const status = selected ? "No plano" : exceedsTarget ? `Ultrapassa ${readiness.capabilityPoints} pontos` : atTarget ? "Meta de capacidades atingida" : item.unmet.length === 0 ? "Consolidada" : `${item.unmet.length} capacidade(s) pendente(s)`;
          return <button key={item.responsibility.sourceId} type="button" disabled={disabled} aria-pressed={selected} onClick={() => toggleResponsibility(step.id, item.responsibility.sourceId)} title={`${selected ? "Remover" : "Adicionar"} ${item.responsibility.title} ${selected ? "do" : "ao"} plano`} className={`min-h-14 border px-3 py-2 text-left text-xs font-medium disabled:cursor-not-allowed ${selected ? "border-sky-600 bg-sky-50 text-sky-950" : item.unmet.length === 0 ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-zinc-200 bg-white text-zinc-700 hover:border-sky-400 hover:bg-sky-50"}`}><span className="block leading-tight">{item.responsibility.title}</span><span className="mt-1 block text-[10px] font-normal opacity-80">{status}</span></button>;
        };
        const consolidationExpanded = expandedConsolidations.has(step.id);
        const consolidatedCapabilities = library.capabilities
          .filter((capability) => (scenarioLevels.get(capability.code) ?? 0) > 0)
          .sort((left, right) => left.code.localeCompare(right.code));
        return <article key={step.id} className="px-4 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><span className={`grid h-7 w-7 place-items-center border text-xs font-bold ${stepConsolidated ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-violet-300 bg-violet-50 text-violet-800"}`}>{stepConsolidated ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span><div><h3 className="text-base font-semibold">{step.title}</h3><p className="text-xs text-zinc-600">{step.function}</p></div></div>
              <p className={`mt-3 text-xs font-semibold ${stepConsolidated ? "text-emerald-800" : readyToConsolidate ? "text-sky-800" : "text-amber-800"}`}>{stepConsolidated ? "Consolidado no cenário" : readyToConsolidate ? "Pronto para consolidar a simulação" : isCrossNucleus ? `Requer cobertura de ${step.nucleiRequired} núcleos` : "Em desenvolvimento"}</p>
            </div>
            <div className="grid min-w-48 grid-cols-2 gap-2 text-right text-xs"><div><strong className="block text-base">{displayedCapabilityPoints}/{readiness.capabilityPoints}</strong><span className="text-zinc-600">pontos no cenário</span></div><div><strong className="block text-base">{competenciesInPlan}</strong><span className="text-zinc-600">competências no plano</span></div></div>
          </div>

          {stepConsolidated ? <div className="mt-4"><div className="flex flex-wrap items-center justify-between gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900"><p>Marco consolidado. {competenciesAtStep.length} competências foram formadas automaticamente nesta etapa e o próximo cargo fica disponível para personalizar a evolução.</p><button type="button" aria-expanded={consolidationExpanded} onClick={() => toggleConsolidation(step.id)} className="inline-flex shrink-0 items-center gap-1 font-semibold underline decoration-emerald-400 underline-offset-2 hover:text-emerald-950">{consolidationExpanded ? "Ocultar capacidades" : "Ver capacidades"}{consolidationExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</button></div>{consolidationExpanded && <div className="border-x border-b border-emerald-200 bg-white p-3"><p className="text-xs font-semibold uppercase text-zinc-500">Capacidades consideradas no cenário</p><p className="mt-1 text-xs text-zinc-600">{consolidatedCapabilities.length} capacidades consideradas, somando {readiness.completedCapabilityPoints} pontos. Insígnias apagadas já estão certificadas; coloridas fazem parte do plano consolidado.</p><div className="mt-3 flex max-h-44 flex-wrap gap-1 overflow-y-auto pr-1">{consolidatedCapabilities.map((capability) => <ConsolidatedCapabilityPill key={capability.code} capability={capability} level={scenarioLevels.get(capability.code) as CapabilityLevel} certifiedLevel={certifiedLevels.get(capability.code) ?? 0} />)}</div></div>}</div> : !isActivePersonalizationStep ? <p className="mt-4 border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">Este marco será aberto para personalização quando o cargo anterior estiver consolidado.</p> : <div className="mt-4 space-y-4">
            <div className="border bg-zinc-50 p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold uppercase text-zinc-500">Competências para compor o cenário</p><span className="text-xs font-semibold text-violet-800">{inheritedPlan.competencyIds.size} anteriores · {selectedResponsibilityIds.size} novas</span></div>
              <p className="mt-1 text-xs text-zinc-600">Marque as competências que quer compor. Este catálogo reúne todas as competências possíveis para esta trilha; as capacidades e os níveis exigidos entram automaticamente no cenário e somam os pontos deste cargo.</p>
              {inheritedResponsibilityOptions.length > 0 && <div className="mt-3 border-b border-zinc-200 pb-3"><p className="mb-2 text-[11px] font-semibold uppercase text-zinc-500">Já consolidadas no plano</p><div className="grid max-h-24 gap-1 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-5">{inheritedResponsibilityOptions.map((item) => <div key={item.responsibility.sourceId} className="border border-sky-300 bg-sky-50 px-2 py-1.5 text-[10px] font-medium text-sky-950"><span className="block leading-tight">{item.responsibility.title}</span><span className="mt-0.5 block text-[9px] font-normal text-sky-700">No plano anterior</span></div>)}</div></div>}
              <div className="mt-3"><div className="mb-2 flex items-center justify-between gap-2"><p className="text-[11px] font-semibold uppercase text-zinc-500">Competências para esta etapa</p><span className="text-[11px] text-zinc-500">{selectableResponsibilityOptions.length} opções</span></div><div className="grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{selectableResponsibilityOptions.map(renderCompetencyOption)}</div></div>
              {inheritedPlan.competencyIds.size > 0 && <p className="mt-3 text-xs text-sky-800">Plano anterior: {inheritedPlan.competencyIds.size} competências e {inheritedPlan.requirements.size} capacidades. Nesta etapa: {selectedResponsibilityIds.size} novas competências e {selectedRequirements.size} novas capacidades.</p>}
              {selectedResponsibilityIds.size > 0 && <p className="mt-3 text-xs text-sky-800">O cenário formado pelas competências selecionadas soma {displayedCapabilityPoints}/{readiness.capabilityPoints} pontos de capacidades.</p>}
              {isCrossNucleus && <p className="mt-3 text-xs text-violet-800">Depois da maturidade total do Núcleo Técnico, este marco depende da cobertura dos demais núcleos.</p>}
            </div>
            <div>
              <details className="border bg-white" open>
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs"><span><span className="font-semibold uppercase text-zinc-500">Capacidades necessárias para este perfil</span><span className="mt-1 block text-zinc-600">Somente capacidades exigidas pelas competências selecionadas.</span></span><span className="font-semibold text-sky-800">{necessaryCapabilities.length} necessárias</span></summary>
                <div className="border-t p-3">{necessaryCapabilities.length > 0 ? <CapabilityScenarioGrid requirements={necessaryCapabilities} certifiedLevels={certifiedLevels} scenarioLevels={scenarioLevels} scenarioChanges={plannedChanges} capabilityTarget={readiness.capabilityPoints} onSelect={(capabilityCode, level) => setScenarioLevel(step.id, capabilityCode, level)} /> : <p className="text-xs text-zinc-600">Selecione competências para visualizar as capacidades que este perfil precisa desenvolver.</p>}</div>
              </details>
              {readiness.missingCapabilityPoints > 0 && <p className="mt-3 text-xs text-amber-800">Faltam {readiness.missingCapabilityPoints} pontos no cenário para este cargo.</p>}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className={`text-xs ${readyToConsolidate ? "text-emerald-800" : "text-zinc-600"}`}>{readyToConsolidate ? "O cenário atingiu os pontos necessários deste cargo." : "Para consolidar, complete os pontos necessários deste cargo."}</p><button type="button" disabled={!readyToConsolidate} onClick={() => consolidateSimulation(step.id)} className="border border-emerald-700 bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-200 disabled:text-zinc-500">Consolidar simulação</button></div>
            </div>
          </div>}
        </article>;
      })}
    </div>
  </section>;
}

export function CapabilityOnlyLadderPanel({ library, certifiedLevels }: { library: Library; certifiedLevels: Map<string, number> }) {
  const ladder = nucleoTecnicoCareerLadder;
  const [changesByStep, setChangesByStep] = useState<Map<string, Map<string, CapabilityLevel>>>(new Map());
  const [consolidatedSteps, setConsolidatedSteps] = useState<Set<string>>(new Set());
  const certifiedPoints = capabilityPoints(certifiedLevels);
  const baselineIndex = ladder.steps.reduce((lastIndex, step, index) => certifiedPoints >= step.capabilityTarget ? index : lastIndex, -1);
  const scenarios = useMemo(() => {
    let carried = new Map(certifiedLevels);
    return new Map(ladder.steps.map((step, index) => {
      const base = new Map(carried);
      const scenario = new Map(base);
      changesByStep.get(step.id)?.forEach((level, code) => scenario.set(code, Math.max(scenario.get(code) ?? 0, level)));
      if (index <= baselineIndex || consolidatedSteps.has(step.id)) carried = scenario;
      return [step.id, { base, scenario }] as const;
    }));
  }, [baselineIndex, certifiedLevels, changesByStep, consolidatedSteps, ladder.steps]);
  const firstOpenIndex = ladder.steps.findIndex((step, index) => index > baselineIndex && !consolidatedSteps.has(step.id));
  const activeIndex = firstOpenIndex < 0 ? ladder.steps.length - 1 : firstOpenIndex;
  const setLevel = (stepId: string, code: string, level: CapabilityLevel) => {
    const base = scenarios.get(stepId)!.base.get(code) ?? 0;
    setChangesByStep((current) => {
      const next = new Map(current);
      const changes = new Map(next.get(stepId));
      if (changes.get(code) === level || level <= base) changes.delete(code);
      else changes.set(code, level);
      if (changes.size) next.set(stepId, changes);
      else next.delete(stepId);
      return next;
    });
  };
  return <section className="border bg-white">
    <div className="border-b p-4"><p className="text-xs font-semibold uppercase text-sky-700">Jornada de especialização por capacidades</p><h2 className="mt-2 text-lg font-semibold">Monte o cargo pelas capacidades e níveis</h2><p className="mt-1 max-w-3xl text-sm text-zinc-600">Todas as capacidades e os três níveis ficam disponíveis: Assistido vale 1 ponto, Autônomo vale 2 e Multiplicador vale 3. Componha diretamente o perfil especialista até alcançar a pontuação do patamar; competências não são exigidas nesta modalidade.</p></div>
    <div className="divide-y">{ladder.steps.map((step, index) => {
      const { base, scenario } = scenarios.get(step.id)!;
      const isConsolidated = index <= baselineIndex || consolidatedSteps.has(step.id);
      const isActive = index === activeIndex && !isConsolidated;
      const maximumLevel: CapabilityLevel = 3;
      const points = capabilityPoints(scenario);
      const remaining = Math.max(0, step.capabilityTarget - points);
      const requirements = library.capabilities.slice().sort((left, right) => left.title.localeCompare(right.title, "pt-BR")).map((capability) => ({ capability, maximumLevel, requiredLevel: 0 as const }));
      return <article key={step.id} className="px-4 py-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className={`grid h-7 w-7 place-items-center border text-xs font-bold ${isConsolidated ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-sky-300 bg-sky-50 text-sky-800"}`}>{isConsolidated ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span><div><h3 className="text-base font-semibold">{step.title}</h3><p className="text-xs text-zinc-600">{step.function}</p></div></div><p className={`mt-3 text-xs font-semibold ${isConsolidated ? "text-emerald-800" : isActive ? "text-sky-800" : "text-zinc-600"}`}>{isConsolidated ? "Consolidado por capacidades" : isActive ? "Em personalização por capacidades" : "Aguardando o cargo anterior"}</p></div><div className="text-right text-xs"><strong className="block text-base">{Math.min(points, step.capabilityTarget)}/{step.capabilityTarget}</strong><span className="text-zinc-600">pontos por capacidades</span></div></div>{isConsolidated ? <p className="mt-4 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">Este patamar foi concluído pelas capacidades certificadas ou consolidadas nesta simulação.</p> : !isActive ? <p className="mt-4 border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">Este patamar abre quando a simulação anterior for consolidada.</p> : <div className="mt-4 space-y-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-zinc-600">Selecione a capacidade e depois o nível: <strong>Assistido +1</strong>, <strong>Autônomo +2</strong> ou <strong>Multiplicador +3</strong>. Faltam <strong className="text-sky-800">{remaining} pontos</strong> para consolidar.</p><span className="text-xs font-semibold text-sky-800">Todos os níveis disponíveis</span></div><CapabilityScenarioGrid requirements={requirements} certifiedLevels={base} scenarioLevels={scenario} scenarioChanges={changesByStep.get(step.id) ?? new Map()} capabilityTarget={step.capabilityTarget} onSelect={(code, level) => setLevel(step.id, code, level)} /><div className="flex justify-end border-t pt-4"><button type="button" disabled={remaining > 0} onClick={() => setConsolidatedSteps((current) => new Set(current).add(step.id))} className="border border-emerald-700 bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-500">Consolidar simulação por capacidades</button></div></div>}</article>;
    })}</div>
  </section>;
}
