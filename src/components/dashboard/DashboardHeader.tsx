import { Users, FileText, Shield, ClipboardList, Settings, Star, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { COLLABORATOR_COLORS, CollaboratorName } from "@/types/client";

interface CollaboratorStats {
  celine: number;
  gabi: number;
  darley: number;
  vanessa: number;
}

interface CollaboratorDemandStats {
  celine: number;
  gabi: number;
  darley: number;
  vanessa: number;
}

interface DashboardHeaderProps {
  totalClients: number;
  totalProcesses: number;
  totalLicenses: number;
  totalDemands: number;
  collaboratorStats: CollaboratorStats;
  collaboratorDemandStats: CollaboratorDemandStats;
  priorityCount: number;
  highlightedCount: number;
}

export function DashboardHeader({
  totalClients,
  totalProcesses,
  totalLicenses,
  totalDemands,
  collaboratorStats,
  collaboratorDemandStats,
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
        {/* Main stats */}
        <StatCardCompact 
          icon={<Users className="w-3.5 h-3.5" />} 
          value={totalClients} 
          label="Clientes" 
        />
        <StatCardCompact 
          icon={<FileText className="w-3.5 h-3.5" />} 
          value={totalProcesses} 
          label="Processos" 
        />
        <StatCardCompact 
          icon={<Shield className="w-3.5 h-3.5" />} 
          value={totalLicenses} 
          label="Licenças" 
        />
        <StatCardCompact 
          icon={<ClipboardList className="w-3.5 h-3.5" />} 
          value={totalDemands} 
          label="Demandas" 
        />
        
        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" />
        
        {/* Collaborator stats - with color bar and dual numbers */}
        {collaborators.map((collab) => (
          <CollaboratorStatCard
            key={collab}
            collaborator={collab}
            demandCount={collaboratorDemandStats[collab]}
            selectionCount={collaboratorStats[collab]}
          />
        ))}
        
        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" />
        
        {/* Priority and Highlight stats */}
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

interface CollaboratorStatCardProps {
  collaborator: CollaboratorName;
  demandCount: number;
  selectionCount: number;
}

function CollaboratorStatCard({ collaborator, demandCount, selectionCount }: CollaboratorStatCardProps) {
  const color = COLLABORATOR_COLORS[collaborator];
  const displayName = collaborator.charAt(0).toUpperCase() + collaborator.slice(1);
  
  return (
    <div className="flex flex-col rounded-lg border border-border overflow-hidden bg-card min-w-[52px]">
      {/* Name at top with colored background */}
      <div 
        className="px-2 py-0.5 text-center"
        style={{ backgroundColor: color }}
      >
        <span className="text-[9px] font-semibold text-white uppercase tracking-wide">
          {displayName}
        </span>
      </div>
      {/* Dual numbers */}
      <div className="flex items-stretch divide-x divide-border">
        <div className="flex flex-col items-center justify-center px-2 py-1 flex-1">
          <span className="text-sm font-bold text-foreground leading-none">{demandCount}</span>
          <span className="text-[7px] text-muted-foreground uppercase">Dem</span>
        </div>
        <div className="flex flex-col items-center justify-center px-2 py-1 flex-1">
          <span className="text-sm font-bold text-foreground leading-none">{selectionCount}</span>
          <span className="text-[7px] text-muted-foreground uppercase">Sel</span>
        </div>
      </div>
    </div>
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
