import { Star, Sparkles, Building2 } from "lucide-react";
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

// Dynamic logo area height - expands when fewer clients - valores aumentados
function getLogoAreaStyle(clientCount: number): { minHeight: string; flex: number } {
  if (clientCount <= 4) {
    return { minHeight: '200px', flex: 1 };
  } else if (clientCount <= 8) {
    return { minHeight: '160px', flex: 1 };
  } else if (clientCount <= 12) {
    return { minHeight: '120px', flex: 1 };
  } else if (clientCount <= 20) {
    return { minHeight: '100px', flex: 1 };
  } else if (clientCount <= 30) {
    return { minHeight: '80px', flex: 1 };
  } else {
    return { minHeight: '60px', flex: 1 };
  }
}

// Dynamic logo max height based on client count - aumentado para melhor visualização
function getLogoMaxHeight(clientCount: number): string {
  if (clientCount <= 4) {
    return 'max-h-48'; // 192px
  } else if (clientCount <= 8) {
    return 'max-h-40'; // 160px
  } else if (clientCount <= 12) {
    return 'max-h-32'; // 128px
  } else if (clientCount <= 20) {
    return 'max-h-24'; // 96px
  } else if (clientCount <= 30) {
    return 'max-h-20'; // 80px
  } else {
    return 'max-h-16'; // 64px
  }
}

// Get building icon size based on client count
function getBuildingIconSize(clientCount: number): string {
  if (clientCount <= 4) {
    return 'w-24 h-24'; // 96px
  } else if (clientCount <= 8) {
    return 'w-20 h-20'; // 80px
  } else if (clientCount <= 12) {
    return 'w-16 h-16'; // 64px
  } else if (clientCount <= 20) {
    return 'w-12 h-12'; // 48px
  } else if (clientCount <= 30) {
    return 'w-10 h-10'; // 40px
  } else {
    return 'w-8 h-8'; // 32px
  }
}

// Dynamic sizes for header elements
function getHeaderSizes(clientCount: number): { numberSize: string; nameSize: string; headerPadding: string } {
  if (clientCount <= 4) {
    return { numberSize: 'w-8 h-8 text-sm', nameSize: 'text-lg', headerPadding: 'px-3 py-2' };
  } else if (clientCount <= 8) {
    return { numberSize: 'w-6 h-6 text-xs', nameSize: 'text-base', headerPadding: 'px-2 py-1.5' };
  } else if (clientCount <= 12) {
    return { numberSize: 'w-5 h-5 text-[10px]', nameSize: 'text-sm', headerPadding: 'px-2 py-1' };
  } else if (clientCount <= 20) {
    return { numberSize: 'w-4 h-4 text-[9px]', nameSize: 'text-xs', headerPadding: 'px-1.5 py-0.5' };
  } else {
    return { numberSize: 'w-4 h-4 text-[8px]', nameSize: 'text-[9px]', headerPadding: 'px-1.5 py-0.5' };
  }
}

// Dynamic sizes for indicators (P, L, D, demand chips)
function getIndicatorSizes(clientCount: number): { labelSize: string; valueSize: string; chipSize: string; chipPadding: string } {
  if (clientCount <= 4) {
    return { labelSize: 'text-sm', valueSize: 'text-2xl', chipSize: 'min-w-[28px] h-7 text-sm', chipPadding: 'px-2 py-1.5' };
  } else if (clientCount <= 8) {
    return { labelSize: 'text-xs', valueSize: 'text-xl', chipSize: 'min-w-[22px] h-6 text-xs', chipPadding: 'px-1.5 py-1' };
  } else if (clientCount <= 12) {
    return { labelSize: 'text-[10px]', valueSize: 'text-lg', chipSize: 'min-w-[18px] h-5 text-[10px]', chipPadding: 'px-1.5 py-1' };
  } else if (clientCount <= 20) {
    return { labelSize: 'text-[8px]', valueSize: 'text-base', chipSize: 'min-w-[16px] h-4.5 text-[9px]', chipPadding: 'px-1 py-0.5' };
  } else {
    return { labelSize: 'text-[6px]', valueSize: 'text-[10px]', chipSize: 'min-w-[14px] h-4 text-[8px]', chipPadding: 'px-1 py-0.5' };
  }
}

