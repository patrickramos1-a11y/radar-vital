import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, CircleAlert, ClipboardList, MessageCircle, Pencil, Sparkles, Trash2, Users, SquarePen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CommentButton } from "@/components/comments/CommentButton";
import { UniverseChallengeEditDialog } from "@/components/universe-ramos/UniverseChallengeDialogs";
import { ChallengeConditionsProgress, ChallengeGuidance } from "@/components/universe-ramos/ChallengeConditions";
import { cn } from "@/lib/utils";
import { getChallengeElapsedDays, getEffectiveChallengeStatus } from "@/lib/challenge";
import { CHALLENGE_STATUS_CONFIG, type Challenge, type ChallengeCompletionCondition, type ChallengeEditData, type ChallengeParticipant } from "@/types/challenge";
import type { Client } from "@/types/client";
import type { Collaborator } from "@/types/collaborator";
import type { Task } from "@/types/task";

interface Props {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenges: Challenge[];
  participantsByChallenge: Map<string, ChallengeParticipant[]>;
  conditionsByChallenge: Map<string, ChallengeCompletionCondition[]>;
  collaborators: Collaborator[];
  commentCount: number;
  taskCount: number;
  tasks: Task[];
  canManage: boolean;
  onNewChallenge: () => void;
  onResolve: (challengeId: string, outcome: "won" | "lost") => void;
  onUpdate: (challengeId: string, data: ChallengeEditData) => Promise<boolean>;
  onDelete: (challengeIds: string[]) => Promise<boolean>;
  onOpenTasks: () => void;
  onToggleCondition: (conditionId: string, completed: boolean) => void;
  onToggleTask: (taskId: string) => Promise<boolean>;
  initialTab?: string;
}

