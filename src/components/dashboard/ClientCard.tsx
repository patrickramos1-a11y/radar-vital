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
  initials: string;
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
  compact?: boolean;
}

export function ClientCard({ client, isSelected, onSelect, compact }: ClientCardProps) {
  const totalDemands = 
    client.demands.completed + 
    client.demands.inProgress + 
    client.demands.notStarted + 
    client.demands.cancelled;

  return (
    <div
      className={`client-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(client.id)}
    >
      {/* Priority Badge */}
      {client.isPriority && (
        <div className="priority-badge">
          <Star className="w-5 h-5 fill-current" />
        </div>
      )}

      {/* Header */}
      <div className="client-card-header">
        <div className={`client-card-logo ${compact ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'}`}>
          {client.initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-foreground truncate ${compact ? 'text-sm' : 'text-base'}`}>
            {client.name}
          </h3>
        </div>
      </div>

      {/* Logo Area */}
      <div className={`flex-1 flex items-center justify-center bg-secondary/30 ${compact ? 'py-4' : 'py-6'}`}>
        {client.logoUrl ? (
          <img 
            src={client.logoUrl} 
            alt={`Logo ${client.name}`} 
            className={`object-contain ${compact ? 'max-h-12' : 'max-h-16'}`}
          />
        ) : (
          <div className={`
            flex items-center justify-center rounded-2xl bg-card-elevated
            ${compact ? 'w-16 h-16 text-2xl' : 'w-20 h-20 text-3xl'}
            font-bold text-muted-foreground/50
          `}>
            {client.initials}
          </div>
        )}
      </div>

      {/* Indicators */}
      <div className="client-card-indicators">
        {/* P - Processos */}
        <div className="indicator-pill">
          <span className="indicator-pill-label">P</span>
          <span>{client.processes}</span>
        </div>

        {/* L - Licenças */}
        <div className="indicator-pill">
          <span className="indicator-pill-label">L</span>
          <span>{client.licenses}</span>
        </div>

        {/* D - Demandas */}
        <div className="flex items-center gap-1">
          <div className="indicator-pill mr-1">
            <span className="indicator-pill-label">D</span>
            <span>{totalDemands}</span>
          </div>
          <div className="flex gap-0.5">
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
  if (count === 0) return null;
  
  return (
    <div className={`demand-chip ${status}`}>
      {count}
    </div>
  );
}
