import { useMemo } from 'react';
import { CalendarClock, CheckCircle2, CheckSquare, ListChecks, UserRoundX } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TaskManagementSheet } from '@/components/tasks/TaskManagementSheet';
import { KPICard, VisualPanelHeader } from '@/components/visual-panels/VisualPanelHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientContext';
import { useTasks } from '@/hooks/useTasks';

export default function JackboxUnified() {
  const { collaborators } = useAuth();
  const { activeClients } = useClients();
  const {
    tasks,
    toggleComplete,
    updateTask,
    bulkUpdateTasks,
    getDaysOpen,
    isLoading,
    error,
  } = useTasks();

  const externalClientIds = useMemo(() => new Set(activeClients.map(client => client.id)), [activeClients]);
  const externalTasks = useMemo(
    () => tasks.filter(task => externalClientIds.has(task.client_id)),
    [externalClientIds, tasks],
  );

  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const scheduled = externalTasks.filter(task => !task.completed && task.scheduled_for && task.scheduled_for > today);
    const pending = externalTasks.filter(task => !task.completed && (!task.scheduled_for || task.scheduled_for <= today));
    const completed = externalTasks.filter(task => task.completed).length;
    const unassigned = pending.filter(task => task.assigned_to.length === 0).length;
    return {
      pending: pending.length,
      completed,
      clients: new Set(pending.map(task => task.client_id)).size,
      unassigned,
      scheduled: scheduled.length,
    };
  }, [externalTasks]);

  return (
    <AppLayout>
      <div className="flex h-full min-w-0 flex-col overflow-hidden">
        <VisualPanelHeader
          title="Gestão de Tarefas"
          subtitle="Acompanhamento operacional agrupado por cliente"
          icon={<ListChecks className="h-5 w-5" />}
        >
          <KPICard icon={<CheckSquare className="h-4 w-4" />} value={metrics.pending} label="Pendentes" variant="warning" />
          <KPICard icon={<CheckCircle2 className="h-4 w-4" />} value={metrics.completed} label="Concluídas" variant="success" />
          <KPICard icon={<ListChecks className="h-4 w-4" />} value={metrics.clients} label="Clientes" variant="info" />
          <KPICard icon={<UserRoundX className="h-4 w-4" />} value={metrics.unassigned} label="Sem responsável" variant="danger" />
          <KPICard icon={<CalendarClock className="h-4 w-4" />} value={metrics.scheduled} label="Agendadas" variant="default" />
        </VisualPanelHeader>

        <TaskManagementSheet
          tasks={externalTasks}
          clients={activeClients}
          collaborators={collaborators}
          isLoading={isLoading}
          error={error}
          getDaysOpen={getDaysOpen}
          onToggleComplete={toggleComplete}
          onUpdateTask={updateTask}
          onBulkUpdateTasks={bulkUpdateTasks}
        />
      </div>
    </AppLayout>
  );
}
