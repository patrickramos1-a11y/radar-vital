import { useState, useMemo } from 'react';
import { Deliverable, DeliverableFormData, DELIVERABLE_STATUS_CONFIG } from '@/types/deliverable';
import { Priority } from '@/types/priority';
import { Task } from '@/types/task';
import { Client } from '@/types/client';
import { assigneeMatches } from '@/lib/taskAssignee';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Calendar as CalendarIcon, Star, CheckSquare, Package, CheckCircle2, Clock, ThumbsUp, Sparkles, Percent, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DeliverableModal } from './DeliverableModal';
import { useDeliverableRatings, summarizeRatings } from '@/hooks/useDeliverableRatings';
import { DeliverableRatingControl } from './DeliverableRating';
import { CollaboratorAvatar } from './CollaboratorAvatar';
import { ClientCell } from './ClientCell';
import { KpiCard } from './KpiCard';

interface RespOption { name: string; color: string; initials: string; }

interface Props {
  collaborator: string;
  color: string;
  isTeamView: boolean;
  deliverables: Deliverable[];
  priorities: Priority[];
  tasks: Task[];
  clients: Client[];
  responsibleList: RespOption[];
  onCreate: (data: DeliverableFormData) => Promise<any>;
  onUpdate: (id: string, data: Partial<DeliverableFormData>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function DeliverablesTab({ collaborator, color, isTeamView, deliverables, priorities, tasks, clients, responsibleList, onCreate, onUpdate, onDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Deliverable | null>(null);
  const [showDone, setShowDone] = useState(true);
  const { ratings, rate, removeRating, currentUser } = useDeliverableRatings();

  const ratingsByDeliv = useMemo(() => {
    const map = new Map<string, typeof ratings>();
    ratings.forEach(r => {
      const arr = map.get(r.deliverable_id) || [];
      arr.push(r);
      map.set(r.deliverable_id, arr);
    });
    return map;
  }, [ratings]);

  const priorityMap = useMemo(() => new Map(priorities.map(p => [p.id, p])), [priorities]);
  const taskMap = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks]);
  const clientById = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  // Infer a "primary client" for a deliverable via its linked items
  const clientForDeliverable = (d: Deliverable): Client | undefined => {
    for (const it of d.items) {
      if (it.item_type === 'task') {
        const t = taskMap.get(it.item_id);
        if (t?.client_id) return clientById.get(t.client_id);
      } else {
        const p = priorityMap.get(it.item_id);
        if (p?.client_id) return clientById.get(p.client_id);
      }
    }
    return undefined;
  };

  const filtered = useMemo(() => {
    let list = deliverables.filter(d => isTeamView ? true : assigneeMatches(d.assigned_to, collaborator));
    if (!showDone) list = list.filter(d => d.status !== 'concluido' && d.status !== 'cancelado');
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [deliverables, collaborator, isTeamView, showDone]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const done = filtered.filter(d => d.status === 'concluido').length;
    const pending = filtered.filter(d => d.status !== 'concluido' && d.status !== 'cancelado').length;
    const myRatings = filtered.flatMap(d => ratingsByDeliv.get(d.id) || []);
    const summary = summarizeRatings(myRatings);
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pending, pct, ...summary };
  }, [filtered, ratingsByDeliv]);

