import { useEffect, useState } from 'react';
import { Repeat } from 'lucide-react';
import type { Client } from '@/types/client';
import type { Task, TaskFormData } from '@/types/task';
import { DEFAULT_PROCESS_WEIGHT, normalizeProcessWeight, type ProcessWeight } from '@/lib/processWeight';
import { weightVisual } from '@/lib/processDisplay';
import { describeFollowUp, ruleFromTask } from '@/lib/recurringFollowUp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientMultiPicker } from '@/components/shared/ClientMultiPicker';
import { WeightIconOptions, type RespOption, type UpdateTask } from './processParts';
import { FollowUpModal, type CreateFollowUp, type FollowUpPrefill } from './FollowUpModal';
import { fieldLabel, selectClass, sheetDialogClass, sheetFooterClass } from './formStyles';

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
  /** Sem ele, o formulário não oferece repetição. */
  onCreateFollowUp?: CreateFollowUp;
}

/** Novo processo e edição de processo: peso, vencimento e planejamento. A repetição abre o Novo acompanhamento. */
export function ProcessModal({ open, onOpenChange, editing, clients, responsibleList, defaultAssignee, presetClientId, defaultWeight = DEFAULT_PROCESS_WEIGHT, onCreate, onUpdateTask, onCreateFollowUp }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [assignee, setAssignee] = useState(defaultAssignee);
  const [weight, setWeight] = useState<ProcessWeight>(defaultWeight);
  const [dueDate, setDueDate] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [saving, setSaving] = useState(false);
  const [followUp, setFollowUp] = useState<{ editing: Task | null; prefill: FollowUpPrefill | null } | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title ?? '');
    setDescription(editing?.description ?? '');
    setClientIds(editing ? [editing.client_id] : presetClientId ? [presetClientId] : []);
    setAssignee(editing?.assigned_to[0] ?? defaultAssignee);
    setWeight(editing ? normalizeProcessWeight(editing.weight) : defaultWeight);
    setDueDate(editing?.due_date ?? '');
    setScheduledFor(editing?.scheduled_for ?? '');
  }, [open, editing, presetClientId, defaultAssignee, defaultWeight]);
  const currentWeight = weightVisual(weight);
  const repeatRule = editing ? ruleFromTask(editing) : null;

  const selectedClients = clients.filter(client => clientIds.includes(client.id));
  const assigneeOptions = assignee && !responsibleList.some(person => person.name === assignee)
    ? [{ name: assignee, color: '#64748b', initials: '?' }, ...responsibleList]
    : responsibleList;
  const canSave = Boolean(title.trim() && assignee && (editing || selectedClients.length > 0)) && !saving;

  const openRepetition = () => {
    setFollowUp(editing
      ? { editing, prefill: null }
      : { editing: null, prefill: { title, description, clientId: clientIds[0] ?? null, assignee, weight } });
    onOpenChange(false);
  };

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

  return <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={sheetDialogClass}>
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

            {onCreateFollowUp && <div className="space-y-1.5">
              <Label className={fieldLabel}>Repetição</Label>
              {repeatRule
                ? <div className="flex items-center gap-2 rounded-md border bg-violet-50/60 px-3 py-2">
                  <Repeat className="h-4 w-4 shrink-0 text-violet-700" aria-hidden />
                  <span className="min-w-0 flex-1 text-xs text-violet-900">{describeFollowUp(repeatRule)}</span>
                  <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 text-xs" onClick={openRepetition}>Editar</Button>
                </div>
                : <Button type="button" variant="outline" className="h-10 w-full justify-start text-sm font-normal text-slate-600" onClick={openRepetition}>
                  <Repeat className="mr-2 h-4 w-4 text-violet-700" aria-hidden />Repetir: fazer disto um acompanhamento
                </Button>}
            </div>}

            <div className="space-y-1.5">
              <Label htmlFor="process-description" className={fieldLabel}>Detalhes <span className="font-normal normal-case tracking-normal">(opcional)</span></Label>
              <Textarea id="process-description" value={description} onChange={event => setDescription(event.target.value)} rows={2} placeholder="Observações, links, contexto" className="text-base sm:text-sm" />
            </div>
          </div>

          <div className={sheetFooterClass}>
            <Button type="button" variant="outline" className="h-11 sm:h-10" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="h-11 sm:h-10" disabled={!canSave}>{submitLabel}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {onCreateFollowUp && <FollowUpModal
      open={Boolean(followUp)}
      onOpenChange={value => { if (!value) setFollowUp(null); }}
      editing={followUp?.editing ?? null}
      prefill={followUp?.prefill ?? null}
      clients={clients}
      responsibleList={responsibleList}
      defaultAssignee={defaultAssignee}
      onCreate={onCreateFollowUp}
      onUpdateTask={onUpdateTask}
    />}
  </>;
}
