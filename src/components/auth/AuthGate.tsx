import type { ReactNode } from "react";
import { AlertCircle, LoaderCircle, LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Login from "@/pages/Login";

export function AuthGate({ children }: { children: ReactNode }) {
  const {
    session,
    currentUser,
    loading,
    profileError,
    refreshIdentity,
    signOut,
  } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Validando acesso...</span>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-emerald-50/50 grid place-items-center p-6">
        <main className="w-full max-w-md bg-white border border-emerald-100 shadow-sm p-6">
          <div className="h-10 w-10 grid place-items-center bg-amber-50 text-amber-700 mb-4">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Acesso aguardando vinculacao
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {profileError ??
              "O usuario autenticado ainda nao foi vinculado a um colaborador."}
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            Confirme se o e-mail deste acesso e o mesmo cadastrado para o
            colaborador na configuracao da equipe.
          </p>
          <div className="flex gap-2 mt-6">
            <Button
              className="flex-1"
              onClick={() => void refreshIdentity()}
            >
              <RefreshCw className="h-4 w-4" />
              Verificar novamente
            </Button>
            <Button variant="outline" onClick={() => void signOut()}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return children;
}
