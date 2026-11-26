import { useState } from 'react';
import { Plus, Workflow, MessageSquarePlus, Package, X, type LucideIcon } from '@/components/icones';
import { cn } from '@/lib/utils';
import { Client } from '@/types/client';
import { DeliverableFormData } from '@/types/deliverable';
import { CollaboratorCommentContext, COLLAB_COMMENT_CONTEXT_LABELS, COLLAB_COMMENT_CONTEXT_COLORS } from '@/types/collaboratorComment';
import { DeliverableModal } from './DeliverableModal';
import { ProcessModal, type CreateProcess } from '@/components/processos/ProcessModal';
import type { CreateFollowUp } from '@/components/processos/FollowUpModal';
import type { UpdateTask } from '@/components/processos/processParts';
import { useCollaboratorComments } from '@/hooks/useCollaboratorComments';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface RespOption { name: string; color: string; initials: string; }

interface Props {
  collaborator: string;
  color: string;
  isTeamView: boolean;
  clients: Client[];
  responsibleList: RespOption[];
  onCreateProcess: CreateProcess;
  onCreateFollowUp?: CreateFollowUp;
  onUpdateTask: UpdateTask;
  onCreateDeliverable: (data: DeliverableFormData) => Promise<unknown>;
  variant?: 'fab' | 'inline';
}

type Kind = 'process' | 'comment' | 'deliverable' | null;

export function QuickCreatePanel({
  collaborator, color, isTeamView, clients, responsibleList,
  onCreateProcess, onCreateFollowUp, onUpdateTask, onCreateDeliverable, variant = 'fab',
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Kind>(null);
  const { create: createCollabComment } = useCollaboratorComments();

  // Processos v2 (D-025): tarefa e prioridade viraram um único "Processo".
  const actions: { kind: Kind; label: string; icon: LucideIcon; bg: string }[] = [
    { kind: 'process', label: 'Processo', icon: Workflow, bg: '#0EA5E9' },
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
              'w-14 h-14 rounded-full shadow-xl flex items-center justify-center bg-primary text-primary-foreground transition-transform hover:bg-primary/90',
              open && 'rotate-45'
            )}
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

      <ProcessModal
        open={active === 'process'}
        onOpenChange={(v) => { if (!v) setActive(null); }}
        editing={null}
        clients={clients}
        responsibleList={responsibleList}
        defaultAssignee={defaultAssignee ?? responsibleList[0]?.name ?? ''}
        presetClientId={null}
        onCreate={onCreateProcess}
        onCreateFollowUp={onCreateFollowUp}
        onUpdateTask={onUpdateTask}
      />

      <DeliverableModal
        open={active === 'deliverable'}
        onOpenChange={(v) => { if (!v) setActive(null); }}
        editing={null}
        defaultAssignee={defaultAssignee}
        clients={clients}
        responsibleList={responsibleList}
        onSubmit={async (data) => {
          const created = await onCreateDeliverable(data);
          if (created) setActive(null);
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
          <Button onClick={submit} disabled={!text.trim()}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
