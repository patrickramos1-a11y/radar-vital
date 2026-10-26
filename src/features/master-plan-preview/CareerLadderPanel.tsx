import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { capabilityLevelNames } from "./capabilityJourney";
import { careerLadders, careerStepReadiness } from "./careerLadder";
import type { Library } from "./journeyRemote";
import type { ResponsibilityClaim } from "./responsibilityJourney";

type Go = (view: "capacitacoes" | "responsabilidade", id?: string, tab?: string, mode?: string) => void;

export function CareerLadderPanel({ library, certifiedLevels, claims, collaboratorId, go }: { library: Library; certifiedLevels: Map<string, number>; claims: ResponsibilityClaim[]; collaboratorId: string; go: Go }) {
  const [ladderId, setLadderId] = useState(careerLadders[0].id);
  const ladder = careerLadders.find((item) => item.id === ladderId) ?? careerLadders[0];
  const steps = ladder.steps.map((step) => ({ step, readiness: careerStepReadiness(library, ladder, step.id, certifiedLevels, claims, collaboratorId) }));
  const next = steps.find(({ readiness }) => !readiness.eligible);

  return <section className="border bg-white">
    <div className="border-b p-4">
      <p className="text-xs font-semibold uppercase text-violet-700">Matriz de jornada</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{ladder.title}</h2>
          <p className="mt-1 max-w-3xl text-sm text-zinc-600">{ladder.summary} Cada degrau soma o PAC e as responsabilidades dos degraus anteriores. A elegibilidade só acontece em 100% nos dois requisitos.</p>
        </div>
        <label className="grid gap-1 text-xs font-semibold text-zinc-700">Setor da escada
          <select aria-label="Setor da escada" value={ladder.id} onChange={(event) => setLadderId(event.target.value)} className="min-w-72 border bg-white px-3 py-2 text-sm font-normal text-zinc-900">
            {careerLadders.map((item) => <option key={item.id} value={item.id}>{item.sector}</option>)}
          </select>
        </label>
      </div>
      {next && <p className="mt-3 text-sm font-semibold text-violet-900">Próximo cargo: {next.step.title}</p>}
    </div>
    <div className="divide-y">
      {steps.map(({ step, readiness }, index) => <article key={step.id} className="px-4 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`grid h-7 w-7 place-items-center border text-xs font-bold ${readiness.eligible ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-violet-300 bg-violet-50 text-violet-800"}`}>{readiness.eligible ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span>
              <div><h3 className="text-base font-semibold">{step.title}</h3><p className="text-xs text-zinc-600">{step.function}</p></div>
            </div>
            <p className={`mt-3 text-xs font-semibold ${readiness.eligible ? "text-emerald-800" : "text-amber-800"}`}>{readiness.eligible ? "Elegível para solicitação administrativa" : "Em desenvolvimento"}</p>
          </div>
          <div className="grid min-w-48 grid-cols-2 gap-2 text-right text-xs">
            <div><strong className="block text-base">{readiness.completedCapabilities}/{readiness.pac.length}</strong><span className="text-zinc-600">PAC completo</span></div>
            <div><strong className="block text-base">{readiness.grantedResponsibilities}/{readiness.responsibilities.length}</strong><span className="text-zinc-600">responsabilidades</span></div>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">PAC acumulado</p>
            {readiness.pac.length > 0 ? <div className="flex flex-wrap gap-1">{readiness.pac.map((requirement) => {
              const level = certifiedLevels.get(requirement.capabilityCode) ?? 0;
              const complete = level >= requirement.minimumLevel;
              return <button key={requirement.capabilityCode} type="button" onClick={() => go("capacitacoes", requirement.capabilityCode, "criterios", "colaborador")} className={`border px-2 py-1 text-[11px] font-medium ${complete ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900"}`}>{requirement.capabilityCode} · {capabilityLevelNames[requirement.minimumLevel]}</button>;
            })}</div> : <p className="text-xs text-zinc-600">Sem capacidades técnicas vinculadas neste degrau.</p>}
            {readiness.missingCapabilities.length > 0 && <p className="mt-2 text-xs text-amber-800">Faltam {readiness.missingCapabilities.length} capacidades ou níveis para completar o PAC.</p>}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-zinc-500">Responsabilidades acumuladas</p>
            <div className="flex flex-wrap gap-1">{readiness.responsibilities.map((responsibility) => <button key={responsibility.sourceId} type="button" onClick={() => go("responsabilidade", responsibility.sourceId)} className={`border px-2 py-1 text-[11px] font-medium ${readiness.missingResponsibilities.some((missing) => missing.sourceId === responsibility.sourceId) ? "border-amber-300 bg-amber-50 text-amber-900" : "border-emerald-300 bg-emerald-50 text-emerald-900"}`}>{responsibility.title}</button>)}</div>
            {readiness.missingResponsibilities.length > 0 && <p className="mt-2 text-xs text-amber-800">Faltam {readiness.missingResponsibilities.length} responsabilidades concedidas.</p>}
          </div>
        </div>
        {!readiness.eligible && readiness.missingCapabilities[0] && <button type="button" onClick={() => go("capacitacoes", readiness.missingCapabilities[0].capabilityCode, "criterios", "colaborador")} className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline">Abrir próxima capacidade necessária <ArrowRight className="h-4 w-4" /></button>}
      </article>)}
    </div>
  </section>;
}
