import { ArrowRight, CheckCircle2 } from "lucide-react";
import { capabilityLevelInsignia, capabilityLevelNames } from "./capabilityJourney";
import { careerStepReadiness, newPacRequirementsForCareerStep, nucleoTecnicoCareerLadder, type PacRequirement } from "./careerLadder";
import type { Library } from "./journeyRemote";
import type { ResponsibilityClaim, ResponsibilityReadiness } from "./responsibilityJourney";

type Go = (view: "capacidade" | "responsabilidade", id?: string, tab?: string, mode?: string) => void;

export function CareerLadderPanel({ library, certifiedLevels, claims, collaboratorId, go }: { library: Library; certifiedLevels: Map<string, number>; claims: ResponsibilityClaim[]; collaboratorId: string; go: Go }) {
  const ladder = nucleoTecnicoCareerLadder;
  const capabilityByCode = new Map(library.capabilities.map((capability) => [capability.code, capability]));
  const steps = ladder.steps.map((step) => ({
    step,
    readiness: careerStepReadiness(library, ladder, step.id, certifiedLevels, claims, collaboratorId),
    addedRequirements: newPacRequirementsForCareerStep(library, ladder, step.id),
  }));
  const next = steps.find(({ readiness }) => !readiness.eligible);
  const capabilityChip = (requirement: PacRequirement) => {
    const level = certifiedLevels.get(requirement.capabilityCode) ?? 0;
    const complete = level >= requirement.minimumLevel;
    const capability = capabilityByCode.get(requirement.capabilityCode);
    const levelName = capabilityLevelNames[requirement.minimumLevel];
    const label = capability?.title ?? requirement.capabilityCode;
    return <button key={requirement.capabilityCode} type="button" onClick={() => go("capacidade", requirement.capabilityCode)} aria-label={`${requirement.capabilityCode} · ${label} · ${levelName}`} title={`${requirement.capabilityCode} · ${label} · ${levelName}`} className={`inline-flex items-center gap-1 border px-2 py-1 text-[11px] font-medium ${complete ? "border-emerald-500 bg-white text-emerald-900 hover:bg-emerald-50" : "border-zinc-300 bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}><span>{label}</span><img src={capabilityLevelInsignia[requirement.minimumLevel]} alt="" className="h-4 w-4 object-contain" loading="lazy" decoding="async" /></button>;
  };
  const responsibilityChip = (item: ResponsibilityReadiness) => {
    const granted = item.status === "concedida";
    const requested = item.status === "solicitada";
    return <button key={item.responsibility.sourceId} type="button" onClick={() => go("responsabilidade", item.responsibility.sourceId)} className={`border px-2 py-1 text-[11px] font-medium ${granted ? "border-emerald-300 bg-emerald-50 text-emerald-900" : requested ? "border-sky-300 bg-sky-50 text-sky-900" : "border-teal-300 bg-white text-teal-900 hover:bg-teal-50"}`}>{item.responsibility.title}</button>;
  };

  return <section className="border bg-white">
    <div className="border-b p-4">
      <p className="text-xs font-semibold uppercase text-violet-700">Matriz de jornada</p>
      <h2 className="mt-2 text-lg font-semibold">{ladder.title}</h2>
      <p className="mt-1 max-w-3xl text-sm text-zinc-600">{ladder.summary} A promoção exige os dois requisitos: pontos certificados e responsabilidades formalmente concedidas.</p>
      <p className="mt-3 text-xs font-semibold uppercase text-violet-800">Escopo integrado: {ladder.scope}</p>
      {next && <p className="mt-3 text-sm font-semibold text-violet-900">Próximo cargo: {next.step.title}</p>}
    </div>
    <div className="divide-y">
      {steps.map(({ step, readiness, addedRequirements }, index) => {
        const nextCapability = addedRequirements.find((requirement) => (certifiedLevels.get(requirement.capabilityCode) ?? 0) < requirement.minimumLevel) ?? readiness.missingCapabilities[0];
        const isCrossNucleus = step.nucleiRequired > 1;
        return <article key={step.id} className="px-4 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className={`grid h-7 w-7 place-items-center border text-xs font-bold ${readiness.eligible ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-violet-300 bg-violet-50 text-violet-800"}`}>{readiness.eligible ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span>
                <div><h3 className="text-base font-semibold">{step.title}</h3><p className="text-xs text-zinc-600">{step.function}</p></div>
              </div>
              <p className={`mt-3 text-xs font-semibold ${readiness.eligible ? "text-emerald-800" : "text-amber-800"}`}>{readiness.eligible ? "Elegível para solicitação administrativa" : isCrossNucleus ? `Requer cobertura de ${step.nucleiRequired} núcleos` : "Em desenvolvimento"}</p>
            </div>
            <div className="grid min-w-48 grid-cols-2 gap-2 text-right text-xs">
              <div><strong className="block text-base">{readiness.completedCapabilityPoints}/{readiness.capabilityPoints}</strong><span className="text-zinc-600">pontos certificados</span></div>
              <div><strong className="block text-base">{readiness.grantedResponsibilities}/{readiness.responsibilityTarget}</strong><span className="text-zinc-600">responsabilidades</span></div>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div>
              <div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase text-zinc-500">Capacidades deste cargo</p><span className="text-xs font-semibold text-violet-800">{addedRequirements.length} novas ou evoluídas</span></div>
              <div className="flex flex-wrap gap-1">{addedRequirements.map(capabilityChip)}</div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase text-zinc-500">PAC acumulado</p><span className="text-xs font-semibold text-zinc-600">{readiness.pac.length} capacidades</span></div>
              <div className="flex flex-wrap gap-1">{readiness.pac.map(capabilityChip)}</div>
              {readiness.missingCapabilityPoints > 0 && <p className="mt-2 text-xs text-amber-800">Faltam {readiness.missingCapabilityPoints} pontos certificados para este cargo.</p>}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase text-zinc-500">Caminhos de responsabilidade</p><span className="text-xs font-semibold text-violet-800">até {readiness.responsibilityTarget}</span></div>
              <div className="flex flex-wrap gap-1">{readiness.responsibilityCandidates.map(responsibilityChip)}</div>
              {!readiness.responsibilityCandidates.length && <p className="text-xs text-zinc-600">Conclua capacidades do PAC para liberar os primeiros caminhos.</p>}
              {readiness.missingResponsibilityCount > 0 && <p className="mt-2 text-xs text-amber-800">Faltam {readiness.missingResponsibilityCount} responsabilidades concedidas entre as que suas capacidades habilitam.</p>}
              {isCrossNucleus && <p className="mt-2 text-xs text-violet-800">Depois da maturidade total do Núcleo Técnico, este marco depende da cobertura dos demais núcleos.</p>}
            </div>
          </div>
          {!readiness.eligible && nextCapability && <button type="button" onClick={() => go("capacidade", nextCapability.capabilityCode)} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline">Abrir ficha da próxima capacidade recomendada <ArrowRight className="h-4 w-4" /></button>}
        </article>;
      })}
    </div>
  </section>;
}
