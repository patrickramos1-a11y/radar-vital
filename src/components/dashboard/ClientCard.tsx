import { Star } from "lucide-react";
import { Client, calculateTotalDemands, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";

interface ClientCardProps {
  client: Client;
  displayNumber: number;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: (id: string) => void;
  onHighlight: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onToggleCollaborator: (id: string, collaborator: CollaboratorName) => void;
}

export function ClientCard({ 
  client, 
  displayNumber, 
  isSelected, 
  isHighlighted,
  onSelect, 
  onHighlight,
  onTogglePriority,
  onToggleCollaborator,
}: ClientCardProps) {
  const totalDemands = calculateTotalDemands(client.demands);

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

  return (
    <div
      className={`client-card-compact ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
      onClick={() => onSelect(client.id)}
    >
      {/* Priority Star - Always visible, clickable */}
      <button
        onClick={handleStarClick}
        className="absolute top-1 right-1 z-10 p-0.5 rounded transition-colors hover:bg-muted/50"
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

      {/* Header - Number + Name */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-card-elevated border-b border-border">
        <div className="flex items-center justify-center w-5 h-5 rounded bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
          {displayNumber.toString().padStart(2, '0')}
        </div>
        <span className="text-[10px] font-medium text-foreground truncate flex-1 pr-4">
          {client.name}
        </span>
      </div>

      {/* Logo Area - Clickable for highlight */}
      <div 
        className={`flex items-center justify-center p-1.5 h-10 transition-colors cursor-pointer ${
          isHighlighted ? 'bg-yellow-400' : 'bg-muted/30 hover:bg-muted/50'
        }`}
        onClick={handleLogoClick}
        title="Clique para destacar"
      >
        {client.logoUrl ? (
          <img 
            src={client.logoUrl} 
            alt={`Logo ${client.name}`} 
            className="max-h-8 max-w-full object-contain rounded"
          />
        ) : (
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
            isHighlighted ? 'bg-yellow-600 text-white' : 'bg-primary/10 text-primary'
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

      {/* Collaborators Row */}
      <div className="px-1 py-0.5 border-t border-border bg-card flex items-center justify-center gap-1">
        {COLLABORATOR_NAMES.map((name) => (
          <CollaboratorChip
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

interface CollaboratorChipProps {
  name: CollaboratorName;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
}

function CollaboratorChip({ name, isActive, onClick }: CollaboratorChipProps) {
  const displayName = name.charAt(0).toUpperCase() + name.slice(1, 3);
  const color = COLLABORATOR_COLORS[name];
  
  return (
    <button
      onClick={onClick}
      className={`collaborator-chip ${isActive ? 'active' : ''}`}
      style={{ 
        '--collaborator-color': color,
        color: isActive ? '#fff' : color,
        backgroundColor: isActive ? color : 'transparent',
        borderColor: color,
      } as React.CSSProperties}
      title={`${name.charAt(0).toUpperCase() + name.slice(1)} - Clique para ${isActive ? 'desativar' : 'ativar'}`}
    >
      {displayName}
    </button>
  );
}
