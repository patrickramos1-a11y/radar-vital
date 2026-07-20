import { useState, useMemo } from 'react';
import { Client } from '@/types/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Circle, Archive, AlertOctagon, Plus, Trash2, MessageSquarePlus, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ClientCell } from './ClientCell';
import { CollaboratorAvatar } from './CollaboratorAvatar';
import { useCollaboratorComments } from '@/hooks/useCollaboratorComments';
import {
  CollaboratorCommentContext,
  COLLAB_COMMENT_CONTEXT_LABELS,
  COLLAB_COMMENT_CONTEXT_COLORS,
} from '@/types/collaboratorComment';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Props {
  collaborator: string;
  color: string;
  isTeamView: boolean;
  comments: any[];
  clients: Client[];
}

type SubView = 'about' | 'onClients';

export function CommentsTab({ collaborator, color, isTeamView, comments, clients }: Props) {
  const [subView, setSubView] = useState<SubView>('about');
  const [newOpen, setNewOpen] = useState(false);
  const { comments: collabComments, create, markRead, archive, remove } = useCollaboratorComments();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 border-b pb-2">
        <div className="inline-flex rounded-lg border bg-card p-1">
          <button
            onClick={() => setSubView('about')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors',
              subView === 'about' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}
          >
            <User className="w-3.5 h-3.5" />
            Sobre o colaborador
          </button>
          <button
            onClick={() => setSubView('onClients')}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors',
              subView === 'onClients' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            )}
          >
            <Users className="w-3.5 h-3.5" />
            Comentários em clientes
          </button>
        </div>
        {subView === 'about' && !isTeamView && (
          <Button size="sm" style={{ backgroundColor: color }} onClick={() => setNewOpen(true)} className="ml-auto">
            <MessageSquarePlus className="w-4 h-4 mr-1" /> Nova anotação
          </Button>
        )}
      </div>

      {subView === 'about' ? (
        <AboutCollaboratorView
          collaborator={collaborator}
          isTeamView={isTeamView}
          comments={collabComments}
          onMarkRead={markRead}
          onArchive={archive}
          onDelete={remove}
        />
      ) : (
        <OnClientsView
          collaborator={collaborator}
          isTeamView={isTeamView}
          comments={comments}
          clients={clients}
        />
      )}

      <NewCollabCommentDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        collaborator={collaborator}
        color={color}
        onSubmit={async (data) => {
          const ok = await create(data);
          if (ok) setNewOpen(false);
        }}
      />
    </div>
  );
}

