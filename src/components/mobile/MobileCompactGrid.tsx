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
  // Get primary collaborator color for border - preserved exactly
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
          : 'border-2 border-border bg-card'
      }`}
      style={{
        borderLeftWidth: primaryColor ? '4px' : undefined,
        borderLeftColor: primaryColor,
      }}
    >
      {/* Index number - More legible */}
      <div className="absolute top-1 left-1.5 text-[10px] font-semibold text-muted-foreground">
        {String(index).padStart(2, '0')}
      </div>

      {/* Status indicators - Larger touch targets */}
      <div className="absolute top-1 right-1 flex items-center gap-1">
        {client.isPriority && (
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
        )}
        {activeTaskCount > 0 && (
          <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100 rounded px-1 py-0.5">
            {activeTaskCount}
          </span>
        )}
        {commentCount > 0 && (
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 rounded px-1 py-0.5">
            {commentCount}
          </span>
        )}
      </div>

      {/* Logo or Name - Improved sizing */}
      <div className="flex flex-col items-center justify-center p-2 pt-4 min-h-[56px]">
        {client.logoUrl ? (
          <img 
            src={client.logoUrl} 
            alt={client.name}
            className="w-full max-h-8 object-contain"
          />
        ) : (
          <span className="text-xs font-bold text-center text-primary leading-tight line-clamp-2">
            {client.initials}
          </span>
        )}
      </div>

      {/* Client name - Larger text */}
      <div className="px-1.5 pb-1.5">
        <p className="text-[10px] font-semibold text-center text-foreground truncate leading-tight">
          {client.name.length > 14 ? client.name.slice(0, 12) + '...' : client.name}
        </p>
      </div>

      {/* Collaborator dots - Preserved colors exactly */}
      <div className="flex items-center justify-center gap-1 pb-1.5">
        {COLLABORATOR_NAMES.filter(name => client.collaborators[name]).map(name => (
          <div
            key={name}
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: COLLABORATOR_COLORS[name] }}
          />
        ))}
      </div>
    </button>
  );
}
