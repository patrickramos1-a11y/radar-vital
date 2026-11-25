import { useEffect, useState } from 'react';
import type { Client } from '@/types/client';
import type { Task, TaskFormData } from '@/types/task';
import { DEFAULT_PROCESS_WEIGHT, normalizeProcessWeight, type ProcessWeight } from '@/lib/processWeight';
import { RECURRENCE_CHOICE_LABELS, recurrenceChoiceFor, recurrenceSetting, type RecurrenceChoice } from '@/lib/processRecurrence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientMultiPicker } from '@/components/shared/ClientMultiPicker';
import { WeightOptions, type RespOption, type UpdateTask } from './processParts';

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

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editing ? 'Editar processo' : 'Novo processo'}</DialogTitle>
        <DialogDescription>Peso 5 é Máxima e aparece no Painel.</DialogDescription>
      </DialogHeader>
      <form className="space-y-3" onSubmit={event => { event.preventDefault(); void submit(); }}>
        <div><Label htmlFor="process-title">Processo</Label><Input id="process-title" autoFocus value={title} onChange={event => setTitle(event.target.value)} placeholder="Descreva o processo" /></div>
        <div><Label htmlFor="process-description">Detalhes</Label><Textarea id="process-description" value={description} onChange={event => setDescription(event.target.value)} rows={2} placeholder="Opcional" /></div>
        <div>
          <Label>{editing ? 'Cliente' : 'Clientes'}</Label>
          <div className="mt-1"><ClientMultiPicker clients={clients} selectedClientIds={clientIds} onChange={setClientIds} includeUniverseRamos disabled={Boolean(editing)} /></div>
          {!editing && selectedClients.length > 1 && <p className="mt-1 text-[11px] text-muted-foreground">Será criado um processo para cada cliente.</p>}
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <Label>Peso</Label>
            <div className="mt-1"><WeightOptions value={weight} onSelect={setWeight} /></div>
          </div>
          <div className="space-y-3">
            <div><Label htmlFor="process-assignee">Responsável</Label><select id="process-assignee" value={assignee} onChange={event => setAssignee(event.target.value)} className="mt-1 h-9 w-full border bg-white px-2 text-sm">{assigneeOptions.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}</select></div>
            <div><Label htmlFor="process-due">Vencimento</Label><Input id="process-due" type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} /></div>
            <div><Label htmlFor="process-scheduled">Planejamento</Label><Input id="process-scheduled" type="date" value={scheduledFor} onChange={event => setScheduledFor(event.target.value)} /></div>
            <div>
              <Label htmlFor="process-recurrence">Repetição</Label>
              <div className="mt-1 flex gap-2">
                <select id="process-recurrence" value={repeat} onChange={event => setRepeat(event.target.value as RecurrenceChoice)} className="h-9 min-w-0 flex-1 border bg-white px-2 text-sm">{(Object.keys(RECURRENCE_CHOICE_LABELS) as RecurrenceChoice[]).map(item => <option key={item} value={item}>{RECURRENCE_CHOICE_LABELS[item]}</option>)}</select>
                {asksInterval && <Input aria-label={repeat === 'every-days' ? 'Quantos dias' : 'Quantos meses'} type="number" min={1} max={366} value={every} onChange={event => setEvery(Number(event.target.value))} className="h-9 w-20" />}
              </div>
              {repeat !== 'none' && <p className="mt-1 text-[11px] text-muted-foreground">O processo fica aberto e ganha uma etapa a cada período, a partir do vencimento. Concluir o processo encerra a repetição.</p>}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" disabled={!canSave}>{editing ? 'Salvar processo' : 'Criar processo'}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
