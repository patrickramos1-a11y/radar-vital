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
}: TVClientCardProps) {
  const totalDemands = calculateTotalDemands(client.demands);
  const hasCollaborators = hasActiveCollaborators(client.collaborators);
  const collaboratorBg = getCollaboratorGradient(client.collaborators);

  // Size based on density
  const sizes = {
    compacta: {
      padding: 'p-1.5',
      headerPadding: 'px-1.5 py-0.5',
      numberSize: 'w-4 h-4 text-[9px]',
      nameSize: 'text-[10px]',
      logoHeight: 'h-12',
      indicatorSize: 'text-[8px]',
      valueSize: 'text-xs',
    },
    normal: {
      padding: 'p-2',
      headerPadding: 'px-2 py-1',
      numberSize: 'w-5 h-5 text-[10px]',
      nameSize: 'text-xs',
      logoHeight: 'h-20',
      indicatorSize: 'text-[9px]',
      valueSize: 'text-sm',
    },
    gigante: {
      padding: 'p-3',
      headerPadding: 'px-3 py-1.5',
      numberSize: 'w-7 h-7 text-sm',
      nameSize: 'text-base',
      logoHeight: 'h-32',
      indicatorSize: 'text-xs',
      valueSize: 'text-lg',
    },
  };

  const s = sizes[density];

  return (
    <div
      className={cn(
        "rounded-lg border-2 bg-card overflow-hidden transition-all",
        "hover:shadow-lg",
        isHighlighted && "border-blue-500 ring-2 ring-blue-500/30",
        client.isPriority && !isHighlighted && "border-amber-500",
        !isHighlighted && !client.isPriority && "border-border"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center gap-1.5 bg-card border-b border-border",
        s.headerPadding
      )}>
        <div className={cn(
          "flex items-center justify-center rounded bg-primary text-primary-foreground font-bold shrink-0",
          s.numberSize
        )}>
          {displayNumber.toString().padStart(2, '0')}
        </div>
        <span className={cn("font-medium text-foreground truncate flex-1", s.nameSize)}>
          {client.name}
        </span>
        
        {/* Badges */}
        <div className="flex items-center gap-0.5">
          {client.isPriority && (
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          )}
          {commentCount > 0 && (
            <div className="flex items-center">
              <MessageSquare className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] text-emerald-600 font-medium">{commentCount}</span>
            </div>
          )}
          {taskCount > 0 && (
            <div className="flex items-center">
              <CheckSquare className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-primary font-medium">{taskCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Collaborator row */}
      {hasCollaborators && (
        <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-muted/30 border-b border-border/50">
          {COLLABORATOR_NAMES.filter(name => client.collaborators[name]).map((name) => (
            <div
              key={name}
              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
              style={{ backgroundColor: COLLABORATOR_COLORS[name] }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      )}

      {/* Logo/Name Area */}
      <div 
        className={cn("flex items-center justify-center", s.logoHeight)}
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
            className="max-h-full max-w-[90%] object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Building2 className={cn(
              "opacity-40",
              density === 'compacta' && "w-6 h-6",
              density === 'normal' && "w-10 h-10",
              density === 'gigante' && "w-16 h-16",
              hasCollaborators && "text-white",
            )} />
          </div>
        )}
      </div>

      {/* Indicators */}
      <div className={cn("border-t border-border bg-card", s.padding)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className={cn(s.indicatorSize, "text-muted-foreground font-medium")}>P</div>
              <div className={cn(s.valueSize, "font-bold text-foreground")}>{client.processes}</div>
            </div>
            <div className="text-center">
              <div className={cn(s.indicatorSize, "text-muted-foreground font-medium")}>L</div>
              <div className={cn(s.valueSize, "font-bold text-foreground")}>{client.licenses}</div>
            </div>
            <div className="text-center">
              <div className={cn(s.indicatorSize, "text-muted-foreground font-medium")}>D</div>
              <div className={cn(s.valueSize, "font-bold text-foreground")}>{totalDemands}</div>
            </div>
          </div>
          
          {/* Status chips */}
          <div className="flex items-center gap-px">
            <div className="min-w-[14px] h-4 px-0.5 rounded bg-green-600 text-white text-[8px] font-bold flex items-center justify-center">
              {client.demands.completed}
            </div>
            <div className="min-w-[14px] h-4 px-0.5 rounded bg-emerald-400 text-white text-[8px] font-bold flex items-center justify-center">
              {client.demands.inProgress}
            </div>
            <div className="min-w-[14px] h-4 px-0.5 rounded bg-gray-400 text-white text-[8px] font-bold flex items-center justify-center">
              {client.demands.notStarted}
            </div>
            <div className="min-w-[14px] h-4 px-0.5 rounded bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
              {client.demands.cancelled}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
