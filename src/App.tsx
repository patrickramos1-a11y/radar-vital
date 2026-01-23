import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClientProvider } from "@/contexts/ClientContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Config from "./pages/Config";
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
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-2xl">AC</span>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <ClientProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        {/* Unified Panels (New - Macro View) */}
        <Route path="/demandas-unificado" element={<DemandasUnified />} />
        <Route path="/processos-unificado" element={<ProcessosUnified />} />
        <Route path="/jackbox-unificado" element={<JackboxUnified />} />
        <Route path="/comentarios" element={<CommentsPanel />} />
        <Route path="/notificacoes" element={<NotificacoesPanel />} />
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
        {/* Redirect auth pages to home if logged in */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/cadastro" element={<Navigate to="/" replace />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ClientProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <AuthenticatedApp />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