  const computeProgress = (d: Deliverable) => {
    if (d.items.length === 0) return { done: 0, total: 0, pct: 0 };
    let done = 0;
    d.items.forEach(it => {
      if (it.item_type === 'task') { const t = taskMap.get(it.item_id); if (t?.completed) done++; }
      else { const p = priorityMap.get(it.item_id); if (p?.status === 'concluida') done++; }
    });
    return { done, total: d.items.length, pct: Math.round((done / d.items.length) * 100) };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">Entregáveis agrupam prioridades e tarefas. Avaliação libera após conclusão.</p>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            <input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} />
            incluir concluídos
          </label>
          <Button onClick={() => { setEditing(null); setModalOpen(true); }} size="sm" style={{ backgroundColor: color }}>
            <Plus className="w-4 h-4 mr-1" /> Novo entregável
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
        <KpiCard label="Total" value={kpis.total} icon={Package} color={color} />
        <KpiCard label="Concluídos" value={kpis.done} icon={CheckCircle2} variant="success" />
        <KpiCard label="Pendentes" value={kpis.pending} icon={Clock} />
        <KpiCard label="% Conclusão" value={`${kpis.pct}%`} icon={Percent} color={color} />
        <KpiCard label="Joinhas" value={kpis.thumbs} icon={ThumbsUp} />
        <KpiCard label="Estrelas" value={kpis.stars} icon={Star} />
        <KpiCard label="Super" value={kpis.superstars} icon={Sparkles} />
        <KpiCard label="Pontos" value={kpis.score} icon={Trophy} variant="success" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card/60 p-8 text-center text-sm text-muted-foreground">
          Nenhum entregável.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(d => {
            const cfg = DELIVERABLE_STATUS_CONFIG[d.status];
            const prog = computeProgress(d);
            const client = clientForDeliverable(d);
            const ratingDisabled = d.status !== 'concluido';
            const done = d.status === 'concluido' || d.status === 'cancelado';
            return (
              <div key={d.id} className={cn('rounded-xl border bg-card p-4 hover:shadow-md transition-shadow', done && 'opacity-80')}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {client && <ClientCell client={client} size={22} compact />}
                      {client && <span className="text-xs text-muted-foreground truncate">{client.name}</span>}
                    </div>
                    <h4 className="font-semibold text-base break-words">{d.name}</h4>
                    {d.description && <p className="text-xs text-muted-foreground mt-0.5 break-words line-clamp-2">{d.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button className="p-1 rounded hover:bg-muted" onClick={() => { setEditing(d); setModalOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 rounded hover:bg-muted text-destructive" onClick={() => { if (confirm('Excluir entregável?')) onDelete(d.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2 items-center">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded font-medium', cfg.bgClass, cfg.textClass)}>{cfg.label}</span>
                  {d.due_date && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-muted text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />{format(new Date(d.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  )}
                  {d.assigned_to?.length > 0 && (
                    <div className="flex -space-x-1.5 ml-auto">
                      {d.assigned_to.slice(0, 4).map(a => <CollaboratorAvatar key={a} name={a} size={20} ring />)}
                    </div>
                  )}
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span>Progresso</span>
                    <span className="font-semibold">{prog.done}/{prog.total} · {prog.pct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${prog.pct}%`, backgroundColor: cfg.color }} />
                  </div>
                </div>

                {d.items.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground">Itens ({d.items.length})</summary>
                    <div className="mt-2 space-y-1">
                      {d.items.map(it => {
                        if (it.item_type === 'priority') {
                          const p = priorityMap.get(it.item_id); if (!p) return null;
                          const c = p.client_id ? clientById.get(p.client_id) : null;
                          return (
                            <div key={it.id} className="flex items-center gap-2 text-xs p-1.5 rounded bg-red-50/50">
                              <Star className="w-3 h-3 text-red-600 shrink-0" />
                              <span className="break-words flex-1">{p.title}</span>
                              {c && <ClientCell client={c} size={18} compact />}
                            </div>
                          );
                        } else {
                          const t = taskMap.get(it.item_id); if (!t) return null;
                          const c = clientById.get(t.client_id);
                          return (
                            <div key={it.id} className="flex items-center gap-2 text-xs p-1.5 rounded bg-sky-50/50">
                              <CheckSquare className="w-3 h-3 text-sky-600 shrink-0" />
                              <span className={cn('break-words flex-1', t.completed && 'line-through')}>{t.title}</span>
                              {c && <ClientCell client={c} size={18} compact />}
                            </div>
                          );
                        }
                      })}
                    </div>
                  </details>
                )}

                <DeliverableRatingControl
                  deliverableId={d.id}
                  ratings={ratingsByDeliv.get(d.id) || []}
                  currentUser={currentUser}
                  disabled={ratingDisabled}
                  onRate={rate}
                  onRemove={removeRating}
                />
              </div>
            );
          })}
        </div>
      )}

      <DeliverableModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        defaultAssignee={isTeamView ? undefined : collaborator}
        priorities={priorities}
        tasks={tasks}
        clients={clients}
        responsibleList={responsibleList}
        onSubmit={async (data) => {
          if (editing) await onUpdate(editing.id, data);
          else await onCreate(data);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
