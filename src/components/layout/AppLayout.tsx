import { ReactNode } from "react";
import { NavLink } from "@/components/NavLink";
import { Settings, LayoutDashboard, ClipboardList, Shield, FileText } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Navigation Header */}
      <nav className="flex items-center justify-between px-4 py-2 bg-header-bg border-b border-header-border">
        {/* Logo / Title */}
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

        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          <NavLink
            to="/"
            end
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-muted/50"
            activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Painel AC</span>
          </NavLink>
          
          <NavLink
            to="/demandas"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-muted/50"
            activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">Demandas</span>
          </NavLink>
          
          <NavLink
            to="/licencas"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-muted/50"
            activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Licenças</span>
          </NavLink>
          
          <NavLink
            to="/processos"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-muted/50"
            activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Processos</span>
          </NavLink>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <NavLink
            to="/config"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80"
            activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configurar</span>
          </NavLink>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
