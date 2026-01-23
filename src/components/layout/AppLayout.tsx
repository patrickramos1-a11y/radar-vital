import { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";
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
  const { profile, collaborator, signOut } = useAuth();

  // Determine display info
  const displayName = collaborator?.name || profile?.displayName || 'Usuário';
  const displayColor = collaborator?.color || '#6366f1';
  const displayInitials = collaborator?.initials || displayName.slice(0, 2).toUpperCase();

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

              {/* User info and Logout */}
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                  style={{ backgroundColor: `${displayColor}20` }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: displayColor }}
                  >
                    {displayInitials}
                  </div>
                  <span
                    className="text-sm font-medium hidden sm:inline"
                    style={{ color: displayColor }}
                  >
                    {displayName}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>
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
