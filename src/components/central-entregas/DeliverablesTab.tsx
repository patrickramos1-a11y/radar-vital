import { useMemo, useState } from 'react';
import { format, isSameWeek, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Link2,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientCell } from './ClientCell';
import { CollaboratorAvatar } from './CollaboratorAvatar';
import { DeliverableModal } from './DeliverableModal';
import { DeliverableRatingControl } from './DeliverableRating';
import { useDeliverableRatings, summarizeRatings } from '@/hooks/useDeliverableRatings';
import { assigneeMatches, normalizeAssignee } from '@/lib/taskAssignee';
import { deliveryDate, groupDeliverablesByWeek, type WeekGroup } from '@/lib/deliverableWeekGroups';
import { partitionDeliverablesByReview, pendingDeliverablesInReviewRound } from '@/lib/deliverableReview';
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

type ReviewView = 'pending' | 'reviewed' | 'all';

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
  const [reviewView, setReviewView] = useState<ReviewView>('pending');
  const [requesterFilter, setRequesterFilter] = useState('');
  const [weekExpansion, setWeekExpansion] = useState<Record<string, boolean>>({});
  const [reviewedInCurrentRound, setReviewedInCurrentRound] = useState<Set<string>>(() => new Set());
  const { ratings, isLoading: ratingsLoading, error: ratingsError, rate, removeRating, currentUser, refetch: refetchRatings } = useDeliverableRatings();

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

  const scopedDeliverables = useMemo(() => {
    let list = deliverables.filter(deliverable =>
      isTeamView || assigneeMatches(deliverable.assigned_to, collaborator));

    if (requesterFilter) {
      list = list.filter(deliverable =>
        deliverable.requester === requesterFilter);
    }

    return [...list].sort((a, b) => deliveryDate(b).getTime() - deliveryDate(a).getTime());
  }, [collaborator, deliverables, isTeamView, requesterFilter]);

  const { reviewed } = useMemo(
    () => partitionDeliverablesByReview(scopedDeliverables, ratingsByDeliverable),
    [scopedDeliverables, ratingsByDeliverable],
  );

  const pending = useMemo(() => {
    return pendingDeliverablesInReviewRound(scopedDeliverables, ratingsByDeliverable, reviewedInCurrentRound);
  }, [ratingsByDeliverable, reviewedInCurrentRound, scopedDeliverables]);

  const visibleDeliverables = reviewView === 'pending' ? pending : reviewView === 'reviewed' ? reviewed : scopedDeliverables;

  const weekGroups = useMemo(
    () => groupDeliverablesByWeek(visibleDeliverables, collaborator, isTeamView, responsibleList),
    [collaborator, visibleDeliverables, isTeamView, responsibleList],
  );

  const thisWeekPending = pending.filter(deliverable =>
    isSameWeek(deliveryDate(deliverable), new Date(), { weekStartsOn: 1 })).length;

  const overview = useMemo(() => {
    const now = new Date();
    const previousWeek = subWeeks(now, 1);
    return {
      thisWeek: visibleDeliverables.filter(deliverable => isSameWeek(deliveryDate(deliverable), now, { weekStartsOn: 1 })).length,
      lastWeek: visibleDeliverables.filter(deliverable => isSameWeek(deliveryDate(deliverable), previousWeek, { weekStartsOn: 1 })).length,
      collaborators: new Set(visibleDeliverables.flatMap(deliverable => deliverable.assigned_to.map(normalizeAssignee))).size,
      ...summarizeRatings(visibleDeliverables.flatMap(deliverable => ratingsByDeliverable.get(deliverable.id) || [])),
    };
  }, [visibleDeliverables, ratingsByDeliverable]);

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

  const rateInCurrentRound = async (deliverableId: string, type: Parameters<typeof rate>[1], value: number) => {
    setReviewedInCurrentRound(current => new Set(current).add(deliverableId));
    const saved = await rate(deliverableId, type, value);
    if (!saved) {
      setReviewedInCurrentRound(current => {
        const next = new Set(current);
        next.delete(deliverableId);
        return next;
      });
    }
    return saved;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <div role="tablist" aria-label="Avaliação dos entregáveis" className="inline-flex max-w-full flex-wrap gap-1 rounded-md bg-muted p-1">
          {([
            { value: 'pending', label: 'A avaliar', count: pending.length },
            { value: 'reviewed', label: 'Avaliados', count: reviewed.length },
            { value: 'all', label: 'Todos', count: scopedDeliverables.length },
          ] as const).map(tab => (
            <button
              key={tab.value}
              id={`deliverables-tab-${tab.value}`}
              type="button"
              role="tab"
              aria-selected={reviewView === tab.value}
              aria-controls="deliverables-review-panel"
              onClick={() => setReviewView(tab.value)}
              className={cn(
                'min-h-8 rounded px-3 text-xs font-medium transition-colors',
                reviewView === tab.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label} <span className="ml-1 tabular-nums text-[11px]">{ratingsLoading || ratingsError ? '...' : tab.count}</span>
            </button>
          ))}
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} size="sm" style={{ backgroundColor: color }}>
          <Plus className="mr-1 h-4 w-4" /> Registrar entrega
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>{ratingsLoading ? 'Carregando avaliações...' : ratingsError ? 'Avaliações indisponíveis' : `${visibleDeliverables.length} entrega(s) em ${weekGroups.length} semana(s)`}</span>
          {!ratingsLoading && !ratingsError && <span>{thisWeekPending} a avaliar nesta semana</span>}
        </div>
        {availableRequesters.length > 0 && (
          <select
            aria-label="Filtrar por solicitante"
            value={requesterFilter}
            onChange={event => setRequesterFilter(event.target.value)}
            className="h-8 max-w-full rounded border bg-background px-2 text-xs text-foreground"
          >
            <option value="">Todos os solicitantes</option>
            {availableRequesters.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        )}
      </div>

      {!ratingsLoading && !ratingsError && reviewView !== 'pending' && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-y py-2 text-xs text-muted-foreground">
          <span>Esta semana <strong className="text-foreground">{overview.thisWeek}</strong></span>
          <span>Semana anterior <strong className="text-foreground">{overview.lastWeek}</strong></span>
          <span>Colaboradores <strong className="text-foreground">{overview.collaborators}</strong></span>
          <span>Joinhas <strong className="text-foreground">{overview.thumbs}</strong></span>
          <span>Estrelas <strong className="text-foreground">{overview.stars}</strong></span>
          <span>Pontos <strong className="text-foreground">{overview.score}</strong></span>
        </div>
      )}

      <div id="deliverables-review-panel" role="tabpanel" aria-labelledby={`deliverables-tab-${reviewView}`}>
        {ratingsLoading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Carregando avaliações...</div>
      ) : ratingsError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground">
          <span>Não foi possível carregar as avaliações.</span>
          <Button type="button" size="sm" variant="outline" onClick={refetchRatings}>Tentar novamente</Button>
        </div>
      ) : weekGroups.length === 0 ? (
        <div className="rounded-md border bg-card/60 p-8 text-center text-sm text-muted-foreground">
          {reviewView === 'pending' ? 'Nenhuma entrega aguardando avaliação.' : reviewView === 'reviewed' ? 'Nenhuma entrega avaliada.' : 'Nenhuma entrega encontrada.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border bg-card">
          <div className="hidden grid-cols-[minmax(120px,1fr)_minmax(220px,2.2fr)_minmax(100px,.8fr)_84px_228px_64px] gap-3 border-b bg-muted/80 px-3 py-2 text-[10px] font-semibold uppercase text-muted-foreground lg:grid">
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
                        <div className="hidden grid-cols-[minmax(120px,1fr)_minmax(220px,2.2fr)_minmax(100px,.8fr)_84px_228px_64px] items-center gap-3 px-3 py-2.5 lg:grid">
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
                            onRate={rateInCurrentRound}
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
                            onRate={rateInCurrentRound}
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
      </div>

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
