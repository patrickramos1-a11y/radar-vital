import { useState, useMemo, type ReactNode } from 'react';
import type { LucideIcon } from '@/components/icones';
import { Task } from '@/types/task';
import { Deliverable } from '@/types/deliverable';
import { Client } from '@/types/client';
import { assigneeMatches } from '@/lib/taskAssignee';
import { Workflow, Package, MessageSquare, ChevronDown, ChevronRight } from '@/components/icones';
import { PROCESS_WEIGHT_CONFIG, normalizeProcessWeight, weightForUrgency } from '@/lib/processWeight';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ClientCell } from './ClientCell';
import { periodStart, type PeriodKey } from '@/lib/period';
import { PeriodSelect } from '@/components/common/PeriodSelect';

interface Props {
  collaborator: string;
  isTeamView: boolean;
  tasks: Task[];
  deliverables: Deliverable[];
  comments: HistoryComment[];
  clients: Client[];
}

interface HistoryComment {
  id?: string;
  client_id: string;
  author_name?: string | null;
  comment_text?: string | null;
  created_at?: string;
  is_archived?: boolean;
  is_closed?: boolean;
  [field: string]: unknown;
}

interface SectionProps {
  id: string;
  title: string;
  icon: LucideIcon;
  count: number;
  tint: string;
  children: ReactNode;
}

export function HistoryTab({ collaborator, isTeamView, tasks, deliverables, comments, clients }: Props) {
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [open, setOpen] = useState<Record<string, boolean>>({ processes: false, deliverables: false, comments: false });

  const clientById = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
  const readField = `read_${collaborator.toLowerCase()}`;

  const since = useMemo(() => periodStart(period) ?? 0, [period]);

  // D-025: o histórico mostra processos (tarefas principais); as etapas ficam dentro deles.
  const doneTasks = useMemo(() => tasks
    .filter(t => !t.parent_task_id && t.completed && (isTeamView || assigneeMatches(t.assigned_to, collaborator)))
    .filter(t => !t.completed_at || new Date(t.completed_at).getTime() >= since)
    .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()),
    [tasks, collaborator, isTeamView, since]);

  const doneDeliverables = useMemo(() => deliverables
    .filter(d => d.status === 'concluido' && (isTeamView || assigneeMatches(d.assigned_to, collaborator)))
    .filter(d => !d.completed_at || new Date(d.completed_at).getTime() >= since)
    .sort((a, b) => new Date(b.completed_at || b.updated_at).getTime() - new Date(a.completed_at || a.updated_at).getTime()),
    [deliverables, collaborator, isTeamView, since]);

  const resolvedComments = useMemo(() => comments
    .filter(c => c.is_archived || c.is_closed)
    .filter(c => isTeamView || !!c[readField])
    .filter(c => new Date(c.created_at ?? 0).getTime() >= since)
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()),
    [comments, isTeamView, readField, since]);

  const Section = ({ id, title, icon: Icon, count, tint, children }: SectionProps) => (
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
      <div className="flex flex-wrap items-center gap-2">
        <PeriodSelect value={period} onChange={setPeriod} />
        <span className="ml-auto text-xs text-muted-foreground">Clique em uma seção para expandir</span>
      </div>

      <Section id="processes" title="Processos concluídos" icon={Workflow} count={doneTasks.length} tint="#10B981">
        <table className="w-full text-sm">
          <tbody className="divide-y">
            {doneTasks.map(t => (
              <tr key={t.id} className="hover:bg-muted/20">
                <td className="px-3 py-2 max-w-[400px]"><span className="line-clamp-1">{t.title}</span></td>
                <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{PROCESS_WEIGHT_CONFIG[normalizeProcessWeight(t.weight, weightForUrgency(t.priority))].label}</td>
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
