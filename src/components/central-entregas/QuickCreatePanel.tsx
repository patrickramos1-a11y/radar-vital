import { useState } from 'react';
import { Plus, Star, CheckSquare, MessageSquarePlus, Package, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Client } from '@/types/client';
import { Priority, PriorityFormData } from '@/types/priority';
import { Task, TaskFormData, TaskPriority, PRIORITY_CONFIG } from '@/types/task';
import { Deliverable, DeliverableFormData } from '@/types/deliverable';
import { CollaboratorCommentContext, COLLAB_COMMENT_CONTEXT_LABELS, COLLAB_COMMENT_CONTEXT_COLORS } from '@/types/collaboratorComment';
import { PriorityModal } from './PriorityModal';
import { DeliverableModal } from './DeliverableModal';
import { useCollaboratorComments } from '@/hooks/useCollaboratorComments';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { normalizeAssignee } from '@/lib/taskAssignee';

interface RespOption { name: string; color: string; initials: string; }

interface Props {
  collaborator: string;
  color: string;
  isTeamView: boolean;
  clients: Client[];
  responsibleList: RespOption[];
  priorities: Priority[];
  tasks: Task[];
  onCreatePriority: (data: PriorityFormData, clientName?: string) => Promise<any>;
  onCreateTask: (clientId: string, data: TaskFormData, clientName?: string) => Promise<any>;
  onCreateDeliverable: (data: DeliverableFormData) => Promise<any>;
  variant?: 'fab' | 'inline';
}

type Kind = 'task' | 'priority' | 'comment' | 'deliverable' | null;

