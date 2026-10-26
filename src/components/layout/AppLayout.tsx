import { ReactNode } from "react";
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

export function AppLayout({ children, navigationTools }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <AppNavigation onRefresh={() => void clearTemporaryAppData()} tools={navigationTools} />

          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
