import { Star, Sparkles, Building2, Plus } from "lucide-react";
import { Client, calculateTotalDemands, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName, Collaborators } from "@/types/client";
import { ChecklistButton } from "@/components/checklist/ChecklistButton";
import { CommentButton } from "@/components/comments/CommentButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  /** When true, disables minimum heights so the grid can shrink to fit everything on-screen */
  fitAll?: boolean;
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
  fitAll = false,
}: ClientCardProps) {
  const totalDemands = calculateTotalDemands(client.demands);
  const hasCollaborators = hasActiveCollaborators(client.collaborators);
  const collaboratorBg = getCollaboratorGradient(client.collaborators);
  const logoAreaStyle = getLogoAreaStyle(clientCount);
  const fontStyle = getOptimalFontSize(client.name, clientCount);
  const logoMaxHeight = getLogoMaxHeight(clientCount);
  const headerSizes = getHeaderSizes(clientCount);
  const indicatorSizes = getIndicatorSizes(clientCount);
  

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

  // Get active collaborators for display
  const activeCollaboratorsList = COLLABORATOR_NAMES.filter(name => client.collaborators[name]);

  return (
    <div
      className={`client-card-compact h-full min-h-0 min-w-0 ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
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

      {/* Header - Number + Name + Collaborator Badges */}
      <div className={`flex items-center gap-1 ${headerSizes.headerPadding} bg-card-elevated border-b border-border`}>
        <div className={`flex items-center justify-center ${headerSizes.numberSize} rounded bg-primary text-primary-foreground font-bold shrink-0`}>
          {displayNumber.toString().padStart(2, '0')}
        </div>
        <span className={`${headerSizes.nameSize} font-medium text-foreground truncate flex-1`}>
          {client.name}
        </span>
        
        {/* Collaborator Badges - Inside header, right side */}
        <div className="flex items-center gap-0.5 shrink-0 pr-8">
          {activeCollaboratorsList.map((name) => (
            <CollaboratorBadge
              key={name}
              name={name}
              onClick={(e) => handleCollaboratorClick(e, name)}
              clientCount={clientCount}
            />
          ))}
          {/* Add collaborator button */}
          <CollaboratorAddButton
            collaborators={client.collaborators}
            onToggle={(e, name) => handleCollaboratorClick(e, name)}
            clientCount={clientCount}
          />
        </div>
      </div>

      {/* Logo/Name Area - Dynamic height based on client count */}
      <div 
        className={`flex flex-col items-center justify-center transition-colors overflow-hidden ${fitAll ? 'p-2' : 'p-3'}`}
        style={{
          background: hasCollaborators ? collaboratorBg : (isHighlighted ? 'hsl(220 90% 50% / 0.15)' : 'hsl(var(--muted) / 0.3)'),
          // In fit-all mode we must allow the card to shrink below any minimum,
          // otherwise the grid can't fit all clients without scroll.
          ...(fitAll ? {} : { minHeight: logoAreaStyle.minHeight }),
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
          <div className="flex flex-col items-center justify-center w-full h-full px-2">
            <span 
              className={`font-bold text-center break-words ${
                hasCollaborators || isHighlighted ? 'text-white drop-shadow-md' : 'text-foreground'
              }`}
              style={{
                ...fontStyle,
                display: '-webkit-box',
                WebkitLineClamp: fitAll ? 2 : 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-word',
              }}
            >
              {client.name}
            </span>
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

// Badge size based on client count
function getBadgeSize(clientCount: number): { size: string; fontSize: string } {
  if (clientCount <= 8) {
    return { size: 'w-6 h-6', fontSize: 'text-[10px]' };
  } else if (clientCount <= 20) {
    return { size: 'w-5 h-5', fontSize: 'text-[9px]' };
  } else {
    return { size: 'w-4 h-4', fontSize: 'text-[8px]' };
  }
}

interface CollaboratorBadgeProps {
  name: CollaboratorName;
  onClick: (e: React.MouseEvent) => void;
  clientCount: number;
}

function CollaboratorBadge({ name, onClick, clientCount }: CollaboratorBadgeProps) {
  const color = COLLABORATOR_COLORS[name];
  const initial = name.charAt(0).toUpperCase();
  const { size, fontSize } = getBadgeSize(clientCount);
  
  return (
    <button
      onClick={onClick}
      className={`${size} rounded-full transition-all hover:opacity-80 hover:scale-110 flex items-center justify-center shadow-sm`}
      style={{ backgroundColor: color }}
      title={`${name.charAt(0).toUpperCase() + name.slice(1)} - Clique para remover`}
    >
      <span className={`${fontSize} font-bold text-white leading-none`}>{initial}</span>
    </button>
  );
}

interface CollaboratorAddButtonProps {
  collaborators: Collaborators;
  onToggle: (e: React.MouseEvent, name: CollaboratorName) => void;
  clientCount: number;
}

function CollaboratorAddButton({ collaborators, onToggle, clientCount }: CollaboratorAddButtonProps) {
  const { size, fontSize } = getBadgeSize(clientCount);
  const inactiveCollaborators = COLLABORATOR_NAMES.filter(name => !collaborators[name]);
  
  // If all collaborators are active, don't show the add button
  if (inactiveCollaborators.length === 0) {
    return null;
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={`${size} rounded-full border-2 border-dashed border-muted-foreground/40 transition-all hover:border-muted-foreground hover:bg-muted/50 flex items-center justify-center`}
          title="Adicionar colaborador"
        >
          <Plus className={`${clientCount <= 8 ? 'w-3 h-3' : 'w-2.5 h-2.5'} text-muted-foreground/60`} />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-2" 
        align="end" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground px-1 mb-1">Adicionar colaborador</span>
          <div className="flex gap-1">
            {inactiveCollaborators.map((name) => (
              <button
                key={name}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(e, name);
                }}
                className="w-8 h-8 rounded-full transition-all hover:opacity-80 hover:scale-110 flex items-center justify-center shadow-sm"
                style={{ backgroundColor: COLLABORATOR_COLORS[name] }}
                title={`Adicionar ${name.charAt(0).toUpperCase() + name.slice(1)}`}
              >
                <span className="text-xs font-bold text-white">{name.charAt(0).toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
