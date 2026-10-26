import { ArrowRight, CheckCircle2 } from "lucide-react";
import { capabilityLevelInsignia, capabilityLevelNames } from "./capabilityJourney";
import { careerStepReadiness, nucleoTecnicoCareerLadder } from "./careerLadder";
import type { Library } from "./journeyRemote";
import type { ResponsibilityClaim } from "./responsibilityJourney";

type Go = (view: "capacidade" | "responsabilidade", id?: string, tab?: string, mode?: string) => void;

export function CareerLadderPanel({ library, certifiedLevels, claims, collaboratorId, go }: { library: Library; certifiedLevels: Map<string, number>; claims: ResponsibilityClaim[]; collaboratorId: string; go: Go }) {
  const ladder = nucleoTecnicoCareerLadder;
  const capabilityByCode = new Map(library.capabilities.map((capability) => [capability.code, capability]));
  const responsibilityById = new Map(library.responsibilities.map((responsibility) => [responsibility.sourceId, responsibility]));
  const steps = ladder.steps.map((step) => ({
    step,
    readiness: careerStepReadiness(library, ladder, step.id, certifiedLevels, claims, collaboratorId),
    addedResponsibilities: step.responsibilityIds.map((id) => responsibilityById.get(id)).filter((responsibility): responsibility is NonNullable<typeof responsibility> => Boolean(responsibility)),
  }));
  const next = steps.find(({ readiness }) => !readiness.eligible);

  return <section className="border bg-white">
    <div className="border-b p-4">
      <p className="text-xs font-semibold uppercase text-violet-700">Matriz de jornada</p>
      <h2 className="mt-2 text-lg font-semibold">{ladder.title}</h2>
      <p className="mt-1 max-w-3xl text-sm text-zinc-600">{ladder.summary} Cada degrau soma o PAC e as responsabilidades dos degraus anteriores. A elegibilidade só acontece em 100% nos dois requisitos.</p>
      <p className="mt-3 text-xs font-semibold uppercase text-violet-800">Escopo integrado: {ladder.scope}</p>
      {next && <p className="mt-3 text-sm font-semibold text-violet-900">Próximo cargo: {next.step.title}</p>}
    </div>
    <div className="divide-y">
      {steps.map(({ step, readiness, addedResponsibilities }, index) => {
        const missingIds = new Set(readiness.missingResponsibilities.map((responsibility) => responsibility.sourceId));
        return <article key={step.id} className="px-4 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className={`grid h-7 w-7 place-items-center border text-xs font-bold ${readiness.eligible ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-violet-300 bg-violet-50 text-violet-800"}`}>{readiness.eligible ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span>
                <div><h3 className="text-base font-semibold">{step.title}</h3><p className="text-xs text-zinc-600">{step.function}</p></div>
              </div>
              <p className={`mt-3 text-xs font-semibold ${readiness.eligible ? "text-emerald-800" : "text-amber-800"}`}>{readiness.eligible ? "Elegível para solicitação administrativa" : "Em desenvolvimento"}</p>
            </div>
            <div className="grid min-w-48 grid-cols-2 gap-2 text-right text-xs">
              <div><strong className="block text-base">{readiness.completedCapabilityPoints}/{readiness.capabilityPoints}</strong><span className="text-zinc-600">pontos do PAC</span></div>
              <div><strong className="block text-base">{readiness.grantedResponsibilities}/{readiness.responsibilities.length}</strong><span className="text-zinc-600">responsabilidades</span></div>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">PAC acumulado</p>
              <div className="flex flex-wrap gap-1">{readiness.pac.map((requirement) => {
                const level = certifiedLevels.get(requirement.capabilityCode) ?? 0;
                const complete = level >= requirement.minimumLevel;
                const capability = capabilityByCode.get(requirement.capabilityCode);
                const levelName = capabilityLevelNames[requirement.minimumLevel];
                const label = capability?.title ?? requirement.capabilityCode;
                return <button key={requirement.capabilityCode} type="button" onClick={() => go("capacidade", requirement.capabilityCode)} aria-label={`${requirement.capabilityCode} · ${label} · ${levelName}`} title={`${requirement.capabilityCode} · ${label} · ${levelName}`} className={`inline-flex items-center gap-1 border px-2 py-1 text-[11px] font-medium ${complete ? "border-emerald-500 bg-white text-emerald-900 hover:bg-emerald-50" : "border-zinc-300 bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}><span>{label}</span><img src={capabilityLevelInsignia[requirement.minimumLevel]} alt="" className="h-4 w-4 object-contain" loading="lazy" decoding="async" /></button>;
              })}</div>
              {readiness.missingCapabilities.length > 0 && <p className="mt-2 text-xs text-amber-800">Faltam {readiness.missingCapabilities.length} capacidades ou níveis para completar o PAC.</p>}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase text-zinc-500">Responsabilidades deste cargo</p><span className="text-xs font-semibold text-violet-800">{addedResponsibilities.length} novas</span></div>
              <div className="flex flex-wrap gap-1">{addedResponsibilities.map((responsibility) => <button key={responsibility.sourceId} type="button" onClick={() => go("responsabilidade", responsibility.sourceId)} className={`border px-2 py-1 text-[11px] font-medium ${missingIds.has(responsibility.sourceId) ? "border-amber-300 bg-amber-50 text-amber-900" : "border-emerald-300 bg-emerald-50 text-emerald-900"}`}>{responsibility.title}</button>)}</div>
              <details className="mt-3 border-t pt-2 text-xs"><summary className="cursor-pointer font-semibold text-zinc-700">Responsabilidades acumuladas · {readiness.responsibilities.length}</summary><div className="mt-2 flex flex-wrap gap-1">{readiness.responsibilities.map((responsibility) => <button key={responsibility.sourceId} type="button" onClick={() => go("responsabilidade", responsibility.sourceId)} className={`border px-2 py-1 text-[11px] font-medium ${missingIds.has(responsibility.sourceId) ? "border-amber-300 bg-amber-50 text-amber-900" : "border-emerald-300 bg-emerald-50 text-emerald-900"}`}>{responsibility.title}</button>)}</div></details>
              {readiness.missingResponsibilities.length > 0 && <p className="mt-2 text-xs text-amber-800">Faltam {readiness.missingResponsibilities.length} responsabilidades concedidas.</p>}
            </div>
          </div>
          {!readiness.eligible && readiness.missingCapabilities[0] && <button type="button" onClick={() => go("capacidade", readiness.missingCapabilities[0].capabilityCode)} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline">Abrir ficha da próxima capacidade <ArrowRight className="h-4 w-4" /></button>}
        </article>;
      })}
    </div>
  </section>;
}
