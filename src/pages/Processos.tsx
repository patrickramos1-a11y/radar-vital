import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Workflow } from '@/components/icones';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProcessesTab } from '@/components/processos/ProcessesTab';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientContext';
import { useTasks } from '@/hooks/useTasks';
import { useProcessComments } from '@/hooks/useProcessComments';

/**
 * Processos v2 (D-025): o processo é a tarefa principal e as etapas são as
 * subtarefas dela. A tabela de prioridades fica só como histórico.
 */
export default function Processos() {
  const [searchParams] = useSearchParams();
  const { currentUser, collaborators, isAdmin } = useAuth();
  const { clients } = useClients();
  const taskData = useTasks();
  const processComments = useProcessComments();

  return <AppLayout><main className="h-full overflow-y-auto bg-slate-50 px-3 pb-20 pt-4 sm:px-6">
    <div className="mx-auto max-w-[1480px]">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-primary"><ArrowLeft className="h-4 w-4" />Voltar aos clientes</Link>
      <header className="mt-3 flex items-center gap-2">
        <span className="selo-ramos" style={{ "--selo": "40px" } as React.CSSProperties} aria-hidden="true"><Workflow /></span>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Processos</h1>
          <p className="text-xs text-muted-foreground">Cada processo tem peso de 1 a 5, etapas, vencimento, planejamento e repetição. Peso 5 é Máxima.</p>
        </div>
      </header>
      <div className="mt-3">
        {currentUser ? <ProcessesTab
          collaborator={currentUser.name}
          color={currentUser.color}
          isTeamView={false}
          tasks={taskData.tasks}
          clients={clients.filter(client => client.isActive)}
          responsibleList={collaborators.filter(person => person.isActive).map(person => ({ name: person.name, color: person.color, initials: person.initials }))}
          allowCollaboratorFilter={isAdmin}
          canPlanMaximum={isAdmin && currentUser.name.toLocaleLowerCase('pt-BR').includes('patrick')}
          initialClientId={searchParams.get('clientId')}
          comments={processComments.comments}
          onComment={processComments.addComment}
          onCreate={taskData.addTask}
          onCreateFollowUp={taskData.createFollowUp}
          onToggleTask={taskData.toggleComplete}
          onUpdateTask={taskData.updateTask}
          onDeleteTask={taskData.deleteTask}
        /> : <p className="border bg-white p-4 text-sm text-muted-foreground">Selecione um perfil para consultar seus processos.</p>}
      </div>
    </div>
  </main></AppLayout>;
}
