import { Star, MessageCircle, ListChecks } from "lucide-react";
import { Client, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";

interface MobileCompactGridProps {
  clients: Client[];
  highlightedClients: Set<string>;
  getActiveTaskCount: (clientId: string) => number;
  getCommentCount: (clientId: string) => number;
  onClientTap: (id: string) => void;
}

export function MobileCompactGrid({
  clients,
  highlightedClients,
  getActiveTaskCount,
  getCommentCount,
  onClientTap,
}: MobileCompactGridProps) {
  const getGridColumns = () => {
    const count = clients.length;
    if (count <= 8) return 2;
    if (count <= 15) return 3;
    if (count <= 25) return 4;
    return 5;
  };

  const columns = getGridColumns();

  return (
    <div className="h-full overflow-y-auto p-2">
      <div 
        className="grid gap-1.5"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {clients.map((client) => (
          <CompactCard
            key={client.id}
            client={client}
            isHighlighted={highlightedClients.has(client.id)}
            activeTaskCount={getActiveTaskCount(client.id)}
            commentCount={getCommentCount(client.id)}
            onTap={onClientTap}
          />
        ))}
      </div>
    </div>
  );
}

interface CompactCardProps {
  client: Client;
  isHighlighted: boolean;
  activeTaskCount: number;
  commentCount: number;
  onTap: (id: string) => void;
}

function CompactCard({
  client,
  isHighlighted,
  activeTaskCount,
  commentCount,
  onTap,
}: CompactCardProps) {
  const activeCollaborators = COLLABORATOR_NAMES.filter(name => client.collaborators[name]);
  const primaryColor = activeCollaborators.length > 0 
    ? COLLABORATOR_COLORS[activeCollaborators[0]] 
    : undefined;

  const hasAlerts = client.isPriority || activeTaskCount > 0 || commentCount > 0;

  return (
    <button
      onClick={() => onTap(client.id)}
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
        <p className="text-[7px] font-medium text-center text-muted-foreground truncate leading-tight">
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
    </button>
  );
}
