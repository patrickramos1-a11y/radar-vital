import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClientProvider } from "@/contexts/ClientContext";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Config from "./pages/Config";
import DemandasPanel from "./pages/DemandasPanel";
import DemandasVisual from "./pages/DemandasVisual";
import LicencasPanel from "./pages/LicencasPanel";
import LicencasVisual from "./pages/LicencasVisual";
import ProcessosPanel from "./pages/ProcessosPanel";
import ProcessosVisual from "./pages/ProcessosVisual";
import JackboxPanel from "./pages/JackboxPanel";
import JackboxDetalhado from "./pages/JackboxDetalhado";
import AuthPage from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthenticatedApp() {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <ClientProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
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
      <Toaster />
      <Sonner />
      <AuthenticatedApp />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
