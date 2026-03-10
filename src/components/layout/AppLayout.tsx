import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";
import { UserSelector } from "./UserSelector";
import { AppSidebar } from "./AppSidebar";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          {/* Top Header Bar — glass effect */}
          <header className="flex items-center justify-between h-12 px-4 border-b border-header-border bg-header-bg/80 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
              
              {/* Mobile Logo */}
              <div className="flex items-center gap-2 md:hidden">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-primary-foreground font-bold text-xs">AC</span>
                </div>
                <span className="text-sm font-bold text-foreground">Painel AC</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <NotificationsPanel />
              <div className="w-px h-5 bg-border/50" />
              <UserSelector />
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
