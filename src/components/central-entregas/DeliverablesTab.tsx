import { useMemo, useState } from 'react';
import { endOfWeek, format, isSameWeek, startOfWeek, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarCheck2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Link2,
  Package,
  Pencil,
  Plus,
  Sparkles,
  Star,
  ThumbsUp,
  Trash2,
  Trophy,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientCell } from './ClientCell';
import { CollaboratorAvatar } from './CollaboratorAvatar';
import { DeliverableModal } from './DeliverableModal';
import { DeliverableRatingControl } from './DeliverableRating';
import { KpiCard } from './KpiCard';
import { useDeliverableRatings, summarizeRatings } from '@/hooks/useDeliverableRatings';
import { assigneeMatches, normalizeAssignee } from '@/lib/taskAssignee';
import { cn } from '@/lib/utils';
import { Client } from '@/types/client';
import { Deliverable, DeliverableFormData } from '@/types/deliverable';
import { Priority } from '@/types/priority';
import { Task } from '@/types/task';

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
  onCreate: (data: DeliverableFormData) => Promise<unknown>;
  onUpdate: (id: string, data: Partial<DeliverableFormData>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

type RatingFilter = 'thumbs' | 'star' | 'superstar';

interface CollaboratorGroup {
  name: string;
  deliveries: Deliverable[];
}

interface WeekGroup {
  key: string;
  start: Date;
  end: Date;
  deliveries: Deliverable[];
  collaborators: CollaboratorGroup[];
}

const deliveryDate = (deliverable: Deliverable) =>
  new Date(deliverable.completed_at || deliverable.updated_at || deliverable.created_at);

export function DeliverablesTab({
  collaborator,
  color,
  isTeamView,
  deliverables,
  priorities,
  tasks,
  clients,
  responsibleList,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Deliverable | null>(null);
  const [ratingFilter, setRatingFilter] = useState<Set<RatingFilter>>(new Set());
  const [noRatingAtAll, setNoRatingAtAll] = useState(false);
  const [notRatedByMe, setNotRatedByMe] = useState(false);
  const [requesterFilter, setRequesterFilter] = useState<Set<string>>(new Set());
  const [weekExpansion, setWeekExpansion] = useState<Record<string, boolean>>({});
  const { ratings, rate, removeRating, currentUser } = useDeliverableRatings();

  const ratingsByDeliverable = useMemo(() => {
    const result = new Map<string, typeof ratings>();
    ratings.forEach(rating => {
      const current = result.get(rating.deliverable_id) || [];
      current.push(rating);
      result.set(rating.deliverable_id, current);
    });
    return result;
  }, [ratings]);

  const priorityById = useMemo(() => new Map(priorities.map(priority => [priority.id, priority])), [priorities]);
  const taskById = useMemo(() => new Map(tasks.map(task => [task.id, task])), [tasks]);
  const clientById = useMemo(() => new Map(clients.map(client => [client.id, client])), [clients]);

  const clientForDeliverable = (deliverable: Deliverable): Client | undefined => {
    if (deliverable.client_id) return clientById.get(deliverable.client_id);

    for (const item of deliverable.items) {
      const clientId = item.item_type === 'task'
        ? taskById.get(item.item_id)?.client_id
        : priorityById.get(item.item_id)?.client_id;
      if (clientId) return clientById.get(clientId);
    }
    return undefined;
  };

  const availableRequesters = useMemo(() => {
    const names = new Set<string>();
    deliverables.forEach(deliverable => {
      if (deliverable.requester) names.add(deliverable.requester);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [deliverables]);

  const filtered = useMemo(() => {
    let list = deliverables.filter(deliverable =>
      isTeamView || assigneeMatches(deliverable.assigned_to, collaborator));

    if (requesterFilter.size > 0) {
      list = list.filter(deliverable =>
        Boolean(deliverable.requester && requesterFilter.has(deliverable.requester)));
    }

    if (ratingFilter.size > 0) {
      list = list.filter(deliverable =>
        (ratingsByDeliverable.get(deliverable.id) || [])
          .some(rating => ratingFilter.has(rating.rating_type as RatingFilter)));
    }

    if (noRatingAtAll) {
      list = list.filter(deliverable => (ratingsByDeliverable.get(deliverable.id) || []).length === 0);
    }

    if (notRatedByMe) {
      list = list.filter(deliverable =>
        !(ratingsByDeliverable.get(deliverable.id) || [])
          .some(rating => rating.rater_name.toLowerCase() === currentUser.toLowerCase()));
    }

    return [...list].sort((a, b) => deliveryDate(b).getTime() - deliveryDate(a).getTime());
  }, [collaborator, currentUser, deliverables, isTeamView, noRatingAtAll, notRatedByMe, ratingFilter, ratingsByDeliverable, requesterFilter]);

  const weekGroups = useMemo<WeekGroup[]>(() => {
    const weeks = new Map<string, { start: Date; end: Date; deliveries: Deliverable[] }>();

    filtered.forEach(deliverable => {
      const deliveredAt = deliveryDate(deliverable);
      const weekStart = startOfWeek(deliveredAt, { weekStartsOn: 1 });
      const key = format(weekStart, 'yyyy-MM-dd');
      const current = weeks.get(key) || {
        start: weekStart,
        end: endOfWeek(deliveredAt, { weekStartsOn: 1 }),
        deliveries: [],
      };
      current.deliveries.push(deliverable);
      weeks.set(key, current);
    });

    return Array.from(weeks.entries())
      .map(([key, week]) => {
        const byCollaborator = new Map<string, Deliverable[]>();
        week.deliveries.forEach(deliverable => {
          const assignees = isTeamView
            ? deliverable.assigned_to.length > 0 ? deliverable.assigned_to : ['Sem responsável']
            : [collaborator];
          const groupNames = new Set(assignees.map(assignee =>
            responsibleList.find(responsible =>
              normalizeAssignee(responsible.name) === normalizeAssignee(assignee))?.name || assignee));
          groupNames.forEach(groupName => {
            const current = byCollaborator.get(groupName) || [];
            current.push(deliverable);
            byCollaborator.set(groupName, current);
          });
        });

        const collaborators = Array.from(byCollaborator.entries())
          .map(([name, deliveriesForCollaborator]) => ({ name, deliveries: deliveriesForCollaborator }))
          .sort((a, b) => a.name.localeCompare(b.name));

        return { key, ...week, collaborators };
      })
      .sort((a, b) => b.start.getTime() - a.start.getTime());
  }, [collaborator, filtered, isTeamView, responsibleList]);

  const kpis = useMemo(() => {
    const now = new Date();
    const previousWeek = subWeeks(now, 1);
    const thisWeek = filtered.filter(deliverable => isSameWeek(deliveryDate(deliverable), now, { weekStartsOn: 1 })).length;
    const lastWeek = filtered.filter(deliverable => isSameWeek(deliveryDate(deliverable), previousWeek, { weekStartsOn: 1 })).length;
    const collaborators = new Set(
      filtered.flatMap(deliverable => deliverable.assigned_to.map(normalizeAssignee)),
    ).size;
    const summary = summarizeRatings(filtered.flatMap(deliverable => ratingsByDeliverable.get(deliverable.id) || []));
    return { total: filtered.length, thisWeek, lastWeek, collaborators, ...summary };
  }, [filtered, ratingsByDeliverable]);

  const requesterColor = (name: string) =>
    responsibleList.find(responsible => normalizeAssignee(responsible.name) === normalizeAssignee(name))?.color;

  const toggle = <T,>(current: Set<T>, update: (value: Set<T>) => void, value: T) => {
    const next = new Set(current);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    update(next);
  };

  const anyFilterActive = ratingFilter.size > 0 || noRatingAtAll || notRatedByMe || requesterFilter.size > 0;

  const clearFilters = () => {
    setRatingFilter(new Set());
    setNoRatingAtAll(false);
    setNotRatedByMe(false);
    setRequesterFilter(new Set());
  };

  const chip = (active: boolean, onClick: () => void, label: React.ReactNode, tone: string) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-[11px] font-medium transition',
        active ? 'text-white shadow-sm' : 'bg-background text-muted-foreground hover:bg-muted',
      )}
      style={active ? { backgroundColor: tone, borderColor: tone } : {}}
    >
      {label}
    </button>
  );

  const weekTitle = (week: WeekGroup) => {
    const currentWeek = isSameWeek(week.start, new Date(), { weekStartsOn: 1 });
    const prefix = currentWeek ? 'Semana atual' : `Semana de ${format(week.start, "dd 'de' MMMM", { locale: ptBR })}`;
    return `${prefix} · ${format(week.start, 'dd/MM')} a ${format(week.end, 'dd/MM')}`;
  };

  const edit = (deliverable: Deliverable) => {
    setEditing(deliverable);
    setModalOpen(true);
  };

  const remove = (deliverable: Deliverable) => {
    if (confirm(`Excluir a entrega "${deliverable.name}"?`)) onDelete(deliverable.id);
  };

  const toggleWeek = (weekKey: string, currentlyExpanded: boolean) => {
    setWeekExpansion(current => ({ ...current, [weekKey]: !currentlyExpanded }));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Entregas concluídas por semana e colaborador. Prioridades concluídas entram automaticamente.
        </p>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} size="sm" style={{ backgroundColor: color }}>
          <Plus className="mr-1 h-4 w-4" /> Registrar entrega
        </Button>
      </div>

      <div className="space-y-2 rounded-md border bg-card/60 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 text-[10px] font-semibold uppercase text-muted-foreground">Avaliação</span>
          {chip(ratingFilter.has('thumbs'), () => toggle(ratingFilter, setRatingFilter, 'thumbs'), <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />Joinha</span>, '#10B981')}
          {chip(ratingFilter.has('star'), () => toggle(ratingFilter, setRatingFilter, 'star'), <span className="flex items-center gap-1"><Star className="h-3 w-3" />Estrela</span>, '#F59E0B')}
          {chip(ratingFilter.has('superstar'), () => toggle(ratingFilter, setRatingFilter, 'superstar'), <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" />Super</span>, '#F97316')}
          <span className="mx-1 h-4 w-px bg-border" />
          {chip(noRatingAtAll, () => setNoRatingAtAll(value => !value), 'Sem avaliação', '#64748B')}
          {chip(notRatedByMe, () => setNotRatedByMe(value => !value), 'Não avaliei', '#0EA5E9')}
        </div>

        {availableRequesters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-[10px] font-semibold uppercase text-muted-foreground">Solicitante</span>
            {availableRequesters.map(name => chip(
              requesterFilter.has(name),
              () => toggle(requesterFilter, setRequesterFilter, name),
              name,
              requesterColor(name) || '#64748B',
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-dashed pt-2">
          <span className="text-[11px] text-muted-foreground">{filtered.length} entrega(s) em {weekGroups.length} semana(s)</span>
          {anyFilterActive && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
        <KpiCard label="Entregas" value={kpis.total} icon={Package} color={color} />
        <KpiCard label="Esta semana" value={kpis.thisWeek} icon={CalendarCheck2} variant="success" />
        <KpiCard label="Semana anterior" value={kpis.lastWeek} icon={CalendarDays} />
        <KpiCard label="Colaboradores" value={kpis.collaborators} icon={Users} />
        <KpiCard label="Joinhas" value={kpis.thumbs} icon={ThumbsUp} />
        <KpiCard label="Estrelas" value={kpis.stars} icon={Star} />
        <KpiCard label="Pontos" value={kpis.score} icon={Trophy} variant="success" />
      </div>

      {weekGroups.length === 0 ? (
        <div className="rounded-md border bg-card/60 p-8 text-center text-sm text-muted-foreground">
          Nenhuma entrega encontrada.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border bg-card">
          <div className="hidden grid-cols-[minmax(140px,1fr)_minmax(240px,2.2fr)_minmax(130px,1fr)_100px_minmax(180px,1.2fr)_64px] gap-3 border-b bg-muted/80 px-3 py-2 text-[10px] font-semibold uppercase text-muted-foreground lg:grid">
            <span>Cliente</span>
            <span>Entrega</span>
            <span>Responsáveis</span>
            <span>Data</span>
            <span>Avaliação</span>
            <span className="text-right">Ações</span>
          </div>

          {weekGroups.map((week, index) => {
            const expanded = weekExpansion[week.key] ?? (!isTeamView || index === 0);
            return (
              <section key={week.key}>
              <button
                type="button"
                onClick={() => toggleWeek(week.key, expanded)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between border-b border-t bg-emerald-50/70 px-3 py-2 text-left first:border-t-0 hover:bg-emerald-50"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <CalendarDays className="h-4 w-4" />
                  {weekTitle(week)}
                </div>
                <span className="text-xs font-medium text-emerald-700">{week.deliveries.length} entrega(s)</span>
              </button>

              {expanded && week.collaborators.map(group => (
                <div key={`${week.key}-${group.name}`}>
                  <div className="flex items-center justify-between border-b bg-muted/25 px-3 py-2">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      {group.name === 'Sem responsável'
                        ? <span className="grid h-6 w-6 place-items-center rounded-full border text-muted-foreground">?</span>
                        : <CollaboratorAvatar name={group.name} size={24} ring />}
                      {group.name}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{group.deliveries.length} entrega(s)</span>
                  </div>

                  {group.deliveries.map(deliverable => {
                    const client = clientForDeliverable(deliverable);
                    const deliveredAt = deliveryDate(deliverable);
                    const deliveryRatings = ratingsByDeliverable.get(deliverable.id) || [];
                    return (
                      <div key={deliverable.id} className="border-b last:border-b-0 hover:bg-muted/20">
                        <div className="hidden grid-cols-[minmax(140px,1fr)_minmax(240px,2.2fr)_minmax(130px,1fr)_100px_minmax(180px,1.2fr)_64px] items-center gap-3 px-3 py-2.5 lg:grid">
                          <ClientCell client={client} fallbackName={client ? undefined : 'Sem cliente'} size={28} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-medium">{deliverable.name}</span>
                              <span className={cn(
                                'shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase',
                                deliverable.source_priority_id ? 'bg-violet-50 text-violet-700' : 'bg-sky-50 text-sky-700',
                              )}>
                                {deliverable.source_priority_id ? 'Prioridade' : 'Manual'}
                              </span>
                            </div>
                            {deliverable.description && <p className="truncate text-[11px] text-muted-foreground">{deliverable.description}</p>}
                            {deliverable.requester && (
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <UserPlus className="h-3 w-3" /> Solicitado por {deliverable.requester}
                              </span>
                            )}
                          </div>
                          <div className="flex -space-x-1.5">
                            {deliverable.assigned_to.length > 0
                              ? deliverable.assigned_to.slice(0, 4).map(name => <CollaboratorAvatar key={name} name={name} size={24} ring />)
                              : <span className="text-xs text-muted-foreground">Sem responsável</span>}
                          </div>
                          <div className="text-xs font-medium">
                            {format(deliveredAt, 'dd/MM/yyyy')}
                          </div>
                          <DeliverableRatingControl
                            compact
                            deliverableId={deliverable.id}
                            ratings={deliveryRatings}
                            currentUser={currentUser}
                            onRate={rate}
                            onRemove={removeRating}
                          />
                          <div className="flex justify-end gap-1">
                            {!deliverable.source_priority_id && (
                              <>
                                <button className="grid h-8 w-8 place-items-center rounded hover:bg-muted" onClick={() => edit(deliverable)} title="Editar entrega">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button className="grid h-8 w-8 place-items-center rounded text-destructive hover:bg-destructive/10" onClick={() => remove(deliverable)} title="Excluir entrega">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 px-3 py-3 lg:hidden">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <ClientCell client={client} fallbackName={client ? undefined : 'Sem cliente'} size={24} />
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="text-sm font-medium">{deliverable.name}</span>
                                {deliverable.source_priority_id && <Link2 className="h-3 w-3 shrink-0 text-violet-600" />}
                              </div>
                            </div>
                            <span className="shrink-0 text-xs font-medium">{format(deliveredAt, 'dd/MM/yyyy')}</span>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex -space-x-1">
                              {deliverable.assigned_to.map(name => <CollaboratorAvatar key={name} name={name} size={22} ring />)}
                            </div>
                            <div className="flex items-center gap-1">
                              {!deliverable.source_priority_id && (
                                <>
                                  <button className="grid h-8 w-8 place-items-center rounded hover:bg-muted" onClick={() => edit(deliverable)} title="Editar entrega">
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button className="grid h-8 w-8 place-items-center rounded text-destructive hover:bg-destructive/10" onClick={() => remove(deliverable)} title="Excluir entrega">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <DeliverableRatingControl
                            compact
                            deliverableId={deliverable.id}
                            ratings={deliveryRatings}
                            currentUser={currentUser}
                            onRate={rate}
                            onRemove={removeRating}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              </section>
            );
          })}
        </div>
      )}

      <DeliverableModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        defaultAssignee={isTeamView ? undefined : collaborator}
        clients={clients}
        responsibleList={responsibleList}
        onSubmit={async data => {
          const saved = editing ? await onUpdate(editing.id, data) : await onCreate(data);
          if (saved) setModalOpen(false);
        }}
      />
    </div>
  );
}
