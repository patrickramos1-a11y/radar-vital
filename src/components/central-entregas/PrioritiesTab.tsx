import { useState, useMemo } from 'react';
import { Priority, PriorityFormData, PRIORITY_STATUS_CONFIG, PriorityStatus } from '@/types/priority';
import { Client } from '@/types/client';
import { Plus, Trash2, Pencil, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PriorityModal } from './PriorityModal';
import { ClientCell } from './ClientCell';
import { CollaboratorAvatar } from './CollaboratorAvatar';
import { assigneeMatches } from '@/lib/taskAssignee';
import { format, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface RespOption { name: string; color: string; initials: string; }

interface Props {
  collaborator: string;
  color: string;
  isTeamView: boolean;
  priorities: Priority[];
  clients: Client[];
  responsibleList: RespOption[];
  onCreate: (data: PriorityFormData, clientName?: string) => Promise<any>;
  onUpdate: (id: string, data: Partial<PriorityFormData>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function PrioritiesTab({ collaborator, color, isTeamView, priorities, clients, responsibleList, onCreate, onUpdate, onDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Priority | null>(null);
  const [showAll, setShowAll] = useState(false);

  const clientById = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  const filtered = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return priorities
      .filter(p => isTeamView ? true : assigneeMatches(p.assigned_to, collaborator))
      .filter(p => showAll ? true : (p.status !== 'concluida' && p.status !== 'cancelada'))
      .sort((a, b) => {
        // Overdue first, then weight desc, then due date asc, then created asc
        const aOver = a.due_date && new Date(a.due_date) < today && a.status !== 'concluida' ? 1 : 0;
        const bOver = b.due_date && new Date(b.due_date) < today && b.status !== 'concluida' ? 1 : 0;
        if (aOver !== bOver) return bOver - aOver;
        if (a.weight !== b.weight) return b.weight - a.weight;
        const aDue = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const bDue = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        if (aDue !== bDue) return aDue - bDue;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  }, [priorities, collaborator, isTeamView, showAll]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">
            {isTeamView ? 'Todas as prioridades da equipe' : `Prioridades de ${collaborator}`}
          </h3>
          <span className="text-xs text-muted-foreground">{filtered.length} item(ns)</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} />
            incluir concluídas
          </label>
          {!isTeamView && (
            <Button onClick={() => { setEditing(null); setModalOpen(true); }} size="sm" style={{ backgroundColor: color }}>
              <Plus className="w-4 h-4 mr-1" /> Nova prioridade
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card/60 p-8 text-center text-sm text-muted-foreground">
          Nenhuma prioridade em aberto 🎉
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="max-h-[640px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Prioridade</th>
                  <th className="px-3 py-2 font-medium">Cliente</th>
                  {isTeamView && <th className="px-3 py-2 font-medium">Responsáveis</th>}
                  <th className="px-3 py-2 font-medium">Prazo</th>
                  <th className="px-3 py-2 font-medium text-center">Peso</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(p => {
                  const cfg = PRIORITY_STATUS_CONFIG[p.status];
                  const today = new Date(); today.setHours(0, 0, 0, 0);
                  const dueDate = p.due_date ? new Date(p.due_date) : null;
                  const overdue = dueDate && dueDate < today && p.status !== 'concluida' && p.status !== 'cancelada';
                  const daysToDue = dueDate ? differenceInCalendarDays(dueDate, today) : null;
                  const done = p.status === 'concluida' || p.status === 'cancelada';
                  const client = p.client_id ? clientById.get(p.client_id) : null;
                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        'hover:bg-muted/30 transition-colors',
                        overdue && 'bg-red-50/40',
                        done && 'opacity-60'
                      )}
                      style={overdue ? { borderLeft: '3px solid #DC2626' } : {}}
                    >
                      <td className="px-3 py-2 max-w-[300px]">
                        <div className="flex items-start gap-2">
                          <span className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                          <div className="min-w-0">
                            <div className="font-medium text-sm break-words">{p.title}</div>
                            {p.category && <div className="text-[10px] text-muted-foreground">{p.category}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2"><ClientCell client={client} size={22} /></td>
                      {isTeamView && (
                        <td className="px-3 py-2">
                          <div className="flex -space-x-1.5">
                            {p.assigned_to.slice(0, 4).map(a => <CollaboratorAvatar key={a} name={a} size={22} ring />)}
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-2 whitespace-nowrap">
                        {dueDate ? (
                          <div className={cn('text-xs', overdue ? 'text-red-700 font-semibold' : 'text-muted-foreground')}>
                            {format(dueDate, 'dd/MM/yyyy', { locale: ptBR })}
                            {daysToDue !== null && !done && (
                              <div className={cn('text-[10px]', overdue ? 'text-red-600' : daysToDue <= 3 ? 'text-amber-600' : 'text-muted-foreground')}>
                                {overdue ? `${Math.abs(daysToDue)}d atrasada` : daysToDue === 0 ? 'hoje' : `em ${daysToDue}d`}
                              </div>
                            )}
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-muted text-xs font-bold">{p.weight}</span>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={p.status}
                          onChange={e => onUpdate(p.id, { status: e.target.value as PriorityStatus })}
                          className={cn('text-xs px-2 py-1 rounded border font-medium', cfg.bgClass, cfg.textClass, cfg.borderClass)}
                        >
                          {(Object.keys(PRIORITY_STATUS_CONFIG) as PriorityStatus[]).map(s => (
                            <option key={s} value={s}>{PRIORITY_STATUS_CONFIG[s].label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-1">
                          {p.status !== 'concluida' && (
                            <button
                              onClick={() => onUpdate(p.id, { status: 'concluida' })}
                              title="Concluir"
                              className="p-1 rounded hover:bg-emerald-100 text-emerald-700"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button className="p-1 rounded hover:bg-muted" onClick={() => { setEditing(p); setModalOpen(true); }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1 rounded hover:bg-muted text-destructive" onClick={() => { if (confirm('Excluir prioridade?')) onDelete(p.id); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PriorityModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        defaultAssignee={isTeamView ? undefined : collaborator}
        clients={clients}
        responsibleList={responsibleList}
        onSubmit={async (data) => {
          const clientName = data.client_id ? clients.find(c => c.id === data.client_id)?.name : undefined;
          if (editing) await onUpdate(editing.id, data);
          else await onCreate(data, clientName);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
