import { ArrowRight } from "lucide-react";
import { capabilityLevelNames, type CapabilityLevel, type CapabilityRecord } from "./capabilityJourney";
import { capabilityCoverPath, capabilityVisual, capabilityVisualStyle } from "./capabilityVisuals";

export function CapabilityCatalogCard({ item, onOpen, certifiedLevel = 0, trainingLevel = 0, onRequestLevel }: {
  item: CapabilityRecord;
  onOpen: () => void;
  certifiedLevel?: number;
  trainingLevel?: number;
  onRequestLevel?: (level: CapabilityLevel) => void;
}) {
  const visual = capabilityVisual(item.code);
  const nextLevel = certifiedLevel < 3 ? Math.max(1, certifiedLevel + 1) as CapabilityLevel : null;
  const activeTrainingLevel = trainingLevel > certifiedLevel ? trainingLevel as CapabilityLevel : null;
  return <article className="cap-catalog-item group cap-themed" style={capabilityVisualStyle(item.code)}>
    <button type="button" className="block w-full text-left" onClick={onOpen}>
      <img className="cap-catalog-cover" src={capabilityCoverPath(item.code)} alt={`Capa ilustrada de ${item.code}: ${item.title}`} width={1600} height={900} loading="lazy" decoding="async" />
      <span className="cap-catalog-detail">
        <span className="cap-catalog-kicker"><span className="cap-catalog-nature">{item.nature}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
        <strong className="cap-catalog-title">{item.title}</strong>
        <span className="cap-catalog-concept">{visual?.concept ?? item.summary}</span>
      </span>
    </button>
    <div className="border-t px-3 py-2 text-xs">
      {certifiedLevel > 0 ? <p className="text-emerald-800">Capacidade atual: <strong>{capabilityLevelNames[certifiedLevel]}</strong>{activeTrainingLevel ? <span className="text-sky-800"> · Capacitação solicitada: <strong>{capabilityLevelNames[activeTrainingLevel]}</strong></span> : nextLevel && <span className="text-zinc-600"> · Próximo nível: {capabilityLevelNames[nextLevel]}</span>}</p> : activeTrainingLevel ? <p className="text-sky-800">Capacitação solicitada: <strong>{capabilityLevelNames[activeTrainingLevel]}</strong></p> : <p className="text-amber-800">Falta iniciar: <strong>Assistido</strong></p>}
      {activeTrainingLevel && <p className="mt-1 text-[11px] text-sky-800">Próximo passo: concluir os critérios do nível solicitado e aguardar a validação.</p>}
      {nextLevel && onRequestLevel && <button type="button" onClick={() => onRequestLevel(nextLevel)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900"><ArrowRight className="h-3.5 w-3.5" /> {activeTrainingLevel ? "Ver solicitação e critérios" : `Solicitar ${capabilityLevelNames[nextLevel]}`}</button>}
    </div>
  </article>;
}

export function CapabilityHero({ item }: { item: CapabilityRecord }) {
  const visual = capabilityVisual(item.code);
  return <div className="cap-identity-hero cap-themed" style={capabilityVisualStyle(item.code)}>
    <img src={capabilityCoverPath(item.code)} alt={`Capa ilustrada de ${item.code}: ${item.title}`} width={1600} height={900} decoding="async" />
    {visual && <p className="cap-identity-concept">{visual.concept}</p>}
  </div>;
}

export function CapabilityIdentityStrip({ item }: { item: CapabilityRecord }) {
  const visual = capabilityVisual(item.code);
  return <div className="cap-identity-strip cap-themed" style={capabilityVisualStyle(item.code)}>
    <img src={capabilityCoverPath(item.code)} alt="" width={1600} height={900} decoding="async" />
    <div className="min-w-0"><span className="cap-identity-code">{item.nature} · {item.code}</span><strong>{item.title}</strong><p>{visual?.concept ?? item.summary}</p></div>
  </div>;
}

export function CapabilityQueueThumb({ code }: { code: string }) {
  return <img className="cap-queue-thumb" src={capabilityCoverPath(code)} alt="" width={1600} height={900} loading="lazy" decoding="async" />;
}