function AboutCollaboratorView({
  collaborator, isTeamView, comments, onMarkRead, onArchive, onDelete,
}: {
  collaborator: string;
  isTeamView: boolean;
  comments: any[];
  onMarkRead: (id: string, v: boolean) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [filter, setFilter] = useState<'pending' | 'all' | 'read'>('pending');
  const [ctxFilter, setCtxFilter] = useState<'all' | CollaboratorCommentContext>('all');

  const list = useMemo(() => {
    let l = comments.filter(c => !c.is_archived);
    if (!isTeamView) {
      l = l.filter(c => (c.collaborator_name || '').toLowerCase() === collaborator.toLowerCase());
    }
    if (filter === 'pending') l = l.filter(c => !c.is_read);
    else if (filter === 'read') l = l.filter(c => c.is_read);
    if (ctxFilter !== 'all') l = l.filter(c => c.context === ctxFilter);
    return l;
  }, [comments, collaborator, isTeamView, filter, ctxFilter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {(['pending', 'all', 'read'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1 rounded-full text-xs font-medium border',
                filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted')}>
              {f === 'pending' ? 'Pendentes' : f === 'read' ? 'Concluídas' : 'Todas'}
            </button>
          ))}
        </div>
        <select value={ctxFilter} onChange={e => setCtxFilter(e.target.value as any)} className="px-2 py-1 border rounded-md text-xs bg-background">
          <option value="all">Todos os contextos</option>
          {(Object.keys(COLLAB_COMMENT_CONTEXT_LABELS) as CollaboratorCommentContext[]).map(k => (
            <option key={k} value={k}>{COLLAB_COMMENT_CONTEXT_LABELS[k]}</option>
          ))}
        </select>
        <div className="ml-auto text-xs text-muted-foreground">{list.length} anotação(ões)</div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border bg-card/60 p-8 text-center text-sm text-muted-foreground">
          Nenhuma anotação por aqui.
        </div>
      ) : (
        <div className="rounded-xl border bg-card divide-y overflow-hidden">
          {list.map(c => {
            const ctxColor = COLLAB_COMMENT_CONTEXT_COLORS[c.context as CollaboratorCommentContext] || '#6B7280';
            const ctxLabel = COLLAB_COMMENT_CONTEXT_LABELS[c.context as CollaboratorCommentContext] || c.context;
            return (
              <div key={c.id} className={cn('flex gap-3 p-3 hover:bg-muted/30', !c.is_read && 'bg-amber-50/30')}>
                <button
                  onClick={() => onMarkRead(c.id, !c.is_read)}
                  className="shrink-0 mt-0.5"
                  title={c.is_read ? 'Reabrir' : 'Marcar como lido/concluído'}
                >
                  {c.is_read
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    : <Circle className="w-5 h-5 text-amber-500" />}
                </button>
                <div className="shrink-0"><CollaboratorAvatar name={c.collaborator_name} size={32} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold">{c.collaborator_name}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ backgroundColor: `${ctxColor}22`, color: ctxColor }}
                    >
                      {ctxLabel}
                    </span>
                    <span className="text-[10px] text-muted-foreground">por {c.author_name}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {format(new Date(c.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm mt-1 break-words whitespace-pre-wrap">{c.comment_text}</p>
                  {c.is_read && c.read_by && (
                    <div className="text-[10px] text-emerald-700 mt-1 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> lido por {c.read_by} em {format(new Date(c.read_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-1 shrink-0">
                  <button onClick={() => onArchive(c.id)} title="Arquivar" className="p-1 rounded hover:bg-muted text-muted-foreground">
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { if (confirm('Excluir anotação?')) onDelete(c.id); }} title="Excluir" className="p-1 rounded hover:bg-muted text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OnClientsView({ collaborator, isTeamView, comments, clients }: {
  collaborator: string; isTeamView: boolean; comments: any[]; clients: Client[];
}) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'ciencia' | 'relevante' | 'informativo'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const clientById = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  const filtered = useMemo(() => {
    let list = comments.filter(c => !c.is_archived);
    if (!isTeamView) {
      list = list.filter(c => (c.author_name || '').toLowerCase() === collaborator.toLowerCase());
    }
    if (typeFilter !== 'all') list = list.filter(c => (c.comment_type || 'informativo') === typeFilter);
    if (clientFilter !== 'all') list = list.filter(c => c.client_id === clientFilter);
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [comments, typeFilter, clientFilter, collaborator, isTeamView]);

  const linkedClients = useMemo(() => {
    const ids = new Set(comments.filter(c => isTeamView || (c.author_name || '').toLowerCase() === collaborator.toLowerCase()).map(c => c.client_id));
    return clients.filter(c => ids.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [comments, clients, collaborator, isTeamView]);

  const archiveClient = async (id: string) => {
    const { error } = await supabase.from('client_comments').update({
      is_archived: true, archived_by: collaborator, archived_at: new Date().toISOString()
    }).eq('id', id);
    if (error) toast.error('Erro ao arquivar'); else toast.success('Arquivado');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="px-2 py-1 border rounded-md text-xs bg-background">
          <option value="all">Todos os tipos</option>
          <option value="ciencia">Ciência</option>
          <option value="relevante">Relevante</option>
          <option value="informativo">Informativo</option>
        </select>
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="px-2 py-1 border rounded-md text-xs bg-background">
          <option value="all">Todos os clientes</option>
          {linkedClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="ml-auto text-xs text-muted-foreground">{filtered.length} comentário(s)</div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card/60 p-8 text-center text-sm text-muted-foreground">
          Nenhum comentário feito em clientes.
        </div>
      ) : (
        <div className="rounded-xl border bg-card divide-y overflow-hidden">
          {filtered.map(c => {
            const client = clientById.get(c.client_id);
            const isCiencia = c.comment_type === 'ciencia';
            const isRelevante = c.comment_type === 'relevante';
            return (
              <div key={c.id} className="flex gap-3 p-3 hover:bg-muted/30 transition-colors">
                <div className="w-8 shrink-0">
                  <ClientCell client={client} size={32} compact />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-xs font-semibold truncate">{client?.name || '—'}</span>
                      <span className="text-[10px] text-muted-foreground">por {c.author_name}</span>
                      {isCiencia && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium inline-flex items-center gap-0.5">
                          <AlertOctagon className="w-2.5 h-2.5" /> Ciência
                        </span>
                      )}
                      {isRelevante && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">Relevante</span>}
                      {c.is_closed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">Resolvido</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(c.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </span>
                      <button onClick={() => archiveClient(c.id)} title="Arquivar" className="p-1 rounded hover:bg-muted text-muted-foreground">
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm mt-1 break-words whitespace-pre-wrap line-clamp-4">{c.comment_text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewCollabCommentDialog({
  open, onOpenChange, collaborator, color, onSubmit,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  collaborator: string; color: string;
  onSubmit: (data: { collaborator_name: string; comment_text: string; context: CollaboratorCommentContext }) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [ctx, setCtx] = useState<CollaboratorCommentContext>('observacao');

  const submit = async () => {
    if (!text.trim()) return;
    await onSubmit({ collaborator_name: collaborator, comment_text: text.trim(), context: ctx });
    setText(''); setCtx('observacao');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setText(''); setCtx('observacao'); } onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova anotação sobre {collaborator}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
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
