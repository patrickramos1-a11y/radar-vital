import { useState, useMemo } from 'react';
import { Client } from '@/types/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Circle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  collaborator: string;
  color: string;
  comments: any[];
  clients: Client[];
}

export function CommentsTab({ collaborator, color, comments, clients }: Props) {
  const readField = `read_${collaborator.toLowerCase()}`;
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('unread');
  const [clientFilter, setClientFilter] = useState<string>('all');

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

  const filtered = useMemo(() => {
    let list = comments.filter(c => !c.is_archived);
    // Only comments where the user is a required reader OR type is not ciencia (informativos aparecem para todos)
    list = list.filter(c => {
      const required: string[] = c.required_readers || [];
      if (c.comment_type === 'ciencia') {
        return required.some(r => r.toLowerCase() === collaborator.toLowerCase());
      }
      return true;
    });
    if (filter === 'unread') list = list.filter(c => !(c as any)[readField]);
    else if (filter === 'read') list = list.filter(c => !!(c as any)[readField]);
    if (clientFilter !== 'all') list = list.filter(c => c.client_id === clientFilter);
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [comments, filter, clientFilter, collaborator, readField]);

  const toggleRead = async (c: any) => {
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

  const linkedClients = useMemo(() => {
    const ids = new Set(comments.map(c => c.client_id));
    return clients.filter(c => ids.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [comments, clients]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1">
          {(['all', 'unread', 'read'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1 rounded-full text-xs font-medium border', filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted')}>
              {f === 'all' ? 'Todos' : f === 'unread' ? 'Não lidos' : 'Lidos'}
            </button>
          ))}
        </div>
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="px-2 py-1 border rounded-md text-xs bg-background">
          <option value="all">Todos os clientes</option>
          {linkedClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="ml-auto text-xs text-muted-foreground">{filtered.length} comentário(s)</div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card/60 p-8 text-center text-sm text-muted-foreground">
          Nenhum comentário {filter === 'unread' ? 'pendente' : ''} para {collaborator}.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const isRead = !!c[readField];
            return (
              <div key={c.id} className={cn('rounded-xl border p-3 bg-card/60 flex gap-3', !isRead && 'border-amber-300 bg-amber-50/40')}>
                <button onClick={() => toggleRead(c)} className="shrink-0 mt-0.5">
                  {isRead ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Circle className="w-5 h-5 text-amber-500" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-foreground">{clientMap.get(c.client_id) || '—'}</span>
                      <span className="text-[10px] text-muted-foreground">por {c.author_name}</span>
                      {c.comment_type === 'ciencia' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">Ciência</span>}
                      {c.comment_type === 'relevante' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">Relevante</span>}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                  </div>
                  <p className="text-sm mt-1 break-words whitespace-pre-wrap">{c.comment_text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
