import { Star, MessageCircle, ListChecks, ShieldCheck, Sparkles } from "lucide-react";
import { Client, COLLABORATOR_COLORS, COLLABORATOR_NAMES } from "@/types/client";
import type { AuditClientStatus } from "@/types/audit";

export type MobileCardAction = "comments" | "challenges" | "tasks";

interface MobileCompactGridProps {
  clients: Client[];
  highlightedClients: Set<string>;
  getActiveTaskCount: (clientId: string) => number;
  getCommentCount: (clientId: string) => number;
  onClientTap: (id: string) => void;
  getAuditStatus?: (clientId: string) => AuditClientStatus | undefined;
  onCardAction?: (id: string, action: MobileCardAction) => void;
  /** Universo Ramos accent color per card (sector color or collaborator color). */
  getAccentColor?: (client: Client) => string | null;
  /** Personal collaborator color, used only by the visible name. */
  getNameColor?: (client: Client) => string | null;
  getChallengeCount?: (clientId: string) => number;
}

export function MobileCompactGrid({
  clients,
  highlightedClients,
  getActiveTaskCount,
  getCommentCount,
  onClientTap,
  getAuditStatus,
  onCardAction,
  getAccentColor,
  getNameColor,
  getChallengeCount,
}: MobileCompactGridProps) {
  const getGridColumns = () => {
    const count = clients.length;
    if (onCardAction) return 2;
    if (count <= 8) return 2;
    if (count <= 15) return 3;
    if (count <= 25) return 4;
    return 5;
  };

  const columns = getGridColumns();

  return (
    <div className="h-full overflow-y-auto p-2">
      <div
        className={onCardAction ? "grid gap-2" : "grid gap-1.5"}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {clients.map((client, index) => (
          <CompactCard
            key={client.id}
            client={client}
            displayNumber={index + 1}
            isHighlighted={highlightedClients.has(client.id)}
            activeTaskCount={getActiveTaskCount(client.id)}
            commentCount={getCommentCount(client.id)}
            challengeCount={getChallengeCount?.(client.id) ?? 0}
            accentColor={getAccentColor?.(client) ?? null}
            nameColor={getNameColor?.(client) ?? null}
            onTap={onClientTap}
            auditStatus={getAuditStatus?.(client.id)}
            onCardAction={onCardAction}
          />
        ))}
      </div>
    </div>
  );
}


interface CompactCardProps {
  client: Client;
  displayNumber: number;
  isHighlighted: boolean;
  activeTaskCount: number;
  commentCount: number;
  challengeCount: number;
  accentColor: string | null;
  nameColor: string | null;
  onTap: (id: string) => void;
  auditStatus?: AuditClientStatus;
  onCardAction?: (id: string, action: MobileCardAction) => void;
}

