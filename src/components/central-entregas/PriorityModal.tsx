import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronDown, Flame, Minus, Search, Siren } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Priority, PriorityFormData, PriorityStatus, PRIORITY_STATUS_CONFIG } from '@/types/priority';
import { Client } from '@/types/client';
import { TASK_MODALITY_CONFIG, TaskModality } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { manualCatalog } from '@/features/master-plan-preview/manualDigitalModel';
import { normalizeAssignee } from '@/lib/taskAssignee';
import { cn } from '@/lib/utils';
import { ClientMultiPicker } from '@/components/shared/ClientMultiPicker';

interface RespOption { name: string; color: string; initials: string; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Priority | null;
  linkedTaskTitle?: string;
  defaultAssignee?: string;
  presetTitle?: string;
  presetClientId?: string | null;
  presetDescription?: string;
  allowMultipleClients?: boolean;
  lockClientId?: boolean;
  promotionMode?: boolean;
  clients: Client[];
  responsibleList: RespOption[];
  onSubmit: (data: PriorityFormData, clientIds?: string[]) => Promise<void>;
  submitLabel?: string;
}

type UniverseOption = { id: string; name: string; type: string };
const weightOptions = [
  { value: 1, label: 'Baixa', Icon: ArrowDown, className: 'border-sky-200 bg-sky-50 text-sky-700' },
  { value: 2, label: 'Normal', Icon: Minus, className: 'border-slate-200 bg-slate-50 text-slate-700' },
  { value: 3, label: 'Alta', Icon: ArrowUp, className: 'border-orange-200 bg-orange-50 text-orange-700' },
  { value: 4, label: 'Urgente', Icon: Flame, className: 'border-red-200 bg-red-50 text-red-700' },
  { value: 5, label: 'Extremamente urgente', Icon: Siren, className: 'border-rose-300 bg-rose-50 text-rose-700' },
] as const;

const universeOptions: UniverseOption[] = [
  ...manualCatalog.nuclei.map(item => ({ id: item.id, name: item.name, type: 'Nucleo' })),
  ...manualCatalog.sectors.map(item => ({ id: item.id, name: item.name, type: 'Setor' })),
  ...manualCatalog.areas.map(item => ({ id: item.id, name: item.name, type: 'Area' })),
  ...manualCatalog.functions.map(item => ({ id: item.id, name: item.name, type: 'Funcao' })),
];

