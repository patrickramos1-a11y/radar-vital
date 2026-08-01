import { useState } from "react";
import { CalendarClock, CheckCircle2, CircleAlert, ClipboardList, MessageCircle, Pencil, Sparkles, Trash2, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { UniverseChallengeEditDialog } from "@/components/universe-ramos/UniverseChallengeDialogs";
import { cn } from "@/lib/utils";
import { getChallengeElapsedDays, getEffectiveChallengeStatus } from "@/lib/challenge";
import { CHALLENGE_STATUS_CONFIG, type Challenge, type ChallengeEditData, type ChallengeParticipant } from "@/types/challenge";
import type { Client } from "@/types/client";
import type { Collaborator } from "@/types/collaborator";

interface Props {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challenges: Challenge[];
  participantsByChallenge: Map<string, ChallengeParticipant[]>;
  collaborators: Collaborator[];
  commentCount: number;
  taskCount: number;
  canManage: boolean;
  onNewChallenge: () => void;
  onResolve: (challengeId: string, outcome: "won" | "lost") => void;
  onUpdate: (challengeId: string, data: ChallengeEditData) => Promise<boolean>;
  onDelete: (challengeIds: string[]) => Promise<boolean>;
}

export function UniverseUnitDialog({ client, open, onOpenChange, challenges, participantsByChallenge, collaborators, commentCount, taskCount, canManage, onNewChallenge, onResolve, onUpdate, onDelete }: Props) {
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  if (!client) return null;
  const unitChallenges = challenges.filter((challenge) => challenge.clientId === client.id);
  const active = unitChallenges.filter((challenge) => ["open", "accepted", "in_progress", "active"].includes(getEffectiveChallengeStatus(challenge))).length;
  const waiting = unitChallenges.filter((challenge) => getEffectiveChallengeStatus(challenge) === "awaiting_validation").length;
  const overdue = unitChallenges.filter((challenge) => challenge.dueAt && new Date(challenge.dueAt).getTime() < Date.now() && ["open", "accepted", "in_progress", "active"].includes(challenge.status)).length;
  const people = new Map(collaborators.map((person) => [person.id, person]));
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
      <DialogHeader><div className="flex flex-wrap items-start justify-between gap-3 pr-6"><div><DialogTitle>{client.name}</DialogTitle><p className="mt-1 text-sm text-muted-foreground">Central da unidade interna</p></div><Button size="sm" onClick={onNewChallenge}><Sparkles className="mr-1 h-4 w-4" /> Novo desafio</Button></div></DialogHeader>
      <Tabs defaultValue="overview">
        <TabsList className="h-auto max-w-full flex-wrap justify-start"><TabsTrigger value="overview">Visão geral</TabsTrigger><TabsTrigger value="challenges">Desafios</TabsTrigger><TabsTrigger value="planning">Planejamento</TabsTrigger><TabsTrigger value="comments">Comentários</TabsTrigger><TabsTrigger value="history">Histórico</TabsTrigger></TabsList>
        <TabsContent value="overview"><div className="grid grid-cols-2 gap-2 md:grid-cols-4"><Metric icon={Sparkles} label="Ativos" value={active} /><Metric icon={CircleAlert} label="Para validar" value={waiting} /><Metric icon={CalendarClock} label="Em atraso" value={overdue} tone="red" /><Metric icon={ClipboardList} label="Tarefas" value={taskCount} /></div><section className="mt-4 border bg-muted/20 p-4"><h3 className="font-medium">Contexto da unidade</h3><p className="mt-1 text-sm text-muted-foreground">Acompanhe os desafios, tarefas e decisões desta unidade sem misturar os indicadores AC/AV.</p></section></TabsContent>
        <TabsContent value="challenges"><ChallengeList challenges={unitChallenges} participantsByChallenge={participantsByChallenge} people={people} empty="Nenhum desafio foi cadastrado para esta unidade." canManage={canManage} onResolve={onResolve} onEdit={setEditingChallenge} onDelete={onDelete} /></TabsContent>
        <TabsContent value="planning"><ChallengeList challenges={unitChallenges.filter((challenge) => challenge.status === "draft")} participantsByChallenge={participantsByChallenge} people={people} empty="Nenhum desafio em planejamento." /></TabsContent>
        <TabsContent value="comments"><div className="border bg-muted/20 p-5 text-sm"><div className="flex items-center gap-2 font-medium"><MessageCircle className="h-4 w-4 text-cyan-700" /> {commentCount} comentários registrados</div><p className="mt-2 text-muted-foreground">Os comentários já cadastrados continuam disponíveis pelo card. Esta aba será a visão consolidada das decisões e do contexto da unidade.</p></div></TabsContent>
        <TabsContent value="history"><div className="border bg-muted/20 p-5 text-sm text-muted-foreground">A criação, aceite, envio de evidência, validação e alterações dos desafios aparecem no histórico de auditoria. A leitura detalhada será alimentada pelos eventos de cada desafio.</div></TabsContent>
      </Tabs>
      <UniverseChallengeEditDialog challenge={editingChallenge} open={Boolean(editingChallenge)} onOpenChange={(isOpen) => !isOpen && setEditingChallenge(null)} units={[client]} onSave={onUpdate} />
    </DialogContent>
  </Dialog>;
}

function ChallengeList({ challenges, participantsByChallenge, people, empty, canManage = false, onResolve, onEdit, onDelete }: { challenges: Challenge[]; participantsByChallenge: Map<string, ChallengeParticipant[]>; people: Map<string, Collaborator>; empty: string; canManage?: boolean; onResolve?: (challengeId: string, outcome: "won" | "lost") => void; onEdit?: (challenge: Challenge) => void; onDelete?: (ids: string[]) => Promise<boolean> }) {
  if (challenges.length === 0) return <div className="border bg-muted/20 p-5 text-sm text-muted-foreground">{empty}</div>;
  return <div className="space-y-2">{challenges.map((challenge) => { const status = getEffectiveChallengeStatus(challenge); const config = CHALLENGE_STATUS_CONFIG[status]; const participants = participantsByChallenge.get(challenge.id) ?? []; const canResolve = canManage && ["accepted", "in_progress", "active", "awaiting_validation"].includes(status); return <article key={challenge.id} className="border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-medium">{challenge.title}</h3><p className="mt-1 text-sm text-muted-foreground">{challenge.description || "Sem descrição adicional."}</p></div><span className={cn("px-2 py-1 text-[10px] font-semibold uppercase", config.className)}>{config.label}</span></div><div className="mt-3 grid gap-2 text-sm md:grid-cols-3"><Info label="Condições" value={challenge.successCriteria} /><Info label="Entregável" value={challenge.expectedDeliverable || "Não definido"} /><Info label="Evidência" value={challenge.evidenceRequirements || "Não definida"} /></div><div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span><CalendarClock className="mr-1 inline h-3.5 w-3.5" />{challenge.dueAt ? new Date(challenge.dueAt).toLocaleDateString("pt-BR") : "Sem prazo"}</span><span><Sparkles className="mr-1 inline h-3.5 w-3.5" />{challenge.rewardSuperstars} Super Estrelas</span><span>{getChallengeElapsedDays(challenge)} dias aberto</span>{participants.length ? <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{participants.map((item) => people.get(item.collaboratorId)?.name).filter(Boolean).join(", ")}</span> : <span className="text-violet-700">Aberto para aceite</span>}</div>{(canResolve || canManage) && <div className="mt-3 flex justify-end gap-2 border-t pt-3">{canManage && <><Button variant="outline" size="sm" title="Editar as informações deste desafio" onClick={() => onEdit?.(challenge)}><Pencil className="mr-1 h-3.5 w-3.5" />Editar</Button><Button variant="outline" size="sm" title="Excluir este desafio" onClick={() => { if (window.confirm("Excluir este desafio?")) void onDelete?.([challenge.id]); }}><Trash2 className="mr-1 h-3.5 w-3.5" />Excluir</Button></>}{canResolve && <><Button variant="outline" size="sm" title="Registrar que o desafio não foi cumprido" onClick={() => onResolve?.(challenge.id, "lost")}>Não cumprido</Button><Button size="sm" title="Validar o desafio e registrar a recompensa configurada" onClick={() => onResolve?.(challenge.id, "won")}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Validar</Button></>}</div>}</article>; })}</div>;
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Sparkles; label: string; value: number; tone?: "red" }) { return <div className="border bg-background p-3"><div className={cn("flex items-center gap-1 text-[10px] uppercase text-muted-foreground", tone === "red" && "text-red-700")}><Icon className="h-3.5 w-3.5" />{label}</div><p className="mt-1 text-2xl font-semibold">{value}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1">{value}</p></div>; }
