import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Flag } from '@/components/icones';
import type { Client } from '@/types/client';
import type { Task, TaskFormData, TaskRecurrenceFirst } from '@/types/task';
import { DEFAULT_PROCESS_WEIGHT, normalizeProcessWeight, type ProcessWeight } from '@/lib/processWeight';
import { today as todayIso, weightVisual } from '@/lib/processDisplay';
import {
  FOLLOW_UP_PRESETS, FOLLOW_UP_UNIT_LABELS, MAX_EVERY, brDate, describeFollowUp, isValidRule, projectFollowUp,
  ruleFromTask, ruleToStorage, type FollowUpRule, type FollowUpUnit,
} from '@/lib/recurringFollowUp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientMultiPicker } from '@/components/shared/ClientMultiPicker';
import { cn } from '@/lib/utils';
import { WeightIconOptions, type RespOption, type UpdateTask } from './processParts';
import { fieldLabel, selectClass, sheetDialogClass, sheetFooterClass } from './formStyles';

export type CreateFollowUp = (clientId: string, data: TaskFormData, stepDates: string[], clientName?: string) => Promise<boolean>;

export interface FollowUpPrefill {
  title?: string;
  description?: string;
  clientId?: string | null;
  assignee?: string;
  weight?: ProcessWeight;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Acompanhamento em edição; sem ele, o formulário cadastra um novo. */
  editing: Task | null;
  clients: Client[];
  responsibleList: RespOption[];
  defaultAssignee: string;
  prefill?: FollowUpPrefill | null;
  onCreate: CreateFollowUp;
  onUpdateTask: UpdateTask;
}

type StartMode = 'date' | 'landmark';
type EndMode = 'never' | 'date' | 'count';

const UPCOMING_SHOWN = 6;

