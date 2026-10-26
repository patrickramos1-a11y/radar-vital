import { useMemo, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { capabilityLevelInsignia, capabilityLevelNames, type CapabilityLevel } from "./capabilityJourney";
import { careerStepReadiness, maximumCapabilityLevelForCareerStep, nucleoTecnicoCareerLadder, responsibilitiesForCareerStep } from "./careerLadder";
import type { Library } from "./journeyRemote";
import { responsibilityReadiness, type ResponsibilityClaim, type ResponsibilityReadiness } from "./responsibilityJourney";

type Go = (view: "responsabilidade", id?: string, tab?: string, mode?: string) => void;
type Capability = Library["capabilities"][number];

const levels: CapabilityLevel[] = [1, 2, 3];

function CapabilityScenarioGrid({ requirements, certifiedLevels, scenarioLevels, scenarioChanges, onSelect }: {
  requirements: Array<{ capability: Capability; maximumLevel: CapabilityLevel; requiredLevel: CapabilityLevel }>;
  certifiedLevels: Map<string, number>;
  scenarioLevels: Map<string, number>;
  scenarioChanges: Map<string, CapabilityLevel>;
  onSelect: (capabilityCode: string, level: CapabilityLevel) => void;
}) {
  return <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">{requirements.map(({ capability, maximumLevel, requiredLevel }) => {
    const certified = certifiedLevels.get(capability.code) ?? 0;
    const selected = scenarioLevels.get(capability.code) ?? 0;
    return <div key={capability.code} className={`border bg-white p-2 ${scenarioChanges.has(capability.code) || requiredLevel > 0 ? "border-sky-400" : "border-zinc-200"}`}>
      <div className="flex items-start justify-between gap-2"><p className="min-w-0 text-xs font-semibold text-zinc-900"><span className="text-sky-800">{capability.code}</span> · {capability.title}</p><span className="shrink-0 text-[10px] text-zinc-500">Real: {certified ? capabilityLevelNames[certified as CapabilityLevel] : "--"}</span></div>
      <div className={`mt-2 grid gap-1 ${maximumLevel === 1 ? "grid-cols-1" : maximumLevel === 2 ? "grid-cols-2" : "grid-cols-3"}`} role="group" aria-label={`Nível simulado para ${capability.title}`}>{levels.filter((level) => level <= maximumLevel).map((level) => {
        const achieved = level <= selected;
        const certifiedLevel = level <= certified;
        return <button key={level} type="button" disabled={level < certified || level < requiredLevel} aria-pressed={selected === level} title={certifiedLevel ? `Certificado: ${capabilityLevelNames[level]}` : achieved ? `Simulado: ${capabilityLevelNames[level]}` : `Simular ${capabilityLevelNames[level]}`} onClick={() => onSelect(capability.code, level)} className={`grid h-8 place-items-center border ${certifiedLevel ? "border-emerald-600 bg-emerald-50" : achieved ? "border-sky-600 bg-sky-50" : "border-zinc-200 bg-white opacity-35 grayscale hover:opacity-100 hover:grayscale-0"} disabled:cursor-not-allowed`}><img src={capabilityLevelInsignia[level]} alt={capabilityLevelNames[level]} className="h-6 w-6 object-contain" loading="lazy" decoding="async" /></button>;
      })}</div>
    </div>;
  })}</div>;
}