function CompactCard({
  client,
  displayNumber,
  isHighlighted,
  activeTaskCount,
  commentCount,
  challengeCount,
  accentColor,
  nameColor,
  onTap,
  auditStatus,
  onCardAction,
}: CompactCardProps) {
  const activeCollaborators = COLLABORATOR_NAMES.filter(name => client.collaborators[name]);
  const isCollaborator = client.universeCategory === "COLABORADOR";
  const primaryColor = activeCollaborators.length > 0
    ? COLLABORATOR_COLORS[activeCollaborators[0]]
    : undefined;

  // Universo Ramos layout: compact header with counters + large logo/photo area.
  if (onCardAction) {
    // The card structure is always driven by its category color. For
    // collaborators this is the Ramos green; only the name uses profile color.
    const surfaceAccent = accentColor;

    return (
      <div
        className={`flex flex-col overflow-hidden rounded-xl border bg-card transition-all ${
          isHighlighted ? "ring-2 ring-blue-500" : ""
        }`}
        style={surfaceAccent
          ? { borderColor: surfaceAccent, boxShadow: `0 2px 10px -6px ${surfaceAccent}` }
          : undefined}
      >
        <div
          className="flex items-center gap-1 border-b border-border/60 px-1.5 py-1"
          style={surfaceAccent ? { backgroundColor: `${surfaceAccent}14`, borderBottomColor: surfaceAccent } : undefined}
        >
          <span
            className="flex h-4 min-w-[1rem] items-center justify-center rounded px-1 text-[9px] font-bold text-white"
            style={{ backgroundColor: accentColor ?? "hsl(var(--primary))" }}
          >
            {displayNumber.toString().padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => onTap(client.id)}
            className="min-w-0 flex-1 truncate text-left text-[11px] font-semibold leading-tight"
            style={nameColor ? { color: nameColor } : accentColor ? { color: accentColor } : undefined}
            title={client.name}
          >
            {client.name}
          </button>
          {auditStatus && <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600" />}
          {client.isPriority && <Star className="h-3 w-3 shrink-0 fill-amber-500 text-amber-500" />}
        </div>

        <div className="flex items-center justify-end gap-0.5 px-1 py-0.5">
          <HeaderCounter
            label="Comentários"
            count={commentCount}
            icon={<MessageCircle className="h-3.5 w-3.5 text-indigo-600" />}
            onClick={() => onCardAction(client.id, "comments")}
          />
          <HeaderCounter
            label="Desafios"
            count={challengeCount}
            icon={<Sparkles className="h-3.5 w-3.5 text-violet-600" />}
            onClick={() => onCardAction(client.id, "challenges")}
          />
          <HeaderCounter
            label="Tarefas"
            count={activeTaskCount}
            icon={<ListChecks className="h-3.5 w-3.5 text-amber-600" />}
            onClick={() => onCardAction(client.id, "tasks")}
          />
        </div>

        <button
          type="button"
          onClick={() => onTap(client.id)}
          aria-label={`Abrir Central de ${client.name}`}
          className="flex min-h-[104px] flex-1 items-center justify-center p-2 active:scale-[0.98]"
          style={surfaceAccent ? { backgroundColor: `${surfaceAccent}0D` } : undefined}
        >
          {client.logoUrl ? (
            <img
              src={client.logoUrl}
              alt={client.name}
              className={isCollaborator
                ? "h-20 w-20 rounded-full object-cover"
                : "max-h-20 w-full object-contain"}
            />
          ) : (
            <span
              className="text-2xl font-bold"
              style={{ color: accentColor ?? "hsl(var(--primary))" }}
            >
              {client.initials}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onTap(client.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onTap(client.id);
        }
      }}
      aria-label={`Abrir ${client.name}`}
      className={`relative flex flex-col rounded-lg overflow-hidden transition-all active:scale-[0.97] ${
        isHighlighted 
          ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30' 
          : 'border border-border bg-card'
      }`}
      style={{
        borderLeftWidth: primaryColor ? '3px' : undefined,
        borderLeftColor: primaryColor,
      }}
    >

      {/* Status indicators top-right */}
      <div className="absolute top-0.5 right-0.5 flex items-center gap-0.5">
        {auditStatus && (
          <ShieldCheck
            className={`h-2.5 w-2.5 ${
              auditStatus === 'validated'
                ? 'text-emerald-600'
                : auditStatus === 'completed'
                  ? 'text-sky-600'
                  : auditStatus === 'in_progress'
                    ? 'text-amber-600'
                    : 'text-slate-400'
            }`}
          />
        )}
        {client.isPriority && (
          <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
        )}
      </div>

      {/* Logo or Initials */}
      <div className="flex flex-col items-center justify-center p-1.5 pt-2.5 min-h-[44px]">
        {client.logoUrl ? (
          <img 
            src={client.logoUrl} 
            alt={client.name}
            className="w-full max-h-6 object-contain"
          />
        ) : (
          <span className="text-[11px] font-bold text-center text-primary leading-tight line-clamp-2">
            {client.initials}
          </span>
        )}
      </div>

      {/* Client name */}
      <div className="px-1 pb-0.5">
        <p className="font-medium text-center text-muted-foreground truncate leading-tight text-[7px]">
          {client.name.length > 14 ? client.name.slice(0, 12) + '…' : client.name}
        </p>
      </div>

      {/* Bottom bar: collaborator dots + badges */}
      <div className="flex items-center justify-between px-1 pb-1">
        {/* Collaborator dots */}
        <div className="flex items-center gap-px">
          {activeCollaborators.map(name => (
            <div
              key={name}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: COLLABORATOR_COLORS[name] }}
            />
          ))}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-0.5">
          {activeTaskCount > 0 && (
            <span className="text-[7px] font-bold text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/40 rounded px-0.5 leading-none py-px">
              <ListChecks className="w-2 h-2 inline -mt-px mr-px" />
              {activeTaskCount}
            </span>
          )}
          {commentCount > 0 && (
            <span className="text-[7px] font-bold text-indigo-700 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/40 rounded px-0.5 leading-none py-px">
              <MessageCircle className="w-2 h-2 inline -mt-px mr-px" />
              {commentCount}
            </span>
          )}
        </div>
      </div>
    </div>

  );
}

function HeaderCounter({
  label,
  icon,
  count,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => { event.stopPropagation(); onClick(); }}
      title={label}
      aria-label={label}
      className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-semibold text-muted-foreground active:bg-muted"
    >
      {icon}
      {count > 0 ? <span>{count}</span> : null}
    </button>
  );
}
