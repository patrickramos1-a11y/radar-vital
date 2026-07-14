import { useState, useMemo } from 'react';
import { Task, TaskFormData, TaskPriority, PRIORITY_CONFIG } from '@/types/task';
import { Priority, PriorityFormData } from '@/types/priority';
import { Client } from '@/types/client';
import { assigneeMatches } from '@/lib/taskAssignee';
import { Star, CheckCircle2, AlertCircle, Plus, Circle } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PriorityModal } from './PriorityModal';
import { ClientCell } from './ClientCell';
import { CollaboratorAvatar } from './CollaboratorAvatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { normalizeAssignee } from '@/lib/taskAssignee';

interface RespOption { name: string; color: string; initials: string; }

interface Props {
  collaborator: string;
  color: string;
  isTeamView: boolean;
  tasks: Task[];
  priorities: Priority[];
  clients: Client[];
  responsibleList: RespOption[];
  onPromote: (taskId: string, taskTitle: string, data: PriorityFormData, clientName?: string) => Promise<any>;
  onToggleComplete: (taskId: string, clientName?: string) => Promise<boolean>;
  onCreateTask: (clientId: string, data: TaskFormData, clientName?: string) => Promise<boolean>;
  getDaysOpen: (t: Task) => number;
}

export function TasksTab({ collaborator, color, isTeamView, tasks, priorities, clients, responsibleList, onPromote, onToggleComplete, onCreateTask, getDaysOpen }: Props) {
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [showDone, setShowDone] = useState(false);
  const [promotingTask, setPromotingTask] = useState<Task | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  const clientById = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const priorityMap = useMemo(() => new Map(priorities.map(p => [p.id, p])), [priorities]);

  const filtered = useMemo(() => {
    let list = tasks.filter(t => isTeamView ? true : assigneeMatches(t.assigned_to, collaborator));
    if (!showDone) list = list.filter(t => !t.completed);
    if (clientFilter !== 'all') list = list.filter(t => t.client_id === clientFilter);
    // Overdue + high priority first, then days open
    const today = new Date(); today.setHours(0, 0, 0, 0);
    list.sort((a, b) => {
      const aOver = a.due_date && !a.completed && new Date(a.due_date) < today ? 1 : 0;
      const bOver = b.due_date && !b.completed && new Date(b.due_date) < today ? 1 : 0;
      if (aOver !== bOver) return bOver - aOver;
      const aP = PRIORITY_CONFIG[a.priority].order;
      const bP = PRIORITY_CONFIG[b.priority].order;
      if (aP !== bP) return aP - bP;
      return getDaysOpen(b) - getDaysOpen(a);
    });
    return list;
  }, [tasks, collaborator, isTeamView, clientFilter, showDone, getDaysOpen]);

  const linkedClients = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach(t => { if (isTeamView || assigneeMatches(t.assigned_to, collaborator)) ids.add(t.client_id); });
    return clients.filter(c => ids.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks, clients, collaborator, isTeamView]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="px-2 py-1.5 border rounded-md text-xs bg-background">
          <option value="all">Todos os clientes</option>
          {linkedClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-1 text-xs text-muted-foreground">
          <input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} />
          incluir concluídas
        </label>
        <div className="text-xs text-muted-foreground">{filtered.length} tarefa(s)</div>
        <Button onClick={() => setNewTaskOpen(true)} size="sm" className="ml-auto" style={{ backgroundColor: color }}>
          <Plus className="w-4 h-4 mr-1" /> Nova tarefa
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="max-h-[640px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 w-8"></th>
                <th className="px-3 py-2 font-medium">Tarefa</th>
                <th className="px-3 py-2 font-medium">Cliente</th>
                {isTeamView && <th className="px-3 py-2 font-medium">Responsáveis</th>}
                <th className="px-3 py-2 font-medium">Prazo</th>
                <th className="px-3 py-2 font-medium text-center">Dias</th>
                <th className="px-3 py-2 font-medium">Prioridade vinc.</th>
                <th className="px-3 py-2 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr><td colSpan={isTeamView ? 8 : 7} className="text-center text-muted-foreground py-8">Nenhuma tarefa.</td></tr>
              ) : filtered.map(t => {
                const days = getDaysOpen(t);
                const linkedPriority = (t as any).priority_id ? priorityMap.get((t as any).priority_id) : null;
                const pcfg = PRIORITY_CONFIG[t.priority];
                const client = clientById.get(t.client_id);
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const dueDate = t.due_date ? new Date(t.due_date) : null;
                const overdue = dueDate && !t.completed && dueDate < today;
                const daysToDue = dueDate ? differenceInCalendarDays(dueDate, today) : null;

                return (
                  <tr
                    key={t.id}
                    className={cn(
                      'hover:bg-muted/30 transition-colors',
                      t.completed && 'opacity-50',
                      overdue && 'bg-red-50/40'
                    )}
                    style={overdue ? { borderLeft: '3px solid #DC2626' } : {}}
                  >
                    <td className="px-3 py-2">
                      <button
                        onClick={() => onToggleComplete(t.id, client?.name)}
                        title={t.completed ? 'Reabrir' : 'Concluir'}
                        className="p-1 rounded hover:bg-muted"
                      >
                        {t.completed
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          : <Circle className="w-5 h-5 text-muted-foreground hover:text-emerald-600" />}
                      </button>
                    </td>
                    <td className="px-3 py-2 max-w-[300px]">
                      <div className="flex items-start gap-2">
                        <span className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: pcfg.color }} />
                        <div className="min-w-0">
                          <div className={cn('font-medium text-sm break-words', t.completed && 'line-through text-muted-foreground')}>{t.title}</div>
                          <div className="text-[10px]" style={{ color: pcfg.color }}>{pcfg.label}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2"><ClientCell client={client} size={22} /></td>
                    {isTeamView && (
                      <td className="px-3 py-2">
                        <div className="flex -space-x-1.5">
                          {t.assigned_to.slice(0, 4).map(a => <CollaboratorAvatar key={a} name={a} size={22} ring />)}
                        </div>
                      </td>
                    )}
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {dueDate ? (
                        <>
                          <div className={overdue ? 'text-red-700 font-semibold' : 'text-muted-foreground'}>
                            {format(dueDate, 'dd/MM/yy', { locale: ptBR })}
                          </div>
                          {daysToDue !== null && !t.completed && (
                            <div className={cn('text-[10px]', overdue ? 'text-red-600' : daysToDue <= 3 ? 'text-amber-600' : 'text-muted-foreground')}>
                              {overdue ? `${Math.abs(daysToDue)}d atrasada` : daysToDue === 0 ? 'hoje' : `em ${daysToDue}d`}
                            </div>
                          )}
                        </>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={cn('font-bold text-sm', !t.completed && days > 30 ? 'text-red-600' : !t.completed && days > 14 ? 'text-amber-600' : 'text-muted-foreground')}>{days}d</span>
                    </td>
                    <td className="px-3 py-2">
                      {linkedPriority ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                          <Star className="w-3 h-3" /> {linkedPriority.title.slice(0, 26)}
                        </span>
                      ) : (t.completed ? (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      ) : (
                        <button
                          onClick={() => setPromotingTask(t)}
                          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border bg-red-50 text-red-700 hover:bg-red-100 border-red-200 font-medium"
                        >
                          <Star className="w-3 h-3" /> Promover
                        </button>
                      ))}
                    </td>
                    <td className="px-3 py-2 text-right text-[11px]">
                      {t.completed ? (
                        <span className="inline-flex items-center gap-0.5 text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Concluída</span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-amber-600"><AlertCircle className="w-3 h-3" /> Pendente</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <PriorityModal
        open={!!promotingTask}
        onOpenChange={(v) => { if (!v) setPromotingTask(null); }}
        editing={null}
        defaultAssignee={collaborator}
        presetTitle={promotingTask?.title}
        presetClientId={promotingTask?.client_id}
        clients={clients}
        responsibleList={responsibleList}
        submitLabel="Promover para prioridade"
        onSubmit={async (data) => {
          if (!promotingTask) return;
          const clientName = data.client_id ? clientById.get(data.client_id)?.name : undefined;
          await onPromote(promotingTask.id, promotingTask.title, data, clientName);
          setPromotingTask(null);
        }}
      />

      <NewTaskDialog
        open={newTaskOpen}
        onOpenChange={setNewTaskOpen}
        color={color}
        defaultAssignee={isTeamView ? undefined : collaborator}
        clients={clients}
        responsibleList={responsibleList}
        onSubmit={async (clientId, data) => {
          const clientName = clientById.get(clientId)?.name;
          const ok = await onCreateTask(clientId, data, clientName);
          if (ok) setNewTaskOpen(false);
        }}
      />
    </div>
  );
}

function NewTaskDialog({
  open, onOpenChange, color, defaultAssignee, clients, responsibleList, onSubmit
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  color: string;
  defaultAssignee?: string;
  clients: Client[];
  responsibleList: RespOption[];
  onSubmit: (clientId: string, data: TaskFormData) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [assigned, setAssigned] = useState<string[]>(defaultAssignee ? [defaultAssignee] : []);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');

  useMemo(() => {
    if (open) {
      setTitle(''); setClientId(''); setDueDate(''); setPriority('normal');
      setAssigned(defaultAssignee ? [defaultAssignee] : []);
    }
  }, [open, defaultAssignee]);

  const toggle = (name: string) => setAssigned(prev => prev.some(a => normalizeAssignee(a) === normalizeAssignee(name))
    ? prev.filter(a => normalizeAssignee(a) !== normalizeAssignee(name))
    : [...prev, name]);

  const submit = async () => {
    if (!title.trim() || !clientId) return;
    await onSubmit(clientId, { title: title.trim(), assigned_to: assigned, due_date: dueDate || undefined, priority });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova tarefa</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Enviar relatório..." autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cliente *</Label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full px-2 py-2 border rounded-md bg-background text-sm">
                <option value="">— Selecione —</option>
                {clients.filter(c => c.isActive).sort((a, b) => a.name.localeCompare(b.name)).map(c =>
                  <option key={c.id} value={c.id}>{c.name}</option>
                )}
              </select>
            </div>
            <div>
              <Label>Prazo</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Prioridade</Label>
            <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className="w-full px-2 py-2 border rounded-md bg-background text-sm">
              {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map(p => (
                <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Responsáveis</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {responsibleList.map(r => {
                const sel = assigned.some(a => normalizeAssignee(a) === normalizeAssignee(r.name));
                return (
                  <button key={r.name} type="button" onClick={() => toggle(r.name)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${sel ? 'text-white' : 'bg-background hover:bg-muted'}`}
                    style={sel ? { backgroundColor: r.color, borderColor: r.color } : {}}>
                    {r.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!title.trim() || !clientId} style={{ backgroundColor: color }}>Criar tarefa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
