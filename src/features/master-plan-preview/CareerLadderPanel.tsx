import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { capabilityLevelInsignia, capabilityLevelNames, type CapabilityLevel } from "./capabilityJourney";
import { careerStepReadiness, nucleoTecnicoCareerLadder } from "./careerLadder";
import type { Library } from "./journeyRemote";
import type { ResponsibilityClaim, ResponsibilityReadiness } from "./responsibilityJourney";

type Go = (view: "responsabilidade", id?: string, tab?: string, mode?: string) => void;
type Capability = Library["capabilities"][number];

const levels: CapabilityLevel[] = [1, 2, 3];

function CapabilityScenarioGrid({ capabilities, certifiedLevels, scenarioLevels, scenarioChanges, onSelect }: {
  capabilities: Capability[];
  certifiedLevels: Map<string, number>;
  scenarioLevels: Map<string, number>;
  scenarioChanges: Map<string, CapabilityLevel>;
  onSelect: (capabilityCode: string, level: CapabilityLevel) => void;
}) {
  return <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">{capabilities.map((capability) => {
    const certified = certifiedLevels.get(capability.code) ?? 0;
    const selected = scenarioLevels.get(capability.code) ?? 0;
    return <div key={capability.code} className={`border bg-white p-2 ${scenarioChanges.has(capability.code) ? "border-sky-400" : "border-zinc-200"}`}>
      <div className="flex items-start justify-between gap-2"><p className="min-w-0 text-xs font-semibold text-zinc-900"><span className="text-sky-800">{capability.code}</span> · {capability.title}</p><span className="shrink-0 text-[10px] text-zinc-500">Real: {certified ? capabilityLevelNames[certified as CapabilityLevel] : "--"}</span></div>
      <div className="mt-2 grid grid-cols-3 gap-1" role="group" aria-label={`Nível simulado para ${capability.title}`}>{levels.map((level) => {
        const achieved = level <= selected;
        return <button key={level} type="button" disabled={level < certified} aria-pressed={selected === level} title={achieved ? `Consolidado: ${capabilityLevelNames[level]}` : `Simular ${capabilityLevelNames[level]}`} onClick={() => onSelect(capability.code, level)} className={`grid h-8 place-items-center border ${achieved ? "border-sky-600 bg-sky-50" : "border-zinc-200 bg-white opacity-35 grayscale hover:opacity-100 hover:grayscale-0"} disabled:cursor-not-allowed`}><img src={capabilityLevelInsignia[level]} alt={capabilityLevelNames[level]} className="h-6 w-6 object-contain" loading="lazy" decoding="async" /></button>;
      })}</div>
    </div>;
  })}</div>;
}

