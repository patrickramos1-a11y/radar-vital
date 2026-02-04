import React from "react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Settings, LayoutDashboard, ClipboardList, Shield, FileText, Box, MessageSquare, Bell, FileUp, LucideIcon, BarChart3, ListChecks, Tv } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";

// Type for navigation items
interface NavItem {
  title: string;
  icon: LucideIcon;
  href: string;
}

// Navigation items - direct links only
const navigationItems: NavItem[] = [
  {
    title: "Painel AC",
    icon: LayoutDashboard,
    href: "/"
  },
  {
    title: "Dashboard",
    icon: BarChart3,
    href: "/dashboard"
  },
  {
    title: "Demandas",
    icon: ClipboardList,
    href: "/demandas-unificado"
  },
  {
    title: "Licenças",
    icon: Shield,
    href: "/licencas-unificado"
  },
  {
    title: "Processos",
    icon: FileText,
    href: "/processos-unificado"
  },
  {
    title: "Jackbox",
    icon: Box,
    href: "/jackbox-unificado"
  },
  {
    title: "Comentários",
    icon: MessageSquare,
    href: "/comentarios"
  },
  {
    title: "Notificações",
    icon: Bell,
    href: "/notificacoes"
  },
  {
    title: "Relatórios PDF",
    icon: FileUp,
    href: "/relatorios-pdf"
  },
  {
    title: "Modo TV",
    icon: Tv,
    href: "/tv"
  }
];

const configItems: NavItem[] = [
  {
    title: "Backlog",
    icon: ListChecks,
    href: "/backlog"
  },
  {
    title: "Configurar",
    icon: Settings,
    href: "/config"
  }
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActiveRoute = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">AC</span>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-base font-bold text-foreground tracking-tight leading-none truncate">
                Painel de Indicadores
              </h1>
              <p className="text-[10px] text-muted-foreground">SISRAMOS</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActiveRoute(item.href)} tooltip={item.title}>
                      <NavLink to={item.href}>
                        <Icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActiveRoute(item.href)} tooltip={item.title}>
                      <NavLink to={item.href}>
                        <Icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-2">
          {!isCollapsed && (
            <p className="text-[10px] text-muted-foreground text-center">
              © 2024 SISRAMOS
            </p>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
