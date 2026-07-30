import { useMemo, useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTasks } from '@/hooks/useTasks';
import { usePriorities } from '@/hooks/usePriorities';
import { useDeliverables } from '@/hooks/useDeliverables';
import { useCollaborators } from '@/hooks/useCollaborators';
import { useClients } from '@/contexts/ClientContext';
import { useDeliverableRatings, summarizeRatings } from '@/hooks/useDeliverableRatings';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TeamSelector, TEAM_VIEW } from '@/components/central-entregas/TeamSelector';
import { GlobalSummary } from '@/components/central-entregas/GlobalSummary';
import { CollaboratorPanel } from '@/components/central-entregas/CollaboratorPanel';
import { TeamOverview } from '@/components/central-entregas/TeamOverview';
import { PrioritiesTab } from '@/components/central-entregas/PrioritiesTab';
import { TasksTab } from '@/components/central-entregas/TasksTab';
import { CommentsTab } from '@/components/central-entregas/CommentsTab';
import { DeliverablesTab } from '@/components/central-entregas/DeliverablesTab';
import { HistoryTab } from '@/components/central-entregas/HistoryTab';
import { PerformanceTab } from '@/components/central-entregas/PerformanceTab';
import { assigneeMatches } from '@/lib/taskAssignee';
import { Star, CheckSquare, MessageSquare, Package, TrendingUp, Archive } from 'lucide-react';
import { startOfMonth } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { QuickCreatePanel } from '@/components/central-entregas/QuickCreatePanel';
import { filterClientsByScope, type ClientScope } from '@/lib/clientScope';


const DEFAULT_NAMES = ['Patrick', 'Celine', 'Gabi', 'Darley', 'Vanessa'];

