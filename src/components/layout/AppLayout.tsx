import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppNavigation } from "./AppNavigation";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: ReactNode;
  navigationTools?: ReactNode;
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

/** Plano Mestre: fica no visual anterior (pedido do Patrick, 26/11/2026). */
export function isLegacyDesignRoute(pathname: string) {
  return pathname.startsWith("/universo-ramos/plano-mestre");
}

export function AppLayout({ children, navigationTools }: AppLayoutProps) {
  const { pathname } = useLocation();
  const legado = isLegacyDesignRoute(pathname);
  // A marca fica no <html> para valer também nas janelas, avisos e menus, que
  // abrem fora do <main>. As peças da fase 3 (ramos-telas.css) só valem com "ramos".
  useEffect(() => {
    document.documentElement.dataset.design = legado ? "legado" : "ramos";
  }, [legado]);
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <AppNavigation onRefresh={() => void clearTemporaryAppData()} tools={navigationTools} />

          <main className="flex-1 overflow-hidden" data-design={legado ? "legado" : undefined}>
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
