import { Star, MessageCircle, ListChecks, ChevronRight } from "lucide-react";
import { Client, calculateTotalDemands, COLLABORATOR_COLORS, COLLABORATOR_NAMES } from "@/types/client";

interface MobileClientCardProps {
  client: Client;
  displayNumber: number;
  isHighlighted: boolean;
  activeTaskCount: number;
  commentCount: number;
  onTap: (id: string) => void;
}

export function MobileClientCard({
  client,
  displayNumber,
  isHighlighted,
  activeTaskCount,
  commentCount,
  onTap,
}: MobileClientCardProps) {
  const totalDemands = calculateTotalDemands(client.demands);
  
  // Get active collaborator colors for left border
  const activeCollaborators = COLLABORATOR_NAMES.filter(name => client.collaborators[name]);
  const borderColor = activeCollaborators.length > 0 
    ? COLLABORATOR_COLORS[activeCollaborators[0]] 
    : 'transparent';

  return (
    <button
      onClick={() => onTap(client.id)}
      className={`w-full text-left rounded-xl border bg-card transition-all active:scale-[0.98] ${
        isHighlighted 
          ? 'border-red-500 ring-2 ring-red-500/30' 
          : 'border-border'
      }`}
      style={{
        borderLeftWidth: activeCollaborators.length > 0 ? '4px' : '1px',
        borderLeftColor: borderColor,
      }}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Number badge */}
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground text-sm font-bold shrink-0">
          {displayNumber.toString().padStart(2, '0')}
        </div>

        {/* Client info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate text-sm">
              {client.name}
            </h3>
            {client.isPriority && (
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
            )}
          </div>
          
          {/* Quick stats */}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="font-medium">
              P: <span className="text-foreground">{client.processes}</span>
            </span>
            <span className="font-medium">
              L: <span className="text-foreground">{client.licenses}</span>
            </span>
            <span className="font-medium">
              D: <span className="text-foreground">{totalDemands}</span>
            </span>
          </div>
        </div>

        {/* Right side indicators */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Jackbox indicator */}
          {activeTaskCount > 0 && (
            <div className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-amber-100 text-amber-700">
              <ListChecks className="w-3 h-3" />
              <span className="text-xs font-bold">{activeTaskCount}</span>
            </div>
          )}
          
          {/* Comments indicator */}
          {commentCount > 0 && (
            <div className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-blue-100 text-blue-700">
              <MessageCircle className="w-3 h-3" />
              <span className="text-xs font-bold">{commentCount}</span>
            </div>
          )}
          
          {/* Collaborator dots */}
          {activeCollaborators.length > 0 && (
            <div className="flex items-center gap-0.5">
              {activeCollaborators.map(name => (
                <div
                  key={name}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLLABORATOR_COLORS[name] }}
                  title={name}
                />
              ))}
            </div>
          )}
          
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      {/* Demand status bar - compact */}
      <div className="flex h-1.5 overflow-hidden rounded-b-xl">
        <div 
          className="bg-green-600 transition-all" 
          style={{ width: `${totalDemands > 0 ? (client.demands.completed / totalDemands) * 100 : 0}%` }}
        />
        <div 
          className="bg-emerald-400 transition-all" 
          style={{ width: `${totalDemands > 0 ? (client.demands.inProgress / totalDemands) * 100 : 0}%` }}
        />
        <div 
          className="bg-gray-400 transition-all" 
          style={{ width: `${totalDemands > 0 ? (client.demands.notStarted / totalDemands) * 100 : 0}%` }}
        />
        <div 
          className="bg-red-500 transition-all" 
          style={{ width: `${totalDemands > 0 ? (client.demands.cancelled / totalDemands) * 100 : 0}%` }}
        />
      </div>
    </button>
  );
}