export function UniverseUnitDialog({ client, open, onOpenChange, challenges, participantsByChallenge, conditionsByChallenge, collaborators, commentCount, taskCount, tasks, canManage, onNewChallenge, onResolve, onUpdate, onDelete, onOpenTasks, onToggleCondition, onToggleTask, initialTab = "overview" }: Props) {
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [tab, setTab] = useState(initialTab);
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab, client?.id]);
  if (!client) return null;
  const unitChallenges = challenges.filter((challenge) => challenge.clientId === client.id);
  const active = unitChallenges.filter((challenge) => ["open", "accepted", "in_progress", "active"].includes(getEffectiveChallengeStatus(challenge))).length;
  const waiting = unitChallenges.filter((challenge) => getEffectiveChallengeStatus(challenge) === "awaiting_validation").length;
  const overdue = unitChallenges.filter((challenge) => challenge.dueAt && new Date(challenge.dueAt).getTime() < Date.now() && ["open", "accepted", "in_progress", "active"].includes(challenge.status)).length;
  const people = new Map(collaborators.map((person) => [person.id, person]));
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[92vh] w-[96vw] max-w-5xl overflow-y-auto p-4 sm:p-6">
      <DialogHeader><div className="flex flex-wrap items-start justify-between gap-3 pr-6"><div><DialogTitle>{client.name}</DialogTitle><p className="mt-1 text-sm text-muted-foreground">Central da unidade interna</p></div>{["challenges", "planning"].includes(tab) ? <Button size="sm" className="min-h-10" onClick={onNewChallenge}><Sparkles className="mr-1 h-4 w-4" /> Novo desafio</Button> : tab === "tasks" ? <Button size="sm" className="min-h-10" onClick={onOpenTasks}><ClipboardList className="mr-1 h-4 w-4" /> Nova tarefa</Button> : tab === "comments" ? <CommentButton clientId={client.id} clientName={client.name} commentCount={commentCount} label="Novo comentário" /> : null}</div></DialogHeader>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto max-w-full flex-wrap justify-start gap-1"><TabsTrigger className="min-h-10" value="overview">Visão geral</TabsTrigger><TabsTrigger className="min-h-10" value="challenges">Desafios</TabsTrigger><TabsTrigger className="min-h-10" value="planning">Planejamento</TabsTrigger><TabsTrigger className="min-h-10" value="tasks">Tarefas</TabsTrigger><TabsTrigger className="min-h-10" value="comments">Comentários</TabsTrigger><TabsTrigger className="min-h-10" value="history">Histórico</TabsTrigger></TabsList>
        <TabsContent value="overview"><div className="grid grid-cols-2 gap-2 md:grid-cols-4"><Metric icon={Sparkles} label="Ativos" value={active} /><Metric icon={CircleAlert} label="Para validar" value={waiting} /><Metric icon={CalendarClock} label="Em atraso" value={overdue} tone="red" /><Metric icon={ClipboardList} label="Tarefas" value={taskCount} /></div><section className="mt-4 border bg-muted/20 p-4"><h3 className="font-medium">Contexto da unidade</h3><p className="mt-1 text-sm text-muted-foreground">Acompanhe os desafios, tarefas e decisões desta unidade sem misturar os indicadores AC/AV.</p></section></TabsContent>
        <TabsContent value="challenges"><ChallengeList challenges={unitChallenges} participantsByChallenge={participantsByChallenge} conditionsByChallenge={conditionsByChallenge} onToggleCondition={onToggleCondition} people={people} empty="Nenhum desafio foi cadastrado para esta unidade." canManage={canManage} onResolve={onResolve} onEdit={setEditingChallenge} onDelete={onDelete} /></TabsContent>
        <TabsContent value="planning"><ChallengeList challenges={unitChallenges.filter((challenge) => challenge.status === "draft")} participantsByChallenge={participantsByChallenge} conditionsByChallenge={conditionsByChallenge} onToggleCondition={onToggleCondition} people={people} empty="Nenhum desafio em planejamento." /></TabsContent>
        <TabsContent value="tasks"><div className="space-y-3 border bg-muted/20 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-medium">Tarefas da unidade</h3><p className="text-sm text-muted-foreground">Conclua aqui ou abra o gerenciamento para editar título, prazo, prioridade, responsáveis e excluir.</p></div><Button size="sm" onClick={onOpenTasks}><ClipboardList className="mr-1 h-4 w-4" /> Gerenciar tarefas</Button></div>{tasks.length ? <div className="divide-y border bg-card">{tasks.map((task) => <div key={task.id} className="flex items-center justify-between gap-3 p-3 text-sm"><button type="button" onClick={() => void onToggleTask(task.id)} title={task.completed ? "Reabrir tarefa" : "Concluir tarefa"} className={`grid h-6 w-6 shrink-0 place-items-center border ${task.completed ? "border-emerald-600 bg-emerald-600 text-white" : "border-muted-foreground/40 hover:border-emerald-600"}`}><CheckCircle2 className="h-4 w-4" /></button><div className="min-w-0 flex-1"><p className={task.completed ? "text-muted-foreground line-through" : "font-medium"}>{task.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{task.priority} {task.due_date ? `· prazo ${new Date(`${task.due_date}T00:00:00`).toLocaleDateString("pt-BR")}` : "· sem prazo"}{task.assigned_to.length ? ` · ${task.assigned_to.join(", ")}` : " · sem responsável"}</p></div><span className={task.completed ? "text-emerald-700" : "text-amber-700"}>{task.completed ? "Concluída" : "Em aberto"}</span><Button variant="ghost" size="icon" title="Editar tarefa" onClick={onOpenTasks}><SquarePen className="h-4 w-4" /></Button></div>)}</div> : <p className="py-3 text-sm text-muted-foreground">Nenhuma tarefa cadastrada para esta unidade.</p>}</div></TabsContent>
        <TabsContent value="comments"><div className="border bg-muted/20 p-5 text-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2 font-medium"><MessageCircle className="h-4 w-4 text-cyan-700" /> {commentCount} comentários registrados</div><p className="mt-2 text-muted-foreground">Registre decisões e contexto diretamente neste quadrado.</p></div><CommentButton clientId={client.id} clientName={client.name} commentCount={commentCount} label="Novo comentário" /></div></div></TabsContent>
        <TabsContent value="history"><div className="border bg-muted/20 p-5 text-sm text-muted-foreground">A criação, aceite, envio de evidência, validação e alterações dos desafios aparecem no histórico de auditoria. A leitura detalhada será alimentada pelos eventos de cada desafio.</div></TabsContent>
      </Tabs>
      <UniverseChallengeEditDialog challenge={editingChallenge} open={Boolean(editingChallenge)} onOpenChange={(isOpen) => !isOpen && setEditingChallenge(null)} units={[client]} conditions={editingChallenge ? conditionsByChallenge.get(editingChallenge.id) ?? [] : []} onSave={onUpdate} />
    </DialogContent>
  </Dialog>;
}

