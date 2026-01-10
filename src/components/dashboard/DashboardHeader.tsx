import { Users, FileText, Shield, ClipboardList, Settings } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardHeaderProps {
  totalClients: number;
  totalProcesses: number;
  totalLicenses: number;
  totalDemands: number;
}

export function DashboardHeader({
  totalClients,
  totalProcesses,
  totalLicenses,
  totalDemands,
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
      <div className="flex items-center gap-2">
        <StatCardCompact 
          icon={<Users className="w-4 h-4" />} 
          value={totalClients} 
          label="Clientes" 
        />
        <StatCardCompact 
          icon={<FileText className="w-4 h-4" />} 
          value={totalProcesses} 
          label="Processos" 
        />
        <StatCardCompact 
          icon={<Shield className="w-4 h-4" />} 
          value={totalLicenses} 
          label="Licenças" 
        />
        <StatCardCompact 
          icon={<ClipboardList className="w-4 h-4" />} 
          value={totalDemands} 
          label="Demandas" 
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
  icon: React.ReactNode;
  value: number;
  label: string;
}

function StatCardCompact({ icon, value, label }: StatCardCompactProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
      <span className="text-primary">{icon}</span>
      <div className="flex flex-col">
        <span className="text-lg font-bold text-foreground leading-none">{value}</span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
    </div>
  );
}
