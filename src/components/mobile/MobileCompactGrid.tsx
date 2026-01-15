import { Star, Sparkles, MessageCircle, ListChecks } from "lucide-react";
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
  // Calculate optimal grid columns based on client count
  // More clients = smaller cards, fewer columns for visibility
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
        {clients.map((client, index) => (
          <CompactCard
            key={client.id}
            client={client}
            index={index + 1}
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
  index: number;
  isHighlighted: boolean;
  activeTaskCount: number;
  commentCount: number;
  onTap: (id: string) => void;
}

function CompactCard({
  client,
  index,
  isHighlighted,
  activeTaskCount,
  commentCount,
  onTap,
}: CompactCardProps) {
  // Get primary collaborator color for border
  const activeCollaborators = COLLABORATOR_NAMES.filter(name => client.collaborators[name]);
  const primaryColor = activeCollaborators.length > 0 
    ? COLLABORATOR_COLORS[activeCollaborators[0]] 
    : undefined;

  return (
    <button
      onClick={() => onTap(client.id)}
      className={`relative flex flex-col rounded-lg overflow-hidden transition-all active:scale-[0.98] ${
        isHighlighted 
          ? 'ring-2 ring-red-500 bg-red-50' 
          : 'border border-border bg-card'
      }`}
      style={{
        borderLeftWidth: primaryColor ? '3px' : undefined,
        borderLeftColor: primaryColor,
      }}
    >
      {/* Index number in corner */}
      <div className="absolute top-0.5 left-1 text-[8px] font-medium text-muted-foreground">
        {String(index).padStart(2, '0')}
      </div>

      {/* Status indicators in top right */}
      <div className="absolute top-0.5 right-0.5 flex items-center gap-0.5">
        {client.isPriority && (
          <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
        )}
        {activeTaskCount > 0 && (
          <div className="flex items-center">
            <span className="text-[8px] font-bold text-yellow-600 bg-yellow-100 rounded px-0.5">
              {activeTaskCount}
            </span>
          </div>
        )}
        {commentCount > 0 && (
          <div className="flex items-center">
            <span className="text-[8px] font-bold text-indigo-600 bg-indigo-100 rounded px-0.5">
              {commentCount}
            </span>
          </div>
        )}
      </div>

      {/* Client initials/name display - always text, no logos */}
      <div className="flex flex-col items-center justify-center p-1.5 pt-3 min-h-[50px]">
        <span className="text-[10px] font-bold text-center text-primary leading-tight line-clamp-2">
          {client.initials}
        </span>
      </div>

      {/* Client name - always show, truncated */}
      <div className="px-1 pb-1">
        <p className="text-[8px] font-medium text-center text-foreground truncate leading-tight">
          {client.name.length > 12 ? client.name.slice(0, 10) + '...' : client.name}
        </p>
      </div>

      {/* Collaborator dots at bottom */}
      <div className="flex items-center justify-center gap-0.5 pb-1">
        {COLLABORATOR_NAMES.filter(name => client.collaborators[name]).map(name => (
          <div
            key={name}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: COLLABORATOR_COLORS[name] }}
          />
        ))}
      </div>
    </button>
  );
}
