import { Star, MessageSquare, CheckSquare, Building2 } from "lucide-react";
import { Client, COLLABORATOR_COLORS, COLLABORATOR_NAMES, calculateTotalDemands } from "@/types/client";
import { TVDensidade } from "@/types/tvMode";
import { cn } from "@/lib/utils";

interface TVClientCardProps {
  client: Client;
  displayNumber: number;
  isHighlighted: boolean;
  commentCount: number;
  taskCount: number;
  density: TVDensidade;
  totalCards?: number;
}

// Get collaborator gradient for background
function getCollaboratorGradient(collaborators: Client['collaborators']): string {
  const activeColors: string[] = [];
  
  COLLABORATOR_NAMES.forEach((name) => {
    if (collaborators[name]) {
      activeColors.push(COLLABORATOR_COLORS[name]);
    }
  });
  
  if (activeColors.length === 0) {
    return 'transparent';
  }
  
  if (activeColors.length === 1) {
    return activeColors[0];
  }
  
  const step = 100 / activeColors.length;
  const gradientStops = activeColors.map((color, i) => {
    const start = i * step;
    const end = (i + 1) * step;
    return `${color} ${start}%, ${color} ${end}%`;
  }).join(', ');
  
  return `linear-gradient(90deg, ${gradientStops})`;
}

function hasActiveCollaborators(collaborators: Client['collaborators']): boolean {
  return COLLABORATOR_NAMES.some(name => collaborators[name]);
}