function ChallengeList({ challenges, participantsByChallenge, conditionsByChallenge, onToggleCondition, people, empty, canManage = false, onResolve, onEdit, onDelete }: { challenges: Challenge[]; participantsByChallenge: Map<string, ChallengeParticipant[]>; conditionsByChallenge: Map<string, ChallengeCompletionCondition[]>; onToggleCondition: (conditionId: string, completed: boolean) => void; people: Map<string, Collaborator>; empty: string; canManage?: boolean; onResolve?: (challengeId: string, outcome: "won" | "lost") => void; onEdit?: (challenge: Challenge) => void; onDelete?: (ids: string[]) => Promise<boolean> }) {
  if (challenges.length === 0) return <div className="border bg-muted/20 p-5 text-sm text-muted-foreground">{empty}</div>;
  return <div className="space-y-2">{challenges.map((challenge) => { const status = getEffectiveChallengeStatus(challenge); const config = CHALLENGE_STATUS_CONFIG[status]; const participants = participantsByChallenge.get(challenge.id) ?? []; const canResolve = canManage && ["accepted", "in_progress", "active", "awaiting_validation"].includes(status); return <article key={challenge.id} className="border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-medium">{challenge.title}</h3><p className="mt-1 text-sm text-muted-foreground">{challenge.description || "Sem descrição adicional."}</p></div><span className={cn("px-2 py-1 text-[10px] font-semibold uppercase", config.className)}>{config.label}</span></div><div className="mt-3 grid gap-2 text-sm md:grid-cols-2"><div>{challenge.completionMode !== "checklist" && <><p className="text-[10px] font-semibold uppercase text-muted-foreground">Orientações</p><div className="mt-1"><ChallengeGuidance guidance={challenge.successCriteria} /></div></>}{challenge.completionMode !== "guidance" && <><p className="mt-3 text-[10px] font-semibold uppercase text-muted-foreground">Checklist</p><div className="mt-1"><ChallengeConditionsProgress conditions={conditionsByChallenge.get(challenge.id) ?? []} onToggle={onToggleCondition} /></div></>}</div><div className="grid gap-2"><Info label="Entregável" value={challenge.expectedDeliverable || "Não definido"} /><Info label="Evidência" value={challenge.evidenceRequirements || "Não definida"} /></div></div><div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span><CalendarClock className="mr-1 inline h-3.5 w-3.5" />{challenge.dueAt ? new Date(challenge.dueAt).toLocaleDateString("pt-BR") : "Sem prazo"}</span><span><Sparkles className="mr-1 inline h-3.5 w-3.5" />{challenge.rewardSuperstars} Super Estrelas</span><span>{getChallengeElapsedDays(challenge)} dias aberto</span>{participants.length ? <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{participants.map((item) => people.get(item.collaboratorId)?.name).filter(Boolean).join(", ")}</span> : <span className="text-violet-700">Aberto para aceite</span>}</div>{(canResolve || canManage) && <div className="mt-3 flex justify-end gap-2 border-t pt-3">{canManage && <><Button variant="outline" size="sm" title="Editar as informações deste desafio" onClick={() => onEdit?.(challenge)}><Pencil className="mr-1 h-3.5 w-3.5" />Editar</Button><Button variant="outline" size="sm" title="Excluir este desafio" onClick={() => { if (window.confirm("Excluir este desafio?")) void onDelete?.([challenge.id]); }}><Trash2 className="mr-1 h-3.5 w-3.5" />Excluir</Button></>}{canResolve && <><Button variant="outline" size="sm" title="Registrar que o desafio não foi cumprido" onClick={() => onResolve?.(challenge.id, "lost")}>Não cumprido</Button><Button size="sm" title="Validar o desafio e registrar a recompensa configurada" onClick={() => onResolve?.(challenge.id, "won")}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Validar</Button></>}</div>}</article>; })}</div>;
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Sparkles; label: string; value: number; tone?: "red" }) { return <div className="border bg-background p-3"><div className={cn("flex items-center gap-1 text-[10px] uppercase text-muted-foreground", tone === "red" && "text-red-700")}><Icon className="h-3.5 w-3.5" />{label}</div><p className="mt-1 text-2xl font-semibold">{value}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1">{value}</p></div>; }
