import { Users, FileText, Shield, ClipboardList, Settings, Star, Sparkles, CheckSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";

interface CollaboratorStats {
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
  priorityCount: number;
  highlightedCount: number;
  taskCount: number;
}

export function DashboardHeader({
  totalClients,
  totalProcesses,
  totalLicenses,
  totalDemands,
  collaboratorStats,
  priorityCount,
  highlightedCount,
  taskCount,
}: DashboardHeaderProps) {
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
        
        {/* Collaborator stats - Color bars with number */}
        {COLLABORATOR_NAMES.map((name) => (
          <CollaboratorStatCard
            key={name}
            name={name}
            value={collaboratorStats[name]}
          />
        ))}
        
        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" />
        
        {/* Priority, Highlight and Task stats */}
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
        <StatCardCompact 
          icon={<CheckSquare className="w-3.5 h-3.5" />} 
          value={taskCount} 
          label="Tarefas" 
          variant="task"
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
  name: CollaboratorName;
  value: number;
}

function CollaboratorStatCard({ name, value }: CollaboratorStatCardProps) {
  const color = COLLABORATOR_COLORS[name];
  const initial = name.charAt(0).toUpperCase();
  
  return (
    <div 
      className="flex items-center gap-1 px-2 py-1 rounded-lg border"
      style={{ 
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
      }}
    >
      <div 
        className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {initial}
      </div>
      <span className="text-sm font-bold" style={{ color }}>{value}</span>
    </div>
  );
}

interface StatCardCompactProps {
  icon?: React.ReactNode;
  value: number;
  label: string;
  variant?: 'default' | 'priority' | 'highlight' | 'task';
}

function StatCardCompact({ icon, value, label, variant = 'default' }: StatCardCompactProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'priority':
        return 'bg-amber-500/10 border-amber-500/30';
      case 'highlight':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'task':
        return 'bg-orange-500/10 border-orange-500/30';
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
      case 'task':
        return 'text-orange-500';
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
