import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListChecks,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useClients } from "@/contexts/ClientContext";
import { useAudits } from "@/hooks/useAudits";
import { getAuditElapsedDays } from "@/lib/audit";
import { cn } from "@/lib/utils";
import type {
  Audit,
  AuditClientItem,
  AuditClientResult,
  AuditClientStatus,
  AuditCriterion,
  AuditCriterionResultStatus,
  AuditFormData,
} from "@/types/audit";
import { useSearchParams } from "react-router-dom";

const statusConfig: Record<
  AuditClientStatus,
  { label: string; className: string }
> = {
  pending: { label: "Pendente", className: "bg-slate-100 text-slate-700" },
  in_progress: {
    label: "Em auditoria",
    className: "bg-amber-100 text-amber-800",
  },
  completed: {
    label: "Concluída",
    className: "bg-sky-100 text-sky-800",
  },
  validated: {
    label: "Validada",
    className: "bg-emerald-100 text-emerald-800",
  },
};

export default function Auditorias() {
  const [searchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const { clients } = useClients();
  const {
    audits,
    criteria,
    results,
    isLoading,
    error,
    openAudit,
    updateClientItem,
    closeAudit,
    updateClientResult,
    getItemsForAudit,
    getSummary,
    refetch,
  } = useAudits();
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [criteriaItemId, setCriteriaItemId] = useState<string | null>(null);

  useEffect(() => {
    const requestedAuditId = searchParams.get("auditId");
    if (
      requestedAuditId &&
      audits.some((audit) => audit.id === requestedAuditId)
    ) {
      setSelectedAuditId(requestedAuditId);
      return;
    }
    if (
      selectedAuditId &&
      audits.some((audit) => audit.id === selectedAuditId)
    ) {
      return;
    }
    setSelectedAuditId(
      audits.find((audit) => audit.status === "active")?.id ??
        audits[0]?.id ??
        null,
    );
  }, [audits, searchParams, selectedAuditId]);

  const selectedAudit =
    audits.find((audit) => audit.id === selectedAuditId) ?? null;
  const selectedItems = selectedAudit
    ? getItemsForAudit(selectedAudit.id)
    : [];
  const summary = selectedAudit ? getSummary(selectedAudit.id) : null;
  const selectedCriteria = selectedAudit
    ? criteria.filter((criterion) => criterion.auditId === selectedAudit.id)
    : [];
  const criteriaItem =
    selectedItems.find((item) => item.id === criteriaItemId) ?? null;
  const clientById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  );

  return (
    <AppLayout>
      <div className="h-full overflow-auto bg-background">
        <div className="mx-auto max-w-[1600px] space-y-4 p-4 md:p-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <ShieldCheck className="h-6 w-6 text-primary" />
                Auditorias
              </h1>
              <p className="text-sm text-muted-foreground">
                Campanhas de verificação dos clientes AC.
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova auditoria
              </Button>
            )}
          </header>

          {error && (
            <div className="flex items-center justify-between border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
              <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Carregando auditorias...
            </div>
          ) : audits.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center border border-dashed bg-muted/20 text-center">
              <ShieldCheck className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">Nenhuma auditoria aberta</p>
              <p className="text-sm text-muted-foreground">
                Uma nova campanha captura os clientes AC ativos daquele momento.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[310px_minmax(0,1fr)]">
              <aside className="space-y-2">
                {audits.map((audit) => (
                  <AuditSelector
                    key={audit.id}
                    audit={audit}
                    selected={audit.id === selectedAuditId}
                    summary={getSummary(audit.id)}
                    onClick={() => setSelectedAuditId(audit.id)}
                  />
                ))}
              </aside>

              {selectedAudit && summary && (
                <section className="min-w-0 space-y-4">
                  <div className="border bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <h2 className="text-lg font-bold">
                            {selectedAudit.title}
                          </h2>
                          <AuditStatus audit={selectedAudit} />
                        </div>
                        {selectedAudit.objective && (
                          <p className="text-sm text-muted-foreground">
                            {selectedAudit.objective}
                          </p>
                        )}
                      </div>
                      {isAdmin && selectedAudit.status === "active" && (
                        <Button
                          variant="outline"
                          disabled={summary.validated !== summary.total}
                          onClick={() => void closeAudit(selectedAudit.id)}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Encerrar auditoria
                        </Button>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-6">
                      <Metric label="Empresas" value={summary.total} />
                      <Metric label="Pendentes" value={summary.pending} />
                      <Metric label="Em auditoria" value={summary.inProgress} />
                      <Metric label="Concluídas" value={summary.completed} />
                      <Metric label="Validadas" value={summary.validated} />
                      <Metric
                        label="Tempo"
                        value={`${getAuditElapsedDays(selectedAudit)}d`}
                      />
                    </div>

                    <div className="mt-3 h-2 overflow-hidden bg-muted">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${summary.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-[10px] text-muted-foreground">
                      {summary.progress}% validada
                    </p>
                  </div>

                  {selectedCriteria.length > 0 && (
                    <div className="border bg-card p-3">
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <ListChecks className="h-4 w-4 text-primary" />
                        Critérios da auditoria
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCriteria.map((criterion) => (
                          <span
                            key={criterion.id}
                            className="border bg-muted/30 px-2 py-1 text-xs"
                          >
                            {criterion.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="overflow-hidden border bg-card">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-sm">
                        <thead className="bg-muted/50 text-left text-[10px] uppercase text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2">Empresa</th>
                            <th className="px-3 py-2">Situação</th>
                            <th className="px-3 py-2">Início</th>
                            <th className="px-3 py-2">Conclusão</th>
                            <th className="px-3 py-2">Critérios</th>
                            <th className="px-3 py-2">Observação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {selectedItems.map((item) => {
                            const client = clientById.get(item.clientId);
                            return (
                              <tr key={item.id}>
                                <td className="px-3 py-2 font-medium">
                                  {client?.name ?? "Cliente removido"}
                                </td>
                                <td className="px-3 py-2">
                                  {isAdmin &&
                                  selectedAudit.status === "active" ? (
                                    <select
                                      value={item.status}
                                      onChange={(event) =>
                                        void updateClientItem(
                                          item.id,
                                          event.target
                                            .value as AuditClientStatus,
                                          item.notes,
                                        )
                                      }
                                      className={cn(
                                        "h-8 border px-2 text-xs font-medium",
                                        statusConfig[item.status].className,
                                      )}
                                    >
                                      {(
                                        Object.keys(
                                          statusConfig,
                                        ) as AuditClientStatus[]
                                      ).map((status) => (
                                        <option key={status} value={status}>
                                          {statusConfig[status].label}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span
                                      className={cn(
                                        "inline-flex px-2 py-1 text-xs",
                                        statusConfig[item.status].className,
                                      )}
                                    >
                                      {statusConfig[item.status].label}
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">
                                  {formatDate(item.startedAt)}
                                </td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">
                                  {formatDate(
                                    item.validatedAt ?? item.completedAt,
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {selectedCriteria.length > 0 ? (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setCriteriaItemId(item.id)}
                                    >
                                      <ListChecks className="mr-1 h-3.5 w-3.5" />
                                      {
                                        results.filter(
                                          (result) =>
                                            result.auditClientItemId ===
                                              item.id &&
                                            result.result !== "pending",
                                        ).length
                                      }
                                      /{selectedCriteria.length}
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      Sem critérios
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    defaultValue={item.notes ?? ""}
                                    disabled={
                                      !isAdmin ||
                                      selectedAudit.status !== "active"
                                    }
                                    placeholder="Adicionar observação"
                                    className="h-8 w-full min-w-48 border bg-background px-2 text-xs disabled:opacity-70"
                                    onBlur={(event) => {
                                      if (
                                        event.target.value.trim() !==
                                        (item.notes ?? "")
                                      ) {
                                        void updateClientItem(
                                          item.id,
                                          item.status,
                                          event.target.value,
                                        );
                                      }
                                    }}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      <CreateAuditDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={async (data) => {
          const auditId = await openAudit(data);
          if (auditId) {
            setSelectedAuditId(auditId);
            setCreateOpen(false);
          }
        }}
      />

      <AuditCriteriaDialog
        open={Boolean(criteriaItem)}
        onOpenChange={(open) => !open && setCriteriaItemId(null)}
        item={criteriaItem}
        clientName={
          criteriaItem
            ? clientById.get(criteriaItem.clientId)?.name ?? "Cliente"
            : ""
        }
        criteria={selectedCriteria}
        results={results.filter(
          (result) => result.auditClientItemId === criteriaItem?.id,
        )}
        canEdit={isAdmin && selectedAudit?.status === "active"}
        onSave={updateClientResult}
      />
    </AppLayout>
  );
}

function AuditCriteriaDialog({
  open,
  onOpenChange,
  item,
  clientName,
  criteria,
  results,
  canEdit,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: AuditClientItem | null;
  clientName: string;
  criteria: AuditCriterion[];
  results: AuditClientResult[];
  canEdit: boolean;
  onSave: (
    resultId: string,
    status: AuditCriterionResultStatus,
    notes?: string | null,
    evidenceUrl?: string | null,
  ) => Promise<boolean>;
}) {
  const resultByCriterion = useMemo(
    () => new Map(results.map((result) => [result.auditCriterionId, result])),
    [results],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[86vh] max-w-3xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Critérios - {clientName}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 space-y-2 overflow-auto">
          {item &&
            criteria.map((criterion) => {
              const result = resultByCriterion.get(criterion.id);
              return result ? (
                <AuditCriterionRow
                  key={criterion.id}
                  criterion={criterion}
                  result={result}
                  canEdit={canEdit}
                  onSave={onSave}
                />
              ) : null;
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AuditCriterionRow({
  criterion,
  result,
  canEdit,
  onSave,
}: {
  criterion: AuditCriterion;
  result: AuditClientResult;
  canEdit: boolean;
  onSave: (
    resultId: string,
    status: AuditCriterionResultStatus,
    notes?: string | null,
    evidenceUrl?: string | null,
  ) => Promise<boolean>;
}) {
  const [status, setStatus] = useState<AuditCriterionResultStatus>(
    result.result,
  );
  const [notes, setNotes] = useState(result.notes ?? "");
  const [evidenceUrl, setEvidenceUrl] = useState(result.evidenceUrl ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(result.result);
    setNotes(result.notes ?? "");
    setEvidenceUrl(result.evidenceUrl ?? "");
  }, [result]);

  const changed =
    status !== result.result ||
    notes.trim() !== (result.notes ?? "") ||
    evidenceUrl.trim() !== (result.evidenceUrl ?? "");

  return (
    <div className="grid gap-3 border bg-card p-3 md:grid-cols-[minmax(0,1fr)_160px]">
      <div className="min-w-0">
        <p className="font-medium">{criterion.title}</p>
        {criterion.description && (
          <p className="text-xs text-muted-foreground">
            {criterion.description}
          </p>
        )}
        <div className="mt-2 grid gap-2">
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={!canEdit}
            placeholder="Observação do critério"
            className="h-9 border bg-background px-2 text-xs disabled:opacity-70"
          />
          <input
            value={evidenceUrl}
            onChange={(event) => setEvidenceUrl(event.target.value)}
            disabled={!canEdit}
            placeholder="Link de evidência, se houver"
            className="h-9 border bg-background px-2 text-xs disabled:opacity-70"
          />
        </div>
      </div>
      <div className="grid content-start gap-2">
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as AuditCriterionResultStatus)
          }
          disabled={!canEdit}
          className="h-9 border bg-background px-2 text-xs"
        >
          <option value="pending">Pendente</option>
          <option value="ok">OK</option>
          <option value="not_ok">Não conforme</option>
          <option value="not_applicable">Não se aplica</option>
        </select>
        {canEdit && (
          <Button
            size="sm"
            disabled={!changed || saving}
            onClick={async () => {
              setSaving(true);
              await onSave(result.id, status, notes, evidenceUrl);
              setSaving(false);
            }}
          >
            {saving ? "Salvando..." : "Salvar critério"}
          </Button>
        )}
      </div>
    </div>
  );
}

function AuditSelector({
  audit,
  selected,
  summary,
  onClick,
}: {
  audit: Audit;
  selected: boolean;
  summary: ReturnType<ReturnType<typeof useAudits>["getSummary"]>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full border bg-card p-3 text-left transition-colors hover:bg-muted/40",
        selected && "border-primary bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold">{audit.title}</span>
        <AuditStatus audit={audit} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{summary.total} empresas</span>
        <span>{summary.progress}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden bg-muted">
        <div
          className="h-full bg-primary"
          style={{ width: `${summary.progress}%` }}
        />
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
        <Clock3 className="h-3 w-3" />
        {getAuditElapsedDays(audit)} dias
      </div>
    </button>
  );
}

function AuditStatus({ audit }: { audit: Audit }) {
  const labels: Record<Audit["status"], string> = {
    draft: "Rascunho",
    active: "Em andamento",
    closed: "Encerrada",
    cancelled: "Cancelada",
  };
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap px-2 py-0.5 text-[10px] font-semibold uppercase",
        audit.status === "active" && "bg-amber-100 text-amber-800",
        audit.status === "closed" && "bg-emerald-100 text-emerald-800",
        audit.status === "draft" && "bg-slate-100 text-slate-700",
        audit.status === "cancelled" && "bg-red-100 text-red-700",
      )}
    >
      {labels[audit.status]}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border bg-background px-3 py-2">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function CreateAuditDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AuditFormData) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [criteria, setCriteria] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      objective: objective.trim(),
      dueAt,
      criteria: criteria
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
    });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova auditoria</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Título</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-10 border bg-background px-3"
              placeholder="Ex.: Auditoria de atendimento"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Objetivo</span>
            <input
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              className="h-10 border bg-background px-3"
              placeholder="O que será verificado nesta campanha?"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Descrição</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-20 border bg-background p-3"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Prazo</span>
            <input
              type="date"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
              className="h-10 border bg-background px-3"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Critérios, um por linha</span>
            <textarea
              value={criteria}
              onChange={(event) => setCriteria(event.target.value)}
              className="min-h-28 border bg-background p-3"
              placeholder={"Atendimento atualizado\nPendências identificadas\nPróximas ações definidas"}
            />
          </label>
          <div className="border bg-muted/20 p-3 text-xs text-muted-foreground">
            <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
            Ao abrir, todos os clientes AC ativos serão registrados como um
            snapshot desta auditoria.
          </div>
          <Button disabled={!title.trim() || saving} onClick={() => void submit()}>
            {saving ? "Abrindo..." : "Abrir auditoria"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "—";
}
