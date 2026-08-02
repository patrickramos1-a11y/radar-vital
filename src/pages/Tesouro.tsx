import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Coins,
  HandCoins,
  History,
  Landmark,
  RefreshCcw,
  RotateCcw,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CollaboratorAvatar } from "@/components/central-entregas/CollaboratorAvatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useCollaborators } from "@/hooks/useCollaborators";
import { useTreasury } from "@/hooks/useTreasury";
import { useOpportunityProgram } from "@/hooks/useOpportunityProgram";
import { calculateSettlementPreview } from "@/lib/treasury";
import { cn } from "@/lib/utils";
import { STAR_TRANSACTION_LABELS, type StarTransaction } from "@/types/treasury";

const starFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const currencyFormat = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function Tesouro() {
  const { isAdmin } = useAuth();
  const { collaborators } = useCollaborators();
  const treasury = useTreasury();
  const opportunityProgram = useOpportunityProgram();
  const [manualOpen, setManualOpen] = useState(false);
  const [openingOpen, setOpeningOpen] = useState(false);
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [reverseTransaction, setReverseTransaction] = useState<StarTransaction | null>(null);
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState("all");

  const displayedBalances = opportunityProgram.schemaReady
    ? opportunityProgram.treasuryBalances
    : treasury.balances;
  const balancesById = useMemo(
    () => new Map(displayedBalances.map((balance) => [balance.collaboratorId, balance])),
    [displayedBalances],
  );
  const activeCollaborators = collaborators.filter((collaborator) => collaborator.isActive);
  const transactions = treasury.transactions.filter(
    (transaction) =>
      selectedCollaboratorId === "all" || transaction.collaboratorId === selectedCollaboratorId,
  );

  return (
    <AppLayout>
      <main className="min-h-full bg-gradient-to-br from-background via-background to-primary/[0.03]">
        <div className="mx-auto max-w-[1600px] space-y-5 p-4 md:p-6">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Tesouro de Estrelas</h1>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Livro de créditos, penalidades, desafios e liquidações da equipe.
              </p>
            </div>
            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => void treasury.backfillSources()}>
                  <RefreshCcw className="mr-1.5 h-4 w-4" /> Sincronizar histórico
                </Button>
                <Button variant="outline" size="sm" onClick={() => setOpeningOpen(true)}>
                  <Sparkles className="mr-1.5 h-4 w-4" /> Crédito inicial
                </Button>
                <Button size="sm" onClick={() => setManualOpen(true)}>
                  <HandCoins className="mr-1.5 h-4 w-4" /> Movimentar estrelas
                </Button>
              </div>
            )}
          </header>

          {treasury.error ? (
            <section className="border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {treasury.error}
            </section>
          ) : (
            <>
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  label="Saldo do Tesouro"
                  value={`${starFormat.format(displayedBalances.reduce((total, balance) => total + balance.balance, 0))} estrelas`}
                  icon={WalletCards}
                  tone={displayedBalances.reduce((total, balance) => total + balance.balance, 0) < 0 ? "negative" : "primary"}
                />
                <SummaryCard
                  label="Créditos acumulados"
                  value={starFormat.format(treasury.summary.totalCredits)}
                  icon={ArrowUpRight}
                  tone="positive"
                />
                <SummaryCard
                  label="Débitos acumulados"
                  value={starFormat.format(Math.abs(treasury.summary.totalDebits))}
                  icon={ArrowDownRight}
                  tone="negative"
                />
                <SummaryCard
                  label="Saque individual pendente"
                  value={currencyFormat.format(opportunityProgram.individualBalances.reduce((total, item) => total + item.payableBrl, 0))}
                  icon={CircleDollarSign}
                  tone="muted"
                />
              </section>

              <section className="border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
                  <div>
                    <h2 className="font-semibold">Saldos individuais</h2>
                    <p className="text-xs text-muted-foreground">
                      Valores negativos entram no saldo coletivo e podem representar dívida.
                    </p>
                  </div>
                  {isAdmin && (
                    <Button variant="outline" size="sm" onClick={() => setSettlementOpen(true)}>
                      <CircleDollarSign className="mr-1.5 h-4 w-4" /> Liquidar saldos
                    </Button>
                  )}
                </div>
                <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-3">
                  {displayedBalances.map((balance) => (
                    <article key={balance.collaboratorId} className="flex items-center gap-3 p-4">
                      <CollaboratorAvatar name={balance.name} color={balance.color ?? undefined} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{balance.name}</p>
                        <p className="text-xs text-muted-foreground">
                          +{starFormat.format(balance.credits)} / {starFormat.format(balance.debits)}
                        </p>
                      </div>
                      <strong
                        className={cn(
                          "text-sm",
                          balance.balance > 0 && "text-emerald-700",
                          balance.balance < 0 && "text-destructive",
                        )}
                      >
                        {starFormat.format(balance.balance)}
                      </strong>
                    </article>
                  ))}
                  {!treasury.isLoading && displayedBalances.length === 0 && (
                    <p className="p-6 text-sm text-muted-foreground">Nenhum membro ativo do Tesouro.</p>
                  )}
                </div>
              </section>

              <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
                <div className="border bg-card">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
                    <div>
                      <h2 className="font-semibold">Extrato</h2>
                      <p className="text-xs text-muted-foreground">Toda correção vira estorno; nada é apagado.</p>
                    </div>
                    <select
                      value={selectedCollaboratorId}
                      onChange={(event) => setSelectedCollaboratorId(event.target.value)}
                      className="h-9 border bg-background px-2 text-sm"
                    >
                      <option value="all">Toda a equipe</option>
                      {displayedBalances.map((balance) => (
                        <option key={balance.collaboratorId} value={balance.collaboratorId}>
                          {balance.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="divide-y">
                    {transactions.slice(0, 80).map((transaction) => {
                      const balance = balancesById.get(transaction.collaboratorId);
                      const isCredit = transaction.amount > 0;
                      return (
                        <div key={transaction.id} className="flex items-center gap-3 p-3 text-sm">
                          <div
                            className={cn(
                              "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                              isCredit ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
                            )}
                          >
                            {isCredit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="font-medium">{STAR_TRANSACTION_LABELS[transaction.transactionType]}</span>
                              <span className="text-xs text-muted-foreground">{balance?.name ?? "Colaborador"}</span>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">{transaction.reason}</p>
                          </div>
                          <div className="text-right">
                            <strong className={isCredit ? "text-emerald-700" : "text-destructive"}>
                              {isCredit ? "+" : ""}{starFormat.format(transaction.amount)}
                            </strong>
                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(transaction.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          {isAdmin && transaction.transactionType !== "reversal" && !transaction.reversesTransactionId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Estornar movimentação"
                              onClick={() => setReverseTransaction(transaction)}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                    {!treasury.isLoading && transactions.length === 0 && (
                      <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma movimentação neste recorte.</p>
                    )}
                  </div>
                </div>

                <aside className="border bg-card">
                  <div className="border-b p-4">
                    <h2 className="font-semibold">Liquidações</h2>
                    <p className="text-xs text-muted-foreground">Histórico de placares encerrados.</p>
                  </div>
                  <div className="divide-y">
                    {treasury.settlements.slice(0, 12).map((settlement) => (
                      <article key={settlement.id} className="p-4">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-sm">{starFormat.format(settlement.totalStars)} estrelas</strong>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(settlement.createdAt), "dd/MM/yy", { locale: ptBR })}
                          </span>
                        </div>
                        {settlement.starToBrl !== null ? (
                          <p className="mt-1 text-sm text-emerald-700">{currencyFormat.format(settlement.totalBrl)}</p>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">Conversão em reais não definida.</p>
                        )}
                        {settlement.notes && <p className="mt-2 text-xs text-muted-foreground">{settlement.notes}</p>}
                      </article>
                    ))}
                    {!treasury.isLoading && treasury.settlements.length === 0 && (
                      <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma liquidação registrada.</p>
                    )}
                  </div>
                </aside>
              </section>
            </>
          )}
        </div>
      </main>

      <ManualTransactionDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        collaborators={activeCollaborators}
        onSubmit={treasury.grantManual}
      />
      <OpeningCreditDialog
        open={openingOpen}
        onOpenChange={setOpeningOpen}
        collaborators={activeCollaborators}
        onSubmit={treasury.grantOpening}
      />
      <SettlementDialog
        open={settlementOpen}
        onOpenChange={setSettlementOpen}
        balances={treasury.balances}
        onSubmit={treasury.settle}
      />
      <ReverseDialog
        transaction={reverseTransaction}
        onOpenChange={(open) => {
          if (!open) setReverseTransaction(null);
        }}
        onSubmit={treasury.reverse}
      />
    </AppLayout>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof Coins;
  tone: "primary" | "positive" | "negative" | "muted";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    positive: "bg-emerald-100 text-emerald-700",
    negative: "bg-rose-100 text-rose-700",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <article className="border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={cn("grid h-7 w-7 place-items-center rounded-full", tones[tone])}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        {label}
      </div>
      <p className="mt-3 text-xl font-bold">{value}</p>
    </article>
  );
}

function ManualTransactionDialog({
  open,
  onOpenChange,
  collaborators,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborators: { id: string; name: string }[];
  onSubmit: (input: { collaboratorId: string; amount: number; reason: string; isPenalty: boolean }) => Promise<boolean>;
}) {
  const [collaboratorId, setCollaboratorId] = useState("");
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState("");
  const [isPenalty, setIsPenalty] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!collaboratorId || amount <= 0 || !reason.trim()) return;
    setSaving(true);
    const success = await onSubmit({ collaboratorId, amount, reason, isPenalty });
    setSaving(false);
    if (success) {
      setReason("");
      setAmount(1);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Movimentar estrelas</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={isPenalty ? "outline" : "default"} onClick={() => setIsPenalty(false)}>Conceder</Button>
            <Button type="button" variant={isPenalty ? "destructive" : "outline"} onClick={() => setIsPenalty(true)}>Penalizar</Button>
          </div>
          <div className="space-y-1.5">
            <Label>Colaborador</Label>
            <select value={collaboratorId} onChange={(event) => setCollaboratorId(event.target.value)} className="h-10 w-full border bg-background px-3 text-sm">
              <option value="">Selecione</option>
              {collaborators.map((collaborator) => <option key={collaborator.id} value={collaborator.id}>{collaborator.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5"><Label>Quantidade de estrelas</Label><Input type="number" min="1" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></div>
          <div className="space-y-1.5"><Label>Justificativa</Label><Textarea value={reason} onChange={(event) => setReason(event.target.value)} /></div>
        </div>
        <DialogFooter><Button disabled={saving || !collaboratorId || amount <= 0 || !reason.trim()} onClick={() => void submit()}>{saving ? "Registrando..." : "Confirmar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OpeningCreditDialog({
  open,
  onOpenChange,
  collaborators,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborators: { id: string; name: string }[];
  onSubmit: (collaboratorIds: string[], amount: number, reason: string) => Promise<boolean>;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [amount, setAmount] = useState(500);
  const [reason, setReason] = useState("Crédito inicial da jornada");
  const [saving, setSaving] = useState(false);
  const allSelected = collaborators.length > 0 && selectedIds.length === collaborators.length;

  const toggle = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const submit = async () => {
    if (selectedIds.length === 0 || amount <= 0 || !reason.trim()) return;
    setSaving(true);
    const success = await onSubmit(selectedIds, amount, reason);
    setSaving(false);
    if (success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Crédito inicial em lote</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Cada colaborador selecionado receberá o valor integral informado.</p>
          <div className="flex items-center gap-2 border-b pb-2 text-sm font-medium"><Checkbox checked={allSelected} onCheckedChange={() => setSelectedIds(allSelected ? [] : collaborators.map((collaborator) => collaborator.id))} /> Selecionar todos</div>
          <div className="max-h-48 space-y-2 overflow-auto">
            {collaborators.map((collaborator) => <label key={collaborator.id} className="flex items-center gap-2 text-sm"><Checkbox checked={selectedIds.includes(collaborator.id)} onCheckedChange={() => toggle(collaborator.id)} />{collaborator.name}</label>)}
          </div>
          <div className="space-y-1.5"><Label>Estrelas por colaborador</Label><Input type="number" min="1" value={amount} onChange={(event) => setAmount(Number(event.target.value))} /></div>
          <div className="space-y-1.5"><Label>Justificativa</Label><Textarea value={reason} onChange={(event) => setReason(event.target.value)} /></div>
        </div>
        <DialogFooter><Button disabled={saving || selectedIds.length === 0 || amount <= 0 || !reason.trim()} onClick={() => void submit()}>{saving ? "Registrando..." : "Conceder crédito"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettlementDialog({
  open,
  onOpenChange,
  balances,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balances: ReturnType<typeof useTreasury>["balances"];
  onSubmit: ReturnType<typeof useTreasury>["settle"];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [rate, setRate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const rateValue = rate === "" ? null : Number(rate);
  const preview = calculateSettlementPreview(balances, selectedIds, rateValue);
  const allSelected = balances.length > 0 && selectedIds.length === balances.length;

  const toggle = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const submit = async () => {
    if (selectedIds.length === 0 || (rateValue !== null && rateValue < 0)) return;
    setSaving(true);
    const success = await onSubmit({ collaboratorIds: selectedIds, periodStart, periodEnd, starToBrl: rateValue, notes });
    setSaving(false);
    if (success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Liquidar saldos selecionados</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">A liquidação cria registros compensatórios e zera somente os saldos selecionados. O extrato permanece intacto.</p>
          <div className="flex items-center gap-2 border-b pb-2 text-sm font-medium"><Checkbox checked={allSelected} onCheckedChange={() => setSelectedIds(allSelected ? [] : balances.map((balance) => balance.collaboratorId))} /> Selecionar todos</div>
          <div className="max-h-40 space-y-2 overflow-auto">
            {balances.map((balance) => <label key={balance.collaboratorId} className="flex items-center justify-between gap-2 text-sm"><span className="flex items-center gap-2"><Checkbox checked={selectedIds.includes(balance.collaboratorId)} onCheckedChange={() => toggle(balance.collaboratorId)} />{balance.name}</span><strong className={balance.balance < 0 ? "text-destructive" : "text-emerald-700"}>{starFormat.format(balance.balance)}</strong></label>)}
          </div>
          <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>Início do período</Label><Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} /></div><div className="space-y-1.5"><Label>Fim do período</Label><Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} /></div></div>
          <div className="space-y-1.5"><Label>Valor de 1 estrela em reais (opcional)</Label><Input type="number" min="0" step="0.01" value={rate} onChange={(event) => setRate(event.target.value)} placeholder="Ainda não definido" /></div>
          <div className="grid grid-cols-2 gap-2 border bg-muted/30 p-3 text-sm"><span>Saldo líquido: <strong>{starFormat.format(preview.totalStars)}</strong></span><span>Pagamento: <strong>{preview.estimatedBrl === null ? "a definir" : currencyFormat.format(preview.estimatedBrl)}</strong></span></div>
          <div className="space-y-1.5"><Label>Observações</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
        </div>
        <DialogFooter><Button disabled={saving || selectedIds.length === 0 || (rateValue !== null && rateValue < 0)} onClick={() => void submit()}>{saving ? "Liquidando..." : "Confirmar liquidação"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReverseDialog({
  transaction,
  onOpenChange,
  onSubmit,
}: {
  transaction: StarTransaction | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (transactionId: string, reason: string) => Promise<boolean>;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!transaction || !reason.trim()) return;
    setSaving(true);
    const success = await onSubmit(transaction.id, reason);
    setSaving(false);
    if (success) {
      setReason("");
      onOpenChange(false);
    }
  };
  return (
    <Dialog open={Boolean(transaction)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Estornar movimentação</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">O valor oposto será adicionado ao extrato. A movimentação original continuará visível.</p>
        <div className="space-y-1.5"><Label>Motivo do estorno</Label><Textarea value={reason} onChange={(event) => setReason(event.target.value)} /></div>
        <DialogFooter><Button variant="destructive" disabled={saving || !reason.trim()} onClick={() => void submit()}>{saving ? "Estornando..." : "Confirmar estorno"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
