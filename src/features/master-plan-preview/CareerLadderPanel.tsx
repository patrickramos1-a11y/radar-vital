import { useMemo, useRef, useState } from "react";
import { CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { capabilityLevelInsignia, capabilityLevelNames, type CapabilityLevel } from "./capabilityJourney";
import { careerStepReadiness, nucleoTecnicoCareerLadder, type CareerStepId, type PacRequirement } from "./careerLadder";
import type { Library } from "./journeyRemote";
import type { ResponsibilityClaim, ResponsibilityReadiness } from "./responsibilityJourney";

type Go = (view: "capacidade" | "responsabilidade", id?: string, tab?: string, mode?: string) => void;

const levels: CapabilityLevel[] = [1, 2, 3];

const orderRequirementsByLevel = (requirements: PacRequirement[]) =>
  [...requirements].sort(
    (left, right) => left.minimumLevel - right.minimumLevel || left.capabilityCode.localeCompare(right.capabilityCode),
  );

export function CareerLadderPanel({ library, certifiedLevels, claims, collaboratorId, go }: { library: Library; certifiedLevels: Map<string, number>; claims: ResponsibilityClaim[]; collaboratorId: string; go: Go }) {
  const ladder = nucleoTecnicoCareerLadder;
  const firstIncompleteStep = ladder.steps.find((step) => !careerStepReadiness(library, ladder, step.id, certifiedLevels, claims, collaboratorId).eligible) ?? ladder.steps.at(-1)!;
  const [scenarioStepId, setScenarioStepId] = useState<CareerStepId>(firstIncompleteStep.id);
  const [scenarioChanges, setScenarioChanges] = useState<Map<string, CapabilityLevel>>(new Map());
  const plannerRef = useRef<HTMLElement>(null);
  const scenarioLevels = useMemo(() => {
    const next = new Map(certifiedLevels);
    scenarioChanges.forEach((level, code) => next.set(code, level));
    return next;
  }, [certifiedLevels, scenarioChanges]);
  const scenarioReadiness = careerStepReadiness(library, ladder, scenarioStepId, scenarioLevels, claims, collaboratorId);
  const realScenarioReadiness = careerStepReadiness(library, ladder, scenarioStepId, certifiedLevels, claims, collaboratorId);
  const realEnabledResponsibilities = new Set(realScenarioReadiness.allResponsibilityCandidates.map((item) => item.responsibility.sourceId));
  const sortedCapabilities = useMemo(() => [...library.capabilities].sort((left, right) => left.code.localeCompare(right.code)), [library.capabilities]);

  const setScenarioLevel = (capabilityCode: string, level: CapabilityLevel) => {
    const certified = (certifiedLevels.get(capabilityCode) ?? 0) as CapabilityLevel | 0;
    setScenarioChanges((current) => {
      const next = new Map(current);
      if (current.get(capabilityCode) === level || level <= certified) next.delete(capabilityCode);
      else next.set(capabilityCode, level);
      return next;
    });
  };

  const selectScenarioStep = (stepId: CareerStepId, scrollToPlanner = false) => {
    setScenarioStepId(stepId);
    if (scrollToPlanner) plannerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const responsibilityChip = (item: ResponsibilityReadiness, isNew = false) => {
    const granted = item.status === "concedida";
    const requested = item.status === "solicitada";
    return <button key={item.responsibility.sourceId} type="button" onClick={() => go("responsabilidade", item.responsibility.sourceId)} className={`border px-2 py-1 text-left text-[11px] font-medium ${granted ? "border-emerald-300 bg-emerald-50 text-emerald-900" : requested ? "border-sky-300 bg-sky-50 text-sky-900" : "border-teal-300 bg-white text-teal-900 hover:bg-teal-50"}`}>{isNew && <span className="mr-1 font-semibold text-violet-800">Nova</span>}{item.responsibility.title}</button>;
  };

  return <section className="border bg-white">
    <div className="border-b p-4">
      <p className="text-xs font-semibold uppercase text-violet-700">Matriz de jornada</p>
      <h2 className="mt-2 text-lg font-semibold">{ladder.title}</h2>
      <p className="mt-1 max-w-3xl text-sm text-zinc-600">{ladder.summary} A promoção exige os dois requisitos: pontos certificados e responsabilidades formalmente concedidas.</p>
      <p className="mt-3 text-xs font-semibold uppercase text-violet-800">Escopo integrado: {ladder.scope}</p>
      <p className="mt-3 text-sm font-semibold text-violet-900">Próximo cargo: {firstIncompleteStep.title}</p>
    </div>

    <section ref={plannerRef} className="border-b border-t-4 border-sky-500 bg-sky-50/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1 text-xs font-semibold uppercase text-sky-800"><Sparkles className="h-3.5 w-3.5" /> Planejador de jornada</p>
          <h3 className="mt-1 text-base font-semibold">Simule escolhas de capacitação</h3>
          <p className="mt-1 max-w-3xl text-sm text-zinc-600">Escolha os níveis que pretende conquistar. O cenário recalcula os pontos do cargo e todos os caminhos de responsabilidade habilitados, sem alterar certificações ou concessões reais.</p>
        </div>
        <button type="button" onClick={() => setScenarioChanges(new Map())} disabled={!scenarioChanges.size} className="inline-flex items-center gap-1 border border-sky-700 bg-white px-3 py-2 text-xs font-semibold text-sky-800 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-sky-50"><RotateCcw className="h-3.5 w-3.5" /> Limpar cenário</button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_repeat(3,minmax(150px,0.32fr))]">
        <label className="text-xs font-semibold text-zinc-700">Cargo simulado<select aria-label="Cargo simulado" value={scenarioStepId} onChange={(event) => selectScenarioStep(event.target.value as CareerStepId)} className="mt-1 h-10 w-full border bg-white px-2 text-sm font-normal outline-none focus:border-sky-600">{ladder.steps.map((step) => <option key={step.id} value={step.id}>{step.title}</option>)}</select></label>
        <div className="border border-sky-200 bg-white p-3"><p className="text-[11px] font-semibold uppercase text-zinc-500">Pontos no cenário</p><strong className="mt-1 block text-lg text-sky-950">{scenarioReadiness.completedCapabilityPoints}/{scenarioReadiness.capabilityPoints}</strong><p className="text-xs text-zinc-600">certificados</p></div>
        <div className="border border-teal-200 bg-white p-3"><p className="text-[11px] font-semibold uppercase text-zinc-500">Caminhos habilitados</p><strong className="mt-1 block text-lg text-teal-950">{scenarioReadiness.allResponsibilityCandidates.length}</strong><p className="text-xs text-zinc-600">por este cenário</p></div>
        <div className="border border-violet-200 bg-white p-3"><p className="text-[11px] font-semibold uppercase text-zinc-500">Limite deste cargo</p><strong className="mt-1 block text-lg text-violet-950">{scenarioReadiness.responsibilityTarget}</strong><p className="text-xs text-zinc-600">a conceder</p></div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)]">
        <div>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2"><div><p className="text-xs font-semibold uppercase text-zinc-500">Capacitações do cenário</p><p className="mt-1 text-xs text-zinc-600">A meta é de pontos; você define quais capacidades e níveis compõem seu percurso.</p></div><span className="text-xs font-semibold text-sky-800">{scenarioChanges.size} alteração(ões)</span></div>
          <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">{sortedCapabilities.map((capability) => {
            const certified = certifiedLevels.get(capability.code) ?? 0;
            const selected = scenarioLevels.get(capability.code) ?? 0;
            return <div key={capability.code} className={`border bg-white p-2 ${scenarioChanges.has(capability.code) ? "border-sky-400" : "border-zinc-200"}`}>
              <div className="flex items-start justify-between gap-2"><p className="min-w-0 text-xs font-semibold text-zinc-900"><span className="text-sky-800">{capability.code}</span> · {capability.title}</p><span className="shrink-0 text-[10px] text-zinc-500">Real: {certified ? capabilityLevelNames[certified as CapabilityLevel] : "--"}</span></div>
              <div className="mt-2 grid grid-cols-3 gap-1" role="group" aria-label={`Nível simulado para ${capability.title}`}>{levels.map((level) => <button key={level} type="button" disabled={level < certified} aria-pressed={selected === level} title={`Simular ${capabilityLevelNames[level]}`} onClick={() => setScenarioLevel(capability.code, level)} className={`grid h-8 place-items-center border ${selected === level ? "border-sky-600 bg-sky-50" : "border-zinc-200 bg-white hover:bg-zinc-50"} disabled:cursor-not-allowed disabled:opacity-40`}><img src={capabilityLevelInsignia[level]} alt={capabilityLevelNames[level]} className="h-6 w-6 object-contain" loading="lazy" decoding="async" /></button>)}</div>
            </div>;
          })}</div>
        </div>
        <div className="border bg-white p-3">
          <p className="text-xs font-semibold uppercase text-zinc-500">Responsabilidades deste cenário</p>
          <p className="mt-1 text-xs text-zinc-600">Até {scenarioReadiness.responsibilityTarget} podem ser concedidas neste cargo; as demais ficam visíveis como caminhos futuros.</p>
          <div className="mt-3 max-h-80 space-y-1 overflow-y-auto pr-1">{scenarioReadiness.allResponsibilityCandidates.map((item) => responsibilityChip(item, !realEnabledResponsibilities.has(item.responsibility.sourceId)))}{!scenarioReadiness.allResponsibilityCandidates.length && <p className="text-xs text-zinc-600">Escolha capacidades e níveis que atendam aos pré-requisitos para descobrir os primeiros caminhos.</p>}</div>
        </div>
      </div>
    </section>

    <div className="divide-y">
      {ladder.steps.map((step, index) => {
        const readiness = careerStepReadiness(library, ladder, step.id, certifiedLevels, claims, collaboratorId);
        const isCrossNucleus = step.nucleiRequired > 1;
        const certifiedRequirements = orderRequirementsByLevel(library.capabilities.filter((capability) => (certifiedLevels.get(capability.code) ?? 0) > 0).map((capability) => ({ capabilityCode: capability.code, minimumLevel: (certifiedLevels.get(capability.code) ?? 0) as CapabilityLevel })));
        return <article key={step.id} className="px-4 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><span className={`grid h-7 w-7 place-items-center border text-xs font-bold ${readiness.eligible ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-violet-300 bg-violet-50 text-violet-800"}`}>{readiness.eligible ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span><div><h3 className="text-base font-semibold">{step.title}</h3><p className="text-xs text-zinc-600">{step.function}</p></div></div>
              <p className={`mt-3 text-xs font-semibold ${readiness.eligible ? "text-emerald-800" : "text-amber-800"}`}>{readiness.eligible ? "Elegível para solicitação administrativa" : isCrossNucleus ? `Requer cobertura de ${step.nucleiRequired} núcleos` : "Em desenvolvimento"}</p>
            </div>
            <div className="grid min-w-48 grid-cols-2 gap-2 text-right text-xs"><div><strong className="block text-base">{readiness.completedCapabilityPoints}/{readiness.capabilityPoints}</strong><span className="text-zinc-600">pontos certificados</span></div><div><strong className="block text-base">{readiness.grantedResponsibilities}/{readiness.responsibilityTarget}</strong><span className="text-zinc-600">responsabilidades</span></div></div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div><p className="text-xs font-semibold uppercase text-zinc-500">Meta de capacidades</p><p className="mt-2 text-sm font-semibold text-zinc-900">{step.capabilityTarget} pontos certificados</p><p className="mt-1 text-xs leading-relaxed text-zinc-600">A promoção não exige uma lista fixa: a pessoa combina capacidades e níveis conforme sua atuação, até atingir esta meta.</p><button type="button" onClick={() => selectScenarioStep(step.id, true)} className="mt-3 text-xs font-semibold text-sky-800 hover:underline">Simular este cargo</button></div>
            <div><details aria-label={`Capacidades certificadas: ${certifiedRequirements.length}`}><summary className="flex cursor-pointer items-center justify-between gap-2 text-xs font-semibold uppercase text-zinc-500"><span>Capacidades certificadas</span><span className="text-zinc-600">{certifiedRequirements.length} capacidades</span></summary><div className="mt-2 flex flex-wrap gap-1">{certifiedRequirements.map((requirement) => <button key={requirement.capabilityCode} type="button" onClick={() => go("capacidade", requirement.capabilityCode)} className="inline-flex items-center gap-1 border border-emerald-500 bg-white px-2 py-1 text-[11px] font-medium text-emerald-900 hover:bg-emerald-50"><img src={capabilityLevelInsignia[requirement.minimumLevel]} alt="" className="h-4 w-4 shrink-0 object-contain" loading="lazy" decoding="async" />{library.capabilities.find((capability) => capability.code === requirement.capabilityCode)?.title ?? requirement.capabilityCode}</button>)}</div></details>{readiness.missingCapabilityPoints > 0 && <p className="mt-2 text-xs text-amber-800">Faltam {readiness.missingCapabilityPoints} pontos certificados para este cargo.</p>}</div>
            <div><div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase text-zinc-500">Caminhos de responsabilidade</p><span className="text-xs font-semibold text-violet-800">até {readiness.responsibilityTarget}</span></div><div className="flex flex-wrap gap-1">{readiness.responsibilityCandidates.map((item) => responsibilityChip(item))}</div>{readiness.allResponsibilityCandidates.length > readiness.responsibilityCandidates.length && <p className="mt-2 text-xs text-zinc-600">Mais {readiness.allResponsibilityCandidates.length - readiness.responsibilityCandidates.length} caminhos técnicos aparecem no planejador.</p>}{!readiness.responsibilityCandidates.length && <p className="text-xs text-zinc-600">Conclua capacidades para liberar os primeiros caminhos.</p>}{readiness.missingResponsibilityCount > 0 && <p className="mt-2 text-xs text-amber-800">Faltam {readiness.missingResponsibilityCount} responsabilidades concedidas entre as que suas capacidades habilitam.</p>}{isCrossNucleus && <p className="mt-2 text-xs text-violet-800">Depois da maturidade total do Núcleo Técnico, este marco depende da cobertura dos demais núcleos.</p>}</div>
          </div>
        </article>;
      })}
    </div>
  </section>;
}
