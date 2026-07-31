import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Link2,
  Sparkles,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  getChallengeElapsedDays,
  getChallengeRewardStars,
  getEffectiveChallengeStatus,
} from "@/lib/challenge";
import type { Client } from "@/types/client";
import type { Collaborator } from "@/types/collaborator";
import type { Deliverable } from "@/types/deliverable";
import type { Priority } from "@/types/priority";
import type { Task } from "@/types/task";
import type {
  Challenge,
  ChallengeFormData,
  ChallengeItem,
  ChallengeParticipant,
  ChallengeStatus,
} from "@/types/challenge";
import { CHALLENGE_STATUS_CONFIG } from "@/types/challenge";

interface ChallengesTabProps {
  challenges: Challenge[];
  participantsByChallenge: Map<string, ChallengeParticipant[]>;
  itemsByChallenge: Map<string, ChallengeItem[]>;
  clients: Client[];
  collaborators: Collaborator[];
  selectedCollaboratorId: string | null;
  isTeamView: boolean;
  tasks: Task[];
  priorities: Priority[];
  deliverables: Deliverable[];
  canManage: boolean;
  isLoading: boolean;
  error: string | null;
  onCreate: (data: ChallengeFormData) => Promise<string | null>;
  onResolve: (
    challengeId: string,
    outcome: "won" | "lost",
    notes?: string,
  ) => Promise<boolean>;
}

interface ResolutionIntent {
  challenge: Challenge;
  outcome: "won" | "lost";
}

export function ChallengesTab({
  challenges,
  participantsByChallenge,
  itemsByChallenge,
  clients,
  collaborators,
  selectedCollaboratorId,
  isTeamView,
  tasks,
  priorities,
  deliverables,
  canManage,
  isLoading,
  error,
  onCreate,
  onResolve,
}: ChallengesTabProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [resolution, setResolution] = useState<ResolutionIntent | null>(null);
  const clientById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  );
  const collaboratorById = useMemo(
    () => new Map(collaborators.map((collaborator) => [collaborator.id, collaborator])),
    [collaborators],
  );

  const visibleChallenges = useMemo(
    () =>
      challenges.filter((challenge) => {
        if (challenge.clientId && !clientById.has(challenge.clientId)) return false;
        if (isTeamView) return true;
        return (participantsByChallenge.get(challenge.id) ?? []).some(
          (participant) => participant.collaboratorId === selectedCollaboratorId,
        );
      }),
    [
      challenges,
      clientById,
      isTeamView,
      participantsByChallenge,
      selectedCollaboratorId,
    ],
  );

  const summary = useMemo(() => {
    const result = {
      active: 0,
      awaitingValidation: 0,
      won: 0,
      totalRewardStars: 0,
    };

    visibleChallenges.forEach((challenge) => {
      const status = getEffectiveChallengeStatus(challenge);
      if (status === "active") result.active += 1;
      if (status === "awaiting_validation") result.awaitingValidation += 1;
      if (status === "won") result.won += 1;
      result.totalRewardStars +=
        getChallengeRewardStars(challenge) *
        (participantsByChallenge.get(challenge.id)?.length ?? 0);
    });

    return result;
  }, [participantsByChallenge, visibleChallenges]);

  if (isLoading) {
    return <EmptyState label="Carregando desafios..." />;
  }

  if (error) {
    return <EmptyState label={error} tone="error" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Desafios da equipe</p>
          <p className="text-xs text-muted-foreground">
            A recompensa e a penalidade são integrais para cada participante.
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Sparkles className="mr-1 h-4 w-4" /> Novo desafio
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Metric label="Em andamento" value={summary.active} icon={CalendarClock} />
        <Metric
          label="Para validar"
          value={summary.awaitingValidation}
          icon={CircleAlert}
          tone="amber"
        />
        <Metric label="Concluídos" value={summary.won} icon={Trophy} tone="green" />
        <Metric
          label="Estrelas possíveis"
          value={summary.totalRewardStars}
          icon={Sparkles}
          tone="violet"
        />
      </div>

      {visibleChallenges.length === 0 ? (
        <EmptyState label="Nenhum desafio neste recorte." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {visibleChallenges.map((challenge) => {
            const effectiveStatus = getEffectiveChallengeStatus(challenge);
            const participants = participantsByChallenge.get(challenge.id) ?? [];
            const linkedItems = itemsByChallenge.get(challenge.id) ?? [];
            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                effectiveStatus={effectiveStatus}
                clientName={
                  challenge.clientId
                    ? clientById.get(challenge.clientId)?.name ?? "Cliente removido"
                    : "Desafio interno"
                }
                participants={participants
                  .map((participant) => collaboratorById.get(participant.collaboratorId))
                  .filter((participant): participant is Collaborator => Boolean(participant))}
                linkedItemCount={linkedItems.length}
                canManage={canManage}
                onResolve={(outcome) => setResolution({ challenge, outcome })}
              />
            );
          })}
        </div>
      )}

      <ChallengeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clients={clients}
        collaborators={collaborators.filter((collaborator) => collaborator.isActive)}
        tasks={tasks}
        priorities={priorities}
        deliverables={deliverables}
        onCreate={onCreate}
      />
      <ResolutionDialog
        intent={resolution}
        onOpenChange={(open) => {
          if (!open) setResolution(null);
        }}
        onResolve={onResolve}
      />
    </div>
  );
}

