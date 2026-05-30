import { ReactNode } from "react";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";
import { UserSelector } from "./UserSelector";
import { AppSidebar } from "./AppSidebar";
import logoSisRamos from "@/assets/logo-sisramos.png";
import { RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

async function clearTemporaryAppData() {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    }

    sessionStorage.clear();
  } catch (error) {
    console.warn('Erro ao limpar arquivos temporários do app:', error);
  } finally {
    window.location.href = `${window.location.pathname}?atualizar=${Date.now()}`;
  }
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
                <img src={logoSisRamos} alt="SisRamos" className="w-7 h-7 rounded-lg object-contain" />
                <span className="text-sm font-bold text-foreground">SisRamos</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={clearTemporaryAppData}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-secondary/40 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    aria-label="Atualizar aplicativo e limpar arquivos temporários"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[240px] text-xs">
                  Atualizar app, limpar arquivos temporários e baixar a versão mais recente.
                </TooltipContent>
              </Tooltip>
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
