import { Client, calculateTotalDemands, COLLABORATOR_COLORS, COLLABORATOR_NAMES } from "@/types/client";
import { Star, ListChecks, MessageCircle } from "lucide-react";

interface MobileClientGridProps {
  clients: Client[];
  highlightedClients: Set<string>;
  getActiveTaskCount: (clientId: string) => number;
  getCommentCount: (clientId: string) => number;
  onClientTap: (id: string) => void;
}

// Compact card for 3-column grid
function CompactClientCard({
  client,
  displayNumber,
  isHighlighted,
  activeTaskCount,
  commentCount,
  onTap,
}: {
  client: Client;
  displayNumber: number;
  isHighlighted: boolean;
  activeTaskCount: number;
  commentCount: number;
  onTap: (id: string) => void;
}) {
  const totalDemands = calculateTotalDemands(client.demands);
  const activeCollaborators = COLLABORATOR_NAMES.filter(name => client.collaborators[name]);
  const borderColor = activeCollaborators.length > 0 
    ? COLLABORATOR_COLORS[activeCollaborators[0]] 
    : 'transparent';

  return (
    <button
      onClick={() => onTap(client.id)}
      className={`w-full text-left rounded-lg border bg-card transition-all active:scale-[0.97] ${
        isHighlighted 
          ? 'border-red-500 ring-2 ring-red-500/30' 
          : 'border-border'
      }`}
      style={{
        borderLeftWidth: activeCollaborators.length > 0 ? '3px' : '1px',
        borderLeftColor: borderColor,
      }}
    >
      <div className="p-2">
        {/* Header: Number + Name */}
        <div className="flex items-center gap-1.5 mb-1">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
            {displayNumber}
          </div>
          <span className="font-semibold text-[11px] text-foreground truncate flex-1">
            {client.initials}
          </span>
          {client.isPriority && (
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-1.5">
          <div className="flex items-center gap-1.5">
            <span>P:<span className="font-semibold text-foreground">{client.processes}</span></span>
            <span>L:<span className="font-semibold text-foreground">{client.licenses}</span></span>
            <span>D:<span className="font-semibold text-foreground">{totalDemands}</span></span>
          </div>
        </div>

        {/* Indicators row */}
        <div className="flex items-center gap-1 flex-wrap">
          {activeTaskCount > 0 && (
            <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-100 text-amber-700">
              <ListChecks className="w-2.5 h-2.5" />
              <span className="text-[9px] font-bold">{activeTaskCount}</span>
            </div>
          )}
          {commentCount > 0 && (
            <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-blue-100 text-blue-700">
              <MessageCircle className="w-2.5 h-2.5" />
              <span className="text-[9px] font-bold">{commentCount}</span>
            </div>
          )}
          {activeCollaborators.length > 0 && (
            <div className="flex items-center gap-0.5 ml-auto">
              {activeCollaborators.map(name => (
                <div
                  key={name}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: COLLABORATOR_COLORS[name] }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Demand status bar */}
      <div className="flex h-1 overflow-hidden rounded-b-lg">
        <div 
          className="bg-green-600" 
          style={{ width: `${totalDemands > 0 ? (client.demands.completed / totalDemands) * 100 : 0}%` }}
        />
        <div 
          className="bg-emerald-400" 
          style={{ width: `${totalDemands > 0 ? (client.demands.inProgress / totalDemands) * 100 : 0}%` }}
        />
        <div 
          className="bg-gray-400" 
          style={{ width: `${totalDemands > 0 ? (client.demands.notStarted / totalDemands) * 100 : 0}%` }}
        />
        <div 
          className="bg-red-500" 
          style={{ width: `${totalDemands > 0 ? (client.demands.cancelled / totalDemands) * 100 : 0}%` }}
        />
      </div>
    </button>
  );
}

export function MobileClientGrid({
  clients,
  highlightedClients,
  getActiveTaskCount,
  getCommentCount,
  onClientTap,
}: MobileClientGridProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-3 gap-2 p-3 pb-20">
        {clients.map((client, index) => (
          <CompactClientCard
            key={client.id}
            client={client}
            displayNumber={index + 1}
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
