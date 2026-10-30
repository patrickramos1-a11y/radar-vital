import { useMemo, useState } from 'react';
import { CalendarClock, CheckCircle2, CheckSquare, ListChecks, UserRoundX } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TaskManagementSheet } from '@/components/tasks/TaskManagementSheet';
import { KPICard, VisualPanelHeader } from '@/components/visual-panels/VisualPanelHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientContext';
import { useTasks } from '@/hooks/useTasks';
import { usePriorities } from '@/hooks/usePriorities';
import { PriorityModal } from '@/components/central-entregas/PriorityModal';
import type { Task } from '@/types/task';
import { priorityTaskTreeIds } from '@/lib/taskHierarchy';

export default function JackboxUnified() {
  const { collaborators, currentUser } = useAuth();
  const { activeClients } = useClients();
  const {
    tasks,
    toggleComplete,
    updateTask,
    deleteTask,
    bulkUpdateTasks,
    getDaysOpen,
    refetch,
    isLoading,
    error,
  } = useTasks();
  const priorities = usePriorities();
  const [promotingTask, setPromotingTask] = useState<Task | null>(null);

  const externalClientIds = useMemo(() => new Set(activeClients.map(client => client.id)), [activeClients]);
  const externalTasks = useMemo(
    () => tasks.filter(task => externalClientIds.has(task.client_id)),
    [externalClientIds, tasks],
  );
  const ordinaryExternalTasks = useMemo(() => {
    const promoted = priorityTaskTreeIds(externalTasks);
    return externalTasks.filter(task => !promoted.has(task.id));
  }, [externalTasks]);

  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const scheduled = ordinaryExternalTasks.filter(task => !task.completed && task.scheduled_for && task.scheduled_for > today);
    const pending = ordinaryExternalTasks.filter(task => !task.completed && (!task.scheduled_for || task.scheduled_for <= today));
    const completed = ordinaryExternalTasks.filter(task => task.completed).length;
    const unassigned = pending.filter(task => task.assigned_to.length === 0).length;
    return {
      pending: pending.length,
      completed,
      clients: new Set(pending.map(task => task.client_id)).size,
      unassigned,
      scheduled: scheduled.length,
    };
  }, [ordinaryExternalTasks]);

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
          onDeleteTask={deleteTask}
          onBulkUpdateTasks={bulkUpdateTasks}
          onPromoteTask={setPromotingTask}
        />
        <PriorityModal
          open={Boolean(promotingTask)}
          onOpenChange={open => { if (!open) setPromotingTask(null); }}
          editing={null}
          defaultAssignee={promotingTask?.assigned_to[0] || currentUser?.name}
          presetTitle={promotingTask?.title}
          presetClientId={promotingTask?.client_id}
          presetDescription={promotingTask?.description || undefined}
          lockClientId
          promotionMode
          clients={activeClients}
          responsibleList={collaborators.filter(person => person.isActive).map(person => ({ name: person.name, color: person.color, initials: person.initials }))}
          submitLabel="Promover para prioridade"
          onSubmit={async data => {
            if (!promotingTask) return;
            const clientName = activeClients.find(client => client.id === promotingTask.client_id)?.name;
            if (await priorities.promoteTaskToPriority(promotingTask.id, promotingTask.title, data, clientName)) {
              await refetch();
              setPromotingTask(null);
            }
          }}
        />
      </div>
    </AppLayout>
  );
}