// Dynamic collaborator button height
function getCollaboratorHeight(clientCount: number): string {
  if (clientCount <= 4) {
    return 'h-6';
  } else if (clientCount <= 8) {
    return 'h-5';
  } else if (clientCount <= 12) {
    return 'h-4';
  } else {
    return 'h-3';
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
  const logoAreaStyle = getLogoAreaStyle(clientCount);
  const fontStyle = getOptimalFontSize(client.name, clientCount);
  const logoMaxHeight = getLogoMaxHeight(clientCount);
  const headerSizes = getHeaderSizes(clientCount);
  const indicatorSizes = getIndicatorSizes(clientCount);
  const collaboratorHeight = getCollaboratorHeight(clientCount);

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
      <div className={`flex items-center gap-1 ${headerSizes.headerPadding} bg-card-elevated border-b border-border`}>
        <div className={`flex items-center justify-center ${headerSizes.numberSize} rounded bg-primary text-primary-foreground font-bold shrink-0`}>
          {displayNumber.toString().padStart(2, '0')}
        </div>
        <span className={`${headerSizes.nameSize} font-medium text-foreground truncate flex-1 pr-6`}>
          {client.name}
        </span>
      </div>

      {/* Logo/Name Area - Dynamic height based on client count */}
      <div 
        className="flex flex-col items-center justify-center p-3 transition-colors overflow-hidden"
        style={{
          background: hasCollaborators ? collaboratorBg : (isHighlighted ? 'hsl(220 90% 50% / 0.15)' : 'hsl(var(--muted) / 0.3)'),
          minHeight: logoAreaStyle.minHeight,
          flex: logoAreaStyle.flex,
        }}
      >
        {client.logoUrl ? (
          <div className="flex items-center justify-center w-full h-full">
            <img 
              src={client.logoUrl} 
              alt={`Logo ${client.name}`} 
              className={`${logoMaxHeight} max-w-[85%] object-contain rounded`}
              style={{ 
                objectFit: 'contain',
                width: 'auto',
                height: 'auto',
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className={`flex items-center justify-center rounded-xl bg-primary/15 p-3 ${
              hasCollaborators || isHighlighted ? 'bg-white/20' : ''
            }`}>
              <Building2 
                className={`${getBuildingIconSize(clientCount)} ${
                  hasCollaborators || isHighlighted 
                    ? 'text-white drop-shadow-md' 
                    : 'text-primary'
                }`}
                strokeWidth={1.5}
              />
            </div>
            {clientCount <= 20 && (
              <span 
                className={`font-semibold text-center px-1 text-xs ${
                  hasCollaborators || isHighlighted ? 'text-white drop-shadow-md' : 'text-muted-foreground'
                }`}
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                }}
              >
                {client.name}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Indicators Row - P, L, D with chips */}
      <div className={`${indicatorSizes.chipPadding} border-t border-border bg-card-elevated/50`}>
        <div className="flex items-center justify-between gap-0.5">
          {/* P - Processos */}
          <div className="flex flex-col items-center min-w-[16px]">
            <span className={`${indicatorSizes.labelSize} text-muted-foreground font-medium leading-none`}>P</span>
            <span className={`${indicatorSizes.valueSize} font-bold text-foreground leading-tight`}>{client.processes}</span>
          </div>

          {/* L - Licenças */}
          <div className="flex flex-col items-center min-w-[16px]">
            <span className={`${indicatorSizes.labelSize} text-muted-foreground font-medium leading-none`}>L</span>
            <span className={`${indicatorSizes.valueSize} font-bold text-foreground leading-tight`}>{client.licenses}</span>
          </div>

          {/* D - Demandas with total */}
          <div className="flex flex-col items-center min-w-[16px]">
            <span className={`${indicatorSizes.labelSize} text-muted-foreground font-medium leading-none`}>D</span>
            <span className={`${indicatorSizes.valueSize} font-bold text-foreground leading-tight`}>{totalDemands}</span>
          </div>

          {/* Status chips */}
          <div className="flex items-center gap-px">
            <DemandChipSmall status="completed" count={client.demands.completed} sizeClass={indicatorSizes.chipSize} />
            <DemandChipSmall status="in-progress" count={client.demands.inProgress} sizeClass={indicatorSizes.chipSize} />
            <DemandChipSmall status="not-started" count={client.demands.notStarted} sizeClass={indicatorSizes.chipSize} />
            <DemandChipSmall status="cancelled" count={client.demands.cancelled} sizeClass={indicatorSizes.chipSize} />
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
            heightClass={collaboratorHeight}
          />
        ))}
      </div>
    </div>
  );
}

interface DemandChipSmallProps {
  status: 'completed' | 'in-progress' | 'not-started' | 'cancelled';
  count: number;
  sizeClass: string;
}

function DemandChipSmall({ status, count, sizeClass }: DemandChipSmallProps) {
  const statusColors = {
    'completed': 'bg-green-600',
    'in-progress': 'bg-emerald-400', 
    'not-started': 'bg-gray-400',
    'cancelled': 'bg-red-500',
  };
  
  return (
    <div className={`flex items-center justify-center ${sizeClass} px-0.5 rounded font-bold text-white ${statusColors[status]}`}>
      {count}
    </div>
  );
}

interface CollaboratorButtonProps {
  name: CollaboratorName;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
  heightClass: string;
}

function CollaboratorButton({ name, isActive, onClick, heightClass }: CollaboratorButtonProps) {
  const color = COLLABORATOR_COLORS[name];
  const initials = name.slice(0, 2).toUpperCase();
  
  return (
    <button
      onClick={onClick}
      className={`${heightClass} w-full transition-all hover:opacity-70 flex items-center justify-center`}
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