function SegmentButton({ active, onClick, children, label }: { active: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
  return <button type="button" aria-pressed={active} aria-label={label} onClick={onClick} className={cn(
    'flex min-h-10 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-center text-xs font-medium transition-colors',
    active ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-background text-slate-600 hover:bg-slate-50',
  )}>{children}</button>;
}

/** Cadastro e edição de acompanhamento recorrente, com a projeção das datas para marcar. */
export function FollowUpModal({ open, onOpenChange, editing, clients, responsibleList, defaultAssignee, prefill, onCreate, onUpdateTask }: Props) {
  const today = todayIso();
  const [mode, setMode] = useState<StartMode>('date');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientIds, setClientIds] = useState<string[]>([]);
  const [assignee, setAssignee] = useState(defaultAssignee);
  const [weight, setWeight] = useState<ProcessWeight>(DEFAULT_PROCESS_WEIGHT);
  const [anchorDate, setAnchorDate] = useState(today);
  const [anchorLabel, setAnchorLabel] = useState('');
  const [first, setFirst] = useState<TaskRecurrenceFirst>('anchor');
  const [every, setEvery] = useState(1);
  const [unit, setUnit] = useState<FollowUpUnit>('months');
  const [endMode, setEndMode] = useState<EndMode>('never');
  const [endDate, setEndDate] = useState('');
  const [maxCount, setMaxCount] = useState(12);
  const [leadDays, setLeadDays] = useState(0);
  // Escolhas feitas à mão; sem escolha, a data passada entra e, das futuras, só a próxima.
  const [picked, setPicked] = useState<Map<string, boolean>>(new Map());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const rule = editing ? ruleFromTask(editing) : null;
    setMode(editing?.recurrence_anchor_label || editing?.recurrence_first === 'after_interval' ? 'landmark' : 'date');
    setTitle(editing?.title ?? prefill?.title ?? '');
    setDescription(editing?.description ?? prefill?.description ?? '');
    setClientIds(editing ? [editing.client_id] : prefill?.clientId ? [prefill.clientId] : []);
    setAssignee(editing?.assigned_to[0] ?? prefill?.assignee ?? defaultAssignee);
    setWeight(editing ? normalizeProcessWeight(editing.weight) : prefill?.weight ?? DEFAULT_PROCESS_WEIGHT);
    setAnchorDate(rule?.anchorDate ?? todayIso());
    setAnchorLabel(editing?.recurrence_anchor_label ?? '');
    setFirst(rule?.first ?? 'anchor');
    setEvery(rule?.every ?? 1);
    setUnit(rule?.unit ?? 'months');
    setEndMode(rule?.endDate ? 'date' : rule?.maxCount ? 'count' : 'never');
    setEndDate(rule?.endDate ?? '');
    setMaxCount(rule?.maxCount ?? 12);
    setLeadDays(editing?.recurrence_lead_days ?? 0);
    setPicked(new Map());
  }, [open, editing, prefill, defaultAssignee]);

  const chooseMode = (next: StartMode) => {
    setMode(next);
    setFirst(next === 'landmark' ? 'after_interval' : 'anchor');
  };

  const rule: FollowUpRule = useMemo(() => ({
    anchorDate,
    every,
    unit,
    first,
    endDate: endMode === 'date' && endDate ? endDate : null,
    maxCount: endMode === 'count' ? maxCount : null,
  }), [anchorDate, every, unit, first, endMode, endDate, maxCount]);
  const valid = isValidRule(rule);
  const projection = useMemo(() => valid ? projectFollowUp(rule, today, UPCOMING_SHOWN) : { past: [], upcoming: [], ended: true }, [rule, valid, today]);
  // A próxima data sempre entra: o sistema mantém uma etapa aberta à frente.
  const nextDate = projection.upcoming[0] ?? null;
  const chosen = (date: string) => date === nextDate || (picked.get(date) ?? date < today);
  const toggleDate = (date: string) => setPicked(current => new Map(current).set(date, !chosen(date)));
  const pickMany = (dates: string[], value: boolean) => (current: Map<string, boolean>) => {
    const next = new Map(current);
    for (const date of dates) next.set(date, value);
    return next;
  };
  const markAll = () => setPicked(pickMany([...projection.past, ...projection.upcoming], true));
  const onlyUpcoming = () => setPicked(current => pickMany(projection.upcoming, true)(pickMany(projection.past, false)(current)));
  const onlyNext = () => setPicked(current => pickMany(projection.upcoming.slice(1), false)(pickMany(projection.past, false)(current)));

  const selectedClients = clients.filter(client => clientIds.includes(client.id));
  const assigneeOptions = assignee && !responsibleList.some(person => person.name === assignee)
    ? [{ name: assignee, color: '#64748b', initials: '?' }, ...responsibleList]
    : responsibleList;
  const canSave = Boolean(title.trim() && assignee && valid && (editing || selectedClients.length === 1)) && !saving;
  const presetActive = FOLLOW_UP_PRESETS.find(preset => preset.every === every && preset.unit === unit);
  const pastChosen = projection.past.filter(chosen).length;
  const currentWeight = weightVisual(weight);

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const storage = ruleToStorage(rule, { label: mode === 'landmark' ? anchorLabel : null, leadDays });
      if (editing) {
        const ok = await onUpdateTask(editing.id, {
          title: title.trim(),
          description: description.trim() || null,
          assigned_to: [assignee],
          weight,
          ...storage,
        });
        if (ok) onOpenChange(false);
        return;
      }
      const client = selectedClients[0];
      const dates = [...projection.past, ...projection.upcoming].filter(chosen);
      const ok = await onCreate(client.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        assigned_to: [assignee],
        weight,
        modality: 'acompanhamento',
        ...storage,
      }, dates, client.name);
      if (ok) onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const dateRow = (date: string, past: boolean) => {
    const locked = date === nextDate;
    const checked = chosen(date);
    return <label key={date} className={cn('flex min-h-10 cursor-pointer items-center gap-2.5 rounded-md border px-3 py-1.5 text-sm', checked ? (past ? 'border-red-200 bg-red-50/60' : 'border-sky-200 bg-sky-50/60') : 'border-slate-200 bg-white text-slate-500', locked && 'cursor-default')}>
      <input type="checkbox" className="h-4 w-4 accent-primary" checked={checked} disabled={locked} onChange={() => toggleDate(date)} aria-label={`Criar etapa de ${brDate(date)}`} />
      <span className="font-medium tabular-nums">{brDate(date)}</span>
      <span className="ml-auto text-[11px] text-muted-foreground">
        {locked ? 'próxima, sempre entra' : past ? (checked ? 'entra atrasada' : 'não conta') : (checked ? 'cria agora' : 'nasce depois')}
      </span>
    </label>;
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className={sheetDialogClass}>
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-300 sm:hidden" aria-hidden />
      <DialogHeader className="shrink-0 border-b px-5 pb-3 pt-3 text-left sm:px-6 sm:pt-5">
        <DialogTitle>{editing ? 'Editar acompanhamento' : 'Novo acompanhamento'}</DialogTitle>
        <DialogDescription>Algo que se repete para um cliente. Cada data vira uma etapa do processo.</DialogDescription>
      </DialogHeader>

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={event => { event.preventDefault(); void submit(); }}>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="space-y-1.5">
            <Label className={fieldLabel}>Como começa</Label>
            <div className="grid grid-cols-2 gap-2">
              <SegmentButton active={mode === 'date'} onClick={() => chooseMode('date')}><CalendarDays className="h-4 w-4" />A partir de uma data</SegmentButton>
              <SegmentButton active={mode === 'landmark'} onClick={() => chooseMode('landmark')}><Flag className="h-4 w-4" />A partir de um marco</SegmentButton>
            </div>
            <p className="text-[11px] leading-snug text-muted-foreground">{mode === 'date'
              ? 'Ex.: a partir de hoje, visita de acompanhamento todo mês.'
              : 'Ex.: licença emitida em 15/09; laudo a cada 180 dias depois dela.'}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="follow-title" className={fieldLabel}>O que se repete</Label>
            <Input id="follow-title" autoFocus={!editing} value={title} onChange={event => setTitle(event.target.value)} placeholder={mode === 'date' ? 'Ex.: Visita de acompanhamento' : 'Ex.: Laudo da caixa separadora de água e óleo'} />
          </div>

          <div className="space-y-1.5">
            <Label className={fieldLabel}>Cliente</Label>
            <ClientMultiPicker clients={clients} selectedClientIds={clientIds} onChange={setClientIds} allowMultiple={false} includeUniverseRamos disabled={Boolean(editing)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
            <div className="min-w-0 space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label className={fieldLabel}>Peso</Label>
                <span className="text-xs font-semibold text-slate-700">{currentWeight.label}</span>
              </div>
              <WeightIconOptions value={weight} onSelect={setWeight} />
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="follow-assignee" className={fieldLabel}>Responsável</Label>
              <select id="follow-assignee" value={assignee} onChange={event => setAssignee(event.target.value)} className={cn(selectClass, 'h-11')}>
                {assigneeOptions.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
              </select>
            </div>
          </div>

          <div className={cn('grid gap-3', mode === 'landmark' && 'sm:grid-cols-2')}>
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="follow-anchor" className={fieldLabel}>{mode === 'landmark' ? 'Data do marco' : 'Começa em'}</Label>
              <Input id="follow-anchor" type="date" value={anchorDate} onChange={event => setAnchorDate(event.target.value)} />
            </div>
            {mode === 'landmark' && <div className="min-w-0 space-y-1.5">
              <Label htmlFor="follow-anchor-label" className={fieldLabel}>O que é o marco</Label>
              <Input id="follow-anchor-label" value={anchorLabel} onChange={event => setAnchorLabel(event.target.value)} placeholder="Ex.: Emissão da LO 123/2026" />
            </div>}
          </div>

          <div className="space-y-2">
            <Label className={fieldLabel}>De quanto em quanto tempo</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {FOLLOW_UP_PRESETS.map(preset => <SegmentButton key={preset.label} active={presetActive === preset} onClick={() => { setEvery(preset.every); setUnit(preset.unit); }}>{preset.label}</SegmentButton>)}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="shrink-0 text-muted-foreground">ou a cada</span>
              <Input aria-label="Quantos" type="number" inputMode="numeric" min={1} max={MAX_EVERY[unit]} value={every} onChange={event => setEvery(Math.max(1, Math.round(Number(event.target.value)) || 1))} className="w-20" />
              <select aria-label="Unidade" value={unit} onChange={event => setUnit(event.target.value as FollowUpUnit)} className={cn(selectClass, 'flex-1')}>
                {(Object.keys(FOLLOW_UP_UNIT_LABELS) as FollowUpUnit[]).map(item => <option key={item} value={item}>{every === 1 ? FOLLOW_UP_UNIT_LABELS[item].one : FOLLOW_UP_UNIT_LABELS[item].many}</option>)}
              </select>
            </div>
          </div>

          {mode === 'landmark' && <div className="space-y-1.5">
            <Label className={fieldLabel}>Primeira vez</Label>
            <div className="grid grid-cols-2 gap-2">
              <SegmentButton active={first === 'after_interval'} onClick={() => setFirst('after_interval')}>Um período depois do marco</SegmentButton>
              <SegmentButton active={first === 'anchor'} onClick={() => setFirst('anchor')}>No próprio marco</SegmentButton>
            </div>
          </div>}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="follow-end" className={fieldLabel}>Até quando</Label>
              <div className="flex gap-2">
                <select id="follow-end" value={endMode} onChange={event => setEndMode(event.target.value as EndMode)} className={cn(selectClass, 'flex-1')}>
                  <option value="never">Sem fim</option>
                  <option value="date">Até uma data</option>
                  <option value="count">Número de vezes</option>
                </select>
                {endMode === 'count' && <Input aria-label="Quantas vezes" type="number" inputMode="numeric" min={1} max={1000} value={maxCount} onChange={event => setMaxCount(Math.max(1, Math.round(Number(event.target.value)) || 1))} className="w-20" />}
              </div>
              {endMode === 'date' && <Input aria-label="Última data" type="date" value={endDate} min={anchorDate} onChange={event => setEndDate(event.target.value)} />}
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="follow-lead" className={fieldLabel}>Avisar antes</Label>
              <div className="flex items-center gap-2">
                <Input id="follow-lead" type="number" inputMode="numeric" min={0} max={365} value={leadDays} onChange={event => setLeadDays(Math.max(0, Math.min(365, Math.round(Number(event.target.value)) || 0)))} className="w-20" />
                <span className="text-sm text-muted-foreground">dias antes</span>
              </div>
            </div>
          </div>

          <section className="space-y-2 rounded-lg border bg-slate-50 p-3" aria-label="Projeção das datas">
            <p className={cn('text-sm font-semibold', valid ? 'text-slate-900' : 'text-muted-foreground')}>{describeFollowUp(rule)}</p>
            {editing
              ? <p className="text-[11px] leading-snug text-muted-foreground">Mudar a regra muda só as próximas datas. As etapas já criadas ficam como estão.</p>
              : valid && (projection.past.length > 0 || projection.upcoming.length > 0) && <>
                <p className="text-[11px] leading-snug text-muted-foreground">Marque as datas que o processo já cria como etapas. As próximas que ficarem sem marcar nascem sozinhas, uma de cada vez.</p>
                <div className="flex flex-wrap gap-1.5">
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={markAll}>Marcar todas</Button>
                  {projection.past.length > 0 && <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={onlyUpcoming}>Só as próximas</Button>}
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={onlyNext}>Só a próxima</Button>
                </div>
                {projection.past.length > 0 && <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-red-700">Já passaram ({projection.past.length}) · {pastChosen ? `${pastChosen} ${pastChosen === 1 ? 'entra atrasada' : 'entram atrasadas'}` : 'nenhuma conta'}</p>
                  <div className="max-h-48 space-y-1 overflow-y-auto pr-1">{projection.past.map(date => dateRow(date, true))}</div>
                </div>}
                {projection.upcoming.length > 0 && <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-sky-800">Próximas</p>
                  <div className="space-y-1">{projection.upcoming.map(date => dateRow(date, false))}</div>
                  {!projection.ended && <p className="text-[11px] text-muted-foreground">E assim por diante.</p>}
                </div>}
              </>}
          </section>

          <div className="space-y-1.5">
            <Label htmlFor="follow-description" className={fieldLabel}>Detalhes <span className="font-normal normal-case tracking-normal">(opcional)</span></Label>
            <Textarea id="follow-description" value={description} onChange={event => setDescription(event.target.value)} rows={2} placeholder="Como fazer, contatos, links" className="text-base sm:text-sm" />
          </div>
        </div>

        <div className={sheetFooterClass}>
          <Button type="button" variant="outline" className="h-11 sm:h-10" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" className="h-11 sm:h-10" disabled={!canSave}>{saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar acompanhamento'}</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
