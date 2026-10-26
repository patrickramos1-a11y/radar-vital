import { ArrowRight } from "lucide-react";
import { capabilityCatalogue, capabilityLevelNames, type CapabilityLevel, type CapabilityRecord } from "./capabilityJourney";
import { editorial, firstLetterUpper } from "./capabilityPresentationData";

export function CapabilityPurpose({ item }: { item: CapabilityRecord }) {
  const content = editorial[item.code];
  return <div className="cap-purpose">
    <p className="cap-purpose-lead">{content?.lead ?? item.detail.statement}</p>
    {content && <><p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-700">{content.detail}</p>
      <div className="cap-purpose-highlights">{content.highlights.map((highlight) => <span key={highlight}>{highlight}</span>)}</div></>}
  </div>;
}
export function CapabilityPrerequisites({ value, currentCode, onOpen, certifiedLevels = new Map() }: { value: string; currentCode: string; onOpen: (code: string) => void; certifiedLevels?: Map<string, CapabilityLevel> }) {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const usedBy = capabilityCatalogue.filter((candidate) => candidate.code !== currentCode
    && candidate.detail.prerequisites.includes(currentCode));
  return <div className="space-y-3">{lines.map((line, index) => {
    const divider = line.indexOf(":");
    const stage = divider >= 0 ? line.slice(0, divider) : "Condição";
    const requirement = divider >= 0 ? line.slice(divider + 1).trim() : line;
    const relations = [...requirement.matchAll(/\b([TFE]\d{2})\b[^—\n]*—\s*(Assistido|Autônomo|Multiplicador)/g)]
      .map((match) => ({ code: match[1], level: match[2], record: capabilityCatalogue.find((candidate) => candidate.code === match[1]) }))
      .filter((relation) => relation.record);
    return <div key={`${stage}-${index}`} className="border-l-2 border-teal-300 pl-3">
      <strong className="text-xs text-zinc-800">{stage}</strong>
      <p className="mt-0.5 text-xs leading-relaxed text-zinc-600">{firstLetterUpper(requirement)}</p>
      {relations.length > 0 && <div className="mt-2 space-y-2">{relations.map(({ code, level, record }) => {
        const certified = certifiedLevels.get(code) ?? 0;
        const needed = capabilityLevelNames.indexOf(level as (typeof capabilityLevelNames)[number]) as CapabilityLevel;
        const ready = certified >= needed;
        return <div key={`${code}-${level}`} className="flex flex-wrap items-center justify-between gap-2 border border-teal-100 bg-teal-50/60 px-2 py-2 text-xs">
          <div><strong className="text-teal-900">{code} · {record!.title}</strong><p className="mt-0.5 text-zinc-600">Necessário: {level} · Seu nível: <span className={ready ? "font-semibold text-teal-700" : "font-semibold text-amber-700"}>{certified ? capabilityLevelNames[certified] : "Ainda não certificado"}</span></p></div>
          <button type="button" aria-label={`${code} · ${record!.title} · ${ready && certified < 3 ? "Solicitar próximo nível" : ready ? "Ver capacidade" : "Iniciar jornada"}`} onClick={() => onOpen(code)} className="inline-flex items-center gap-1 border border-teal-200 bg-white px-2 py-1 font-medium text-teal-800 hover:border-teal-600">
            {ready && certified < 3 ? "Solicitar próximo nível" : ready ? "Ver capacidade" : "Iniciar jornada"} <ArrowRight className="h-3 w-3 shrink-0" />
          </button>
        </div>;
      })}</div>}
    </div>;
  })}
    {usedBy.length > 0 && <div className="border-t pt-3"><strong className="text-xs text-zinc-800">Esta capacidade abre caminho para</strong>
      <p className="mt-1 text-xs leading-relaxed text-zinc-600">Seu nível atual aqui: <strong>{certifiedLevels.get(currentCode) ? capabilityLevelNames[certifiedLevels.get(currentCode)!] : "Ainda não certificado"}</strong>. Conclua esta jornada para avançar nas capacidades abaixo.</p>
      <div className="mt-2 flex flex-wrap gap-2">{usedBy.map((candidate) => <button type="button" key={candidate.code} onClick={() => onOpen(candidate.code)} className="inline-flex items-center gap-1 border border-zinc-200 bg-white px-2 py-1 text-left text-xs font-medium text-teal-800 hover:border-teal-600">{candidate.code} · {candidate.title}<ArrowRight className="h-3 w-3 shrink-0" /></button>)}</div>
    </div>}
  </div>;
}