export function QuickCreatePanel({
  collaborator, color, isTeamView, clients, responsibleList, priorities, tasks,
  onCreatePriority, onCreateTask, onCreateDeliverable, variant = 'fab',
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Kind>(null);
  const { create: createCollabComment } = useCollaboratorComments();

  const actions: { kind: Kind; label: string; icon: any; bg: string }[] = [
    { kind: 'task', label: 'Tarefa', icon: CheckSquare, bg: '#0EA5E9' },
    { kind: 'priority', label: 'Prioridade', icon: Star, bg: '#DC2626' },
    { kind: 'comment', label: 'Anotação', icon: MessageSquarePlus, bg: '#F59E0B' },
    { kind: 'deliverable', label: 'Entregável', icon: Package, bg: '#6B9B37' },
  ];

  const defaultAssignee = isTeamView ? undefined : collaborator;

  return (
    <>
      {variant === 'fab' ? (
        <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
          {open && (
            <div className="flex flex-col gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2">
              {actions.map(a => (
                <button
                  key={a.label}
                  onClick={() => { setActive(a.kind); setOpen(false); }}
                  className="inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-full shadow-lg text-white text-sm font-medium"
                  style={{ backgroundColor: a.bg }}
                >
                  <a.icon className="w-4 h-4" />
                  {a.label}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setOpen(v => !v)}
            className={cn(
              'w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-transform',
              open && 'rotate-45'
            )}
            style={{ backgroundColor: color }}
            aria-label="Criar rápido"
          >
            {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {actions.map(a => (
            <button
              key={a.label}
              onClick={() => setActive(a.kind)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white shadow-sm hover:opacity-90"
              style={{ backgroundColor: a.bg }}
            >
              <a.icon className="w-3.5 h-3.5" />
              + {a.label}
            </button>
          ))}
        </div>
      )}

      <PriorityModal
        open={active === 'priority'}
        onOpenChange={(v) => { if (!v) setActive(null); }}
        editing={null}
        defaultAssignee={defaultAssignee}
        clients={clients}
        responsibleList={responsibleList}
        onSubmit={async (data) => {
          const clientName = data.client_id ? clients.find(c => c.id === data.client_id)?.name : undefined;
          await onCreatePriority(data, clientName);
          setActive(null);
        }}
      />

      <DeliverableModal
        open={active === 'deliverable'}
        onOpenChange={(v) => { if (!v) setActive(null); }}
        editing={null}
        defaultAssignee={defaultAssignee}
        priorities={priorities}
        tasks={tasks}
        clients={clients}
        responsibleList={responsibleList}
        onSubmit={async (data) => {
          await onCreateDeliverable(data);
          setActive(null);
        }}
      />

      <QuickTaskDialog
        open={active === 'task'}
        onOpenChange={(v) => { if (!v) setActive(null); }}
        color={color}
        defaultAssignee={defaultAssignee}
        clients={clients}
        responsibleList={responsibleList}
        onSubmit={async (clientId, data) => {
          const clientName = clients.find(c => c.id === clientId)?.name;
          await onCreateTask(clientId, data, clientName);
          setActive(null);
        }}
      />

      <QuickCollabCommentDialog
        open={active === 'comment'}
        onOpenChange={(v) => { if (!v) setActive(null); }}
        collaborator={collaborator}
        color={color}
        isTeamView={isTeamView}
        responsibleList={responsibleList}
        onSubmit={async (data) => {
          const ok = await createCollabComment(data);
          if (ok) setActive(null);
        }}
      />
    </>
  );
}

function QuickTaskDialog({
  open, onOpenChange, color, defaultAssignee, clients, responsibleList, onSubmit,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  color: string; defaultAssignee?: string;
  clients: Client[]; responsibleList: RespOption[];
  onSubmit: (clientId: string, data: TaskFormData) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [assigned, setAssigned] = useState<string[]>(defaultAssignee ? [defaultAssignee] : []);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');

  const reset = () => {
    setTitle(''); setClientId(''); setDueDate(''); setPriority('normal');
    setAssigned(defaultAssignee ? [defaultAssignee] : []);
  };

  const toggle = (name: string) => setAssigned(prev =>
    prev.some(a => normalizeAssignee(a) === normalizeAssignee(name))
      ? prev.filter(a => normalizeAssignee(a) !== normalizeAssignee(name))
      : [...prev, name]);

  const submit = async () => {
    if (!title.trim() || !clientId) return;
    await onSubmit(clientId, { title: title.trim(), assigned_to: assigned, due_date: dueDate || undefined, priority });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nova tarefa</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} autoFocus placeholder="Ex: Enviar relatório..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cliente *</Label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full px-2 py-2 border rounded-md bg-background text-sm">
                <option value="">— Selecione —</option>
                {clients.filter(c => c.isActive).sort((a, b) => a.name.localeCompare(b.name)).map(c =>
                  <option key={c.id} value={c.id}>{c.name}</option>)}
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
              {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map(p =>
                <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
            </select>
          </div>
          <div>
            <Label>Responsáveis</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {responsibleList.map(r => {
                const sel = assigned.some(a => normalizeAssignee(a) === normalizeAssignee(r.name));
                return (
                  <button key={r.name} type="button" onClick={() => toggle(r.name)}
                    className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', sel ? 'text-white' : 'bg-background hover:bg-muted')}
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
          <Button onClick={submit} disabled={!title.trim() || !clientId} style={{ backgroundColor: color }}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuickCollabCommentDialog({
  open, onOpenChange, collaborator, color, isTeamView, responsibleList, onSubmit,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  collaborator: string; color: string; isTeamView: boolean;
  responsibleList: RespOption[];
  onSubmit: (data: { collaborator_name: string; comment_text: string; context: CollaboratorCommentContext }) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [ctx, setCtx] = useState<CollaboratorCommentContext>('observacao');
  const [target, setTarget] = useState<string>(isTeamView ? (responsibleList[0]?.name || collaborator) : collaborator);

  const submit = async () => {
    if (!text.trim() || !target) return;
    await onSubmit({ collaborator_name: target, comment_text: text.trim(), context: ctx });
    setText(''); setCtx('observacao');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setText(''); setCtx('observacao'); } onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova anotação sobre colaborador</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Colaborador</Label>
            <select value={target} onChange={e => setTarget(e.target.value)} className="w-full px-2 py-2 border rounded-md bg-background text-sm">
              {responsibleList.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Contexto</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(Object.keys(COLLAB_COMMENT_CONTEXT_LABELS) as CollaboratorCommentContext[]).map(k => {
                const c = COLLAB_COMMENT_CONTEXT_COLORS[k];
                const sel = ctx === k;
                return (
                  <button key={k} type="button" onClick={() => setCtx(k)}
                    className={cn('px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                      sel ? 'text-white' : 'bg-background hover:bg-muted')}
                    style={sel ? { backgroundColor: c, borderColor: c } : {}}>
                    {COLLAB_COMMENT_CONTEXT_LABELS[k]}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label>Anotação</Label>
            <Textarea value={text} onChange={e => setText(e.target.value)} rows={5} autoFocus
              placeholder="Ex: conversar sobre pontualidade nas entregas..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={!text.trim()} style={{ backgroundColor: color }}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
