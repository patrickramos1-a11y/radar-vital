import { ArrowRight } from "lucide-react";
import type { CapabilityRecord } from "./capabilityJourney";
import { capabilityCoverPath, capabilityVisual, capabilityVisualStyle } from "./capabilityVisuals";

export function CapabilityCatalogCard({ item, onOpen }: { item: CapabilityRecord; onOpen: () => void }) {
  const visual = capabilityVisual(item.code);
  return <button type="button" className="cap-catalog-item group cap-themed" style={capabilityVisualStyle(item.code)} onClick={onOpen}>
    <img className="cap-catalog-cover" src={capabilityCoverPath(item.code)} alt={`Capa ilustrada de ${item.code}: ${item.title}`} width={1600} height={900} loading="lazy" decoding="async" />
    <span className="cap-catalog-detail">
      <span className="cap-catalog-kicker"><span className="cap-catalog-nature">{item.nature}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
      <strong className="cap-catalog-title">{item.title}</strong>
      <span className="cap-catalog-concept">{visual?.concept ?? item.summary}</span>
    </span>
  </button>;
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
