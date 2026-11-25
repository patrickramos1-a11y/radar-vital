import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Workflow } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PrioritiesTab } from '@/components/central-entregas/PrioritiesTab';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientContext';
import { usePriorities } from '@/hooks/usePriorities';
import { useTasks } from '@/hooks/useTasks';

/**
 * Processos: a single place for priorities and tasks. Both stay in their own
 * tables (D-004); this page only presents them together.
 */
export default function Processos() {
  const [searchParams] = useSearchParams();
  const { currentUser, collaborators, isAdmin } = useAuth();
  const { clients } = useClients();
  const priorityData = usePriorities();
  const taskData = useTasks();

  return <AppLayout><main className="h-full overflow-y-auto bg-slate-50 px-3 pb-20 pt-4 sm:px-6">
    <div className="mx-auto max-w-[1480px]">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-primary"><ArrowLeft className="h-4 w-4" />Voltar aos clientes</Link>
      <header className="mt-3 flex items-center gap-2">
        <Workflow className="h-5 w-5 text-primary" aria-hidden />
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Processos</h1>
          <p className="text-xs text-muted-foreground">Prioridades e tarefas juntas, com vencimento, planejamento e repetição.</p>
        </div>
      </header>
      <div className="mt-3">
        {currentUser ? <PrioritiesTab
          collaborator={currentUser.name}
          color={currentUser.color}
          isTeamView={false}
          initialViewMode="all"
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
          onDemote={priorityData.demotePriorityToTask}
          onPromote={priorityData.promoteTaskToPriority}
          onCreateSubtask={taskData.addTask}
          onToggleTask={taskData.toggleComplete}
          onUpdateTask={taskData.updateTask}
          onDeleteTask={taskData.deleteTask}
          onRefreshTasks={taskData.refetch}
        /> : <p className="border bg-white p-4 text-sm text-muted-foreground">Selecione um perfil para consultar seus processos.</p>}
      </div>
    </div>
  </main></AppLayout>;
}