export function TVClientCard({
  client,
  displayNumber,
  isHighlighted,
  commentCount,
  taskCount,
  density,
  totalCards = 1,
}: TVClientCardProps) {
  const totalDemands = calculateTotalDemands(client.demands);
  const hasCollaborators = hasActiveCollaborators(client.collaborators);
  const collaboratorBg = getCollaboratorGradient(client.collaborators);

  // Dynamic sizing based on card count and density
  const isCompact = totalCards > 20 || density === 'compacta';
  const isLarge = totalCards <= 6 && density !== 'compacta';
  const isGiant = totalCards <= 4 && density === 'gigante';

  return (
    <div
      className={cn(
        "rounded-lg border-2 bg-card overflow-hidden flex flex-col h-full",
        "hover:shadow-lg transition-all",
        isHighlighted && "border-blue-500 ring-2 ring-blue-500/30",
        client.isPriority && !isHighlighted && "border-amber-500",
        !isHighlighted && !client.isPriority && "border-border"
      )}
    >
      {/* Header - scales with card count */}
      <div className={cn(
        "flex items-center gap-1 bg-card border-b border-border shrink-0",
        isGiant ? "px-3 py-2" : isLarge ? "px-2 py-1.5" : isCompact ? "px-1.5 py-0.5" : "px-2 py-1"
      )}>
        <div className={cn(
          "flex items-center justify-center rounded bg-primary text-primary-foreground font-bold shrink-0",
          isGiant ? "w-8 h-8 text-base" : isLarge ? "w-6 h-6 text-sm" : isCompact ? "w-4 h-4 text-[8px]" : "w-5 h-5 text-[10px]"
        )}>
          {displayNumber.toString().padStart(2, '0')}
        </div>
        <span className={cn(
          "font-medium text-foreground truncate flex-1",
          isGiant ? "text-lg" : isLarge ? "text-sm" : isCompact ? "text-[9px]" : "text-xs"
        )}>
          {client.name}
        </span>
        
        {/* Badges - hide on very compact */}
        <div className={cn("flex items-center shrink-0", isCompact && totalCards > 30 ? "hidden" : "gap-0.5")}>
          {client.isPriority && (
            <Star className={cn(
              "text-amber-500 fill-amber-500",
              isGiant ? "w-5 h-5" : isLarge ? "w-4 h-4" : "w-3 h-3"
            )} />
          )}
          {commentCount > 0 && (
            <div className="flex items-center">
              <MessageSquare className={cn(
                "text-emerald-500",
                isGiant ? "w-4 h-4" : isLarge ? "w-3.5 h-3.5" : "w-2.5 h-2.5"
              )} />
              <span className={cn(
                "text-emerald-600 font-medium",
                isGiant ? "text-sm" : isLarge ? "text-xs" : "text-[8px]"
              )}>{commentCount}</span>
            </div>
          )}
          {taskCount > 0 && (
            <div className="flex items-center">
              <CheckSquare className={cn(
                "text-primary",
                isGiant ? "w-4 h-4" : isLarge ? "w-3.5 h-3.5" : "w-2.5 h-2.5"
              )} />
              <span className={cn(
                "text-primary font-medium",
                isGiant ? "text-sm" : isLarge ? "text-xs" : "text-[8px]"
              )}>{taskCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Collaborator row - hide on very compact */}
      {hasCollaborators && !(isCompact && totalCards > 30) && (
        <div className={cn(
          "flex items-center gap-0.5 bg-muted/30 border-b border-border/50 shrink-0",
          isGiant ? "px-2 py-1" : "px-1.5 py-0.5"
        )}>
          {COLLABORATOR_NAMES.filter(name => client.collaborators[name]).map((name) => (
            <div
              key={name}
              className={cn(
                "rounded-full flex items-center justify-center text-white font-bold",
                isGiant ? "w-6 h-6 text-xs" : isLarge ? "w-5 h-5 text-[9px]" : "w-3.5 h-3.5 text-[7px]"
              )}
              style={{ backgroundColor: COLLABORATOR_COLORS[name] }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      )}

      {/* Logo/Name Area - flex-grow to fill available space */}
      <div 
        className="flex items-center justify-center flex-1 min-h-0"
        style={{
          background: hasCollaborators 
            ? collaboratorBg 
            : (isHighlighted ? 'hsl(220 90% 50% / 0.15)' : 'hsl(var(--muted) / 0.3)'),
        }}
      >
        {client.logoUrl ? (
          <img 
            src={client.logoUrl} 
            alt={client.name}
            className="max-h-full max-w-[95%] object-contain p-1"
          />
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Building2 className={cn(
              "opacity-40",
              isGiant ? "w-20 h-20" : isLarge ? "w-14 h-14" : isCompact ? "w-6 h-6" : "w-10 h-10",
              hasCollaborators && "text-white",
            )} />
          </div>
        )}
      </div>

      {/* Indicators - compact at bottom */}
      <div className={cn(
        "border-t border-border bg-card shrink-0",
        isGiant ? "p-3" : isLarge ? "p-2" : isCompact ? "p-1" : "p-1.5"
      )}>
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center", isGiant ? "gap-4" : isLarge ? "gap-3" : "gap-1.5")}>
            <div className="text-center">
              <div className={cn(
                "text-muted-foreground font-medium",
                isGiant ? "text-sm" : isLarge ? "text-xs" : "text-[7px]"
              )}>P</div>
              <div className={cn(
                "font-bold text-foreground",
                isGiant ? "text-xl" : isLarge ? "text-base" : isCompact ? "text-[10px]" : "text-sm"
              )}>{client.processes}</div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-muted-foreground font-medium",
                isGiant ? "text-sm" : isLarge ? "text-xs" : "text-[7px]"
              )}>L</div>
              <div className={cn(
                "font-bold text-foreground",
                isGiant ? "text-xl" : isLarge ? "text-base" : isCompact ? "text-[10px]" : "text-sm"
              )}>{client.licenses}</div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-muted-foreground font-medium",
                isGiant ? "text-sm" : isLarge ? "text-xs" : "text-[7px]"
              )}>D</div>
              <div className={cn(
                "font-bold text-foreground",
                isGiant ? "text-xl" : isLarge ? "text-base" : isCompact ? "text-[10px]" : "text-sm"
              )}>{totalDemands}</div>
            </div>
          </div>
          
          {/* Status chips - hide on very compact */}
          {!(isCompact && totalCards > 40) && (
            <div className="flex items-center gap-px">
              <div className={cn(
                "px-0.5 rounded bg-green-600 text-white font-bold flex items-center justify-center",
                isGiant ? "min-w-[20px] h-5 text-xs" : isLarge ? "min-w-[16px] h-4 text-[9px]" : "min-w-[12px] h-3 text-[6px]"
              )}>
                {client.demands.completed}
              </div>
              <div className={cn(
                "px-0.5 rounded bg-emerald-400 text-white font-bold flex items-center justify-center",
                isGiant ? "min-w-[20px] h-5 text-xs" : isLarge ? "min-w-[16px] h-4 text-[9px]" : "min-w-[12px] h-3 text-[6px]"
              )}>
                {client.demands.inProgress}
              </div>
              <div className={cn(
                "px-0.5 rounded bg-gray-400 text-white font-bold flex items-center justify-center",
                isGiant ? "min-w-[20px] h-5 text-xs" : isLarge ? "min-w-[16px] h-4 text-[9px]" : "min-w-[12px] h-3 text-[6px]"
              )}>
                {client.demands.notStarted}
              </div>
              <div className={cn(
                "px-0.5 rounded bg-red-500 text-white font-bold flex items-center justify-center",
                isGiant ? "min-w-[20px] h-5 text-xs" : isLarge ? "min-w-[16px] h-4 text-[9px]" : "min-w-[12px] h-3 text-[6px]"
              )}>
                {client.demands.cancelled}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
