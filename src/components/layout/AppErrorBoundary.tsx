import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

/** Prevents a client render failure from becoming a blank screen, especially on mobile. */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Falha ao renderizar o Radar Vital", error, info);
  }

  private handleReload = () => {
    window.location.replace(`${window.location.pathname}?atualizar=${Date.now()}`);
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <section className="max-w-sm space-y-3">
          <h1 className="text-lg font-semibold text-foreground">Não foi possível abrir o painel</h1>
          <p className="text-sm text-muted-foreground">
            Atualize para baixar a versão mais recente do Radar Vital.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar aplicativo
          </button>
        </section>
      </main>
    );
  }
}
