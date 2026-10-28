import { ArrowRight, CheckCircle2 } from "lucide-react";
import { capabilityLevelInsignia, capabilityLevelNames, type CapabilityLevel } from "./capabilityJourney";
import { capabilityStickerPath } from "./CapabilityVisualIdentity";
import { competencyRequirements } from "./responsibilityJourney";
import type { Library } from "./journeyRemote";

interface Props {
  requirements: ReturnType<typeof competencyRequirements>;
  capabilities: Library["capabilities"];
  certifiedLevels: Map<string, CapabilityLevel>;
  onOpen: (code: string) => void;
}

export function CompetencyComposition({ requirements, capabilities, certifiedLevels, onOpen }: Props) {
  const byCode = new Map(capabilities.map((item) => [item.code, item]));
  const groups = ([3, 2, 1] as CapabilityLevel[]).map((level) => ({
    level, items: requirements.filter((entry) => entry.minimumLevel === level),
  })).filter((group) => group.items.length);

  return <section className="border bg-white p-5">
    <p className="cap-eyebrow">Composição da competência</p>
    <h2 className="mt-1 text-xl font-semibold">Capacidades e níveis exigidos</h2>
    <p className="mt-1 text-sm text-zinc-600">A competência se forma quando todos os requisitos são atendidos no nível indicado.</p>
    <div className="mt-4 flex flex-wrap gap-2">{groups.map(({ level, items }) => <span key={level} className={`cap-level-badge cap-level-badge-${level} inline-flex items-center gap-1.5`}><img src={capabilityLevelInsignia[level]} alt="" className="h-6 w-6 object-contain" />{items.length} {items.length === 1 ? "capacidade" : "capacidades"} em <strong>{capabilityLevelNames[level]}</strong></span>)}</div>
    <div className="mt-5 space-y-5">{groups.map(({ level, items }) => {
      const metCount = items.filter((entry) => (certifiedLevels.get(entry.capabilityCode) ?? 0) >= level).length;
      return <section key={level} className={`border-t-4 bg-zinc-50 ${level === 3 ? "border-amber-500" : level === 2 ? "border-teal-600" : "border-sky-500"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b bg-white px-4 py-3">
          <div className="flex min-w-0 items-start gap-3"><img src={capabilityLevelInsignia[level]} alt="" className="h-12 w-12 shrink-0 object-contain" /><div><p className="text-xs font-semibold uppercase text-zinc-600">Capacidades exigidas em</p><h3 className="mt-1 text-base font-semibold">{capabilityLevelNames[level]}</h3><p className="mt-1 text-xs leading-relaxed text-zinc-600">{level === 3 ? "Multiplica o método e sustenta decisões mais complexas." : level === 2 ? "Executa com autonomia nas situações usuais." : "Atua com acompanhamento e revisão compatíveis."}</p></div></div>
          <span className={`cap-level-badge cap-level-badge-${level} inline-flex items-center gap-1.5`}><img src={capabilityLevelInsignia[level]} alt="" className="h-5 w-5 object-contain" />{items.length} no total · {metCount} atendidas · {items.length - metCount} pendentes</span>
        </div>
        <div className="divide-y bg-white">{items.map((entry) => {
          const capability = byCode.get(entry.capabilityCode);
          const attained = certifiedLevels.get(entry.capabilityCode) ?? 0;
          const met = attained >= entry.minimumLevel;
          return <button type="button" key={entry.capabilityCode} onClick={() => onOpen(entry.capabilityCode)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-teal-50">
            <img src={capabilityStickerPath(entry.capabilityCode)} alt="" className={`h-14 w-14 shrink-0 object-contain ${attained ? "" : "grayscale opacity-40"}`} loading="lazy" />
            <span className="min-w-0 flex-1"><strong className="block text-sm">{capability?.title ?? entry.capabilityCode}</strong><span className="mt-1 block text-xs text-zinc-600">{entry.capabilityCode} · Exigido: {capabilityLevelNames[entry.minimumLevel]}</span><span className={`mt-1 block text-xs font-semibold ${met ? "text-emerald-800" : "text-amber-800"}`}>{met ? `Atendida: ${capabilityLevelNames[attained as CapabilityLevel]}` : attained ? `Atual: ${capabilityLevelNames[attained as CapabilityLevel]}` : "Ainda não certificada"}</span></span>
            <span className={`relative h-10 w-10 shrink-0 ${met ? "" : "grayscale opacity-35"}`} title={`Nível exigido: ${capabilityLevelNames[entry.minimumLevel]}`}><img src={capabilityLevelInsignia[entry.minimumLevel]} alt="" className="h-full w-full object-contain" />{met && <CheckCircle2 aria-label="Requisito atendido" className="absolute -bottom-1 -right-1 h-4 w-4 fill-white text-emerald-700" />}</span><ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-teal-700" />
          </button>;
        })}</div>
      </section>;
    })}</div>
  </section>;
}
