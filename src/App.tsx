import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClientProvider } from "@/contexts/ClientContext";
import { UserProvider, useUser } from "@/contexts/UserContext";
import Index from "./pages/Index";
import Config from "./pages/Config";
import DemandasPanel from "./pages/DemandasPanel";
import DemandasVisual from "./pages/DemandasVisual";
import DemandasUnified from "./pages/DemandasUnified";
import LicencasPanel from "./pages/LicencasPanel";
import LicencasVisual from "./pages/LicencasVisual";
import ProcessosPanel from "./pages/ProcessosPanel";
import ProcessosVisual from "./pages/ProcessosVisual";
import ProcessosUnified from "./pages/ProcessosUnified";
import JackboxPanel from "./pages/JackboxPanel";
import JackboxUnified from "./pages/JackboxUnified";
import JackboxDetalhado from "./pages/JackboxDetalhado";
import CommentsPanel from "./pages/CommentsPanel";
import AuthPage from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthenticatedApp() {
  const { isLoggedIn } = useUser();

  if (!isLoggedIn) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<AuthPage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <ClientProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Unified Panels (New - Macro View) */}
          <Route path="/demandas-unificado" element={<DemandasUnified />} />
          <Route path="/processos-unificado" element={<ProcessosUnified />} />
          <Route path="/jackbox-unificado" element={<JackboxUnified />} />
          <Route path="/comentarios" element={<CommentsPanel />} />
          {/* Visual Panels (Macro) */}
          <Route path="/demandas-visual" element={<DemandasVisual />} />
          <Route path="/licencas-visual" element={<LicencasVisual />} />
          <Route path="/processos-visual" element={<ProcessosVisual />} />
          <Route path="/jackbox" element={<JackboxPanel />} />
          <Route path="/jackbox-detalhado" element={<JackboxDetalhado />} />
          {/* Detail Panels */}
          <Route path="/demandas" element={<DemandasPanel />} />
          <Route path="/licencas" element={<LicencasPanel />} />
          <Route path="/processos" element={<ProcessosPanel />} />
          <Route path="/config" element={<Config />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ClientProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserProvider>
        <Toaster />
        <Sonner />
        <AuthenticatedApp />
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
