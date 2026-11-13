import { useMemo, useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTasks } from '@/hooks/useTasks';
import { usePriorities } from '@/hooks/usePriorities';
import { useDeliverables } from '@/hooks/useDeliverables';
import { useCollaborators } from '@/hooks/useCollaborators';
import { useChallenges } from '@/hooks/useChallenges';
import { useClients } from '@/contexts/ClientContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTreasury } from '@/hooks/useTreasury';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { TeamSelector, TEAM_VIEW } from '@/components/central-entregas/TeamSelector';
import { TeamOverview } from '@/components/central-entregas/TeamOverview';
import { PrioritiesTab } from '@/components/central-entregas/PrioritiesTab';
import { TasksTab } from '@/components/central-entregas/TasksTab';
import { CommentsTab } from '@/components/central-entregas/CommentsTab';
import { DeliverablesTab } from '@/components/central-entregas/DeliverablesTab';
import { HistoryTab } from '@/components/central-entregas/HistoryTab';
import { PerformanceTab } from '@/components/central-entregas/PerformanceTab';
import { ChallengesTab } from '@/components/central-entregas/ChallengesTab';
import { assigneeMatches } from '@/lib/taskAssignee';
import { ordinaryTasks, workloadFor } from '@/lib/centralMetrics';
import { Star, CheckSquare, MessageSquare, Package, Trophy, AlertTriangle } from 'lucide-react';
import { KpiStrip, type KpiItem } from '@/components/common/KpiStrip';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { useIsMobile } from '@/hooks/use-mobile';
import { QuickCreatePanel } from '@/components/central-entregas/QuickCreatePanel';
import { filterClientsByScope, type ClientScope } from '@/lib/clientScope';
import { useSearchParams } from 'react-router-dom';


const DEFAULT_NAMES = ['Patrick', 'Celine', 'Gabi', 'Darley', 'Vanessa'];

type ClientCommentRow = {
  client_id: string;
  is_archived: boolean;
  [field: string]: unknown;
};

