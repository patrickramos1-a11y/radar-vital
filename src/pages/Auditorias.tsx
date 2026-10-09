import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListChecks,
  Plus,
  Save,
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
import type { Collaborator } from "@/types/collaborator";
import { useSearchParams } from "react-router-dom";

type SortColumn =
  | "client"
  | "status"
  | "startedAt"
  | "completedAt"
  | "assignee"
  | "notes";
type PresenceFilter = "all" | "with" | "without";

const statusConfig: Record<
  AuditClientStatus,
  { label: string; className: string }
> = {
  pending: { label: "Pendente", className: "bg-slate-100 text-slate-700" },
  in_progress: {
    label: "Em andamento",
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
  const { collaborators, isAdmin } = useAuth();
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
  const [statusFilter, setStatusFilter] = useState<AuditClientStatus | "all">(
    "all",
  );
  const [clientSearch, setClientSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [startedFilter, setStartedFilter] = useState<PresenceFilter>("all");
  const [completedFilter, setCompletedFilter] =
    useState<PresenceFilter>("all");
  const [notesFilter, setNotesFilter] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("client");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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
  const selectedItems = useMemo(
    () => (selectedAuditId ? getItemsForAudit(selectedAuditId) : []),
    [getItemsForAudit, selectedAuditId],
  );
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
  const collaboratorById = useMemo(
    () => new Map(collaborators.map((person) => [person.id, person])),
    [collaborators],
  );
  const filteredItems = useMemo(() => {
    const normalizedSearch = clientSearch.trim().toLocaleLowerCase("pt-BR");
    const normalizedNotes = notesFilter.trim().toLocaleLowerCase("pt-BR");
    const presenceMatches = (value: string | null, filter: PresenceFilter) =>
      filter === "all" || (filter === "with" ? Boolean(value) : !value);

    return selectedItems
      .filter((item) => {
        const clientName = clientById.get(item.clientId)?.name ?? "";
        if (
          normalizedSearch &&
          !clientName.toLocaleLowerCase("pt-BR").includes(normalizedSearch)
        ) {
          return false;
        }
        if (statusFilter !== "all" && item.status !== statusFilter) return false;
        if (
          assigneeFilter !== "all" &&
          (assigneeFilter === "unassigned"
            ? Boolean(item.assigneeId)
            : item.assigneeId !== assigneeFilter)
        ) {
          return false;
        }
        if (!presenceMatches(item.startedAt, startedFilter)) return false;
        if (
          !presenceMatches(
            item.validatedAt ?? item.completedAt,
            completedFilter,
          )
        ) {
          return false;
        }
        return (
          !normalizedNotes ||
          (item.notes ?? "")
            .toLocaleLowerCase("pt-BR")
            .includes(normalizedNotes)
        );
      })
      .sort((left, right) => {
        const valueFor = (item: AuditClientItem) => {
          if (sortColumn === "client") {
            return clientById.get(item.clientId)?.name ?? "";
          }
          if (sortColumn === "status") return item.status;
          if (sortColumn === "startedAt") return item.startedAt ?? "";
          if (sortColumn === "completedAt") {
            return item.validatedAt ?? item.completedAt ?? "";
          }
          if (sortColumn === "assignee") {
            return collaboratorById.get(item.assigneeId ?? "")?.name ?? "";
          }
          return item.notes ?? "";
        };
        const comparison = valueFor(left).localeCompare(
          valueFor(right),
          "pt-BR",
          { numeric: true },
        );
        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [
    assigneeFilter,
    clientById,
    clientSearch,
    collaboratorById,
    completedFilter,
    notesFilter,
    selectedItems,
    sortColumn,
    sortDirection,
    startedFilter,
    statusFilter,
  ]);

  const hasColumnFilters =
    Boolean(clientSearch || notesFilter) ||
    statusFilter !== "all" ||
    assigneeFilter !== "all" ||
    startedFilter !== "all" ||
    completedFilter !== "all";

  const toggleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortColumn(column);
    setSortDirection("asc");
  };

  const clearColumnFilters = () => {
    setClientSearch("");
    setStatusFilter("all");
    setAssigneeFilter("all");
    setStartedFilter("all");
    setCompletedFilter("all");
    setNotesFilter("");
  };

  useEffect(() => {
    setStatusFilter("all");
    setClientSearch("");
    setAssigneeFilter("all");
    setStartedFilter("all");
    setCompletedFilter("all");
    setNotesFilter("");
  }, [selectedAuditId]);

  return (
    <AppLayout>
      <div className="h-full overflow-auto bg-background">
        <div className="w-full space-y-4 p-4 md:p-6">
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
            <div className="space-y-4">
              <aside className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                      <Metric label="Em andamento" value={summary.inProgress} />
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

                  <div className="border bg-card">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
                      <p className="text-sm font-medium">Empresas da auditoria</p>
                      <div className="flex items-center gap-2">
                        {hasColumnFilters && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearColumnFilters}
                          >
                            Limpar filtros
                          </Button>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {filteredItems.length} de {selectedItems.length}{" "}
                          empresas
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1120px] text-sm">
                        <thead className="bg-muted/50 text-left text-[10px] uppercase text-muted-foreground">
                          <tr>
                            <SortableHeader label="Empresa" column="client" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                            <SortableHeader label="Situação" column="status" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                            <SortableHeader label="Início" column="startedAt" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                            <SortableHeader label="Conclusão" column="completedAt" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                            <SortableHeader label="Responsável" column="assignee" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                            <SortableHeader label="Observação" column="notes" activeColumn={sortColumn} direction={sortDirection} onSort={toggleSort} />
                            <th className="px-3 py-2 text-right">Ações</th>
                          </tr>
                          <tr className="border-t bg-background normal-case">
                            <th className="px-2 py-2">
                              <input value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} placeholder="Filtrar empresa" aria-label="Filtrar empresa" className="h-8 w-full min-w-48 border px-2 text-xs" />
                            </th>
                            <th className="px-2 py-2">
                              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AuditClientStatus | "all")} aria-label="Filtrar por situação" className="h-8 w-full min-w-32 border bg-background px-2 text-xs">
                                <option value="all">Todas</option>
                                {(Object.keys(statusConfig) as AuditClientStatus[]).map((status) => <option key={status} value={status}>{statusConfig[status].label}</option>)}
                              </select>
                            </th>
                            <th className="px-2 py-2"><PresenceSelect label="Filtrar início" value={startedFilter} onChange={setStartedFilter} /></th>
                            <th className="px-2 py-2"><PresenceSelect label="Filtrar conclusão" value={completedFilter} onChange={setCompletedFilter} /></th>
                            <th className="px-2 py-2">
                              <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} aria-label="Filtrar por responsável" className="h-8 w-full min-w-36 border bg-background px-2 text-xs">
                                <option value="all">Todos</option>
                                <option value="unassigned">Sem responsável</option>
                                {collaborators.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                              </select>
                            </th>
                            <th className="px-2 py-2">
                              <input value={notesFilter} onChange={(event) => setNotesFilter(event.target.value)} placeholder="Filtrar observação" aria-label="Filtrar observação" className="h-8 w-full min-w-48 border px-2 text-xs" />
                            </th>
                            <th />
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredItems.map((item) => (
                            <AuditClientRow
                              key={item.id}
                              item={item}
                              clientName={
                                clientById.get(item.clientId)?.name ??
                                "Cliente removido"
                              }
                              canEdit={
                                isAdmin && selectedAudit.status === "active"
                              }
                              collaborators={collaborators}
                              criteriaCount={selectedCriteria.length}
                              evaluatedCriteriaCount={
                                results.filter(
                                  (result) =>
                                    result.auditClientItemId === item.id &&
                                    result.result !== "pending",
                                ).length
                              }
                              onOpenCriteria={() =>
                                setCriteriaItemId(item.id)
                              }
                              onSave={updateClientItem}
                            />
                          ))}
                          {filteredItems.length === 0 && (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-4 py-10 text-center text-sm text-muted-foreground"
                              >
                                Nenhuma empresa corresponde aos filtros.
                              </td>
                            </tr>
                          )}
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

function AuditClientRow({
  item,
  clientName,
  canEdit,
  collaborators,
  criteriaCount,
  evaluatedCriteriaCount,
  onOpenCriteria,
  onSave,
}: {
  item: AuditClientItem;
  clientName: string;
  canEdit: boolean;
  collaborators: Collaborator[];
  criteriaCount: number;
  evaluatedCriteriaCount: number;
  onOpenCriteria: () => void;
  onSave: (
    itemId: string,
    status: AuditClientStatus,
    notes?: string | null,
    assigneeId?: string | null,
  ) => Promise<boolean>;
}) {
  const [status, setStatus] = useState<AuditClientStatus>(item.status);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [assigneeId, setAssigneeId] = useState(item.assigneeId ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(item.status);
    setNotes(item.notes ?? "");
    setAssigneeId(item.assigneeId ?? "");
  }, [item]);

  const changed =
    status !== item.status ||
    notes.trim() !== (item.notes ?? "") ||
    assigneeId !== (item.assigneeId ?? "");

  return (
    <tr className="align-top transition-colors hover:bg-muted/20">
      <td className="px-3 py-2 font-medium">{clientName}</td>
      <td className="px-3 py-2">
        {canEdit ? (
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as AuditClientStatus)
            }
            className={cn(
              "h-8 min-w-32 border px-2 text-xs font-medium",
              statusConfig[status].className,
            )}
            aria-label={`Situação de ${clientName}`}
          >
            {(Object.keys(statusConfig) as AuditClientStatus[]).map(
              (statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusConfig[statusOption].label}
                </option>
              ),
            )}
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
        {formatDate(item.validatedAt ?? item.completedAt)}
      </td>
      <td className="px-3 py-2">
        {canEdit ? (
          <select
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
            aria-label={`Responsável por ${clientName}`}
            className="h-8 min-w-36 border bg-background px-2 text-xs"
          >
            <option value="">Sem responsável</option>
            {collaborators.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-xs text-muted-foreground">
            {collaborators.find((person) => person.id === item.assigneeId)
              ?.name ?? "Sem responsável"}
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        <input
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={!canEdit}
          placeholder="Adicionar observação"
          className="h-8 w-full min-w-48 border bg-background px-2 text-xs disabled:opacity-70"
        />
      </td>
      <td className="px-3 py-2">
        <div className="flex justify-end gap-1">
        {criteriaCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenCriteria}
            title={`Critérios: ${evaluatedCriteriaCount} de ${criteriaCount} avaliados`}
          >
            <ListChecks className="h-3.5 w-3.5" />
            <span className="sr-only">Abrir critérios de {clientName}</span>
          </Button>
        )}
        {canEdit && (
          <Button
            type="button"
            size="sm"
            disabled={!changed || saving}
            onClick={async () => {
              setSaving(true);
              await onSave(
                item.id,
                status,
                notes.trim(),
                assigneeId || null,
              );
              setSaving(false);
            }}
          >
            <Save className="mr-1 h-3.5 w-3.5" />
            {saving ? "Salvando" : "Salvar"}
          </Button>
        )}
        </div>
      </td>
    </tr>
  );
}

function SortableHeader({
  label,
  column,
  activeColumn,
  direction,
  onSort,
}: {
  label: string;
  column: SortColumn;
  activeColumn: SortColumn;
  direction: "asc" | "desc";
  onSort: (column: SortColumn) => void;
}) {
  return (
    <th className="px-2 py-1">
      <button
        type="button"
        onClick={() => onSort(column)}
        className="flex h-8 w-full items-center gap-1 px-1 text-left font-semibold hover:text-foreground"
        title={`Ordenar por ${label}`}
      >
        <span>{label}</span>
        <ArrowUpDown
          className={cn(
            "h-3.5 w-3.5",
            activeColumn === column && "text-primary",
          )}
        />
        <span className="sr-only">
          {activeColumn === column
            ? `Ordem ${direction === "asc" ? "crescente" : "decrescente"}`
            : "Ordenar"}
        </span>
      </button>
    </th>
  );
}

function PresenceSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PresenceFilter;
  onChange: (value: PresenceFilter) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as PresenceFilter)}
      aria-label={label}
      className="h-8 w-full min-w-28 border bg-background px-2 text-xs"
    >
      <option value="all">Todos</option>
      <option value="with">Com data</option>
      <option value="without">Sem data</option>
    </select>
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
