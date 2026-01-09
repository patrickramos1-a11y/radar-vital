import { Star } from "lucide-react";
import { Client, calculateTotalDemands } from "@/types/client";

interface ClientCardProps {
  client: Client;
  displayNumber: number;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: (id: string) => void;
  onHighlight: (id: string) => void;
}

export function ClientCard({ 
  client, 
  displayNumber, 
  isSelected, 
  isHighlighted,
  onSelect, 
  onHighlight 
}: ClientCardProps) {
  const totalDemands = calculateTotalDemands(client.demands);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHighlight(client.id);
  };

  return (
    <div
      className={`client-card-compact ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
      onClick={() => onSelect(client.id)}
    >
      {/* Priority Badge */}
      {client.isPriority && (
        <div className="absolute top-1 right-1 text-yellow-500 z-10">
          <Star className="w-3 h-3 fill-current" />
        </div>
      )}

      {/* Header - Number + Name */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-card-elevated border-b border-border">
        <div className="flex items-center justify-center w-5 h-5 rounded bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
          {displayNumber.toString().padStart(2, '0')}
        </div>
        <span className="text-[10px] font-medium text-foreground truncate flex-1">
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
