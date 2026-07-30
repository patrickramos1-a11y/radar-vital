import { useState, type FormEvent } from "react";
import { KeyRound, Leaf, LoaderCircle, Mail } from "lucide-react";
import logoSisramos from "@/assets/logo-sisramos.png";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type LoginMode = "password" | "magic-link";

export default function Login() {
  const { signInWithMagicLink, signInWithPassword } = useAuth();
  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === "password") {
        await signInWithPassword(email, password);
      } else {
        await signInWithMagicLink(email);
        setSuccessMessage(
          "Enviamos um link de acesso para o e-mail informado.",
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel autenticar. Tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50/60 grid lg:grid-cols-[minmax(0,1fr)_480px]">
      <section className="hidden lg:flex relative overflow-hidden bg-emerald-950 text-white p-12">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,#34d399_0,transparent_40%),radial-gradient(circle_at_80%_80%,#0ea5e9_0,transparent_38%)]" />
        <div className="relative z-10 flex flex-col justify-between max-w-xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-400 text-emerald-950 grid place-items-center">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold">Ramos Engenharia</span>
          </div>
          <div>
            <p className="text-emerald-300 text-sm font-medium mb-3">
              SISRAMOS
            </p>
            <h1 className="text-4xl font-semibold leading-tight">
              Gestao ambiental com identidade e rastreabilidade.
            </h1>
            <p className="text-emerald-100/75 mt-5 text-base leading-relaxed">
              Acesse clientes, tarefas, entregas e indicadores em um ambiente
              interno protegido.
            </p>
          </div>
          <p className="text-xs text-emerald-100/50">
            Painel de Indicadores AC
          </p>
        </div>
      </section>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <img
            src={logoSisramos}
            alt="SISRAMOS"
            className="h-12 w-auto object-contain mb-8"
          />

          <h2 className="text-2xl font-semibold text-foreground">
            Entrar na plataforma
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Use o e-mail vinculado ao seu cadastro de colaborador.
          </p>

          <div className="grid grid-cols-2 border border-border mt-7">
            <button
              type="button"
              className={`h-10 text-sm font-medium transition-colors ${
                mode === "password"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-muted-foreground hover:bg-muted"
              }`}
              onClick={() => setMode("password")}
            >
              Senha
            </button>
            <button
              type="button"
              className={`h-10 text-sm font-medium transition-colors ${
                mode === "magic-link"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-muted-foreground hover:bg-muted"
              }`}
              onClick={() => setMode("magic-link")}
            >
              Link por e-mail
            </button>
          </div>

          <form className="space-y-4 mt-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            {mode === "password" && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            )}

            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={submitting}
            >
              {submitting ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : mode === "password" ? (
                "Entrar"
              ) : (
                "Enviar link de acesso"
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
