import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClientProvider } from "@/contexts/ClientContext";
import { AuthProvider } from "@/contexts/AuthContext";
const Index = lazy(() => import("./pages/Index"));
const Config = lazy(() => import("./pages/Config"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const JackboxPanel = lazy(() => import("./pages/JackboxPanel"));
const JackboxUnified = lazy(() => import("./pages/JackboxUnified"));
const CentralEntregas = lazy(() => import("./pages/CentralEntregas"));
const UniversoRamos = lazy(() => import("./pages/UniversoRamos"));
const Auditorias = lazy(() => import("./pages/Auditorias"));
const Tesouro = lazy(() => import("./pages/Tesouro"));
const CommentsPanel = lazy(() => import("./pages/CommentsPanel"));
const RelatoriosPdf = lazy(() => import("./pages/RelatoriosPdf"));
const TVMode = lazy(() => import("./pages/TVMode"));
const NotFound = lazy(() => import("./pages/NotFound"));



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ClientProvider>
              <Toaster />
              <Sonner />
              <Suspense
                fallback={
                  <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
                    Carregando painel...
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/comentarios" element={<CommentsPanel />} />
                  <Route path="/relatorios-pdf" element={<RelatoriosPdf />} />
                  <Route path="/jackbox" element={<JackboxPanel />} />
                  <Route path="/jackbox-unificado" element={<JackboxUnified />} />
                  <Route path="/central-entregas" element={<CentralEntregas />} />
                  <Route path="/universo-ramos" element={<UniversoRamos />} />
                  <Route path="/auditorias" element={<Auditorias />} />
                  <Route path="/tesouro" element={<Tesouro />} />
                  <Route path="/config" element={<Config />} />
                  <Route path="/tv" element={<TVMode />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
          </ClientProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
