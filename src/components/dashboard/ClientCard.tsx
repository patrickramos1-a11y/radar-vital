import { Star } from "lucide-react";

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
        <div className="absolute top-1 right-1 text-yellow-400 z-10">
          <Star className="w-3 h-3 fill-current" />
        </div>
      )}

      {/* Header - Number + Name */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-card-elevated/50 border-b border-border/20">
        <div className="flex items-center justify-center w-5 h-5 rounded bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
          {client.number.toString().padStart(2, '0')}
        </div>
        <span className="text-[10px] font-medium text-foreground truncate flex-1">
          {client.name}
        </span>
      </div>

      {/* Logo Area - Compact */}
      <div 
        className="flex items-center justify-center p-1.5 cursor-pointer hover:bg-secondary/30 transition-colors h-10"
        onClick={handleLogoClick}
      >
        {client.logoUrl ? (
          <img 
            src={client.logoUrl} 
            alt={`Logo ${client.name}`} 
            className="max-h-8 max-w-full object-contain rounded"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full rounded border border-dashed border-muted-foreground/30 text-muted-foreground/40 text-[8px] uppercase tracking-wider">
            Logo
          </div>
        )}
      </div>

      {/* Indicators Row - P, L, D with chips */}
      <div className="px-1.5 py-1 border-t border-border/20 bg-card-elevated/30">
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

      {/* Click hint */}
      <div className="text-[6px] text-center text-muted-foreground/30 py-0.5 uppercase tracking-wider leading-none">
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