export function CareerLadderPanel({ library, certifiedLevels, claims, collaboratorId, go }: { library: Library; certifiedLevels: Map<string, number>; claims: ResponsibilityClaim[]; collaboratorId: string; go: Go }) {
  const ladder = nucleoTecnicoCareerLadder;
  const [scenarioChanges, setScenarioChanges] = useState<Map<string, CapabilityLevel>>(new Map());
  const [selectedResponsibilityIds, setSelectedResponsibilityIds] = useState<Set<string>>(new Set());
  const selectedRequirements = useMemo(() => {
    const requirements = new Map<string, CapabilityLevel>();
    library.responsibilities.filter((responsibility) => selectedResponsibilityIds.has(responsibility.sourceId)).forEach((responsibility) => {
      responsibility.requiredCapabilities.forEach((requirement) => requirements.set(requirement.capabilityCode, Math.max(requirements.get(requirement.capabilityCode) ?? 0, requirement.minimumLevel) as CapabilityLevel));
    });
    return requirements;
  }, [library.responsibilities, selectedResponsibilityIds]);
  const scenarioLevels = useMemo(() => {
    const next = new Map(certifiedLevels);
    scenarioChanges.forEach((level, code) => {
      if (selectedRequirements.has(code)) next.set(code, level);
    });
    selectedRequirements.forEach((level, code) => next.set(code, Math.max(next.get(code) ?? 0, level)));
    return next;
  }, [certifiedLevels, scenarioChanges, selectedRequirements]);
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

  const toggleResponsibility = (responsibilityId: string) => {
    setSelectedResponsibilityIds((current) => {
      const next = new Set(current);
      if (next.has(responsibilityId)) next.delete(responsibilityId);
      else next.add(responsibilityId);
      return next;
    });
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
      {(scenarioChanges.size > 0 || selectedResponsibilityIds.size > 0) && <button type="button" onClick={() => { setScenarioChanges(new Map()); setSelectedResponsibilityIds(new Set()); }} className="inline-flex items-center gap-1 border border-sky-700 bg-white px-3 py-2 text-xs font-semibold text-sky-800 hover:bg-sky-50"><RotateCcw className="h-3.5 w-3.5" /> Limpar marcações</button>}
    </div>

    <div className="divide-y">
      {ladder.steps.map((step, index) => {
        const readiness = careerStepReadiness(library, ladder, step.id, scenarioLevels, claims, collaboratorId);
        const ownClaims = claims.filter((claim) => claim.collaborator_id === collaboratorId);
        const capabilityByCode = new Map(library.capabilities.map((capability) => [capability.code, capability]));
        const maximumLevel = maximumCapabilityLevelForCareerStep(library, ladder, step.id);
        const scenarioCapabilities = [...selectedRequirements.entries()]
          .filter(([, requiredLevel]) => requiredLevel <= maximumLevel)
          .map(([capabilityCode, requiredLevel]) => ({ capability: capabilityByCode.get(capabilityCode), maximumLevel, requiredLevel }))
          .filter((item): item is { capability: Capability; maximumLevel: CapabilityLevel; requiredLevel: CapabilityLevel } => Boolean(item.capability));
        const responsibilityOptions = responsibilitiesForCareerStep(library, ladder, step.id)
          .map((responsibility) => responsibilityReadiness(responsibility, scenarioLevels, ownClaims))
          .sort((left, right) => left.unmet.length - right.unmet.length || left.responsibility.title.localeCompare(right.responsibility.title, "pt-BR"));
        const isCrossNucleus = step.nucleiRequired > 1;
        return <article key={step.id} className="px-4 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2"><span className={`grid h-7 w-7 place-items-center border text-xs font-bold ${readiness.eligible ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-violet-300 bg-violet-50 text-violet-800"}`}>{readiness.eligible ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span><div><h3 className="text-base font-semibold">{step.title}</h3><p className="text-xs text-zinc-600">{step.function}</p></div></div>
              <p className={`mt-3 text-xs font-semibold ${readiness.eligible ? "text-emerald-800" : "text-amber-800"}`}>{readiness.eligible ? "Elegível para solicitação administrativa" : isCrossNucleus ? `Requer cobertura de ${step.nucleiRequired} núcleos` : "Em desenvolvimento"}</p>
            </div>
            <div className="grid min-w-48 grid-cols-2 gap-2 text-right text-xs"><div><strong className="block text-base">{readiness.completedCapabilityPoints}/{readiness.capabilityPoints}</strong><span className="text-zinc-600">pontos no cenário</span></div><div><strong className="block text-base">{readiness.grantedResponsibilities}/{readiness.responsibilityTarget}</strong><span className="text-zinc-600">responsabilidades</span></div></div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="border bg-zinc-50 p-3">
              <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase text-zinc-500">Responsabilidades disponíveis</p><span className="text-xs font-semibold text-violet-800">até {readiness.responsibilityTarget} concedidas</span></div>
              <p className="mt-1 text-xs text-zinc-600">Marque responsabilidades para formar uma jornada pessoal. O cargo limita as concessões, não as possibilidades que podem ser planejadas.</p>
              <div className="mt-3 grid gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{responsibilityOptions.map((item) => {
                const selected = selectedResponsibilityIds.has(item.responsibility.sourceId);
                const status = selected ? "No percurso" : item.unmet.length === 0 ? "Já habilitada" : `${item.unmet.length} requisito(s)`;
                return <button key={item.responsibility.sourceId} type="button" aria-pressed={selected} onClick={() => toggleResponsibility(item.responsibility.sourceId)} title={`${selected ? "Remover" : "Adicionar"} ${item.responsibility.title} ${selected ? "do" : "ao"} percurso`} className={`min-h-11 border px-2 py-1.5 text-left text-[10px] font-medium ${selected ? "border-sky-600 bg-sky-50 text-sky-950" : item.unmet.length === 0 ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-zinc-200 bg-white text-zinc-700 hover:border-sky-400 hover:bg-sky-50"}`}><span className="block leading-tight">{item.responsibility.title}</span><span className="mt-0.5 block text-[9px] font-normal opacity-80">{status}</span></button>;
              })}</div>
              {readiness.allResponsibilityCandidates.length > readiness.responsibilityTarget && <p className="mt-3 text-xs text-zinc-600">{readiness.allResponsibilityCandidates.length - readiness.responsibilityTarget} caminhos já habilitados ficam para os próximos marcos.</p>}
              {readiness.missingResponsibilityCount > 0 && <p className="mt-3 text-xs text-amber-800">Faltam {readiness.missingResponsibilityCount} responsabilidades concedidas entre as que suas capacidades habilitam.</p>}
              {isCrossNucleus && <p className="mt-3 text-xs text-violet-800">Depois da maturidade total do Núcleo Técnico, este marco depende da cobertura dos demais núcleos.</p>}
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2"><div><p className="text-xs font-semibold uppercase text-zinc-500">Competências da jornada pessoal</p><p className="mt-1 text-xs text-zinc-600">{scenarioCapabilities.length > 0 ? "As competências abaixo foram liberadas pelas responsabilidades marcadas. As insígnias acesas já fazem parte do histórico da pessoa." : "Marque uma responsabilidade acima para revelar apenas as competências e níveis exigidos por aquele caminho."}</p></div><span className="text-xs font-semibold text-sky-800">{readiness.certifiedCapabilityCount} consolidadas</span></div>
              {scenarioCapabilities.length > 0 ? <CapabilityScenarioGrid requirements={scenarioCapabilities} certifiedLevels={certifiedLevels} scenarioLevels={scenarioLevels} scenarioChanges={scenarioChanges} onSelect={setScenarioLevel} /> : <div className="border border-dashed border-zinc-300 bg-zinc-50 px-3 py-5 text-xs text-zinc-600">Nenhuma competência foi incluída no percurso deste cenário.</div>}
              {readiness.missingCapabilityPoints > 0 && <p className="mt-3 text-xs text-amber-800">Faltam {readiness.missingCapabilityPoints} pontos no cenário para este cargo.</p>}
            </div>
          </div>
        </article>;
      })}
    </div>
  </section>;
}
