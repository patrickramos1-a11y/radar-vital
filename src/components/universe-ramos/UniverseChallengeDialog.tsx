import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChallengeConditionsEditor } from "@/components/universe-ramos/ChallengeConditions";
import type { Client } from "@/types/client";
import type { Collaborator } from "@/types/collaborator";
import { CHALLENGE_COMPLETION_MODE_LABELS, type ChallengeCompletionConditionInput, type ChallengeCompletionMode, type ChallengeFormData, type ChallengeKind } from "@/types/challenge";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  units: Client[];
  collaborators: Collaborator[];
  defaultUnitId?: string | null;
  onCreate: (data: ChallengeFormData) => Promise<string | null>;
}

export function UniverseChallengeDialog({ open, onOpenChange, units, collaborators, defaultUnitId, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [completionMode, setCompletionMode] = useState<ChallengeCompletionMode>("guidance");
  const [guidance, setGuidance] = useState("");
  const [conditions, setConditions] = useState<ChallengeCompletionConditionInput[]>([]);
  const [deliverable, setDeliverable] = useState("");
  const [evidence, setEvidence] = useState("");
  const [unitId, setUnitId] = useState(defaultUnitId ?? "");
  const [kind, setKind] = useState<ChallengeKind>("company_general");
  const [dueAt, setDueAt] = useState("");
  const [reward, setReward] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const togglePerson = (id: string) => setParticipantIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const showGuidance = completionMode !== "checklist";
  const showChecklist = completionMode !== "guidance";
  const isValid = Boolean(title.trim()) && (!showGuidance || Boolean(guidance.trim())) && (!showChecklist || conditions.some((condition) => condition.title.trim()));
  const submit = async () => {
    const validConditions = showChecklist ? conditions.filter((condition) => condition.title.trim()) : [];
    if (!isValid) return;
    setSaving(true);
    const created = await onCreate({
      title: title.trim(), description: description.trim() || undefined,
      successCriteria: showGuidance ? guidance.trim() : validConditions.map((condition) => condition.title.trim()).join("\n"),
      completionMode, conditions: validConditions,
      expectedDeliverable: deliverable.trim() || undefined, evidenceRequirements: evidence.trim() || undefined,
      clientId: unitId || null, kind, dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      rewardSuperstars: Math.max(0, reward), penaltyStars: Math.max(0, penalty), participantIds, items: [],
    });
    setSaving(false);
    if (!created) return;
    setTitle(""); setDescription(""); setCompletionMode("guidance"); setGuidance(""); setConditions([]); setDeliverable(""); setEvidence("");
    setUnitId(defaultUnitId ?? ""); setKind("company_general"); setDueAt(""); setReward(0); setPenalty(0); setParticipantIds([]);
    onOpenChange(false);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
      <DialogHeader><DialogTitle>Novo desafio interno</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">Sem responsável, o desafio é publicado no mural para aceite da equipe. Com participantes, torna-se direcionado ou coletivo.</p>
      <div className="grid gap-4">
        <Field label="Título do desafio"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Organizar brindes institucionais" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Origem"><select className="h-10 w-full border bg-background px-3 text-sm" value={unitId} onChange={(event) => setUnitId(event.target.value)}><option value="">Geral da empresa</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></Field>
          <Field label="Tipo"><select className="h-10 w-full border bg-background px-3 text-sm" value={kind} onChange={(event) => setKind(event.target.value as ChallengeKind)}><option value="company_general">Geral da empresa</option><option value="sector">Setor</option><option value="project">Projeto/Painel</option><option value="company">Empresa</option><option value="individual_goal">Meta individual</option></select></Field>
        </div>
        <Field label="Descrição e contexto"><Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Por que isto precisa ser feito e qual problema resolve?" /></Field>
        <Field label="Forma de conclusão"><select className="h-10 w-full border bg-background px-3 text-sm" value={completionMode} onChange={(event) => setCompletionMode(event.target.value as ChallengeCompletionMode)}>{Object.entries(CHALLENGE_COMPLETION_MODE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        {showGuidance && <Field label="Orientações de conclusão"><Textarea className="min-h-32" value={guidance} onChange={(event) => setGuidance(event.target.value)} placeholder="Descreva como o desafio deve ser conduzido e validado. Este texto não vira checklist." /></Field>}
        {showChecklist && <Field label="Checklist de etapas"><ChallengeConditionsEditor conditions={conditions} onChange={setConditions} /></Field>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Entregável esperado"><Textarea value={deliverable} onChange={(event) => setDeliverable(event.target.value)} placeholder="Material, compra, treinamento, registro..." /></Field>
          <Field label="Evidência necessária"><Textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Foto, arquivo, link, comentário ou checklist." /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Prazo (opcional)"><Input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></Field>
          <Field label="Super Estrelas por pessoa"><Input type="number" min={0} value={reward} onChange={(event) => setReward(Number(event.target.value))} /></Field>
          <Field label="Penalidade em estrelas"><Input type="number" min={0} value={penalty} onChange={(event) => setPenalty(Number(event.target.value))} /></Field>
        </div>
        <div className="grid gap-2"><Label>Responsáveis (opcional)</Label><div className="flex flex-wrap gap-2">{collaborators.filter((person) => person.isActive).map((person) => <button key={person.id} type="button" onClick={() => togglePerson(person.id)} className={`border px-3 py-1.5 text-xs font-medium ${participantIds.includes(person.id) ? "text-white" : "bg-background"}`} style={participantIds.includes(person.id) ? { backgroundColor: person.color, borderColor: person.color } : undefined}>{person.name}</button>)}</div></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button disabled={!isValid || saving} onClick={() => void submit()}>{saving ? "Publicando..." : participantIds.length ? "Criar desafio direcionado" : "Publicar desafio aberto"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm"><span className="font-medium">{label}</span>{children}</label>;
}
