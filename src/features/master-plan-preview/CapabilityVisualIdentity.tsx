import { ArrowRight } from "lucide-react";
import { capabilityLevelInsignia, capabilityLevelNames, type CapabilityLevel, type CapabilityRecord } from "./capabilityJourney";
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
      <span className="cap-catalog-main">
        <img className="cap-catalog-sticker" src={`/capability-stickers/posters/${item.code}.png`} alt={`Figurinha ${item.code}: ${item.title}`} width={384} height={384} loading="lazy" decoding="async" />
        <span className="cap-catalog-detail">
          <span className="cap-catalog-kicker"><span className="cap-catalog-nature">{item.nature} · {item.code}</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
          <strong className="cap-catalog-title">{item.title}</strong>
          <span className="cap-catalog-concept">{visual?.concept ?? item.summary}</span>
        </span>
      </span>
    </button>
    <div className="cap-catalog-status">
      <div className="cap-catalog-levels" aria-label={`Níveis de ${item.title}`}>
        {([1, 2, 3] as CapabilityLevel[]).map((level) => {
          const state = level <= certifiedLevel ? "earned" : level === activeTrainingLevel ? "requested" : "missing";
          const label = state === "earned" ? `Habilitado: ${capabilityLevelNames[level]}` : state === "requested" ? `Solicitado: ${capabilityLevelNames[level]}` : `Falta: ${capabilityLevelNames[level]}`;
          return <span key={level} className={`cap-catalog-level cap-catalog-level-${state}`} title={label}><img src={capabilityLevelInsignia[level]} alt={label} loading="lazy" decoding="async" /></span>;
        })}
      </div>
      <div className="min-w-0 flex-1 text-xs">
        {certifiedLevel > 0 ? <p className="text-emerald-800">Habilitada até: <strong>{capabilityLevelNames[certifiedLevel]}</strong></p> : <p className="text-zinc-600">Ainda não habilitada</p>}
        {activeTrainingLevel ? <p className="mt-1 text-sky-800">Solicitada: <strong>{capabilityLevelNames[activeTrainingLevel]}</strong></p> : nextLevel ? <p className="mt-1 text-zinc-600">Falta: <strong>{capabilityLevelNames[nextLevel]}</strong></p> : <p className="mt-1 text-emerald-800">Todos os níveis habilitados</p>}
      </div>
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

export function CapabilityQueueThumb({ code, alt = "" }: { code: string; alt?: string }) {
  return <img className="cap-queue-thumb" src={`/capability-stickers/posters/${code}.png`} alt={alt} width={384} height={384} loading="lazy" decoding="async" />;
}

const stickerLevelCopy = ["Ainda não iniciada", "Assistido", "Autônomo", "Multiplicador"] as const;

export function CapabilityStickerCard({ item, certifiedLevel = 0, trainingLevel = 0, missingLevel, onOpen, onRequestLevel }: {
  item: CapabilityRecord;
  certifiedLevel?: number;
  trainingLevel?: number;
  missingLevel?: CapabilityLevel;
  onOpen: () => void;
  onRequestLevel?: (level: CapabilityLevel) => void;
}) {
  const currentLevel = Math.max(certifiedLevel, 0);
  const nextLevel = currentLevel < 3 ? Math.max(1, currentLevel + 1) as CapabilityLevel : null;
  const isInDevelopment = trainingLevel > currentLevel;
  const visibleLevels = missingLevel ? ([1, 2, 3] as CapabilityLevel[]).filter((level) => level < missingLevel) : [1, 2, 3] as CapabilityLevel[];
  return <article className={`cap-sticker-card ${currentLevel === 0 ? "cap-sticker-card-locked" : ""} ${missingLevel ? "cap-sticker-card-missing" : ""}`} style={capabilityVisualStyle(item.code)}>
    <button type="button" className="cap-sticker-open" onClick={onOpen}>
      <div className="cap-sticker-art"><img src={`/capability-stickers/posters/${item.code}.png`} alt={`Figurinha ${item.code}: ${item.title}`} loading="lazy" decoding="async" /></div>
      <div className="cap-sticker-body">
        <span className="cap-sticker-kicker"><span>{item.nature}</span><strong>{item.code}</strong></span>
        <strong className="cap-sticker-title">{item.title}</strong>
        <span className="cap-sticker-level-copy">Nível atual <strong>{stickerLevelCopy[currentLevel]}</strong></span>
        <span className="cap-sticker-levels" aria-label={`Níveis de ${item.title}`}>
          {visibleLevels.map((level) => <span key={level} className={level <= currentLevel ? "cap-sticker-level-earned" : ""} title={stickerLevelCopy[level]}><img src={capabilityLevelInsignia[level]} alt="" loading="lazy" decoding="async" /></span>)}
        </span>
      </div>
    </button>
    <div className="cap-sticker-status">
      {isInDevelopment ? <p>Solicitada para <strong>{stickerLevelCopy[trainingLevel]}</strong></p> : currentLevel === 3 ? <p className="text-emerald-800">Jornada concluída</p> : <p>{nextLevel ? <>Próximo nível: <strong>{stickerLevelCopy[nextLevel]}</strong></> : ""}</p>}
      {nextLevel && onRequestLevel && <button type="button" onClick={() => onRequestLevel(nextLevel)}>{isInDevelopment ? "Acompanhar solicitação" : `Solicitar ${stickerLevelCopy[nextLevel]}`}</button>}
    </div>
  </article>;
}