export function PriorityModal({
  open,
  onOpenChange,
  editing,
  linkedTaskTitle,
  defaultAssignee,
  presetTitle,
  presetClientId,
  presetDescription,
  allowMultipleClients = false,
  lockClientId = false,
  promotionMode = false,
  clients,
  responsibleList,
  onSubmit,
  submitLabel,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [universeItemId, setUniverseItemId] = useState<string | null>(null);
  const [useUniverseRamos, setUseUniverseRamos] = useState(false);
  const [targetQuery, setTargetQuery] = useState('');
  const [targetPickerOpen, setTargetPickerOpen] = useState(false);
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [weight, setWeight] = useState(1);
  const [category, setCategory] = useState<TaskModality>('levantamento');
  const [status, setStatus] = useState<PriorityStatus>('aberta');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description || '');
      setDescriptionOpen(Boolean(editing.description));
      setClientIds(editing.client_id ? [editing.client_id] : []);
      setUniverseItemId(editing.universe_item_id || null);
      setUseUniverseRamos(Boolean(editing.universe_item_id));
      setAssignedTo(editing.assigned_to.slice(0, 1));
      setDueDate(editing.due_date || '');
      setWeight(editing.weight || 1);
      setCategory((editing.category as TaskModality) || 'levantamento');
      setStatus(editing.status);
    } else {
      setTitle(presetTitle || '');
      setDescription(presetDescription || '');
      setDescriptionOpen(Boolean(presetDescription));
      setClientIds(presetClientId ? [presetClientId] : []);
      setUniverseItemId(null);
      setUseUniverseRamos(false);
      setAssignedTo(defaultAssignee ? [defaultAssignee] : []);
      setDueDate('');
      setWeight(1);
      setCategory('levantamento');
      setStatus('aberta');
    }
    setTargetQuery('');
    setTargetPickerOpen(false);
    setSubmitting(false);
  }, [open, editing, defaultAssignee, presetTitle, presetClientId, presetDescription]);

  const selectedUniverseTarget = universeOptions.find(item => item.id === universeItemId);

  const filteredTargets = useMemo(() => {
    const query = targetQuery.trim().toLocaleLowerCase('pt-BR');
    const options = universeOptions;
    if (!query) return options.slice(0, 50);
    return options.filter(option => `${'type' in option ? option.type : ''} ${option.name}`.toLocaleLowerCase('pt-BR').includes(query)).slice(0, 50);
  }, [targetQuery]);

  const toggleAssignee = (name: string) => {
    setAssignedTo(current => current.some(item => normalizeAssignee(item) === normalizeAssignee(name)) ? [] : [name]);
  };

  const handleUniverseChange = (checked: boolean) => {
    setUseUniverseRamos(checked);
    setClientIds([]);
    setUniverseItemId(null);
    setTargetQuery('');
    setTargetPickerOpen(false);
  };

  const handleSubmit = async () => {
    if (submitting || !title.trim()) return;
    if (!editing && !promotionMode && clientIds.length === 0 && !universeItemId) return;
    setSubmitting(true);
    try {
      const data: PriorityFormData = {
        title: title.trim(),
        description: description.trim() || undefined,
        client_id: universeItemId ? null : (clientIds[0] || null),
        universe_item_id: universeItemId,
        assigned_to: assignedTo.slice(0, 1),
        due_date: dueDate || null,
        weight: Math.min(5, Math.max(1, Number(weight) || 1)),
        category,
        status,
      };
      await onSubmit(data, !editing && !promotionMode && !universeItemId && allowMultipleClients ? clientIds : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar prioridade' : (submitLabel || 'Nova prioridade')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {editing?.source_task_id && (
            <div className="border-l-4 border-sky-500 bg-sky-50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase text-sky-700">Tarefa vinculada</p>
              <p className="mt-0.5 text-sm font-medium text-sky-950">{linkedTaskTitle || editing.source_task_id}</p>
            </div>
          )}
          <div>
            <Label>Titulo</Label>
            <Input value={title} onChange={event => setTitle(event.target.value)} readOnly={promotionMode} placeholder="Ex: Enviar relatorio..." />
          </div>

          {!promotionMode && (
            <div className="border-y py-2">
              <button type="button" onClick={() => setDescriptionOpen(current => !current)} className="flex w-full items-center justify-between py-1 text-left text-sm font-medium">
                <span>Descricao {description && !descriptionOpen ? <span className="font-normal text-muted-foreground">preenchida</span> : null}</span>
                <ChevronDown className={cn('h-4 w-4 transition-transform', descriptionOpen && 'rotate-180')} />
              </button>
              {descriptionOpen && <Textarea value={description} onChange={event => setDescription(event.target.value)} rows={3} className="mt-2" />}
            </div>
          )}

          {!promotionMode && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label>{useUniverseRamos ? 'Universo Ramos' : (allowMultipleClients && !editing ? 'Clientes' : 'Cliente')}</Label>
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <input type="checkbox" checked={useUniverseRamos} disabled={lockClientId} onChange={event => handleUniverseChange(event.target.checked)} />
                  Vincular ao Universo Ramos
                </label>
              </div>
              {useUniverseRamos ? <div className="relative">
                <button type="button" disabled={lockClientId} onClick={() => setTargetPickerOpen(current => !current)} className="flex h-10 w-full items-center justify-between border bg-background px-3 text-left text-sm disabled:opacity-60">
                  <span className={cn('truncate', !selectedUniverseTarget && 'text-muted-foreground')}>
                    {selectedUniverseTarget ? `${selectedUniverseTarget.type} · ${selectedUniverseTarget.name}` : 'Pesquisar nucleo, setor, area ou funcao'}
                  </span>
                  <Search className="h-4 w-4 shrink-0" />
                </button>
                {targetPickerOpen && !lockClientId && (
                  <div className="absolute z-50 mt-1 w-full border bg-background p-2 shadow-lg">
                    <Input autoFocus value={targetQuery} onChange={event => setTargetQuery(event.target.value)} placeholder="Digite para pesquisar..." />
                    <div className="mt-2 max-h-48 overflow-y-auto">
                      {filteredTargets.map(option => {
                        const selected = option.id === universeItemId;
                        return (
                          <button key={option.id} type="button" onClick={() => {
                            setUniverseItemId(option.id);
                            setTargetPickerOpen(false);
                            setTargetQuery('');
                          }} className="flex w-full items-center justify-between border-b px-2 py-2 text-left text-sm last:border-b-0 hover:bg-muted">
                            <span className="truncate">{'type' in option ? `${option.type} · ${option.name}` : option.name}</span>
                            {selected && <Check className="h-4 w-4 text-emerald-700" />}
                          </button>
                        );
                      })}
                      {!filteredTargets.length && <p className="px-2 py-4 text-center text-sm text-muted-foreground">Nenhum resultado.</p>}
                    </div>
                  </div>
                )}
              </div> : <ClientMultiPicker
                clients={clients}
                selectedClientIds={clientIds}
                onChange={setClientIds}
                allowMultiple={allowMultipleClients && !editing}
                disabled={lockClientId}
              />}
              <div>
                <Label>Prazo</Label>
                <Input type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} />
              </div>
            </div>
          )}

          {!promotionMode && (
            <div>
              <Label>Responsavel</Label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {responsibleList.map(responsible => {
                  const selected = assignedTo.some(item => normalizeAssignee(item) === normalizeAssignee(responsible.name));
                  return (
                    <button key={responsible.name} type="button" onClick={() => toggleAssignee(responsible.name)} className={cn('border px-2.5 py-1 text-xs font-medium transition-colors', selected ? 'text-white' : 'bg-background hover:bg-muted')} style={selected ? { backgroundColor: responsible.color, borderColor: responsible.color } : {}}>
                      {responsible.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={cn('grid gap-3', promotionMode ? 'grid-cols-2' : 'grid-cols-3')}>
            <div className={promotionMode ? 'col-span-2' : ''}>
              <Label>Peso (1-5)</Label>
              <div className="mt-1 grid grid-cols-5 gap-1">
                {weightOptions.map(option => {
                  const Icon = option.Icon;
                  return <button key={option.value} type="button" title={option.label} aria-label={`Peso ${option.value}: ${option.label}`} onClick={() => setWeight(option.value)} className={cn('flex h-10 items-center justify-center gap-1 border text-sm font-semibold transition-colors', option.className, weight === option.value && 'ring-2 ring-primary ring-offset-1')}><Icon className="h-4 w-4" /><span>{option.value}</span></button>;
                })}
              </div>
            </div>
            <div>
              <Label>Modalidade</Label>
              <select value={category} onChange={event => setCategory(event.target.value as TaskModality)} className="h-10 w-full border bg-background px-2 text-sm">
                {(Object.keys(TASK_MODALITY_CONFIG) as TaskModality[]).map(modality => <option key={modality} value={modality}>{TASK_MODALITY_CONFIG[modality].label}</option>)}
              </select>
            </div>
            {!promotionMode && (
              <div>
                <Label>Status</Label>
                <select value={status} onChange={event => setStatus(event.target.value as PriorityStatus)} className="h-10 w-full border bg-background px-2 text-sm">
                  {(Object.keys(PRIORITY_STATUS_CONFIG) as PriorityStatus[]).map(item => <option key={item} value={item}>{PRIORITY_STATUS_CONFIG[item].label}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Processando...' : (editing ? 'Salvar' : (submitLabel || 'Criar'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
