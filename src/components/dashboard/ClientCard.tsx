import { Star } from "lucide-react";
import { Client, calculateTotalDemands, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";
import { ChecklistButton } from "@/components/checklist/ChecklistButton";

interface ClientCardProps {
  client: Client;
  displayNumber: number;
  isSelected: boolean;
  isHighlighted: boolean;
  activeTaskCount: number;
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

export function ClientCard({ 
  client, 
  displayNumber, 
  isSelected, 
  isHighlighted,
  activeTaskCount,
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

  // Tamanho da área do logo baseado na quantidade de clientes
  const logoAreaHeight = clientCount <= 12 ? 'h-16' : clientCount <= 25 ? 'h-14' : clientCount <= 40 ? 'h-12' : 'h-10';
  const logoMaxHeight = clientCount <= 12 ? 'max-h-14' : clientCount <= 25 ? 'max-h-12' : clientCount <= 40 ? 'max-h-10' : 'max-h-8';
  const initialsSize = clientCount <= 12 ? 'w-12 h-12 text-base' : clientCount <= 25 ? 'w-10 h-10 text-sm' : clientCount <= 40 ? 'w-9 h-9 text-xs' : 'w-8 h-8 text-xs';

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
      {/* Top right icons - Checklist + Priority */}
      <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5">
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

      {/* Header - Number + Name */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-card-elevated border-b border-border">
        <div className="flex items-center justify-center w-5 h-5 rounded bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
          {displayNumber.toString().padStart(2, '0')}
        </div>
        <span className="text-[10px] font-medium text-foreground truncate flex-1 pr-4">
          {client.name}
        </span>
      </div>

      {/* Logo Area - Shows collaborator colors when active */}
      <div 
        className={`flex items-center justify-center p-2 ${logoAreaHeight} transition-colors cursor-pointer`}
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
          <div className={`flex items-center justify-center ${initialsSize} rounded-full font-bold ${
            hasCollaborators || isHighlighted ? 'bg-white/80 text-gray-800' : 'bg-primary/10 text-primary'
          }`}>
            {client.initials}
          </div>
        )}
      </div>

      {/* Indicators Row - P, L, D with chips */}
      <div className="px-1.5 py-1 border-t border-border bg-card-elevated/50">
        <div className="flex items-center justify-between gap-0.5">
          {/* P - Processos */}
          <div className="flex flex-col items-center min-w-[20px]">
            <span className="text-[7px] text-muted-foreground font-medium leading-none">P</span>
            <span className="text-xs font-bold text-foreground leading-tight">{client.processes}</span>
          </div>

          {/* L - Licenças */}
          <div className="flex flex-col items-center min-w-[20px]">
            <span className="text-[7px] text-muted-foreground font-medium leading-none">L</span>
            <span className="text-xs font-bold text-foreground leading-tight">{client.licenses}</span>
          </div>

          {/* D - Demandas with total */}
          <div className="flex flex-col items-center min-w-[20px]">
            <span className="text-[7px] text-muted-foreground font-medium leading-none">D</span>
            <span className="text-xs font-bold text-foreground leading-tight">{totalDemands}</span>
          </div>

          {/* Status chips */}
          <div className="flex items-center gap-px">
            <DemandChip status="completed" count={client.demands.completed} />
            <DemandChip status="in-progress" count={client.demands.inProgress} />
            <DemandChip status="not-started" count={client.demands.notStarted} />
            <DemandChip status="cancelled" count={client.demands.cancelled} />
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

interface DemandChipProps {
  status: 'completed' | 'in-progress' | 'not-started' | 'cancelled';
  count: number;
}

function DemandChip({ status, count }: DemandChipProps) {
  return (
    <div className={`demand-chip-small ${status}`}>
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
  
  return (
    <button
      onClick={onClick}
      className="h-2 w-full transition-all hover:opacity-70"
      style={{ 
        backgroundColor: color,
        opacity: isActive ? 1 : 0.3,
      }}
      title={`${name.charAt(0).toUpperCase() + name.slice(1)} - Clique para ${isActive ? 'desativar' : 'ativar'}`}
    />
  );
}
