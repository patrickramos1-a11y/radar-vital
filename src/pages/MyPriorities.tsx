import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PrioritiesTab } from '@/components/central-entregas/PrioritiesTab';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientContext';
import { usePriorities } from '@/hooks/usePriorities';
import { useTasks } from '@/hooks/useTasks';

export default function MyPriorities() {
  const [searchParams] = useSearchParams();
  const { currentUser, collaborators, isAdmin } = useAuth();
  const { clients } = useClients();
  const priorityData = usePriorities();
  const taskData = useTasks();

  return <AppLayout><main className="h-full overflow-y-auto bg-slate-50 px-3 pb-20 pt-4 sm:px-6">
    <div className="mx-auto max-w-[1480px]">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-primary"><ArrowLeft className="h-4 w-4" />Voltar aos clientes</Link>
      <div className="mt-3">
        {currentUser ? <PrioritiesTab
          collaborator={currentUser.name}
          color={currentUser.color}
          isTeamView={false}
          priorities={priorityData.priorities}
          tasks={taskData.tasks}
          clients={clients.filter(client => client.isActive)}
          responsibleList={collaborators.filter(person => person.isActive).map(person => ({ name: person.name, color: person.color, initials: person.initials }))}
          allowCollaboratorFilter={isAdmin}
          canPlanPriorities={isAdmin && currentUser.name.toLocaleLowerCase('pt-BR').includes('patrick')}
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
