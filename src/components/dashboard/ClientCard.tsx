import { Star } from "lucide-react";
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

// Calcula o tamanho ideal da fonte baseado no comprimento do nome e quantidade de clientes
// Objetivo: o MAIOR possível sem estourar o card; nomes grandes podem quebrar em 2 linhas.
function getOptimalFontSize(name: string, clientCount: number): string {
  const len = name.trim().length;

  // Base mais agressiva (maior) para melhorar leitura no grid
  let baseSize: number;
  if (clientCount <= 12) {
    baseSize = 22;
  } else if (clientCount <= 25) {
    baseSize = 18;
  } else if (clientCount <= 40) {
    baseSize = 16;
  } else {
    baseSize = 14;
  }

  // Ajuste por tamanho do nome
  if (len <= 8) {
    return `${baseSize + 6}px`;
  }
  if (len <= 14) {
    return `${baseSize + 3}px`;
  }
  if (len <= 22) {
    return `${baseSize}px`;
  }
  if (len <= 30) {
    return `${baseSize - 2}px`;
  }

  return `${Math.max(baseSize - 3, 10)}px`;
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

  // Tamanho da área do logo baseado na quantidade de clientes - mais compacto
  const logoAreaHeight = clientCount <= 12 ? 'h-12' : clientCount <= 25 ? 'h-10' : clientCount <= 40 ? 'h-8' : 'h-7';
  const logoMaxHeight = clientCount <= 12 ? 'max-h-10' : clientCount <= 25 ? 'max-h-8' : clientCount <= 40 ? 'max-h-6' : 'max-h-5';
  const initialsSize = clientCount <= 12 ? 'w-9 h-9 text-sm' : clientCount <= 25 ? 'w-7 h-7 text-xs' : clientCount <= 40 ? 'w-6 h-6 text-[10px]' : 'w-5 h-5 text-[9px]';

  const handleLogoClick = (e: React.MouseEvent) => {
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
      {/* Top right icons - Comments + Checklist + Priority */}
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

      {/* Header - Number + Name - mais compacto */}
      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-card-elevated border-b border-border">
        <div className="flex items-center justify-center w-4 h-4 rounded bg-primary text-primary-foreground text-[8px] font-bold shrink-0">
          {displayNumber.toString().padStart(2, '0')}
        </div>
        <span className="text-[9px] font-medium text-foreground truncate flex-1 pr-4">
          {client.name}
        </span>
      </div>

      {/* Logo Area - mais compacto */}
      <div 
        className={`flex items-center justify-center p-1 ${logoAreaHeight} transition-colors cursor-pointer overflow-hidden`}
        style={{
          background: hasCollaborators ? collaboratorBg : 'hsl(var(--muted) / 0.3)',
        }}
        onClick={handleLogoClick}
        title="Clique para destacar"
      >
        {client.logoUrl ? (
          <img 
            src={client.logoUrl} 
            alt={`Logo ${client.name}`} 
            className={`${logoMaxHeight} max-w-full object-contain rounded`}
          />
        ) : (
          <span 
            className={`font-bold text-center leading-tight px-1 ${
              hasCollaborators || isHighlighted ? 'text-white drop-shadow-md' : 'text-foreground'
            }`}
            style={{
              fontSize: getOptimalFontSize(client.name, clientCount),
              wordBreak: 'break-word',
              hyphens: 'auto',
            }}
          >
            {client.name}
          </span>
        )}
      </div>

      {/* Indicators Row - P, L, D with chips - mais compacto */}
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

          {/* Status chips - menores */}
          <div className="flex items-center gap-px">
            <DemandChipSmall status="completed" count={client.demands.completed} />
            <DemandChipSmall status="in-progress" count={client.demands.inProgress} />
            <DemandChipSmall status="not-started" count={client.demands.notStarted} />
            <DemandChipSmall status="cancelled" count={client.demands.cancelled} />
          </div>
        </div>
      </div>

      {/* Collaborators Row - 4 Buttons - altura menor */}
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
