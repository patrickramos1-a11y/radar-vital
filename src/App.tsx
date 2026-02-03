import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClientProvider } from "@/contexts/ClientContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Config from "./pages/Config";
import Dashboard from "./pages/Dashboard";
import DemandasPanel from "./pages/DemandasPanel";
import DemandasVisual from "./pages/DemandasVisual";
import DemandasUnified from "./pages/DemandasUnified";
import LicencasPanel from "./pages/LicencasPanel";
import LicencasVisual from "./pages/LicencasVisual";
import LicencasUnified from "./pages/LicencasUnified";
import ProcessosPanel from "./pages/ProcessosPanel";
import ProcessosVisual from "./pages/ProcessosVisual";
import ProcessosUnified from "./pages/ProcessosUnified";
import JackboxPanel from "./pages/JackboxPanel";
import JackboxUnified from "./pages/JackboxUnified";
import JackboxDetalhado from "./pages/JackboxDetalhado";
import CommentsPanel from "./pages/CommentsPanel";
import NotificacoesPanel from "./pages/NotificacoesPanel";
import RelatoriosPdf from "./pages/RelatoriosPdf";
import Backlog from "./pages/Backlog";
import BacklogDetail from "./pages/BacklogDetail";
import TVMode from "./pages/TVMode";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <ClientProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
              {/* Unified Panels (New - Macro View) */}
              <Route path="/demandas-unificado" element={<DemandasUnified />} />
              <Route path="/processos-unificado" element={<ProcessosUnified />} />
              <Route path="/jackbox-unificado" element={<JackboxUnified />} />
              <Route path="/comentarios" element={<CommentsPanel />} />
              <Route path="/notificacoes" element={<NotificacoesPanel />} />
              <Route path="/relatorios-pdf" element={<RelatoriosPdf />} />
              <Route path="/licencas-unificado" element={<LicencasUnified />} />
              <Route path="/licencas-visual" element={<LicencasVisual />} />
              <Route path="/licencas" element={<LicencasPanel />} />
              <Route path="/processos-visual" element={<ProcessosVisual />} />
              <Route path="/jackbox" element={<JackboxPanel />} />
              <Route path="/jackbox-detalhado" element={<JackboxDetalhado />} />
              {/* Detail Panels */}
              <Route path="/demandas" element={<DemandasPanel />} />
              <Route path="/processos" element={<ProcessosPanel />} />
              <Route path="/config" element={<Config />} />
              {/* Backlog de Produto */}
              <Route path="/backlog" element={<Backlog />} />
              <Route path="/backlog/:id" element={<BacklogDetail />} />
              {/* Modo TV / Apresentação */}
              <Route path="/tv" element={<TVMode />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ClientProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
