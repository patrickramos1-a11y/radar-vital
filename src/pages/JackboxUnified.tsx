import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarClock, CheckCircle2, CheckSquare, ListChecks, Repeat, UserRoundX } from '@/components/icones';
import { AppLayout } from '@/components/layout/AppLayout';
import { TaskManagementSheet } from '@/components/tasks/TaskManagementSheet';
import { KPICard, VisualPanelHeader } from '@/components/visual-panels/VisualPanelHeader';
import { ProcessesTab } from '@/components/processos/ProcessesTab';
import { FollowUpBoard } from '@/components/processos/FollowUpBoard';
import { useAuth } from '@/contexts/AuthContext';
import { useClients } from '@/contexts/ClientContext';
import { useTasks } from '@/hooks/useTasks';
import { useProcessComments } from '@/hooks/useProcessComments';
import { isRecurringMother } from '@/lib/processRecurrence';
import { cn } from '@/lib/utils';

type Section = 'todos' | 'planejados' | 'recorrentes';

const SECTIONS: { value: Section; label: string; icon: typeof ListChecks }[] = [
  { value: 'recorrentes', label: 'Recorrentes', icon: Repeat },
  { value: 'planejados', label: 'Planejados', icon: CalendarClock },
  { value: 'todos', label: 'Todos', icon: ListChecks },
];

function sectionFrom(value: string | null): Section {
  return value === 'planejados' || value === 'todos' ? value : 'recorrentes';
}

/** Gestão de processos: Recorrentes (acompanhamentos), Planejados e Todos. */
export default function JackboxUnified() {
  const { collaborators, currentUser, isAdmin } = useAuth();
  const { activeClients } = useClients();
  const [searchParams, setSearchParams] = useSearchParams();
  const section = sectionFrom(searchParams.get('secao'));
  const {
    tasks,
    addTask,
    createFollowUp,
    addFollowUpSteps,
    closeFollowUp,
    toggleComplete,
    updateTask,
    deleteTask,
    bulkUpdateTasks,
    getDaysOpen,
    isLoading,
    error,
  } = useTasks();
  const processComments = useProcessComments();

  const externalClientIds = useMemo(() => new Set(activeClients.map(client => client.id)), [activeClients]);
  const externalTasks = useMemo(
    () => tasks.filter(task => externalClientIds.has(task.client_id)),
    [externalClientIds, tasks],
  );
  const responsibleList = useMemo(
    () => collaborators.filter(person => person.isActive).map(person => ({ name: person.name, color: person.color, initials: person.initials })),
    [collaborators],
  );

  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const roots = externalTasks.filter(task => !task.parent_task_id);
    const open = roots.filter(task => !task.completed && task.status !== 'cancelada');
    const active = open.filter(task => !task.scheduled_for || task.scheduled_for <= today);
    return {
      pending: active.length,
      completed: roots.filter(task => task.completed).length,
      clients: new Set(active.map(task => task.client_id)).size,
      unassigned: active.filter(task => task.assigned_to.length === 0).length,
      scheduled: open.length - active.length,
      recurring: open.filter(isRecurringMother).length,
    };
  }, [externalTasks]);

  const chooseSection = (next: Section) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'recorrentes') params.delete('secao'); else params.set('secao', next);
    setSearchParams(params, { replace: true });
  };

  return (
    <AppLayout>
      <div className="flex h-full min-w-0 flex-col overflow-hidden">
        <VisualPanelHeader
          title="Gestão de processos"
          subtitle="Acompanhamentos que se repetem, processos planejados e a planilha de todos"
          icon={<ListChecks className="h-5 w-5" />}
        >
          <KPICard icon={<CheckSquare className="h-4 w-4" />} value={metrics.pending} label="Abertos" variant="warning" />
          <KPICard icon={<CheckCircle2 className="h-4 w-4" />} value={metrics.completed} label="Concluídos" variant="success" />
          <KPICard icon={<ListChecks className="h-4 w-4" />} value={metrics.clients} label="Clientes" variant="info" />
          <KPICard icon={<UserRoundX className="h-4 w-4" />} value={metrics.unassigned} label="Sem responsável" variant="danger" />
          <KPICard icon={<CalendarClock className="h-4 w-4" />} value={metrics.scheduled} label="Planejados" variant="default" />
          <KPICard icon={<Repeat className="h-4 w-4" />} value={metrics.recurring} label="Recorrentes" variant="default" />
        </VisualPanelHeader>

        <nav className="flex shrink-0 border-b bg-white px-3 py-2 sm:px-6" aria-label="Seções da gestão de processos"><div className="grupo-r flex gap-1">
          {SECTIONS.map(item => {
            const Icon = item.icon;
            return <button
              key={item.value}
              type="button"
              aria-pressed={section === item.value}
              onClick={() => chooseSection(item.value)}
              className={cn('inline-flex h-8 items-center gap-1.5 border px-3 text-xs font-medium', section === item.value ? 'border-slate-900 bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50')}
            >
              <Icon className="h-3.5 w-3.5" />{item.label}
            </button>;
          })}
        </div></nav>

        {section === 'recorrentes'
          ? <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-3 pb-20 pt-3 sm:px-6">
            <FollowUpBoard
              tasks={externalTasks}
              clients={activeClients}
              responsibleList={responsibleList}
              currentUser={currentUser?.name ?? ''}
              onCreateFollowUp={createFollowUp}
              onAddSteps={addFollowUpSteps}
              onClose={closeFollowUp}
              onToggleTask={toggleComplete}
              onUpdateTask={updateTask}
            />
          </main>
          : section === 'todos'
          ? <TaskManagementSheet
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
            onCreateTask={addTask}
          />
          : <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-3 pb-20 pt-3 sm:px-6">
            <ProcessesTab
              key={section}
              collaborator={currentUser?.name ?? ''}
              color={currentUser?.color ?? '#0f766e'}
              isTeamView
              tasks={externalTasks}
              clients={activeClients}
              responsibleList={responsibleList}
              allowCollaboratorFilter
              canPlanMaximum={isAdmin && Boolean(currentUser?.name.toLocaleLowerCase('pt-BR').includes('patrick'))}
              section="planned"
              comments={processComments.comments}
              onComment={processComments.addComment}
              onCreate={addTask}
              onCreateFollowUp={createFollowUp}
              onToggleTask={toggleComplete}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
            />
          </main>}
      </div>
    </AppLayout>
  );
}