export function CareerLadderPanel({ library, certifiedLevels, claims, collaboratorId, go }: { library: Library; certifiedLevels: Map<string, number>; claims: ResponsibilityClaim[]; collaboratorId: string; go: Go }) {
  const ladder = nucleoTecnicoCareerLadder;
  const [scenarioChanges, setScenarioChanges] = useState<Map<string, CapabilityLevel>>(new Map());
  const scenarioLevels = useMemo(() => {
    const next = new Map(certifiedLevels);
    scenarioChanges.forEach((level, code) => next.set(code, level));
    return next;
  }, [certifiedLevels, scenarioChanges]);
  const sortedCapabilities = useMemo(() => [...library.capabilities].sort((left, right) => left.code.localeCompare(right.code)), [library.capabilities]);
  const firstIncompleteStep = ladder.steps.find((step) => !careerStepReadiness(library, ladder, step.id, certifiedLevels, claims, collaboratorId).eligible) ?? ladder.steps.at(-1)!;

  const setScenarioLevel = (capabilityCode: string, level: CapabilityLevel) => {
    const certified = (certifiedLevels.get(capabilityCode) ?? 0) as CapabilityLevel | 0;
    setScenarioChanges((current) => {
      const next = new Map(current);
      if (current.get(capabilityCode) === level || level <= certified) next.delete(capabilityCode);
      else next.set(capabilityCode, level);
      return next;
    });
  };

  const responsibilityChip = (item: ResponsibilityReadiness, isNew = false) => {
    const granted = item.status === "concedida";
    const requested = item.status === "solicitada";
    return <button key={item.responsibility.sourceId} type="button" onClick={() => go("responsabilidade", item.responsibility.sourceId)} className={`border px-2 py-1 text-left text-[11px] font-medium ${granted ? "border-emerald-300 bg-emerald-50 text-emerald-900" : requested ? "border-sky-300 bg-sky-50 text-sky-900" : "border-teal-300 bg-white text-teal-900 hover:bg-teal-50"}`}>{isNew && <span className="mr-1 font-semibold text-violet-800">Nova</span>}{item.responsibility.title}</button>;
  };

  return <section className="border bg-white">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
      <div>
        <p className="text-xs font-semibold uppercase text-violet-700">Matriz de jornada</p>
        <h2 className="mt-2 text-lg font-semibold">{ladder.title}</h2>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600">{ladder.summary} A promoção exige os dois requisitos: pontos certificados e responsabilidades formalmente concedidas.</p>
        <p className="mt-3 text-xs font-semibold uppercase text-violet-800">Escopo integrado: {ladder.scope}</p>
        <p className="mt-3 text-sm font-semibold text-violet-900">Próximo cargo: {firstIncompleteStep.title}</p>
      </div>
      {scenarioChanges.size > 0 && <button type="button" onClick={() => setScenarioChanges(new Map())} className="inline-flex items-center gap-1 border border-sky-700 bg-white px-3 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-50"><RotateCcw className="h-3.5 w-3.5" /> Limpar marcações</button>}
    </div>

    <div className="divide-y">
      {ladder.steps.map((step, index) => {
        const readiness = careerStepReadiness(library, ladder, step.id, scenarioLevels, claims, collaboratorId);
        const realReadiness = careerStepReadiness(library, ladder, step.id, certifiedLevels, claims, collaboratorId);
        const realEnabledResponsibilities = new Set(realReadiness.allResponsibilityCandidates.map((item) => item.responsibility.sourceId));
        const isCrossNucleus = step.nucleiRequired > 1;
        return <article key={step.id} className="px-4 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><span className={`grid h-7 w-7 place-items-center border text-xs font-bold ${readiness.eligible ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-violet-300 bg-violet-50 text-violet-800"}`}>{readiness.eligible ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span><div><h3 className="text-base font-semibold">{step.title}</h3><p className="text-xs text-zinc-600">{step.function}</p></div></div>
              <p className={`mt-3 text-xs font-semibold ${readiness.eligible ? "text-emerald-800" : "text-amber-800"}`}>{readiness.eligible ? "Elegível para solicitação administrativa" : isCrossNucleus ? `Requer cobertura de ${step.nucleiRequired} núcleos` : "Em desenvolvimento"}</p>
            </div>
            <div className="grid min-w-48 grid-cols-2 gap-2 text-right text-xs"><div><strong className="block text-base">{readiness.completedCapabilityPoints}/{readiness.capabilityPoints}</strong><span className="text-zinc-600">pontos no cenário</span></div><div><strong className="block text-base">{readiness.grantedResponsibilities}/{readiness.responsibilityTarget}</strong><span className="text-zinc-600">responsabilidades</span></div></div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(290px,0.55fr)]">
            <div>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2"><div><p className="text-xs font-semibold uppercase text-zinc-500">Capacidades disponíveis para este cargo</p><p className="mt-1 text-xs text-zinc-600">{step.capabilityTarget} pontos são exigidos. As insígnias acesas já foram consolidadas; marque um nível apagado para simular a próxima evolução.</p></div><span className="text-xs font-semibold text-sky-800">{readiness.certifiedCapabilityCount} consolidadas</span></div>
              <CapabilityScenarioGrid capabilities={sortedCapabilities} certifiedLevels={certifiedLevels} scenarioLevels={scenarioLevels} scenarioChanges={scenarioChanges} onSelect={setScenarioLevel} />
              {readiness.missingCapabilityPoints > 0 && <p className="mt-3 text-xs text-amber-800">Faltam {readiness.missingCapabilityPoints} pontos no cenário para este cargo.</p>}
            </div>
            <div className="border bg-zinc-50 p-3">
              <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase text-zinc-500">Caminhos de responsabilidade</p><span className="text-xs font-semibold text-violet-800">até {readiness.responsibilityTarget}</span></div>
              <p className="mt-1 text-xs text-zinc-600">As capacidades marcadas acima atualizam os caminhos habilitados. Até {readiness.responsibilityTarget} responsabilidades podem ser concedidas neste cargo.</p>
              <div className="mt-3 flex max-h-72 flex-wrap content-start gap-1 overflow-y-auto pr-1">{readiness.allResponsibilityCandidates.map((item) => responsibilityChip(item, !realEnabledResponsibilities.has(item.responsibility.sourceId)))}{!readiness.allResponsibilityCandidates.length && <p className="text-xs text-zinc-600">Marque capacidades e níveis para descobrir os primeiros caminhos.</p>}</div>
              {readiness.allResponsibilityCandidates.length > readiness.responsibilityTarget && <p className="mt-3 text-xs text-zinc-600">{readiness.allResponsibilityCandidates.length - readiness.responsibilityTarget} caminhos adicionais ficam disponíveis para os próximos marcos.</p>}
              {readiness.missingResponsibilityCount > 0 && <p className="mt-3 text-xs text-amber-800">Faltam {readiness.missingResponsibilityCount} responsabilidades concedidas entre as que suas capacidades habilitam.</p>}
              {isCrossNucleus && <p className="mt-3 text-xs text-violet-800">Depois da maturidade total do Núcleo Técnico, este marco depende da cobertura dos demais núcleos.</p>}
            </div>
          </div>
        </article>;
      })}
    </div>
  </section>;
}
