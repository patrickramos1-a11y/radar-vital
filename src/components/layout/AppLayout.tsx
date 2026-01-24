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
        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content Area */}
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          {/* Top Header Bar */}
          <header className="flex items-center justify-between h-12 px-4 border-b border-header-border bg-header-bg shrink-0">
            {/* Left: Menu trigger */}
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              
              {/* Mobile Logo */}
              <div className="flex items-center gap-2 md:hidden">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xs">AC</span>
                </div>
                <span className="text-sm font-bold text-foreground">Painel AC</span>
              </div>
            </div>

            {/* Right: User info and actions */}
            <div className="flex items-center gap-2">
              {/* Notifications / Activity History */}
              <NotificationsPanel />

              <div className="w-px h-6 bg-border" />

              {/* User Selector */}
              <UserSelector />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