export default function CentralEntregas() {
  const { collaborators } = useCollaborators();
  const { clients } = useClients();
  const tasksHook = useTasks();
  const prioritiesHook = usePriorities();
  const deliverablesHook = useDeliverables();
  const { ratings } = useDeliverableRatings();
  const [clientScope, setClientScope] = useState<ClientScope>('external');

  const responsibleList = useMemo(() => {
    const active = collaborators.filter(c => c.isActive);
    const map = new Map<string, { name: string; color: string; initials: string }>();
    DEFAULT_NAMES.forEach(n => {
      const found = active.find(c => c.name.toLowerCase().includes(n.toLowerCase()));
      map.set(n, {
        name: found?.name || n,
        color: found?.color || '#6B9B37',
        initials: found?.initials || n.slice(0, 2).toUpperCase(),
      });
    });
    active.forEach(c => {
      if (!Array.from(map.values()).some(v => v.name.toLowerCase() === c.name.toLowerCase())) {
        map.set(c.name, { name: c.name, color: c.color, initials: c.initials });
      }
    });
    return Array.from(map.values());
  }, [collaborators]);

  const [selected, setSelected] = useState<string>('Patrick');
  const isTeamView = selected === TEAM_VIEW;
  const selectedInfo = isTeamView
    ? { name: 'Equipe', color: 'hsl(var(--primary))', initials: 'EQ' }
    : (responsibleList.find(r => r.name.toLowerCase() === selected.toLowerCase()) || responsibleList[0]);

  const [comments, setComments] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('client_comments').select('*').order('created_at', { ascending: false });
      setComments(data || []);
    })();
    const ch = supabase.channel('ce_comments').on('postgres_changes', { event: '*', schema: 'public', table: 'client_comments' }, async () => {
      const { data } = await supabase.from('client_comments').select('*').order('created_at', { ascending: false });
      setComments(data || []);
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const scopedClients = useMemo(() => {
    return filterClientsByScope(clients, clientScope);
  }, [clientScope, clients]);

  const scopedClientIds = useMemo(
    () => new Set(scopedClients.map(client => client.id)),
    [scopedClients],
  );
  const universeClientIds = useMemo(
    () => new Set(
      clients
        .filter(client => client.clientType === 'UNIVERSO_RAMOS')
        .map(client => client.id),
    ),
    [clients],
  );

  const scopedTasks = useMemo(
    () => tasksHook.tasks.filter(task => {
      if (task.client_id) return scopedClientIds.has(task.client_id);
      return clientScope !== 'universe';
    }),
    [clientScope, scopedClientIds, tasksHook.tasks],
  );
  const scopedPriorities = useMemo(
    () => prioritiesHook.priorities.filter(priority => {
      if (priority.client_id) return scopedClientIds.has(priority.client_id);
      return clientScope !== 'universe';
    }),
    [clientScope, prioritiesHook.priorities, scopedClientIds],
  );
  const scopedComments = useMemo(
    () => comments.filter(comment => scopedClientIds.has(comment.client_id)),
    [comments, scopedClientIds],
  );
  const scopedDeliverables = useMemo(() => {
    if (clientScope === 'all') return deliverablesHook.deliverables;

    const taskById = new Map(
      tasksHook.tasks.map(task => [task.id, task]),
    );
    const priorityById = new Map(
      prioritiesHook.priorities.map(priority => [priority.id, priority]),
    );

    return deliverablesHook.deliverables.filter(deliverable => {
      const linkedClientIds = deliverable.items.flatMap(item => {
        if (item.item_type === 'task') {
          const clientId = taskById.get(item.item_id)?.client_id;
          return clientId ? [clientId] : [];
        }
        if (item.item_type === 'priority') {
          const clientId = priorityById.get(item.item_id)?.client_id;
          return clientId ? [clientId] : [];
        }
        return [];
      });
      const belongsToUniverse = linkedClientIds.some(clientId =>
        universeClientIds.has(clientId),
      );
      return clientScope === 'universe'
        ? belongsToUniverse
        : !belongsToUniverse;
    });
  }, [
    clientScope,
    deliverablesHook.deliverables,
    prioritiesHook.priorities,
    tasksHook.tasks,
    universeClientIds,
  ]);

  // Per-collaborator stats for chips
  const statsByName = useMemo(() => {
    const map = new Map<string, { openTasks: number; openPriorities: number; score: number }>();
    responsibleList.forEach(r => {
      const openTasks = scopedTasks.filter(t => !t.completed && assigneeMatches(t.assigned_to, r.name)).length;
      const openPriorities = scopedPriorities.filter(p => assigneeMatches(p.assigned_to, r.name) && p.status !== 'concluida' && p.status !== 'cancelada').length;
      let score = 0;
      scopedDeliverables.forEach(d => {
        if (!assigneeMatches(d.assigned_to, r.name)) return;
        const rs = ratings.filter(rr => rr.deliverable_id === d.id);
        if (rs.length === 0) return;
        const n = Math.max(1, d.assigned_to.length);
        score += summarizeRatings(rs).score / n;
      });
      map.set(r.name, { openTasks, openPriorities, score: Math.round(score * 10) / 10 });
    });
    return map;
  }, [responsibleList, scopedTasks, scopedPriorities, scopedDeliverables, ratings]);

  // Global summary
  const global = useMemo(() => {
    const totalOpenTasks = scopedTasks.filter(t => !t.completed).length;
    const totalOpenPriorities = scopedPriorities.filter(p => p.status !== 'concluida' && p.status !== 'cancelada').length;
    const monthStart = startOfMonth(new Date()).getTime();
    const deliverablesDoneMonth = scopedDeliverables.filter(d =>
      d.status === 'concluido' && d.completed_at && new Date(d.completed_at).getTime() >= monthStart
    ).length;
    const pendingComments = scopedComments.filter(c => !c.is_archived).length;

    // Top performer of the month = highest score in current month
    const scoresMonth = new Map<string, { score: number; stars: number }>();
    scopedDeliverables.forEach(d => {
      if (!d.completed_at || new Date(d.completed_at).getTime() < monthStart) return;
      const rs = ratings.filter(r => r.deliverable_id === d.id);
      if (rs.length === 0) return;
      const s = summarizeRatings(rs);
      const n = Math.max(1, d.assigned_to.length);
      d.assigned_to.forEach(a => {
        const cur = scoresMonth.get(a) || { score: 0, stars: 0 };
        cur.score += s.score / n;
        cur.stars += s.stars / n;
        scoresMonth.set(a, cur);
      });
    });
    const arr = Array.from(scoresMonth.entries()).map(([name, v]) => ({ name, score: Math.round(v.score * 10) / 10, stars: Math.round(v.stars) }));
    const topPerformer = arr.sort((a, b) => b.score - a.score)[0];
    const topStars = [...arr].sort((a, b) => b.stars - a.stars)[0];

    return {
      totalOpenTasks, totalOpenPriorities, deliverablesDoneMonth, pendingComments,
      topPerformer: topPerformer ? { name: topPerformer.name, value: topPerformer.score, sublabel: 'pontos no mês' } : undefined,
      topStars: topStars && topStars.stars > 0 ? { name: topStars.name, value: topStars.stars, sublabel: 'estrelas' } : undefined,
    };
  }, [scopedTasks, scopedPriorities, scopedDeliverables, scopedComments, ratings]);

  // Panel stats for selected collaborator
  const panelStats = useMemo(() => {
    if (isTeamView) return null;
    const name = selectedInfo.name;
    const myTasks = scopedTasks.filter(t => assigneeMatches(t.assigned_to, name));
    const myPri = scopedPriorities.filter(p => assigneeMatches(p.assigned_to, name));
    const myDeliv = scopedDeliverables.filter(d => assigneeMatches(d.assigned_to, name));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const readField = `read_${name.toLowerCase()}`;
    const clientsSet = new Set<string>();
    myTasks.forEach(t => t.client_id && clientsSet.add(t.client_id));
    myPri.forEach(p => p.client_id && clientsSet.add(p.client_id));
    return {
      clients: clientsSet.size,
      openTasks: myTasks.filter(t => !t.completed).length,
      openPriorities: myPri.filter(p => p.status !== 'concluida' && p.status !== 'cancelada').length,
      doneTasks: myTasks.filter(t => t.completed).length,
      deliverables: myDeliv.length,
      pendingComments: scopedComments.filter(c => !c.is_archived && !(c as any)[readField]).length,
      overdue:
        myTasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < today).length +
        myPri.filter(p => p.due_date && new Date(p.due_date) < today && p.status !== 'concluida' && p.status !== 'cancelada').length,
      score: statsByName.get(name)?.score || 0,
    };
  }, [isTeamView, selectedInfo, scopedTasks, scopedPriorities, scopedDeliverables, scopedComments, statsByName]);

  const isMobile = useIsMobile();

  return (
    <AppLayout>
      <div className="h-full overflow-auto bg-gradient-to-br from-background via-background to-primary/[0.02]">
        <div className={isMobile ? "p-3 pb-24 space-y-3" : "max-w-[1600px] mx-auto p-4 md:p-6 space-y-4"}>
          <div className={isMobile ? "sticky top-0 z-30 -mx-3 px-3 pt-1 pb-2 bg-background/95 backdrop-blur border-b" : ""}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className={isMobile ? "text-lg font-bold text-foreground" : "text-2xl md:text-3xl font-bold text-foreground"}>Central de Entregas</h1>
              <div className="inline-flex border bg-card p-0.5">
                {([
                  ['external', 'Clientes AC/AV'],
                  ['universe', 'Universo Ramos'],
                  ['all', 'Tudo'],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setClientScope(value)}
                    className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                      clientScope === value
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {!isMobile && (
              <p className="text-sm text-muted-foreground mt-1">
                Responsabilidades, prioridades, entregas e performance da equipe
              </p>
            )}
          </div>

          {!isMobile && <GlobalSummary {...global} />}


          <TeamSelector
            options={responsibleList}
            selected={selected}
            onSelect={setSelected}
            statsByName={statsByName}
          />

          {isTeamView ? (
            !isMobile && (
              <TeamOverview
                responsibleList={responsibleList}
                tasks={scopedTasks}
                priorities={scopedPriorities}
                deliverables={scopedDeliverables}
              />
            )
          ) : (
            panelStats && (
              isMobile ? (
                <MobileCollaboratorMiniPanel name={selectedInfo.name} color={selectedInfo.color} {...panelStats} />
              ) : (
                <CollaboratorPanel
                  name={selectedInfo.name}
                  color={selectedInfo.color}
                  {...panelStats}
                />
              )
            )
          )}

          <Tabs defaultValue="priorities" className="w-full">
            <TabsList className={isMobile
              ? "flex w-full overflow-x-auto gap-1 bg-card/60 backdrop-blur-sm border justify-start"
              : "grid grid-cols-3 md:grid-cols-6 h-auto gap-1 bg-card/60 backdrop-blur-sm border"}>
              <TabsTrigger value="priorities" className="flex items-center gap-1.5 py-2 shrink-0"><Star className="w-4 h-4" /><span className={isMobile ? "text-[11px]" : "hidden sm:inline"}>Prioridades</span></TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-1.5 py-2 shrink-0"><CheckSquare className="w-4 h-4" /><span className={isMobile ? "text-[11px]" : "hidden sm:inline"}>Tarefas</span></TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-1.5 py-2 shrink-0"><MessageSquare className="w-4 h-4" /><span className={isMobile ? "text-[11px]" : "hidden sm:inline"}>Comentários</span></TabsTrigger>
              <TabsTrigger value="deliverables" className="flex items-center gap-1.5 py-2 shrink-0"><Package className="w-4 h-4" /><span className={isMobile ? "text-[11px]" : "hidden sm:inline"}>Entregáveis</span></TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1.5 py-2 shrink-0"><Archive className="w-4 h-4" /><span className={isMobile ? "text-[11px]" : "hidden sm:inline"}>Histórico</span></TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-1.5 py-2 shrink-0"><TrendingUp className="w-4 h-4" /><span className={isMobile ? "text-[11px]" : "hidden sm:inline"}>Performance</span></TabsTrigger>
            </TabsList>


            <TabsContent value="priorities" className="mt-4">
              <PrioritiesTab
                collaborator={selectedInfo.name}
                color={selectedInfo.color}
                isTeamView={isTeamView}
                priorities={scopedPriorities}
                clients={scopedClients}
                responsibleList={responsibleList}
                onCreate={prioritiesHook.addPriority}
                onUpdate={prioritiesHook.updatePriority}
                onDelete={prioritiesHook.deletePriority}
              />
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <TasksTab
                collaborator={selectedInfo.name}
                color={selectedInfo.color}
                isTeamView={isTeamView}
                tasks={scopedTasks}
                priorities={scopedPriorities}
                clients={scopedClients}
                responsibleList={responsibleList}
                onPromote={prioritiesHook.promoteTaskToPriority}
                onToggleComplete={tasksHook.toggleComplete}
                onCreateTask={tasksHook.addTask}
                getDaysOpen={tasksHook.getDaysOpen}
              />
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <CommentsTab
                collaborator={selectedInfo.name}
                color={selectedInfo.color}
                isTeamView={isTeamView}
                comments={scopedComments}
                clients={scopedClients}
              />
            </TabsContent>

            <TabsContent value="deliverables" className="mt-4">
              <DeliverablesTab
                collaborator={selectedInfo.name}
                color={selectedInfo.color}
                isTeamView={isTeamView}
                deliverables={scopedDeliverables}
                priorities={scopedPriorities}
                tasks={scopedTasks}
                clients={scopedClients}
                responsibleList={responsibleList}
                onCreate={deliverablesHook.addDeliverable}
                onUpdate={deliverablesHook.updateDeliverable}
                onDelete={deliverablesHook.deleteDeliverable}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <HistoryTab
                collaborator={selectedInfo.name}
                isTeamView={isTeamView}
                tasks={scopedTasks}
                priorities={scopedPriorities}
                deliverables={scopedDeliverables}
                comments={scopedComments}
                clients={scopedClients}
              />
            </TabsContent>

            <TabsContent value="performance" className="mt-4">
              <PerformanceTab
                collaborator={isTeamView ? responsibleList[0]?.name || 'Patrick' : selectedInfo.name}
                color={isTeamView ? (responsibleList[0]?.color || '#6B9B37') : selectedInfo.color}
                tasks={scopedTasks}
                priorities={scopedPriorities}
                deliverables={scopedDeliverables}
                clients={scopedClients}
                responsibleList={responsibleList}
                comments={scopedComments}
                getDaysOpen={tasksHook.getDaysOpen}
              />
            </TabsContent>
          </Tabs>
        </div>

        <QuickCreatePanel
          collaborator={selectedInfo.name}
          color={selectedInfo.color}
          isTeamView={isTeamView}
          clients={scopedClients}
          responsibleList={responsibleList}
          priorities={scopedPriorities}
          tasks={scopedTasks}
          onCreatePriority={prioritiesHook.addPriority}
          onCreateTask={tasksHook.addTask}
          onCreateDeliverable={deliverablesHook.addDeliverable}
          variant="fab"
        />
      </div>
    </AppLayout>
  );
}

function MobileCollaboratorMiniPanel({
  name, color, clients, openTasks, openPriorities, deliverables, pendingComments, overdue, score,
}: {
  name: string; color: string;
  clients: number; openTasks: number; openPriorities: number; doneTasks: number;
  deliverables: number; pendingComments: number; overdue: number; score: number;
}) {
  const kpis = [
    { label: 'Tarefas', value: openTasks },
    { label: 'Prioridades', value: openPriorities },
    { label: 'Atrasos', value: overdue, danger: overdue > 0 },
    { label: 'Comentários', value: pendingComments, danger: pendingComments > 0 },
    { label: 'Clientes', value: clients },
    { label: 'Pontos', value: score, success: true },
  ];
  return (
    <div
      className="rounded-2xl border p-3"
      style={{ background: `linear-gradient(135deg, ${color}0f 0%, transparent 60%)` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <div className="text-sm font-bold truncate" style={{ color }}>{name}</div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {kpis.map(k => (
          <div key={k.label} className={`rounded-lg border bg-card px-2 py-1.5 ${k.danger ? 'border-red-200 bg-red-50/40' : ''}`}>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{k.label}</div>
            <div className={`text-base font-bold ${k.danger ? 'text-red-600' : k.success ? 'text-emerald-700' : ''}`}>{k.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
