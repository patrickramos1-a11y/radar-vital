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


const DEFAULT_NAMES = ['Patrick', 'Celine', 'Gabi', 'Darley', 'Vanessa'];

export default function CentralEntregas() {
  const { collaborators } = useCollaborators();
  const { clients } = useClients();
  const tasksHook = useTasks();
  const prioritiesHook = usePriorities();
  const deliverablesHook = useDeliverables();
  const { ratings } = useDeliverableRatings();

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

  // Per-collaborator stats for chips
  const statsByName = useMemo(() => {
    const map = new Map<string, { openTasks: number; openPriorities: number; score: number }>();
    responsibleList.forEach(r => {
      const openTasks = tasksHook.tasks.filter(t => !t.completed && assigneeMatches(t.assigned_to, r.name)).length;
      const openPriorities = prioritiesHook.priorities.filter(p => assigneeMatches(p.assigned_to, r.name) && p.status !== 'concluida' && p.status !== 'cancelada').length;
      let score = 0;
      deliverablesHook.deliverables.forEach(d => {
        if (!assigneeMatches(d.assigned_to, r.name)) return;
        const rs = ratings.filter(rr => rr.deliverable_id === d.id);
        if (rs.length === 0) return;
        const n = Math.max(1, d.assigned_to.length);
        score += summarizeRatings(rs).score / n;
      });
      map.set(r.name, { openTasks, openPriorities, score: Math.round(score * 10) / 10 });
    });
    return map;
  }, [responsibleList, tasksHook.tasks, prioritiesHook.priorities, deliverablesHook.deliverables, ratings]);

  // Global summary
  const global = useMemo(() => {
    const totalOpenTasks = tasksHook.tasks.filter(t => !t.completed).length;
    const totalOpenPriorities = prioritiesHook.priorities.filter(p => p.status !== 'concluida' && p.status !== 'cancelada').length;
    const monthStart = startOfMonth(new Date()).getTime();
    const deliverablesDoneMonth = deliverablesHook.deliverables.filter(d =>
      d.status === 'concluido' && d.completed_at && new Date(d.completed_at).getTime() >= monthStart
    ).length;
    const pendingComments = comments.filter(c => !c.is_archived).length;

    // Top performer of the month = highest score in current month
    const scoresMonth = new Map<string, { score: number; stars: number }>();
    deliverablesHook.deliverables.forEach(d => {
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
  }, [tasksHook.tasks, prioritiesHook.priorities, deliverablesHook.deliverables, comments, ratings]);

  // Panel stats for selected collaborator
  const panelStats = useMemo(() => {
    if (isTeamView) return null;
    const name = selectedInfo.name;
    const myTasks = tasksHook.tasks.filter(t => assigneeMatches(t.assigned_to, name));
    const myPri = prioritiesHook.priorities.filter(p => assigneeMatches(p.assigned_to, name));
    const myDeliv = deliverablesHook.deliverables.filter(d => assigneeMatches(d.assigned_to, name));
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
      pendingComments: comments.filter(c => !c.is_archived && !(c as any)[readField]).length,
      overdue:
        myTasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < today).length +
        myPri.filter(p => p.due_date && new Date(p.due_date) < today && p.status !== 'concluida' && p.status !== 'cancelada').length,
      score: statsByName.get(name)?.score || 0,
    };
  }, [isTeamView, selectedInfo, tasksHook.tasks, prioritiesHook.priorities, deliverablesHook.deliverables, comments, statsByName]);

  const isMobile = useIsMobile();

  return (
    <AppLayout>
      <div className="h-full overflow-auto bg-gradient-to-br from-background via-background to-primary/[0.02]">
        <div className={isMobile ? "p-3 pb-24 space-y-3" : "max-w-[1600px] mx-auto p-4 md:p-6 space-y-4"}>
          <div className={isMobile ? "sticky top-0 z-30 -mx-3 px-3 pt-1 pb-2 bg-background/95 backdrop-blur border-b" : ""}>
            <h1 className={isMobile ? "text-lg font-bold text-foreground" : "text-2xl md:text-3xl font-bold text-foreground"}>Central de Entregas</h1>
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
            <TeamOverview
              responsibleList={responsibleList}
              tasks={tasksHook.tasks}
              priorities={prioritiesHook.priorities}
              deliverables={deliverablesHook.deliverables}
            />
          ) : (
            panelStats && (
              <CollaboratorPanel
                name={selectedInfo.name}
                color={selectedInfo.color}
                {...panelStats}
              />
            )
          )}

          <Tabs defaultValue="priorities" className="w-full">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto gap-1 bg-card/60 backdrop-blur-sm border">
              <TabsTrigger value="priorities" className="flex items-center gap-1.5 py-2"><Star className="w-4 h-4" /><span className="hidden sm:inline">Prioridades</span></TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-1.5 py-2"><CheckSquare className="w-4 h-4" /><span className="hidden sm:inline">Tarefas</span></TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-1.5 py-2"><MessageSquare className="w-4 h-4" /><span className="hidden sm:inline">Comentários</span></TabsTrigger>
              <TabsTrigger value="deliverables" className="flex items-center gap-1.5 py-2"><Package className="w-4 h-4" /><span className="hidden sm:inline">Entregáveis</span></TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1.5 py-2"><Archive className="w-4 h-4" /><span className="hidden sm:inline">Histórico</span></TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-1.5 py-2"><TrendingUp className="w-4 h-4" /><span className="hidden sm:inline">Performance</span></TabsTrigger>
            </TabsList>

            <TabsContent value="priorities" className="mt-4">
              <PrioritiesTab
                collaborator={selectedInfo.name}
                color={selectedInfo.color}
                isTeamView={isTeamView}
                priorities={prioritiesHook.priorities}
                clients={clients}
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
                tasks={tasksHook.tasks}
                priorities={prioritiesHook.priorities}
                clients={clients}
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
                comments={comments}
                clients={clients}
              />
            </TabsContent>

            <TabsContent value="deliverables" className="mt-4">
              <DeliverablesTab
                collaborator={selectedInfo.name}
                color={selectedInfo.color}
                isTeamView={isTeamView}
                deliverables={deliverablesHook.deliverables}
                priorities={prioritiesHook.priorities}
                tasks={tasksHook.tasks}
                clients={clients}
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
                tasks={tasksHook.tasks}
                priorities={prioritiesHook.priorities}
                deliverables={deliverablesHook.deliverables}
                comments={comments}
                clients={clients}
              />
            </TabsContent>

            <TabsContent value="performance" className="mt-4">
              <PerformanceTab
                collaborator={isTeamView ? responsibleList[0]?.name || 'Patrick' : selectedInfo.name}
                color={isTeamView ? (responsibleList[0]?.color || '#6B9B37') : selectedInfo.color}
                tasks={tasksHook.tasks}
                priorities={prioritiesHook.priorities}
                deliverables={deliverablesHook.deliverables}
                clients={clients}
                responsibleList={responsibleList}
                comments={comments}
                getDaysOpen={tasksHook.getDaysOpen}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
