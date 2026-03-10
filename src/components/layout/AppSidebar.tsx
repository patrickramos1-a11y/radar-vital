import React from "react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Settings, LayoutDashboard, Box, MessageSquare, FileUp, LucideIcon, BarChart3, ListChecks } from "lucide-react";
import logoSisRamos from "@/assets/logo-sisramos.png";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  icon: LucideIcon;
  href: string;
}

const navigationItems: NavItem[] = [
  { title: "Painel AC", icon: LayoutDashboard, href: "/" },
  { title: "Dashboard", icon: BarChart3, href: "/dashboard" },
  { title: "Tarefas", icon: Box, href: "/jackbox-unificado" },
  { title: "Comentários", icon: MessageSquare, href: "/comentarios" },
  { title: "Relatórios PDF", icon: FileUp, href: "/relatorios-pdf" },
];

const configItems: NavItem[] = [
  { title: "Backlog", icon: ListChecks, href: "/backlog" },
  { title: "Configurar", icon: Settings, href: "/config" },
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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2.5">
          <img src={logoSisRamos} alt="SisRamos" className="w-8 h-8 rounded-lg object-contain shrink-0" />
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-foreground tracking-tight leading-none truncate">
                Painel de Indicadores
              </h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">SISRAMOS</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActiveRoute(item.href);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <NavLink to={item.href} className={active ? 'relative' : ''}>
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />
                        )}
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

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => {
                const Icon = item.icon;
                const active = isActiveRoute(item.href);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <NavLink to={item.href} className={active ? 'relative' : ''}>
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-primary" />
                        )}
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

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-2">
          {!isCollapsed && (
            <p className="text-[10px] text-muted-foreground/40 text-center">
              © 2024 SISRAMOS
            </p>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
