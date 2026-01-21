import React from "react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Settings,
  LayoutDashboard,
  ClipboardList,
  Shield,
  FileText,
  Box,
  MessageSquare,
  Bell,
  Eye,
  List,
  Layers,
  ChevronDown,
  LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Types for navigation items
interface SubNavItem {
  title: string;
  icon: LucideIcon;
  href: string;
}

interface NavItemWithSub {
  title: string;
  icon: LucideIcon;
  subItems: SubNavItem[];
  href?: never;
}

interface NavItemWithHref {
  title: string;
  icon: LucideIcon;
  href: string;
  subItems?: never;
}

type NavigationItem = NavItemWithSub | NavItemWithHref;

// Navigation items with sub-menus
const navigationItems: NavigationItem[] = [
  {
    title: "Painel AC",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    title: "Demandas",
    icon: ClipboardList,
    subItems: [
      { title: "Unificado", icon: Layers, href: "/demandas-unificado" },
      { title: "Visão Macro", icon: Eye, href: "/demandas-visual" },
      { title: "Detalhado", icon: List, href: "/demandas" },
    ],
  },
  {
    title: "Licenças",
    icon: Shield,
    subItems: [
      { title: "Visão Macro", icon: Eye, href: "/licencas-visual" },
      { title: "Detalhado", icon: List, href: "/licencas" },
    ],
  },
  {
    title: "Processos",
    icon: FileText,
    subItems: [
      { title: "Unificado", icon: Layers, href: "/processos-unificado" },
      { title: "Visão Macro", icon: Eye, href: "/processos-visual" },
      { title: "Detalhado", icon: List, href: "/processos" },
    ],
  },
  {
    title: "Jackbox",
    icon: Box,
    subItems: [
      { title: "Unificado", icon: Layers, href: "/jackbox-unificado" },
      { title: "Visão Macro", icon: Eye, href: "/jackbox" },
      { title: "Detalhado", icon: List, href: "/jackbox-detalhado" },
    ],
  },
  {
    title: "Comentários",
    icon: MessageSquare,
    href: "/comentarios",
  },
  {
    title: "Notificações",
    icon: Bell,
    href: "/notificacoes",
  },
];

const configItems: NavItemWithHref[] = [
  {
    title: "Configurar",
    icon: Settings,
    href: "/config",
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const isActiveRoute = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const isSubMenuActive = (subItems: SubNavItem[]) => {
    return subItems?.some((item) => isActiveRoute(item.href));
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
                Painel AC
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
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {'subItems' in item && item.subItems ? (
                    <CollapsibleNavItem
                      item={item as NavItemWithSub}
                      isCollapsed={isCollapsed}
                      isActive={isSubMenuActive(item.subItems)}
                      isActiveRoute={isActiveRoute}
                    />
                  ) : (
                    (() => {
                      const navItem = item as NavItemWithHref;
                      const Icon = navItem.icon;
                      return (
                        <SidebarMenuButton
                          asChild
                          isActive={isActiveRoute(navItem.href)}
                          tooltip={navItem.title}
                        >
                          <NavLink to={navItem.href}>
                            <Icon className="w-4 h-4" />
                            <span>{navItem.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      );
                    })()
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActiveRoute(item.href)}
                    tooltip={item.title}
                  >
                    <NavLink to={item.href}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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

// Collapsible navigation item for sub-menus
interface CollapsibleNavItemProps {
  item: NavItemWithSub;
  isCollapsed: boolean;
  isActive: boolean;
  isActiveRoute: (href: string) => boolean;
}

function CollapsibleNavItem({ item, isCollapsed, isActive, isActiveRoute }: CollapsibleNavItemProps) {
  const Icon = item.icon;
  
  return (
    <Collapsible defaultOpen={isActive} className="group/collapsible">
      <CollapsibleTrigger asChild>
        <SidebarMenuButton tooltip={item.title} isActive={isActive}>
          <Icon className="w-4 h-4" />
          <span>{item.title}</span>
          {!isCollapsed && (
            <ChevronDown className="ml-auto w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
          )}
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {item.subItems.map((subItem) => {
            const SubIcon = subItem.icon;
            return (
              <SidebarMenuSubItem key={subItem.href}>
                <SidebarMenuSubButton asChild isActive={isActiveRoute(subItem.href)}>
                  <NavLink to={subItem.href}>
                    <SubIcon className="w-3 h-3" />
                    <span>{subItem.title}</span>
                  </NavLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}