export default function CentralEntregas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { collaborators } = useCollaborators();
  const { isAdmin, currentUser } = useAuth();
  const { clients } = useClients();
  const tasksHook = useTasks();
  const prioritiesHook = usePriorities();
  const deliverablesHook = useDeliverables();
  const challengesHook = useChallenges();
  const treasury = useTreasury();
  const [clientScope, setClientScope] = useState<ClientScope>('all');
  const requestedTab = searchParams.get('tab');
  const activeTab = [
    'priorities',
    'tasks',
    'comments',
    'deliverables',
    'challenges',
    'history',
    'performance',
  ].includes(requestedTab ?? '')
    ? requestedTab!
    : 'priorities';

  const requestedClientScope = useMemo<ClientScope | null>(() => {
    const clientId = searchParams.get('clientId');
    const client = clients.find(item => item.id === clientId);
    return client?.clientType === 'UNIVERSO_RAMOS' ? 'universe' : null;
  }, [clients, searchParams]);
  const effectiveClientScope = requestedClientScope ?? clientScope;

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

  const [selected, setSelected] = useState<string>(() => currentUser?.name || 'Patrick');
  useEffect(() => { if (currentUser?.name) setSelected(currentUser.name); }, [currentUser?.name]);
  const isTeamView = selected === TEAM_VIEW;
  const selectedInfo = useMemo(
    () =>
      isTeamView
        ? { name: 'Equipe', color: 'hsl(var(--primary))', initials: 'EQ' }
        : (responsibleList.find(r => r.name.toLowerCase() === selected.toLowerCase()) ||
          responsibleList[0] ||
          { name: 'Equipe', color: 'hsl(var(--primary))', initials: 'EQ' }),
    [isTeamView, responsibleList, selected],
  );
  const selectedCollaboratorId = useMemo(
    () =>
      collaborators.find(
        (collaborator) =>
          collaborator.name.toLowerCase() === selectedInfo.name.toLowerCase(),
      )?.id ?? null,
    [collaborators, selectedInfo.name],
  );

  const [comments, setComments] = useState<ClientCommentRow[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('client_comments').select('*').order('created_at', { ascending: false });
       setComments((data ?? []) as ClientCommentRow[]);
    })();
    const ch = supabase.channel('ce_comments').on('postgres_changes', { event: '*', schema: 'public', table: 'client_comments' }, async () => {
      const { data } = await supabase.from('client_comments').select('*').order('created_at', { ascending: false });
       setComments((data ?? []) as ClientCommentRow[]);
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const scopedClients = useMemo(() => {
    return filterClientsByScope(clients, effectiveClientScope);
  }, [effectiveClientScope, clients]);

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
      return effectiveClientScope !== 'universe';
    }),
    [effectiveClientScope, scopedClientIds, tasksHook.tasks],
  );
  const scopedPriorities = useMemo(
    () => prioritiesHook.priorities.filter(priority => {
      if (priority.client_id) return scopedClientIds.has(priority.client_id);
      return effectiveClientScope !== 'universe';
    }),
    [effectiveClientScope, prioritiesHook.priorities, scopedClientIds],
  );
  const scopedComments = useMemo(
    () => comments.filter(comment => scopedClientIds.has(comment.client_id)),
    [comments, scopedClientIds],
  );
  const scopedDeliverables = useMemo(() => {
    if (effectiveClientScope === 'all') return deliverablesHook.deliverables;

    const taskById = new Map(
      tasksHook.tasks.map(task => [task.id, task]),
    );
    const priorityById = new Map(
      prioritiesHook.priorities.map(priority => [priority.id, priority]),
    );

    return deliverablesHook.deliverables.filter(deliverable => {
      if (deliverable.client_id) {
        const belongsToUniverse = universeClientIds.has(deliverable.client_id);
        return effectiveClientScope === 'universe'
          ? belongsToUniverse
          : !belongsToUniverse;
      }

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
      return effectiveClientScope === 'universe'
        ? belongsToUniverse
        : !belongsToUniverse;
    });
  }, [
    effectiveClientScope,
    deliverablesHook.deliverables,
    prioritiesHook.priorities,
    tasksHook.tasks,
    universeClientIds,
  ]);

  // Workload numbers come from one helper so the picker, the KPI strip and
  // the Tasks tab always agree (tasks inside priority trees count as priorities).
  const scopedOrdinaryTasks = useMemo(() => ordinaryTasks(scopedTasks), [scopedTasks]);

  const statsByName = useMemo(() => {
    const map = new Map<string, { openTasks: number; openPriorities: number }>();
    responsibleList.forEach(r => {
      const workload = workloadFor(r.name, scopedOrdinaryTasks, scopedPriorities, undefined, scopedTasks);
      map.set(r.name, { openTasks: workload.openTasks, openPriorities: workload.openPriorities });
    });
    return map;
  }, [responsibleList, scopedOrdinaryTasks, scopedPriorities, scopedTasks]);

  const pointsByCollaboratorId = useMemo(() => {
    const now = new Date();
    const total = new Map<string, number>();
    const month = new Map<string, number>();
    treasury.transactions.forEach(transaction => {
      const id = transaction.collaboratorId;
      total.set(id, (total.get(id) ?? 0) + transaction.amount);
      const date = new Date(transaction.createdAt);
      if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
        month.set(id, (month.get(id) ?? 0) + transaction.amount);
      }
    });
    return { total, month };
  }, [treasury.transactions]);

  const kpis = useMemo<KpiItem[]>(() => {
    const name = isTeamView ? null : selectedInfo.name;
    const workload = workloadFor(name, scopedOrdinaryTasks, scopedPriorities, undefined, scopedTasks);
    const readField = `read_${selectedInfo.name.toLowerCase()}`;
    const pendingComments = scopedComments.filter(
      comment => !comment.is_archived && (isTeamView || !comment[readField]),
    ).length;
    const pendingDeliverables = scopedDeliverables.filter(deliverable =>
      deliverable.status !== 'concluido' &&
      deliverable.status !== 'cancelado' &&
      (name === null || assigneeMatches(deliverable.assigned_to, name)),
    ).length;
    const goTo = (tab: string) => () => {
      const next = new URLSearchParams(searchParams);
      next.set('tab', tab);
      setSearchParams(next, { replace: true });
    };

    const items: KpiItem[] = [
      {
        key: 'priorities', label: 'Prioridades', value: workload.openPriorities, icon: Star,
        detail: workload.scheduledPriorities > 0 ? `+${workload.scheduledPriorities} planejadas` : undefined,
        hint: 'Prioridades ativas (as planejadas para depois aparecem à parte)', active: activeTab === 'priorities', onClick: goTo('priorities'),
      },
      {
        key: 'tasks', label: 'Tarefas', value: workload.openTasks, icon: CheckSquare,
        hint: 'Tarefas em aberto fora das prioridades', active: activeTab === 'tasks', onClick: goTo('tasks'),
      },
      {
        key: 'overdue', label: 'Atrasos', value: workload.overdue, icon: AlertTriangle,
        tone: workload.overdue > 0 ? 'danger' : 'default',
        hint: `${workload.overdueTasks} tarefa(s) e ${workload.overduePriorities} prioridade(s) com prazo vencido`,
      },
      {
        key: 'comments', label: 'Comentários', value: pendingComments, icon: MessageSquare,
        tone: pendingComments > 0 ? 'warning' : 'default',
        hint: isTeamView ? 'Comentários não arquivados' : 'Comentários ainda não lidos',
        active: activeTab === 'comments', onClick: goTo('comments'),
      },
      {
        key: 'deliverables', label: 'Entregáveis', value: pendingDeliverables, icon: Package,
        hint: 'Entregáveis pendentes', active: activeTab === 'deliverables', onClick: goTo('deliverables'),
      },
    ];

    if (isTeamView) {
      const leader = collaborators
        .map(collaborator => ({ name: collaborator.name, points: pointsByCollaboratorId.month.get(collaborator.id) ?? 0 }))
        .filter(row => row.points > 0)
        .sort((left, right) => right.points - left.points)[0];
      items.push({
        key: 'leader', label: 'Destaque do mês', value: leader ? leader.points : '—', icon: Trophy,
        tone: leader ? 'success' : 'default', detail: leader?.name ?? 'Sem pontos no mês',
        hint: 'Mais pontos oficiais no mês', active: activeTab === 'performance', onClick: goTo('performance'),
      });
    } else {
      items.push({
        key: 'points', label: 'Pontos',
        value: selectedCollaboratorId ? pointsByCollaboratorId.total.get(selectedCollaboratorId) ?? 0 : 0,
        icon: Trophy, tone: 'success', hint: 'Pontuação oficial acumulada',
        active: activeTab === 'performance', onClick: goTo('performance'),
      });
    }
    return items;
  }, [
    activeTab, collaborators, isTeamView, pointsByCollaboratorId, scopedComments, scopedDeliverables,
    scopedOrdinaryTasks, scopedPriorities, scopedTasks, searchParams, selectedCollaboratorId, selectedInfo.name, setSearchParams,
  ]);

  const isMobile = useIsMobile();

  return (
    <AppLayout>
      <div className="h-full overflow-auto bg-background">
        <div className={isMobile ? "p-3 pb-24 space-y-3" : "max-w-[1600px] mx-auto p-4 md:p-6 space-y-4"}>
          <header className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-lg font-bold text-foreground md:text-xl">Central de Entregas</h1>
              <SegmentedControl
                ariaLabel="Escopo de clientes"
                value={effectiveClientScope}
                onChange={setClientScope}
                options={[
                  { value: 'external', label: 'Clientes AC/AV' },
                  { value: 'universe', label: 'Universo Ramos' },
                  { value: 'all', label: 'Tudo' },
                ]}
              />
            </div>
            <TeamSelector
              options={responsibleList}
              selected={selected}
              onSelect={setSelected}
              statsByName={statsByName}
            />
            <KpiStrip items={kpis} />
          </header>

          <Tabs
            value={activeTab}
            onValueChange={(tab) => {
              const next = new URLSearchParams(searchParams);
              next.set('tab', tab);
              setSearchParams(next, { replace: true });
            }}
            className="w-full"
          >
            <TabsContent value="priorities" className="mt-0">
              <PrioritiesTab
                collaborator={selectedInfo.name}
                color={selectedInfo.color}
                isTeamView={isTeamView}
                priorities={scopedPriorities}
                tasks={scopedTasks}
                clients={scopedClients}
                responsibleList={responsibleList}
                initialClientId={searchParams.get('clientId')}
                onCreate={prioritiesHook.addPriority}
                onCreateMany={prioritiesHook.addPrioritiesForClients}
                onUpdate={prioritiesHook.updatePriority}
                onDelete={prioritiesHook.deletePriority}
                onDemote={prioritiesHook.demotePriorityToTask}
                onPromote={prioritiesHook.promoteTaskToPriority}
                onCreateSubtask={tasksHook.addTask}
                onToggleTask={tasksHook.toggleComplete}
                onUpdateTask={tasksHook.updateTask}
                onDeleteTask={tasksHook.deleteTask}
                onRefreshTasks={tasksHook.refetch}
              />
            </TabsContent>

            <TabsContent value="tasks" className="mt-0">
              <TasksTab
                collaborator={selectedInfo.name}
                color={selectedInfo.color}
                isTeamView={isTeamView}
                tasks={scopedTasks}
                priorities={scopedPriorities}
                clients={scopedClients}
                responsibleList={responsibleList}
                onPromote={prioritiesHook.promoteTaskToPriority}
                onRefreshTasks={tasksHook.refetch}
                onToggleComplete={tasksHook.toggleComplete}
                onCreateTask={tasksHook.addTask}
                onUpdateTask={tasksHook.updateTask}
                getDaysOpen={tasksHook.getDaysOpen}
              />
            </TabsContent>

            <TabsContent value="comments" className="mt-0">
              <CommentsTab
                collaborator={selectedInfo.name}
                color={selectedInfo.color}
                isTeamView={isTeamView}
                comments={scopedComments}
                clients={scopedClients}
              />
            </TabsContent>

            <TabsContent value="deliverables" className="mt-0">
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
                onUpdateTask={tasksHook.updateTask}
              />
            </TabsContent>

            <TabsContent value="challenges" className="mt-0">
              <ChallengesTab
                challenges={challengesHook.challenges}
                participantsByChallenge={challengesHook.participantsByChallenge}
                itemsByChallenge={challengesHook.itemsByChallenge}
                clients={scopedClients}
                collaborators={collaborators}
                selectedCollaboratorId={selectedCollaboratorId}
                isTeamView={isTeamView}
                tasks={scopedTasks}
                priorities={scopedPriorities}
                deliverables={scopedDeliverables}
                canManage={isAdmin}
                isLoading={challengesHook.isLoading}
                error={challengesHook.error}
                onCreate={challengesHook.createChallenge}
                onResolve={challengesHook.resolveChallenge}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
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

            <TabsContent value="performance" className="mt-0 space-y-4">
              {isTeamView && (
                <TeamOverview
                  responsibleList={responsibleList}
                  tasks={scopedTasks}
                  priorities={scopedPriorities}
                  deliverables={scopedDeliverables}
                />
              )}
              <PerformanceTab
                collaborator={isTeamView ? responsibleList[0]?.name || 'Patrick' : selectedInfo.name}
                color={isTeamView ? (responsibleList[0]?.color || '#6B9B37') : selectedInfo.color}
                teamOnly={isTeamView}
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

