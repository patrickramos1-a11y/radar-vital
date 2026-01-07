import { Users, FileText, Shield, ClipboardList, Maximize2, Minimize2, Settings } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardHeaderProps {
  totalClients: number;
  totalProcesses: number;
  totalLicenses: number;
  totalDemands: number;
  isPresentationMode: boolean;
  onTogglePresentationMode: () => void;
}

export function DashboardHeader({
  totalClients,
  totalProcesses,
  totalLicenses,
  totalDemands,
  isPresentationMode,
  onTogglePresentationMode,
}: DashboardHeaderProps) {
  return (
    <header className={`
      flex items-center justify-between px-6 py-4
      bg-header-bg border-b border-header-border
      transition-all duration-500
      ${isPresentationMode ? 'py-2' : 'py-4'}
    `}>
      {/* Logo / Title */}
      <div className={`flex items-center gap-3 transition-all duration-300 ${isPresentationMode ? 'presentation-hide' : ''}`}>
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-lg">AC</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Painel de Acompanhamento
          </h1>
          <p className="text-xs text-muted-foreground">SISRAMOS • Tempo Real</p>
        </div>
      </div>

      {/* Global Stats */}
      <div className="flex items-center gap-3">
        <StatCard 
          icon={<Users className="w-5 h-5" />} 
          value={totalClients} 
          label="Clientes AC" 
          compact={isPresentationMode}
        />
        <StatCard 
          icon={<FileText className="w-5 h-5" />} 
          value={totalProcesses} 
          label="Processos" 
          compact={isPresentationMode}
        />
        <StatCard 
          icon={<Shield className="w-5 h-5" />} 
          value={totalLicenses} 
          label="Licenças" 
          compact={isPresentationMode}
        />
        <StatCard 
          icon={<ClipboardList className="w-5 h-5" />} 
          value={totalDemands} 
          label="Demandas" 
          compact={isPresentationMode}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          to="/config"
          className={`mode-toggle bg-secondary text-secondary-foreground hover:bg-secondary/80 ${isPresentationMode ? 'hidden' : ''}`}
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Configurar</span>
        </Link>
        
        <button
          onClick={onTogglePresentationMode}
          className="mode-toggle"
        >
          {isPresentationMode ? (
            <>
              <Minimize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Apresentação</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  compact?: boolean;
}

function StatCard({ icon, value, label, compact }: StatCardProps) {
  return (
    <div className={`stat-card ${compact ? 'px-4 py-2' : ''}`}>
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <span className={`stat-value ${compact ? 'text-2xl' : ''}`}>{value}</span>
      </div>
      <span className={`stat-label ${compact ? 'text-xs' : ''}`}>{label}</span>
    </div>
  );
}
