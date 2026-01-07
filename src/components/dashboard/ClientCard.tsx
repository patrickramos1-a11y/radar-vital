import { Star, ImagePlus } from "lucide-react";

export interface DemandBreakdown {
  completed: number;
  inProgress: number;
  notStarted: number;
  cancelled: number;
}

export interface ClientData {
  id: string;
  name: string;
  number: number;
  logoUrl?: string;
  isPriority?: boolean;
  processes: number;
  licenses: number;
  demands: DemandBreakdown;
}

interface ClientCardProps {
  client: ClientData;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onLogoClick?: (id: string) => void;
}

export function ClientCard({ client, isSelected, onSelect, onLogoClick }: ClientCardProps) {
  const totalDemands = 
    client.demands.completed + 
    client.demands.inProgress + 
    client.demands.notStarted + 
    client.demands.cancelled;

  const handleLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLogoClick?.(client.id);
  };

  return (
    <div
      className={`client-card-compact ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(client.id)}
    >
      {/* Priority Badge */}
      {client.isPriority && (
        <div className="absolute top-1 right-1 text-yellow-400">
          <Star className="w-3 h-3 fill-current" />
        </div>
      )}

      {/* Header - Number + Name */}
      <div className="flex items-center gap-2 px-2 py-1.5 bg-card-elevated/50 border-b border-border/20">
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary text-primary-foreground text-xs font-bold">
          {client.number.toString().padStart(2, '0')}
        </div>
        <span className="text-xs font-medium text-foreground truncate flex-1">
          {client.name}
        </span>
      </div>

      {/* Logo Area - Clickable */}
      <div 
        className="flex-1 flex items-center justify-center p-2 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={handleLogoClick}
      >
        {client.logoUrl ? (
          <img 
            src={client.logoUrl} 
            alt={`Logo ${client.name}`} 
            className="max-h-10 max-w-full object-contain rounded"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-12 rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground/50 hover:border-primary/50 hover:text-primary/50 transition-colors">
            <ImagePlus className="w-4 h-4" />
            <span className="text-[8px] uppercase tracking-wider mt-0.5">Logo</span>
          </div>
        )}
      </div>

      {/* Indicators Row - P, L, D with chips */}
      <div className="px-2 py-1.5 border-t border-border/20 bg-card-elevated/30">
        <div className="flex items-center justify-between gap-1">
          {/* P - Processos */}
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-muted-foreground font-medium">P</span>
            <span className="text-sm font-bold text-foreground">{client.processes}</span>
          </div>

          {/* L - Licenças */}
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-muted-foreground font-medium">L</span>
            <span className="text-sm font-bold text-foreground">{client.licenses}</span>
          </div>

          {/* D - Demandas with total */}
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-muted-foreground font-medium">D</span>
            <span className="text-sm font-bold text-foreground">{totalDemands}</span>
          </div>

          {/* Status chips */}
          <div className="flex items-center gap-0.5">
            <DemandChip status="completed" count={client.demands.completed} />
            <DemandChip status="in-progress" count={client.demands.inProgress} />
            <DemandChip status="not-started" count={client.demands.notStarted} />
            <DemandChip status="cancelled" count={client.demands.cancelled} />
          </div>
        </div>
      </div>

      {/* Click to highlight hint */}
      <div className="text-[7px] text-center text-muted-foreground/40 py-0.5 uppercase tracking-wider">
        Clique para destacar
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
