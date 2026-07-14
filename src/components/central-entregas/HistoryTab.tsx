import { useState, useMemo } from 'react';
import { Task } from '@/types/task';
import { Priority } from '@/types/priority';
import { Deliverable } from '@/types/deliverable';
import { Client } from '@/types/client';
import { assigneeMatches } from '@/lib/taskAssignee';
import { CheckCircle2, Star, Package, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ClientCell } from './ClientCell';

interface Props {
  collaborator: string;
  isTeamView: boolean;
  tasks: Task[];
  priorities: Priority[];
  deliverables: Deliverable[];
  comments: any[];
  clients: Client[];
}

type Period = '7' | '30' | '90' | 'all';

export function HistoryTab({ collaborator, isTeamView, tasks, priorities, deliverables, comments, clients }: Props) {
  const [period, setPeriod] = useState<Period>('30');
  const [open, setOpen] = useState<Record<string, boolean>>({ tasks: false, priorities: false, deliverables: false, comments: false });

  const clientById = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const readField = `read_${collaborator.toLowerCase()}`;

  const since = useMemo(() => {
    if (period === 'all') return 0;
    const days = parseInt(period);
    return Date.now() - days * 86400000;
  }, [period]);

  const doneTasks = useMemo(() => tasks
    .filter(t => t.completed && (isTeamView || assigneeMatches(t.assigned_to, collaborator)))
    .filter(t => !t.completed_at || new Date(t.completed_at).getTime() >= since)
    .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()),
    [tasks, collaborator, isTeamView, since]);

  const donePriorities = useMemo(() => priorities
    .filter(p => (p.status === 'concluida' || p.status === 'cancelada') && (isTeamView || assigneeMatches(p.assigned_to, collaborator)))
    .filter(p => !p.completed_at || new Date(p.completed_at).getTime() >= since)
    .sort((a, b) => new Date(b.completed_at || b.updated_at).getTime() - new Date(a.completed_at || a.updated_at).getTime()),
    [priorities, collaborator, isTeamView, since]);

  const doneDeliverables = useMemo(() => deliverables
    .filter(d => d.status === 'concluido' && (isTeamView || assigneeMatches(d.assigned_to, collaborator)))
    .filter(d => !d.completed_at || new Date(d.completed_at).getTime() >= since)
    .sort((a, b) => new Date(b.completed_at || b.updated_at).getTime() - new Date(a.completed_at || a.updated_at).getTime()),
    [deliverables, collaborator, isTeamView, since]);

  const resolvedComments = useMemo(() => comments
    .filter(c => c.is_archived || c.is_closed)
    .filter(c => isTeamView || !!(c as any)[readField])
    .filter(c => new Date(c.created_at).getTime() >= since)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [comments, isTeamView, readField, since]);

  const Section = ({ id, title, icon: Icon, count, tint, children }: any) => (
    <div className="rounded-xl border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(o => ({ ...o, [id]: !o[id] }))}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/30 transition"
      >
        {open[id] ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        <Icon className="w-4 h-4" style={{ color: tint }} />
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground">({count})</span>
      </button>
      {open[id] && <div className="border-t max-h-[400px] overflow-auto">{children}</div>}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Período:</span>
        {(['7', '30', '90', 'all'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn('px-2.5 py-1 rounded-full text-xs font-medium border',
              period === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted')}
          >
            {p === 'all' ? 'Tudo' : `${p}d`}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">Histórico minimizado — clique para expandir</span>
      </div>

      <Section id="tasks" title="Tarefas concluídas" icon={CheckCircle2} count={doneTasks.length} tint="#10B981">
        <table className="w-full text-sm">
          <tbody className="divide-y">
            {doneTasks.map(t => (
              <tr key={t.id} className="hover:bg-muted/20">
                <td className="px-3 py-2 max-w-[400px]"><span className="line-clamp-1">{t.title}</span></td>
                <td className="px-3 py-2"><ClientCell client={clientById.get(t.client_id)} size={20} /></td>
                <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                  {t.completed_at ? format(new Date(t.completed_at), 'dd/MM/yy', { locale: ptBR }) : '—'}
                </td>
              </tr>
            ))}
            {doneTasks.length === 0 && <tr><td className="px-3 py-3 text-center text-xs text-muted-foreground">Nada por aqui.</td></tr>}
          </tbody>
        </table>
      </Section>

      <Section id="priorities" title="Prioridades finalizadas" icon={Star} count={donePriorities.length} tint="#DC2626">
        <table className="w-full text-sm">
          <tbody className="divide-y">
            {donePriorities.map(p => (
              <tr key={p.id} className="hover:bg-muted/20">
                <td className="px-3 py-2 max-w-[400px]"><span className="line-clamp-1">{p.title}</span></td>
                <td className="px-3 py-2"><ClientCell client={p.client_id ? clientById.get(p.client_id) : null} size={20} /></td>
                <td className="px-3 py-2 text-xs">
                  <span className={p.status === 'concluida' ? 'text-emerald-700' : 'text-slate-500'}>
                    {p.status === 'concluida' ? 'Concluída' : 'Cancelada'}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                  {p.completed_at ? format(new Date(p.completed_at), 'dd/MM/yy', { locale: ptBR }) : '—'}
                </td>
              </tr>
            ))}
            {donePriorities.length === 0 && <tr><td className="px-3 py-3 text-center text-xs text-muted-foreground">Nada por aqui.</td></tr>}
          </tbody>
        </table>
      </Section>

      <Section id="deliverables" title="Entregáveis realizados" icon={Package} count={doneDeliverables.length} tint="#10B981">
        <table className="w-full text-sm">
          <tbody className="divide-y">
            {doneDeliverables.map(d => (
              <tr key={d.id} className="hover:bg-muted/20">
                <td className="px-3 py-2 max-w-[400px]"><span className="line-clamp-1 font-medium">{d.name}</span></td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{d.assigned_to.join(', ')}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                  {d.completed_at ? format(new Date(d.completed_at), 'dd/MM/yy', { locale: ptBR }) : '—'}
                </td>
              </tr>
            ))}
            {doneDeliverables.length === 0 && <tr><td className="px-3 py-3 text-center text-xs text-muted-foreground">Nada por aqui.</td></tr>}
          </tbody>
        </table>
      </Section>

      <Section id="comments" title="Comentários resolvidos/arquivados" icon={MessageSquare} count={resolvedComments.length} tint="#0EA5E9">
        <div className="divide-y">
          {resolvedComments.map(c => (
            <div key={c.id} className="px-3 py-2 flex gap-2 items-start">
              <ClientCell client={clientById.get(c.client_id)} size={20} compact />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">{c.author_name} · {format(new Date(c.created_at), 'dd/MM/yy', { locale: ptBR })}</div>
                <p className="text-sm line-clamp-2">{c.comment_text}</p>
              </div>
            </div>
          ))}
          {resolvedComments.length === 0 && <div className="px-3 py-3 text-center text-xs text-muted-foreground">Nada por aqui.</div>}
        </div>
      </Section>
    </div>
  );
}