function ChallengeCard({
  challenge,
  effectiveStatus,
  clientName,
  participants,
  linkedItemCount,
  canManage,
  onResolve,
}: {
  challenge: Challenge;
  effectiveStatus: ChallengeStatus;
  clientName: string;
  participants: Collaborator[];
  linkedItemCount: number;
  canManage: boolean;
  onResolve: (outcome: "won" | "lost") => void;
}) {
  const status = CHALLENGE_STATUS_CONFIG[effectiveStatus];
  const rewardStars = getChallengeRewardStars(challenge);
  const canResolve =
    canManage &&
    (effectiveStatus === "active" || effectiveStatus === "awaiting_validation");

  return (
    <article className="border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{challenge.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{clientName}</p>
        </div>
        <span className={cn("shrink-0 px-2 py-0.5 text-[10px] font-semibold uppercase", status.className)}>
          {status.label}
        </span>
      </div>

      {challenge.description && (
        <p className="mt-3 text-sm text-muted-foreground">{challenge.description}</p>
      )}

      <div className="mt-3 border-l-2 border-primary/50 pl-3 text-sm">
        <span className="text-xs font-semibold uppercase text-muted-foreground">Condição</span>
        <p>{challenge.successCriteria}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <Info icon={CalendarClock} label="Prazo" value={formatDate(challenge.dueAt)} />
        <Info
          icon={Sparkles}
          label="Recompensa"
          value={`${challenge.rewardSuperstars} Super = ${rewardStars}`}
        />
        <Info
          icon={CircleAlert}
          label="Penalidade"
          value={`${challenge.penaltyStars} estrelas`}
        />
        <Info
          icon={Link2}
          label="Itens"
          value={`${linkedItemCount} vinculados`}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        {participants.map((participant) => (
          <span
            key={participant.id}
            className="inline-flex items-center gap-1 border px-2 py-1 text-xs"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: participant.color }}
            />
            {participant.name}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
        <span className="text-xs text-muted-foreground">
          {getChallengeElapsedDays(challenge)} dias desde a criação
        </span>
        {canResolve && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onResolve("lost")}>
              <XCircle className="mr-1 h-3.5 w-3.5" /> Não cumprido
            </Button>
            <Button size="sm" onClick={() => onResolve("won")}>
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Validar
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

function ChallengeDialog({
  open,
  onOpenChange,
  clients,
  collaborators,
  tasks,
  priorities,
  deliverables,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  collaborators: Collaborator[];
  tasks: Task[];
  priorities: Priority[];
  deliverables: Deliverable[];
  onCreate: (data: ChallengeFormData) => Promise<string | null>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [successCriteria, setSuccessCriteria] = useState("");
  const [clientId, setClientId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [rewardSuperstars, setRewardSuperstars] = useState(1);
  const [penaltyStars, setPenaltyStars] = useState(0);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const availableItems = useMemo(
    () => [
      ...tasks.map((task) => ({
        key: `task:${task.id}`,
        type: "task" as const,
        id: task.id,
        title: task.title,
      })),
      ...priorities.map((priority) => ({
        key: `priority:${priority.id}`,
        type: "priority" as const,
        id: priority.id,
        title: priority.title,
      })),
      ...deliverables.map((deliverable) => ({
        key: `deliverable:${deliverable.id}`,
        type: "deliverable" as const,
        id: deliverable.id,
        title: deliverable.name,
      })),
    ],
    [deliverables, priorities, tasks],
  );

  const toggleParticipant = (id: string) => {
    setParticipantIds((current) =>
      current.includes(id)
        ? current.filter((participantId) => participantId !== id)
        : [...current, id],
    );
  };

  const toggleItem = (key: string) => {
    setSelectedItems((current) =>
      current.includes(key)
        ? current.filter((itemKey) => itemKey !== key)
        : [...current, key],
    );
  };

  const submit = async () => {
    if (!title.trim() || !successCriteria.trim() || !dueAt || participantIds.length === 0) {
      return;
    }

    setSaving(true);
    const itemMap = new Map(availableItems.map((item) => [item.key, item]));
    const result = await onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      successCriteria: successCriteria.trim(),
      clientId: clientId || null,
      dueAt: new Date(dueAt).toISOString(),
      rewardSuperstars: Math.max(0, rewardSuperstars),
      penaltyStars: Math.max(0, penaltyStars),
      participantIds,
      items: selectedItems.flatMap((key) => {
        const item = itemMap.get(key);
        return item ? [{ itemType: item.type, itemId: item.id }] : [];
      }),
    });
    setSaving(false);

    if (result) {
      setTitle("");
      setDescription("");
      setSuccessCriteria("");
      setClientId("");
      setDueAt("");
      setRewardSuperstars(1);
      setPenaltyStars(0);
      setParticipantIds([]);
      setSelectedItems([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo desafio</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Título">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Condição de sucesso">
            <Textarea
              value={successCriteria}
              onChange={(event) => setSuccessCriteria(event.target.value)}
              placeholder="Qual resultado verificável precisa ser entregue?"
            />
          </Field>
          <Field label="Descrição">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Cliente (opcional)">
              <select
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                className="h-10 w-full border bg-background px-3 text-sm"
              >
                <option value="">Desafio interno</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Prazo">
              <Input
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
              />
            </Field>
            <Field label="Super Estrelas por participante">
              <Input
                type="number"
                min={0}
                value={rewardSuperstars}
                onChange={(event) => setRewardSuperstars(Number(event.target.value))}
              />
            </Field>
            <Field label="Penalidade em estrelas por participante">
              <Input
                type="number"
                min={0}
                value={penaltyStars}
                onChange={(event) => setPenaltyStars(Number(event.target.value))}
              />
            </Field>
          </div>
          <Field label="Participantes">
            <div className="flex flex-wrap gap-2">
              {collaborators.map((collaborator) => {
                const selected = participantIds.includes(collaborator.id);
                return (
                  <button
                    key={collaborator.id}
                    type="button"
                    onClick={() => toggleParticipant(collaborator.id)}
                    className={cn(
                      "border px-3 py-1.5 text-xs font-medium",
                      selected && "text-white",
                    )}
                    style={selected ? { backgroundColor: collaborator.color, borderColor: collaborator.color } : undefined}
                  >
                    {collaborator.name}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Itens vinculados (opcional)">
            <div className="max-h-40 space-y-1 overflow-auto border p-2">
              {availableItems.map((item) => (
                <label key={item.key} className="flex cursor-pointer items-center gap-2 p-1.5 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.key)}
                    onChange={() => toggleItem(item.key)}
                  />
                  <span className="text-xs uppercase text-muted-foreground">{item.type}</span>
                  <span>{item.title}</span>
                </label>
              ))}
              {availableItems.length === 0 && (
                <p className="p-2 text-xs text-muted-foreground">Nenhuma tarefa, prioridade ou entregável disponível.</p>
              )}
            </div>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!title.trim() || !successCriteria.trim() || !dueAt || participantIds.length === 0 || saving}
            onClick={() => void submit()}
          >
            {saving ? "Criando..." : "Criar desafio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResolutionDialog({
  intent,
  onOpenChange,
  onResolve,
}: {
  intent: ResolutionIntent | null;
  onOpenChange: (open: boolean) => void;
  onResolve: (
    challengeId: string,
    outcome: "won" | "lost",
    notes?: string,
  ) => Promise<boolean>;
}) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const isWin = intent?.outcome === "won";

  const submit = async () => {
    if (!intent) return;
    setSaving(true);
    const resolved = await onResolve(intent.challenge.id, intent.outcome, notes);
    setSaving(false);
    if (resolved) {
      setNotes("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={Boolean(intent)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isWin ? "Validar desafio" : "Registrar desafio não cumprido"}</DialogTitle>
        </DialogHeader>
        {intent && (
          <div className="space-y-3 text-sm">
            <p>
              {isWin
                ? `Cada participante receberá ${getChallengeRewardStars(intent.challenge)} estrelas no Tesouro.`
                : `Cada participante receberá uma penalidade de ${intent.challenge.penaltyStars} estrelas no Tesouro.`}
            </p>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Observação da validação"
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant={isWin ? "default" : "destructive"} disabled={saving} onClick={() => void submit()}>
            {saving ? "Salvando..." : isWin ? "Confirmar êxito" : "Confirmar penalidade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Sparkles;
  tone?: "amber" | "green" | "violet";
}) {
  const toneClass = {
    amber: "text-amber-700",
    green: "text-emerald-700",
    violet: "text-violet-700",
  }[tone ?? "amber"];
  return (
    <div className="border bg-background px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase text-muted-foreground">
        <Icon className={cn("h-3.5 w-3.5", toneClass)} />
        {label}
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="truncate font-medium" title={value}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function EmptyState({ label, tone = "default" }: { label: string; tone?: "default" | "error" }) {
  return (
    <div className={cn(
      "border bg-card p-8 text-center text-sm text-muted-foreground",
      tone === "error" && "border-red-200 text-red-700",
    )}>
      {label}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
