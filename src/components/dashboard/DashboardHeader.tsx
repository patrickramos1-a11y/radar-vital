import { Users, Settings, Star, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { COLLABORATOR_COLORS, CollaboratorName } from "@/types/client";

interface DashboardHeaderProps {
  totalClients: number;
  collaboratorStats: Record<CollaboratorName, number>;
  priorityCount: number;
  highlightedCount: number;
}

export function DashboardHeader({
  totalClients,
  collaboratorStats,
  priorityCount,
  highlightedCount,
}: DashboardHeaderProps) {
  const collaborators: CollaboratorName[] = ['celine', 'gabi', 'darley', 'vanessa'];

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-header-bg border-b border-header-border">
      {/* Logo / Title - Compact */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">AC</span>
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight leading-none">
            Painel AC
          </h1>
          <p className="text-[10px] text-muted-foreground">SISRAMOS</p>
        </div>
      </div>

      {/* Global Stats - Compact */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <StatCardCompact 
          icon={<Users className="w-3.5 h-3.5" />} 
          value={totalClients} 
          label="Clientes" 
        />
        
        <div className="w-px h-6 bg-border mx-1" />
        
        {/* Collaborator stats */}
        {(['celine', 'gabi', 'darley', 'vanessa'] as CollaboratorName[]).map((collab) => (
          <div key={collab} className="flex flex-col rounded-lg border border-border overflow-hidden bg-card min-w-[40px]">
            <div className="px-2 py-0.5 text-center" style={{ backgroundColor: COLLABORATOR_COLORS[collab] }}>
              <span className="text-[9px] font-semibold text-white uppercase tracking-wide">
                {collab}
              </span>
            </div>
            <div className="flex items-center justify-center px-2 py-1">
              <span className="text-sm font-bold text-foreground leading-none">{collaboratorStats[collab]}</span>
            </div>
          </div>
        ))}
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <StatCardCompact 
          icon={<Star className="w-3.5 h-3.5" />} 
          value={priorityCount} 
          label="Prioridade" 
          variant="priority"
        />
        <StatCardCompact 
          icon={<Sparkles className="w-3.5 h-3.5" />} 
          value={highlightedCount} 
          label="Destaques" 
          variant="highlight"
        />
      </div>

      {/* Config Button */}
      <Link
        to="/config"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-medium transition-colors"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">Configurar</span>
      </Link>
    </header>
  );
}


interface StatCardCompactProps {
  icon?: React.ReactNode;
  value: number;
  label: string;
  variant?: 'default' | 'priority' | 'highlight';
}

function StatCardCompact({ icon, value, label, variant = 'default' }: StatCardCompactProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'priority':
        return 'bg-amber-500/10 border-amber-500/30';
      case 'highlight':
        return 'bg-blue-500/10 border-blue-500/30';
      default:
        return 'bg-card border-border';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'priority':
        return 'text-amber-500';
      case 'highlight':
        return 'text-blue-500';
      default:
        return 'text-primary';
    }
  };

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${getVariantClasses()}`}>
      {icon && <span className={getIconColor()}>{icon}</span>}
      <div className="flex flex-col">
        <span className="text-sm font-bold text-foreground leading-none">{value}</span>
        <span className="text-[8px] text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
    </div>
  );
}
