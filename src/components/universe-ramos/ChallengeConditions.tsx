import { useState } from "react";
import { Check, ListPlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ChallengeCompletionCondition, ChallengeCompletionConditionInput } from "@/types/challenge";

export function ChallengeGuidance({ guidance }: { guidance: string }) {
  const text = (guidance ?? "").trim();
  if (!text) return <p className="text-sm text-muted-foreground">Sem orientações registradas.</p>;
  return <p className="whitespace-pre-wrap text-sm leading-6">{text}</p>;
}


export function ChallengeConditionsEditor({ conditions, onChange }: { conditions: ChallengeCompletionConditionInput[]; onChange: (conditions: ChallengeCompletionConditionInput[]) => void }) {
  const [bulkText, setBulkText] = useState("");
  const addLines = () => {
    const additions = bulkText.split("\n").map((line) => line.trim()).filter(Boolean).map((title) => ({ title, isRequired: true }));
    if (!additions.length) return;
    onChange([...conditions, ...additions]);
    setBulkText("");
  };
  const update = (index: number, patch: Partial<ChallengeCompletionConditionInput>) => onChange(conditions.map((condition, current) => current === index ? { ...condition, ...patch } : condition));
  return <div className="space-y-2"><div className="rounded border bg-muted/20 p-3"><p className="text-sm font-medium">Checklist de condições</p><p className="mt-1 text-xs text-muted-foreground">Cada linha vira um check de progresso. Use a descrição para o contexto que não precisa ser marcado.</p><div className="mt-2 flex gap-2"><Textarea value={bulkText} onChange={(event) => setBulkText(event.target.value)} placeholder="Cole uma condição por linha" className="min-h-20" /><Button type="button" variant="outline" onClick={addLines}><ListPlus className="mr-1 h-4 w-4" />Adicionar</Button></div></div>{conditions.length === 0 && <button type="button" onClick={() => onChange([{ title: "", isRequired: true }])} className="flex w-full items-center justify-center gap-1 border border-dashed p-3 text-sm text-muted-foreground hover:bg-muted"><Plus className="h-4 w-4" />Adicionar primeira condição</button>}{conditions.map((condition, index) => <div key={`${index}-${condition.title}`} className="flex items-center gap-2 border bg-card p-2"><span className="text-xs text-muted-foreground">{index + 1}</span><Input value={condition.title} onChange={(event) => update(index, { title: event.target.value })} placeholder="Condição verificável para concluir" /><label className="flex shrink-0 items-center gap-1 text-xs"><Checkbox checked={condition.isRequired !== false} onCheckedChange={(checked) => update(index, { isRequired: checked === true })} />Obrigatória</label><Button type="button" size="icon" variant="ghost" title="Remover condição" onClick={() => onChange(conditions.filter((_, current) => current !== index))}><Trash2 className="h-4 w-4" /></Button></div>)}</div>;
}

export function ChallengeConditionsProgress({ conditions, onToggle }: { conditions: ChallengeCompletionCondition[]; onToggle?: (conditionId: string, completed: boolean) => void }) {
  if (!conditions.length) return <p className="text-sm text-muted-foreground">Nenhuma condição estruturada. O critério textual permanece disponível no contexto do desafio.</p>;
  const required = conditions.filter((condition) => condition.isRequired);
  const completed = required.filter((condition) => condition.completedAt).length;
  const percentage = required.length ? Math.round((completed / required.length) * 100) : 100;
  return <div className="space-y-2"><div className="flex items-center justify-between text-xs"><span className="font-medium">Progresso das condições</span><span>{completed}/{required.length} obrigatórias · {percentage}%</span></div><div className="h-2 overflow-hidden bg-muted"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${percentage}%` }} /></div><div className="divide-y border bg-card">{conditions.map((condition) => <label key={condition.id} className="flex cursor-pointer items-center gap-2 p-2 text-sm"><Checkbox checked={Boolean(condition.completedAt)} onCheckedChange={(checked) => onToggle?.(condition.id, checked === true)} disabled={!onToggle} /><span className={condition.completedAt ? "line-through text-muted-foreground" : ""}>{condition.title}</span>{!condition.isRequired && <span className="ml-auto text-[10px] text-muted-foreground">Opcional</span>}{condition.completedAt && <Check className="ml-auto h-4 w-4 text-emerald-600" />}</label>)}</div></div>;
}
