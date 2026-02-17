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
import JackboxPanel from "./pages/JackboxPanel";
import JackboxUnified from "./pages/JackboxUnified";
import JackboxDetalhado from "./pages/JackboxDetalhado";
import CommentsPanel from "./pages/CommentsPanel";
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
              <Route path="/comentarios" element={<CommentsPanel />} />
              <Route path="/relatorios-pdf" element={<RelatoriosPdf />} />
              <Route path="/jackbox" element={<JackboxPanel />} />
              <Route path="/jackbox-unificado" element={<JackboxUnified />} />
              <Route path="/jackbox-detalhado" element={<JackboxDetalhado />} />
              <Route path="/config" element={<Config />} />
              <Route path="/backlog" element={<Backlog />} />
              <Route path="/backlog/:id" element={<BacklogDetail />} />
              <Route path="/tv" element={<TVMode />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ClientProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
