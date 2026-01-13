import { Star, Sparkles } from "lucide-react";
import { Client, calculateTotalDemands, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";
import { ChecklistButton } from "@/components/checklist/ChecklistButton";
import { CommentButton } from "@/components/comments/CommentButton";

interface ClientCardProps {
  client: Client;
  displayNumber: number;
  isSelected: boolean;
  isHighlighted: boolean;
  activeTaskCount: number;
  commentCount: number;
  onSelect: (id: string) => void;
  onHighlight: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onToggleCollaborator: (id: string, collaborator: CollaboratorName) => void;
  onOpenChecklist: (id: string) => void;
  clientCount?: number;
}

// Get gradient background for active collaborators
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
  
  // Create gradient with multiple colors
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

// Dynamic font size calculation - MAXIMUM possible based on client count
// Allows up to 3 lines for long names
function getOptimalFontSize(name: string, clientCount: number): { fontSize: string; lineHeight: string } {
  const len = name.trim().length;

  // Base size increases significantly with fewer clients
  let baseSize: number;
  if (clientCount <= 4) {
    baseSize = 36;
  } else if (clientCount <= 8) {
    baseSize = 30;
  } else if (clientCount <= 12) {
    baseSize = 26;
  } else if (clientCount <= 20) {
    baseSize = 22;
  } else if (clientCount <= 30) {
    baseSize = 18;
  } else if (clientCount <= 40) {
    baseSize = 16;
  } else {
    baseSize = 14;
  }

  // Adjust by name length - short names get even bigger
  let finalSize: number;
  if (len <= 6) {
    finalSize = baseSize + 8;
  } else if (len <= 10) {
    finalSize = baseSize + 4;
  } else if (len <= 16) {
    finalSize = baseSize;
  } else if (len <= 24) {
    finalSize = Math.max(baseSize - 2, 12);
  } else {
    finalSize = Math.max(baseSize - 4, 10);
  }

  return {
    fontSize: `${finalSize}px`,
    lineHeight: '1.1',
  };
}

// Dynamic logo area height - expands when fewer clients
function getLogoAreaStyle(clientCount: number, hasLogo: boolean): { minHeight: string; maxHeight: string } {
  if (clientCount <= 4) {
    return { minHeight: hasLogo ? '80px' : '100px', maxHeight: '140px' };
  } else if (clientCount <= 8) {
    return { minHeight: hasLogo ? '60px' : '80px', maxHeight: '120px' };
  } else if (clientCount <= 12) {
    return { minHeight: hasLogo ? '48px' : '64px', maxHeight: '100px' };
  } else if (clientCount <= 20) {
    return { minHeight: hasLogo ? '40px' : '52px', maxHeight: '80px' };
  } else if (clientCount <= 30) {
    return { minHeight: hasLogo ? '36px' : '44px', maxHeight: '60px' };
  } else {
    return { minHeight: hasLogo ? '28px' : '36px', maxHeight: '48px' };
  }
}

export function ClientCard({ 
  client, 
  displayNumber, 
  isSelected, 
  isHighlighted,
  activeTaskCount,
  commentCount,
  onSelect, 
  onHighlight,
  onTogglePriority,
  onToggleCollaborator,
  onOpenChecklist,
  clientCount = 40,
}: ClientCardProps) {
  const totalDemands = calculateTotalDemands(client.demands);
  const hasCollaborators = hasActiveCollaborators(client.collaborators);
  const collaboratorBg = getCollaboratorGradient(client.collaborators);
  const logoAreaStyle = getLogoAreaStyle(clientCount, !!client.logoUrl);
  const fontStyle = getOptimalFontSize(client.name, clientCount);

  // Logo sizing based on client count
  const logoMaxHeight = clientCount <= 8 ? 'max-h-16' : clientCount <= 20 ? 'max-h-12' : clientCount <= 30 ? 'max-h-10' : 'max-h-8';

  const handleHighlightClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHighlight(client.id);
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePriority(client.id);
  };

  const handleCollaboratorClick = (e: React.MouseEvent, collaborator: CollaboratorName) => {
    e.stopPropagation();
    onToggleCollaborator(client.id, collaborator);
  };

  const handleChecklistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenChecklist(client.id);
  };

  return (
    <div
      className={`client-card-compact ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
      onClick={() => onSelect(client.id)}
    >
      {/* Top right icons - Comments + Checklist + Highlight + Priority */}
      <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5">
        <CommentButton
          clientId={client.id}
          clientName={client.name}
          commentCount={commentCount}
        />
        <ChecklistButton
          activeCount={activeTaskCount}
          onClick={handleChecklistClick}
        />
        {/* Highlight Button */}
        <button
          onClick={handleHighlightClick}
          className="p-0.5 rounded transition-colors hover:bg-muted/50"
          title={isHighlighted ? "Remover destaque" : "Destacar cliente"}
        >
          <Sparkles 
            className={`w-3.5 h-3.5 transition-colors ${
              isHighlighted 
                ? 'text-blue-500 fill-blue-500' 
                : 'text-muted-foreground/40 hover:text-blue-400'
            }`} 
          />
        </button>
        {/* Priority Button */}
        <button
          onClick={handleStarClick}
          className="p-0.5 rounded transition-colors hover:bg-muted/50"
          title={client.isPriority ? "Remover prioridade" : "Marcar como prioritário"}
        >
          <Star 
            className={`w-3.5 h-3.5 transition-colors ${
              client.isPriority 
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-muted-foreground/40 hover:text-yellow-400'
            }`} 
          />
        </button>
      </div>

      {/* Header - Number + Name */}
      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-card-elevated border-b border-border">
        <div className="flex items-center justify-center w-4 h-4 rounded bg-primary text-primary-foreground text-[8px] font-bold shrink-0">
          {displayNumber.toString().padStart(2, '0')}
        </div>
        <span className="text-[9px] font-medium text-foreground truncate flex-1 pr-6">
          {client.name}
        </span>
      </div>

      {/* Logo/Name Area - Dynamic height based on client count */}
      <div 
        className="flex items-center justify-center p-2 flex-1 transition-colors overflow-hidden"
        style={{
          background: hasCollaborators ? collaboratorBg : (isHighlighted ? 'hsl(220 90% 50% / 0.15)' : 'hsl(var(--muted) / 0.3)'),
          minHeight: logoAreaStyle.minHeight,
        }}
      >
        {client.logoUrl ? (
          <img 
            src={client.logoUrl} 
            alt={`Logo ${client.name}`} 
            className={`${logoMaxHeight} max-w-full object-contain rounded`}
          />
        ) : (
          <span 
            className={`font-bold text-center px-1 ${
              hasCollaborators || isHighlighted ? 'text-white drop-shadow-md' : 'text-foreground'
            }`}
            style={{
              fontSize: fontStyle.fontSize,
              lineHeight: fontStyle.lineHeight,
              wordBreak: 'break-word',
              hyphens: 'auto',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {client.name}
          </span>
        )}
      </div>

      {/* Indicators Row - P, L, D with chips */}
      <div className="px-1 py-0.5 border-t border-border bg-card-elevated/50">
        <div className="flex items-center justify-between gap-0.5">
          {/* P - Processos */}
          <div className="flex flex-col items-center min-w-[16px]">
            <span className="text-[6px] text-muted-foreground font-medium leading-none">P</span>
            <span className="text-[10px] font-bold text-foreground leading-tight">{client.processes}</span>
          </div>

          {/* L - Licenças */}
          <div className="flex flex-col items-center min-w-[16px]">
            <span className="text-[6px] text-muted-foreground font-medium leading-none">L</span>
            <span className="text-[10px] font-bold text-foreground leading-tight">{client.licenses}</span>
          </div>

          {/* D - Demandas with total */}
          <div className="flex flex-col items-center min-w-[16px]">
            <span className="text-[6px] text-muted-foreground font-medium leading-none">D</span>
            <span className="text-[10px] font-bold text-foreground leading-tight">{totalDemands}</span>
          </div>

          {/* Status chips */}
          <div className="flex items-center gap-px">
            <DemandChipSmall status="completed" count={client.demands.completed} />
            <DemandChipSmall status="in-progress" count={client.demands.inProgress} />
            <DemandChipSmall status="not-started" count={client.demands.notStarted} />
            <DemandChipSmall status="cancelled" count={client.demands.cancelled} />
          </div>
        </div>
      </div>

      {/* Collaborators Row - 4 Buttons */}
      <div className="grid grid-cols-4 border-t border-border">
        {COLLABORATOR_NAMES.map((name) => (
          <CollaboratorButton
            key={name}
            name={name}
            isActive={client.collaborators[name]}
            onClick={(e) => handleCollaboratorClick(e, name)}
          />
        ))}
      </div>
    </div>
  );
}

interface DemandChipSmallProps {
  status: 'completed' | 'in-progress' | 'not-started' | 'cancelled';
  count: number;
}

function DemandChipSmall({ status, count }: DemandChipSmallProps) {
  const statusColors = {
    'completed': 'bg-green-600',
    'in-progress': 'bg-emerald-400', 
    'not-started': 'bg-gray-400',
    'cancelled': 'bg-red-500',
  };
  
  return (
    <div className={`flex items-center justify-center min-w-[14px] h-4 px-0.5 rounded text-[8px] font-bold text-white ${statusColors[status]}`}>
      {count}
    </div>
  );
}

interface CollaboratorButtonProps {
  name: CollaboratorName;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
}

function CollaboratorButton({ name, isActive, onClick }: CollaboratorButtonProps) {
  const color = COLLABORATOR_COLORS[name];
  const initials = name.slice(0, 2).toUpperCase();
  
  return (
    <button
      onClick={onClick}
      className="h-3 w-full transition-all hover:opacity-70 flex items-center justify-center"
      style={{ 
        backgroundColor: color,
        opacity: isActive ? 1 : 0.25,
      }}
      title={`${name.charAt(0).toUpperCase() + name.slice(1)} - Clique para ${isActive ? 'desativar' : 'ativar'}`}
    >
      <span className="text-[7px] font-bold text-white leading-none">{initials}</span>
    </button>
  );
}
