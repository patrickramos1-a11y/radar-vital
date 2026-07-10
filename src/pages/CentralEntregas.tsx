import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { usePriorities } from '@/hooks/usePriorities';
import { useDeliverables } from '@/hooks/useDeliverables';
import { useCollaborators } from '@/hooks/useCollaborators';
import { useClients } from '@/contexts/ClientContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ResponsibleSelector } from '@/components/central-entregas/ResponsibleSelector';
import { OverviewTab } from '@/components/central-entregas/OverviewTab';
import { PrioritiesTab } from '@/components/central-entregas/PrioritiesTab';
import { TasksTab } from '@/components/central-entregas/TasksTab';
import { CommentsTab } from '@/components/central-entregas/CommentsTab';
import { DeliverablesTab } from '@/components/central-entregas/DeliverablesTab';
import { PerformanceTab } from '@/components/central-entregas/PerformanceTab';
import { LayoutDashboard, Star, CheckSquare, MessageSquare, Package, TrendingUp } from 'lucide-react';
import { useEffect } from 'react';

const DEFAULT_NAMES = ['Patrick', 'Celine', 'Gabi', 'Darley', 'Vanessa'];

export default function CentralEntregas() {
  const { collaborators } = useCollaborators();
  const { clients } = useClients();
  const tasksHook = useTasks();
  const prioritiesHook = usePriorities();
  const deliverablesHook = useDeliverables();

  const responsibleList = useMemo(() => {
    const active = collaborators.filter(c => c.isActive);
    // Ensure the 5 default names are always present
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
  const selectedInfo = responsibleList.find(r => r.name.toLowerCase().includes(selected.toLowerCase())) || responsibleList[0];

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

  return (
    <AppLayout>
      <div className="h-full overflow-auto bg-gradient-to-br from-background via-background to-primary/[0.02]">
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Central de Entregas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visão por responsável — prioridades, tarefas, comentários e entregáveis
            </p>
          </div>

          <ResponsibleSelector
            options={responsibleList}
            selected={selected}
            onSelect={setSelected}
          />

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 h-auto gap-1 bg-card/60 backdrop-blur-sm border">
              <TabsTrigger value="overview" className="flex items-center gap-1.5 py-2"><LayoutDashboard className="w-4 h-4" /><span className="hidden sm:inline">Visão Geral</span></TabsTrigger>
              <TabsTrigger value="priorities" className="flex items-center gap-1.5 py-2"><Star className="w-4 h-4" /><span className="hidden sm:inline">Prioridades</span></TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-1.5 py-2"><CheckSquare className="w-4 h-4" /><span className="hidden sm:inline">Tarefas</span></TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-1.5 py-2"><MessageSquare className="w-4 h-4" /><span className="hidden sm:inline">Comentários</span></TabsTrigger>
              <TabsTrigger value="deliverables" className="flex items-center gap-1.5 py-2"><Package className="w-4 h-4" /><span className="hidden sm:inline">Entregáveis</span></TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-1.5 py-2"><TrendingUp className="w-4 h-4" /><span className="hidden sm:inline">Performance</span></TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <OverviewTab
                collaborator={selectedInfo.name}
                color={selectedInfo.color}
                tasks={tasksHook.tasks}
                priorities={prioritiesHook.priorities}
                deliverables={deliverablesHook.deliverables}
                clients={clients}
                comments={comments}
                getDaysOpen={tasksHook.getDaysOpen}
              />
            </TabsContent>

            <TabsContent value="priorities" className="mt-4">
              <PrioritiesTab
                collaborator={selectedInfo.name}
                color={selectedInfo.color}
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
                tasks={tasksHook.tasks}
                priorities={prioritiesHook.priorities}
                clients={clients}
                responsibleList={responsibleList}
                onPromote={prioritiesHook.promoteTaskToPriority}
                getDaysOpen={tasksHook.getDaysOpen}
              />
            </TabsContent>

            <TabsContent value="comments" className="mt-4">
              <CommentsTab
                collaborator={selectedInfo.name}
                color={selectedInfo.color}
                comments={comments}
                clients={clients}
              />
            </TabsContent>

            <TabsContent value="deliverables" className="mt-4">
              <DeliverablesTab
                collaborator={selectedInfo.name}
                color={selectedInfo.color}
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

            <TabsContent value="performance" className="mt-4">
              <PerformanceTab
                collaborator={selectedInfo.name}
                color={selectedInfo.color}
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
