import { useEffect, useState } from 'react';
import type { Client } from '@/types/client';
import type { Task, TaskFormData } from '@/types/task';
import { DEFAULT_PROCESS_WEIGHT, normalizeProcessWeight, type ProcessWeight } from '@/lib/processWeight';
import { weightVisual } from '@/lib/processDisplay';
import { RECURRENCE_CHOICE_LABELS, recurrenceChoiceFor, recurrenceSetting, type RecurrenceChoice } from '@/lib/processRecurrence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientMultiPicker } from '@/components/shared/ClientMultiPicker';
import { cn } from '@/lib/utils';
import { WeightIconOptions, type RespOption, type UpdateTask } from './processParts';

export type CreateProcess = (clientId: string, data: TaskFormData, clientName?: string) => Promise<boolean>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Processo em edição; sem ele, o formulário cria um processo novo. */
  editing: Task | null;
  clients: Client[];
  responsibleList: RespOption[];
  defaultAssignee: string;
  presetClientId: string | null;
  defaultWeight?: ProcessWeight;
  onCreate: CreateProcess;
  onUpdateTask: UpdateTask;
}

const selectClass = 'h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm';
const fieldLabel = 'text-xs font-semibold uppercase tracking-wide text-muted-foreground';

/** Novo processo e edição de processo: peso, vencimento, planejamento e repetição. */
export function ProcessModal({ open, onOpenChange, editing, clients, responsibleList, defaultAssignee, presetClientId, defaultWeight = DEFAULT_PROCESS_WEIGHT, onCreate, onUpdateTask }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [assignee, setAssignee] = useState(defaultAssignee);
  const [weight, setWeight] = useState<ProcessWeight>(defaultWeight);
  const [dueDate, setDueDate] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [repeat, setRepeat] = useState<RecurrenceChoice>('none');
  const [every, setEvery] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title ?? '');
    setDescription(editing?.description ?? '');
    setClientIds(editing ? [editing.client_id] : presetClientId ? [presetClientId] : []);
    setAssignee(editing?.assigned_to[0] ?? defaultAssignee);
    setWeight(editing ? normalizeProcessWeight(editing.weight) : defaultWeight);
    setDueDate(editing?.due_date ?? '');
    setScheduledFor(editing?.scheduled_for ?? '');
    const current = editing ? recurrenceChoiceFor(editing) : { choice: 'none' as const, every: 1 };
    setRepeat(current.choice);
    setEvery(current.every);
  }, [open, editing, presetClientId, defaultAssignee, defaultWeight]);
  const asksInterval = repeat === 'every-days' || repeat === 'every-months';
  const currentWeight = weightVisual(weight);

  const selectedClients = clients.filter(client => clientIds.includes(client.id));
  const assigneeOptions = assignee && !responsibleList.some(person => person.name === assignee)
    ? [{ name: assignee, color: '#64748b', initials: '?' }, ...responsibleList]
    : responsibleList;
  const canSave = Boolean(title.trim() && assignee && (editing || selectedClients.length > 0)) && !saving;

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      if (editing) {
        const ok = await onUpdateTask(editing.id, {
          title: title.trim(),
          description: description.trim() || null,
          assigned_to: [assignee],
          weight,
          due_date: dueDate || null,
          scheduled_for: scheduledFor || null,
          ...recurrenceSetting(repeat, every),
        });
        if (ok) onOpenChange(false);
        return;
      }
      const data: TaskFormData = {
        title: title.trim(),
        description: description.trim() || undefined,
        assigned_to: [assignee],
        weight,
        due_date: dueDate || undefined,
        scheduled_for: scheduledFor || undefined,
        ...recurrenceSetting(repeat, every),
      };
      const created = await Promise.all(selectedClients.map(client => onCreate(client.id, data, client.name)));
      if (created.every(Boolean)) onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const submitLabel = saving
    ? 'Salvando...'
    : editing
      ? 'Salvar processo'
      : selectedClients.length > 1 ? `Criar ${selectedClients.length} processos` : 'Criar processo';

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className={cn(
      'flex max-h-[92vh] max-w-lg flex-col gap-0 overflow-hidden p-0',
      // Celular: folha que sobe do rodapé, ocupando a largura toda.
      'max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[94dvh] max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-2xl max-sm:border-x-0 max-sm:border-b-0 max-sm:data-[state=closed]:slide-out-to-bottom max-sm:data-[state=open]:slide-in-from-bottom max-sm:data-[state=closed]:zoom-out-100 max-sm:data-[state=open]:zoom-in-100',
    )}>
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-300 sm:hidden" aria-hidden />
      <DialogHeader className="shrink-0 border-b px-5 pb-3 pt-3 text-left sm:px-6 sm:pt-5">
        <DialogTitle>{editing ? 'Editar processo' : 'Novo processo'}</DialogTitle>
        <DialogDescription>Peso 5 é Máxima e aparece no Painel.</DialogDescription>
      </DialogHeader>

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={event => { event.preventDefault(); void submit(); }}>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="space-y-1.5">
            <Label htmlFor="process-title" className={fieldLabel}>Processo</Label>
            <Input id="process-title" autoFocus value={title} onChange={event => setTitle(event.target.value)} placeholder="Descreva o processo" />
          </div>

          <div className="space-y-1.5">
            <Label className={fieldLabel}>{editing ? 'Cliente' : 'Clientes'}</Label>
            <ClientMultiPicker clients={clients} selectedClientIds={clientIds} onChange={setClientIds} includeUniverseRamos disabled={Boolean(editing)} />
            {!editing && selectedClients.length > 1 && <p className="text-[11px] text-muted-foreground">Será criado um processo para cada cliente.</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label className={fieldLabel}>Peso</Label>
              <span className="text-xs font-semibold text-slate-700" aria-live="polite">{currentWeight.label} <span className="font-normal text-muted-foreground">· peso {currentWeight.weight}</span></span>
            </div>
            <WeightIconOptions value={weight} onSelect={setWeight} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="process-assignee" className={fieldLabel}>Responsável</Label>
            <select id="process-assignee" value={assignee} onChange={event => setAssignee(event.target.value)} className={selectClass}>
              {assigneeOptions.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="process-due" className={fieldLabel}>Vencimento</Label>
              <Input id="process-due" type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} className="min-w-0 px-2 sm:px-3" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="process-scheduled" className={fieldLabel}>Planejamento</Label>
              <Input id="process-scheduled" type="date" value={scheduledFor} onChange={event => setScheduledFor(event.target.value)} className="min-w-0 px-2 sm:px-3" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="process-recurrence" className={fieldLabel}>Repetição</Label>
            <div className="flex gap-2">
              <select id="process-recurrence" value={repeat} onChange={event => setRepeat(event.target.value as RecurrenceChoice)} className={cn(selectClass, 'flex-1')}>
                {(Object.keys(RECURRENCE_CHOICE_LABELS) as RecurrenceChoice[]).map(item => <option key={item} value={item}>{RECURRENCE_CHOICE_LABELS[item]}</option>)}
              </select>
              {asksInterval && <Input aria-label={repeat === 'every-days' ? 'Quantos dias' : 'Quantos meses'} type="number" inputMode="numeric" min={1} max={366} value={every} onChange={event => setEvery(Number(event.target.value))} className="w-20" />}
            </div>
            {repeat !== 'none' && <p className="text-[11px] leading-snug text-muted-foreground">O processo fica aberto e ganha uma etapa a cada período, a partir do vencimento. Concluir o processo encerra a repetição.</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="process-description" className={fieldLabel}>Detalhes <span className="font-normal normal-case tracking-normal">(opcional)</span></Label>
            <Textarea id="process-description" value={description} onChange={event => setDescription(event.target.value)} rows={2} placeholder="Observações, links, contexto" className="text-base sm:text-sm" />
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-t bg-background px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex sm:justify-end sm:px-6">
          <Button type="button" variant="outline" className="h-11 sm:h-10" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" className="h-11 sm:h-10" disabled={!canSave}>{submitLabel}</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
