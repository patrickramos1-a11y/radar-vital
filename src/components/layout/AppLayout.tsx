import { ReactNode } from "react";
import { NavLink } from "@/components/NavLink";
import { Settings, LayoutDashboard, ClipboardList, Shield, FileText, LogOut, Box, ChevronDown, Eye, List, User } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentUser, logout } = useUser();

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
          
          {/* Demandas Dropdown */}
          <NavDropdown 
            icon={<ClipboardList className="w-4 h-4" />}
            label="Demandas"
            visualRoute="/demandas-visual"
            detailRoute="/demandas"
          />
          
          {/* Licenças Dropdown */}
          <NavDropdown 
            icon={<Shield className="w-4 h-4" />}
            label="Licenças"
            visualRoute="/licencas-visual"
            detailRoute="/licencas"
          />
          
          {/* Processos Dropdown */}
          <NavDropdown 
            icon={<FileText className="w-4 h-4" />}
            label="Processos"
            visualRoute="/processos-visual"
            detailRoute="/processos"
          />

          {/* Jackbox Dropdown */}
          <NavDropdown 
            icon={<Box className="w-4 h-4" />}
            label="Jackbox"
            visualRoute="/jackbox"
            detailRoute="/jackbox-detalhado"
          />
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <NavLink
            to="/config"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80"
            activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configurar</span>
          </NavLink>

          <div className="w-px h-6 bg-border mx-1" />

          {/* User info and Logout */}
          <div className="flex items-center gap-2">
            {currentUser && (
              <div 
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                style={{ backgroundColor: `${currentUser.color}20` }}
              >
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: currentUser.color }}
                >
                  {currentUser.initials}
                </div>
                <span 
                  className="text-sm font-medium hidden md:inline"
                  style={{ color: currentUser.color }}
                >
                  {currentUser.name}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              title="Trocar usuário"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Trocar</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

// Navigation Dropdown Component
interface NavDropdownProps {
  icon: ReactNode;
  label: string;
  visualRoute: string;
  detailRoute: string;
}

function NavDropdown({ icon, label, visualRoute, detailRoute }: NavDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-muted/50">
          {icon}
          <span className="hidden sm:inline">{label}</span>
          <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem asChild>
          <NavLink to={visualRoute} className="flex items-center gap-2 w-full cursor-pointer">
            <Eye className="w-4 h-4" />
            <span>Visão Macro</span>
          </NavLink>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <NavLink to={detailRoute} className="flex items-center gap-2 w-full cursor-pointer">
            <List className="w-4 h-4" />
            <span>Detalhado</span>
          </NavLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
