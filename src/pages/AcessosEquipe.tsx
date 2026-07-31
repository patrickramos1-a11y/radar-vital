import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MailPlus, ShieldCheck, UserCheck, UserRoundX } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCollaborators } from "@/hooks/useCollaborators";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type InviteResult = { status?: "invited" | "existing"; message?: string };

export default function AcessosEquipe() {
  const { isAdmin } = useAuth();
  const { collaborators, loading, updateCollaborator, refetch } = useCollaborators();
  const { toast } = useToast();
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  const activeCollaborators = useMemo(
    () => collaborators.filter((collaborator) => collaborator.isActive),
    [collaborators],
  );

  const emailFor = (id: string, savedEmail: string | null) =>
    emails[id] ?? savedEmail ?? "";

  const saveAndInvite = async (collaboratorId: string, savedEmail: string | null) => {
    const email = emailFor(collaboratorId, savedEmail).trim().toLowerCase();
    if (!email) {
      toast({
        title: "Informe um e-mail",
        description: "Cadastre o e-mail corporativo ou pessoal do colaborador antes de enviar o acesso.",
        variant: "destructive",
      });
      return;
    }

    setSendingId(collaboratorId);
    try {
      const saved = await updateCollaborator(collaboratorId, { email });
      if (!saved) return;

      const { data, error } = await supabase.functions.invoke<InviteResult>(
        "invite-collaborator",
        { body: { collaboratorId, redirectTo: window.location.origin } },
      );
      if (error) throw error;

      await refetch();
      toast({
        title: data?.status === "existing" ? "Acesso já existe" : "Convite enviado",
        description:
          data?.message ??
          "O colaborador receberá um e-mail para criar o acesso à plataforma.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível enviar o acesso",
        description:
          error instanceof Error
            ? error.message
            : "Verifique o e-mail e a configuração de autenticação.",
        variant: "destructive",
      });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <AppLayout>
      <main className="min-h-full bg-gradient-to-br from-background via-background to-primary/[0.03]">
        <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Acessos da equipe</h1>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Vincule o e-mail aos colaboradores existentes e envie o convite para entrar no SISRAMOS.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/config">Voltar à configuração</Link>
            </Button>
          </header>

          {!isAdmin ? (
            <section className="border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              Apenas administradores podem cadastrar e enviar acessos da equipe.
            </section>
          ) : (
            <>
              <section className="grid gap-3 md:grid-cols-3">
                <InfoCard label="Colaboradores ativos" value={activeCollaborators.length} />
                <InfoCard label="Acessos vinculados" value={activeCollaborators.filter((item) => item.userId).length} />
                <InfoCard label="Aguardando convite" value={activeCollaborators.filter((item) => !item.userId).length} />
              </section>

              <section className="border bg-card">
                <div className="border-b px-5 py-4">
                  <h2 className="font-semibold">Colaboradores disponíveis</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    O mesmo e-mail será usado no login. Quem já tiver acesso pode entrar pela opção “Link por e-mail” na tela inicial.
                  </p>
                </div>
                {loading ? (
                  <p className="p-5 text-sm text-muted-foreground">Carregando equipe...</p>
                ) : activeCollaborators.length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">Nenhum colaborador ativo cadastrado.</p>
                ) : (
                  <div className="divide-y">
                    {activeCollaborators.map((collaborator) => {
                      const hasAccess = Boolean(collaborator.userId);
                      return (
                        <div key={collaborator.id} className="grid gap-3 p-4 lg:grid-cols-[minmax(180px,0.75fr)_minmax(240px,1fr)_auto] lg:items-end">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: collaborator.color }}>
                                {collaborator.initials}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-medium">{collaborator.name}</p>
                                <Badge variant={hasAccess ? "default" : "secondary"} className="mt-1 gap-1">
                                  {hasAccess ? <UserCheck className="h-3 w-3" /> : <UserRoundX className="h-3 w-3" />}
                                  {hasAccess ? "Acesso vinculado" : "Sem acesso"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor={`email-${collaborator.id}`}>E-mail de acesso</Label>
                            <Input
                              id={`email-${collaborator.id}`}
                              type="email"
                              value={emailFor(collaborator.id, collaborator.email)}
                              onChange={(event) => setEmails((current) => ({ ...current, [collaborator.id]: event.target.value }))}
                              placeholder="nome@empresa.com"
                              disabled={sendingId === collaborator.id}
                            />
                          </div>
                          <Button
                            className="gap-2"
                            onClick={() => void saveAndInvite(collaborator.id, collaborator.email)}
                            disabled={sendingId === collaborator.id}
                          >
                            <MailPlus className="h-4 w-4" />
                            {sendingId === collaborator.id ? "Enviando..." : hasAccess ? "Atualizar e-mail" : "Enviar convite"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </AppLayout>
  );
}

function InfoCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
