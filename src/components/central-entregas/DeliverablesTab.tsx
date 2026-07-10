import { useState, useMemo } from 'react';
import { Deliverable, DeliverableFormData, DELIVERABLE_STATUS_CONFIG, DeliverableStatus } from '@/types/deliverable';
import { Priority } from '@/types/priority';
import { Task } from '@/types/task';
import { Client } from '@/types/client';
import { assigneeMatches } from '@/lib/taskAssignee';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Calendar as CalendarIcon, Star, CheckSquare, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DeliverableModal } from './DeliverableModal';
import { useDeliverableRatings, ratingScore } from '@/hooks/useDeliverableRatings';
import { DeliverableRatingControl } from './DeliverableRating';

interface RespOption { name: string; color: string; initials: string; }

interface Props {
  collaborator: string;
  color: string;
  deliverables: Deliverable[];
  priorities: Priority[];
  tasks: Task[];
  clients: Client[];
  responsibleList: RespOption[];
  onCreate: (data: DeliverableFormData) => Promise<any>;
  onUpdate: (id: string, data: Partial<DeliverableFormData>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function DeliverablesTab({ collaborator, color, deliverables, priorities, tasks, clients, responsibleList, onCreate, onUpdate, onDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Deliverable | null>(null);
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

  // Leaderboard: aggregate rating scores by assignee (from all deliverables)
  const leaderboard = useMemo(() => {
    const totals = new Map<string, number>();
    deliverables.forEach(d => {
      const rs = ratingsByDeliv.get(d.id) || [];
      const score = rs.reduce((s, r) => s + ratingScore(r), 0);
      if (score === 0) return;
      const assignees = (d.assigned_to && d.assigned_to.length > 0) ? d.assigned_to : [];
      // Split score across assignees so a shared deliverable rewards everyone equally
      const per = assignees.length > 0 ? score / assignees.length : 0;
      assignees.forEach(a => totals.set(a, (totals.get(a) || 0) + per));
    });
    return Array.from(totals.entries())
      .map(([name, score]) => ({ name, score: Math.round(score * 10) / 10 }))
      .sort((a, b) => b.score - a.score);
  }, [deliverables, ratingsByDeliv]);

  const priorityMap = useMemo(() => new Map(priorities.map(p => [p.id, p])), [priorities]);
  const taskMap = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks]);
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

  const filtered = useMemo(() => {
    return deliverables.filter(d => assigneeMatches(d.assigned_to, collaborator));
  }, [deliverables, collaborator]);

  const computeProgress = (d: Deliverable) => {
    if (d.items.length === 0) return { done: 0, total: 0, pct: 0 };
    let done = 0;
    d.items.forEach(it => {
      if (it.item_type === 'task') {
        const t = taskMap.get(it.item_id);
        if (t?.completed) done++;
      } else {
        const p = priorityMap.get(it.item_id);
        if (p?.status === 'concluida') done++;
      }
    });
    return { done, total: d.items.length, pct: Math.round((done / d.items.length) * 100) };
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-muted-foreground">Entregáveis agrupam prioridades e tarefas que precisam ser finalizadas até uma data ou reunião.</p>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} size="sm" style={{ backgroundColor: color }}>
          <Plus className="w-4 h-4 mr-1" /> Novo entregável
        </Button>
      </div>

      {leaderboard.length > 0 && (
        <div className="rounded-xl border bg-gradient-to-r from-amber-50 via-white to-amber-50/40 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">Ranking de Estrelas</h3>
            <span className="text-[10px] text-muted-foreground">joinha = 1 · estrela = 1-5 · super estrela = 10</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {leaderboard.map((row, idx) => (
              <div
                key={row.name}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs',
                  idx === 0 ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold' :
                  idx === 1 ? 'bg-slate-100 border-slate-300 text-slate-800' :
                  idx === 2 ? 'bg-orange-100 border-orange-300 text-orange-900' :
                  'bg-white border-border text-muted-foreground'
                )}
              >
                <span className="font-bold">{idx + 1}º</span>
                <span>{row.name}</span>
                <span className="flex items-center gap-0.5 font-semibold text-amber-700">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {row.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}


      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card/60 p-8 text-center text-sm text-muted-foreground">
          Nenhum entregável para {collaborator}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(d => {
            const cfg = DELIVERABLE_STATUS_CONFIG[d.status];
            const prog = computeProgress(d);
            return (
              <div key={d.id} className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
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

                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded font-medium', cfg.bgClass, cfg.textClass)}>{cfg.label}</span>
                  {d.due_date && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-muted text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {format(new Date(d.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
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
                    <summary className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground">Itens vinculados ({d.items.length})</summary>
                    <div className="mt-2 space-y-1">
                      {d.items.map(it => {
                        if (it.item_type === 'priority') {
                          const p = priorityMap.get(it.item_id);
                          if (!p) return null;
                          const clientName = p.client_id ? clientMap.get(p.client_id) : null;
                          return (
                            <div key={it.id} className="flex items-center gap-2 text-xs p-1.5 rounded bg-red-50/50">
                              <Star className="w-3 h-3 text-red-600 shrink-0" />
                              <span className="break-words">{p.title}</span>
                              {clientName && <span className="text-muted-foreground ml-auto">{clientName}</span>}
                            </div>
                          );
                        } else {
                          const t = taskMap.get(it.item_id);
                          if (!t) return null;
                          const clientName = clientMap.get(t.client_id);
                          return (
                            <div key={it.id} className="flex items-center gap-2 text-xs p-1.5 rounded bg-sky-50/50">
                              <CheckSquare className="w-3 h-3 text-sky-600 shrink-0" />
                              <span className={cn('break-words', t.completed && 'line-through')}>{t.title}</span>
                              {clientName && <span className="text-muted-foreground ml-auto">{clientName}</span>}
                            </div>
                          );
                        }
                      })}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DeliverableModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        defaultAssignee={collaborator}
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
