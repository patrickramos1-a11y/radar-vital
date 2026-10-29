import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { PrioritiesTab } from '@/components/central-entregas/PrioritiesTab';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientContext';
import { usePriorities } from '@/hooks/usePriorities';
import { useTasks } from '@/hooks/useTasks';
import { assigneeMatches } from '@/lib/taskAssignee';

export default function MyPriorities() {
  const [searchParams] = useSearchParams();
  const { currentUser, collaborators } = useAuth();
  const { clients } = useClients();
  const priorityData = usePriorities();
  const taskData = useTasks();
  const today = format(new Date(), 'yyyy-MM-dd');
  const activeCount = priorityData.priorities.filter(priority =>
    (priority.status === 'aberta' || priority.status === 'em_andamento')
    && assigneeMatches(priority.assigned_to, currentUser?.name || '')
    && !(() => {
      const rootTask = taskData.tasks.find(task => task.id === priority.source_task_id)
        || taskData.tasks.find(task => task.priority_id === priority.id && !task.parent_task_id);
      return Boolean(rootTask?.scheduled_for && rootTask.scheduled_for > today);
    })()).length;

  return <AppLayout><main className="h-full overflow-y-auto bg-slate-50 px-3 pb-20 pt-4 sm:px-6">
    <div className="mx-auto max-w-5xl">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-primary"><ArrowLeft className="h-4 w-4" />Voltar aos clientes</Link>
      <header className="mt-4 border-b pb-4">
        <div className="flex items-center gap-2 text-amber-600"><Star className="h-5 w-5 fill-current" /><span className="text-xs font-semibold uppercase">Central de Entregas</span></div>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Minhas prioridades</h1>
        <p className="mt-1 text-sm text-muted-foreground">{currentUser?.name || 'Selecione um perfil'} · {activeCount} prioridades ativas</p>
      </header>
      <div className="mt-5">
        {currentUser ? <PrioritiesTab
          collaborator={currentUser.name}
          color={currentUser.color}
          isTeamView={false}
          priorities={priorityData.priorities}
          tasks={taskData.tasks}
          clients={clients.filter(client => client.isActive)}
          responsibleList={collaborators.filter(person => person.isActive).map(person => ({ name: person.name, color: person.color, initials: person.initials }))}
          initialClientId={searchParams.get('clientId')}
          onCreate={priorityData.addPriority}
          onCreateMany={priorityData.addPrioritiesForClients}
          onUpdate={priorityData.updatePriority}
          onDelete={priorityData.deletePriority}
          onCreateSubtask={taskData.addTask}
          onToggleTask={taskData.toggleComplete}
          onUpdateTask={taskData.updateTask}
          onRefreshTasks={taskData.refetch}
        /> : <p className="border bg-white p-4 text-sm text-muted-foreground">Selecione um perfil para consultar suas prioridades.</p>}
      </div>
    </div>
  </main></AppLayout>;
}
