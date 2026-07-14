import { useState, useMemo } from 'react';
import { Client } from '@/types/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Circle, Archive, AlertOctagon } from 'lucide-react';
import { toast } from 'sonner';
import { ClientCell } from './ClientCell';

interface Props {
  collaborator: string;
  color: string;
  isTeamView: boolean;
  comments: any[];
  clients: Client[];
}

export function CommentsTab({ collaborator, isTeamView, comments, clients }: Props) {
  const readField = `read_${collaborator.toLowerCase()}`;
  const [filter, setFilter] = useState<'unread' | 'all' | 'read'>('unread');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ciencia' | 'relevante' | 'informativo'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  const clientById = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  const filtered = useMemo(() => {
    let list = comments.filter(c => !c.is_archived);
    if (!isTeamView) {
      list = list.filter(c => {
        const required: string[] = c.required_readers || [];
        if (c.comment_type === 'ciencia') {
          return required.some(r => r.toLowerCase() === collaborator.toLowerCase());
        }
        return true;
      });
      if (filter === 'unread') list = list.filter(c => !(c as any)[readField]);
      else if (filter === 'read') list = list.filter(c => !!(c as any)[readField]);
    }
    if (typeFilter !== 'all') list = list.filter(c => (c.comment_type || 'informativo') === typeFilter);
    if (clientFilter !== 'all') list = list.filter(c => c.client_id === clientFilter);
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [comments, filter, typeFilter, clientFilter, collaborator, readField, isTeamView]);

  const toggleRead = async (c: any) => {
    if (isTeamView) return;
    const current = !!c[readField];
    const newVal = !current;
    const collabName = collaborator.charAt(0).toUpperCase() + collaborator.slice(1);
    const newTimestamps = { ...(c.read_timestamps || {}) };
    if (newVal) newTimestamps[collabName] = new Date().toISOString();
    else delete newTimestamps[collabName];
    const { error } = await supabase.from('client_comments').update({
      [readField]: newVal,
      read_timestamps: newTimestamps,
    }).eq('id', c.id);
    if (error) { toast.error('Erro ao marcar leitura'); return; }
    toast.success(newVal ? 'Marcado como lido' : 'Marcado como não lido');
  };

  const archive = async (id: string) => {
    const { error } = await supabase.from('client_comments').update({
      is_archived: true, archived_by: collaborator, archived_at: new Date().toISOString()
    }).eq('id', id);
    if (error) toast.error('Erro ao arquivar'); else toast.success('Arquivado');
  };

  const linkedClients = useMemo(() => {
    const ids = new Set(comments.map(c => c.client_id));
    return clients.filter(c => ids.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [comments, clients]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        {!isTeamView && (
          <div className="flex gap-1">
            {(['unread', 'all', 'read'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-3 py-1 rounded-full text-xs font-medium border', filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted')}>
                {f === 'all' ? 'Todos' : f === 'unread' ? 'Pendentes' : 'Lidos'}
              </button>
            ))}
          </div>
        )}
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
          Caixa de entrada vazia 🎉
        </div>
      ) : (
        <div className="rounded-xl border bg-card divide-y overflow-hidden">
          {filtered.map(c => {
            const isRead = !!c[readField];
            const client = clientById.get(c.client_id);
            const isCiencia = c.comment_type === 'ciencia';
            const isRelevante = c.comment_type === 'relevante';
            return (
              <div key={c.id} className={cn('flex gap-3 p-3 hover:bg-muted/30 transition-colors', !isRead && !isTeamView && 'bg-amber-50/30')}>
                <button
                  onClick={() => toggleRead(c)}
                  disabled={isTeamView}
                  className="shrink-0 mt-0.5 disabled:cursor-default"
                  title={isTeamView ? 'Visão de equipe' : (isRead ? 'Marcar como não lido' : 'Marcar como lido')}
                >
                  {isRead
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    : <Circle className="w-5 h-5 text-amber-500" />}
                </button>
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
                      <button onClick={() => archive(c.id)} title="Arquivar" className="p-1 rounded hover:bg-muted text-muted-foreground">
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
