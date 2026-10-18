import { useMemo, useState } from "react";
import { 
  Star, 
  Bomb,
  MessageCircle, 
  ListChecks,
  ClipboardList,
  ClipboardCheck,
  FileCheck2,
  History,
  LayoutDashboard,
  Pencil,
  ShieldCheck
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Client } from "@/types/client";
import type { Collaborator } from "@/types/collaborator";
import { ClientWorkDialog } from "@/components/client-work/ClientWorkDialog";
import { CommentsModal } from "@/components/comments/CommentsModal";
import { MarkerReasonDialog } from "@/components/dashboard/MarkerReasonDialog";
import { Task, TaskDependency, TaskFormData, TaskTemplate } from "@/types/task";
import type { WorkItemFilter } from "@/types/workItem";
import { useClientComments } from "@/hooks/useClientComments";
import { useClientWorkItems } from "@/hooks/useClientWorkItems";

interface MobileClientDetailProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  isHighlighted: boolean;
  activeTaskCount: number;
  commentCount: number;
  tasks: Task[];
  dependencies: TaskDependency[];
  templates: TaskTemplate[];
  onTogglePriority: (id: string, reason?: string) => void;
  onToggleHighlight: (id: string, reason?: string) => void;
  collaborators: Collaborator[];
  assignedCollaboratorIds: string[];
  onToggleCollaboratorAssignment: (clientId: string, collaboratorId: string) => void;
  onEditClient: (client: Client) => void;
  onAddTask: (clientId: string, data: TaskFormData) => Promise<boolean>;
  onAddTaskFromTemplate: (clientId: string, template: TaskTemplate, overrides: Partial<TaskFormData>, clientName?: string) => Promise<boolean>;
  onToggleComplete: (taskId: string) => Promise<boolean>;
  onUpdateTask: (taskId: string, data: Partial<Task>) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
  onSetTaskDependencies: (taskId: string, dependsOnIds: string[]) => Promise<boolean>;
}

export function MobileClientDetail({
  client,
  isOpen,
  onClose,
  isHighlighted,
  activeTaskCount,
  commentCount,
  tasks,
  dependencies,
  templates,
  onTogglePriority,
  onToggleHighlight,
  collaborators,
  assignedCollaboratorIds,
  onToggleCollaboratorAssignment,
  onEditClient,
  onAddTask,
  onAddTaskFromTemplate,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onSetTaskDependencies,
}: MobileClientDetailProps) {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [reasonDialog, setReasonDialog] = useState<"priority" | "bo" | null>(null);
  const [workView, setWorkView] = useState<WorkItemFilter>('all');
  const { comments } = useClientComments(client?.id ?? '');
  const { items: clientWorkItems } = useClientWorkItems(client?.id ?? '', tasks);
  const completedTaskCount = tasks.filter((task) => !task.parent_task_id && task.completed).length;
  const workMetrics = useMemo(() => {
    const metrics = {
      deliverables: 0,
      priorities: 0,
      completedAudits: 0,
      pendingAudits: 0,
    };

    clientWorkItems.forEach((item) => {
      if (item.kind === 'deliverable') metrics.deliverables += 1;
      if (item.kind === 'priority') metrics.priorities += 1;
      if (item.kind !== 'audit') return;

      if (item.status === 'completed' || item.status === 'pending_validation') {
        metrics.completedAudits += 1;
      } else {
        metrics.pendingAudits += 1;
      }
    });

    return metrics;
  }, [clientWorkItems]);

  const recentActivity = useMemo(() => {
    const taskActivity = tasks.map((task) => ({
      id: `task-${task.id}`,
      occurredAt: task.completed_at ?? task.created_at,
      icon: task.completed ? <ClipboardCheck className="h-4 w-4 text-emerald-600" /> : <ClipboardList className="h-4 w-4 text-amber-600" />,
      title: task.completed ? 'Tarefa concluída' : 'Tarefa criada',
      detail: task.title,
    }));
    const commentActivity = comments.map((comment) => ({
      id: `comment-${comment.id}`,
      occurredAt: comment.createdAt,
      icon: <MessageCircle className="h-4 w-4 text-indigo-600" />,
      title: `${comment.authorName} comentou`,
      detail: comment.commentText,
    }));

    return [...taskActivity, ...commentActivity]
      .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
      .slice(0, 8);
  }, [comments, tasks]);

  const openWorkView = (view: WorkItemFilter) => {
    setWorkView(view);
    setShowTaskModal(true);
  };

  if (!client) return null;

  

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
          <SheetHeader className="p-4 border-b border-border">
            <div className="flex items-center pr-8">
              <div className="flex items-center gap-3">
                {client.logoUrl ? (
                  <img 
                    src={client.logoUrl} 
                    alt={client.name} 
                    className="w-12 h-12 rounded-lg object-contain bg-muted"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">
                      {client.initials}
                    </span>
                  </div>
                )}
                <button type="button" onClick={() => onEditClient(client)} className="min-w-0 text-left" title="Editar cliente">
                  <SheetTitle className="flex items-center gap-1.5 text-left">
                    <span className="truncate">{client.name}</span>
                    <Pencil className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  </SheetTitle>
                  <span className="text-xs text-muted-foreground">{client.clientType}</span>
                </button>
              </div>
            </div>
          </SheetHeader>

          <div className="h-[calc(85vh-80px)] space-y-4 overflow-y-auto p-4">
            {/* Ações rápidas */}
            <div className="grid grid-cols-4 gap-2">
              <ActionButton
                icon={<Star className={`w-5 h-5 ${client.isPriority ? 'fill-current' : ''}`} />}
                label="Prioridade"
                active={client.isPriority}
                color="rgb(245, 158, 11)"
                onClick={() => {
                  if (!client.isPriority) {
                    setReasonDialog("priority");
                    return;
                  }
                  onTogglePriority(client.id);
                }}
              />
              <ActionButton
                icon={<Bomb className="w-5 h-5" />}
                label="Pode dar BO"
                active={isHighlighted}
                color="rgb(239, 68, 68)"
                onClick={() => {
                  if (!isHighlighted) {
                    setReasonDialog("bo");
                    return;
                  }
                  onToggleHighlight(client.id);
                }}
              />
              <ActionButton
                icon={<ListChecks className="w-5 h-5" />}
                label={`Tarefas (${activeTaskCount})`}
                active={activeTaskCount > 0}
                color="rgb(234, 179, 8)"
                onClick={() => openWorkView('task')}
              />
              <ActionButton
                icon={<MessageCircle className="w-5 h-5" />}
                label={`Comentários (${commentCount})`}
                active={commentCount > 0}
                color="rgb(79, 70, 229)"
                onClick={() => setShowCommentsModal(true)}
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Gestão do cliente</h4>
              <div className="grid grid-cols-4 gap-1.5">
                <ManagementButton color="emerald" icon={<FileCheck2 className="h-4 w-4" />} label="Entregáveis" onClick={() => openWorkView('deliverable')} />
                <ManagementButton color="violet" icon={<ShieldCheck className="h-4 w-4" />} label="Auditorias" onClick={() => openWorkView('audit')} />
                <ManagementButton color="amber" icon={<ClipboardCheck className="h-4 w-4" />} label="Prioridades" onClick={() => openWorkView('priority')} />
                <ManagementButton color="sky" icon={<LayoutDashboard className="h-4 w-4" />} label="Visão do cliente" onClick={() => openWorkView('all')} />
              </div>
              <div className="border-y py-2">
                <div className="grid grid-cols-2 gap-x-3">
                  <span className="text-[13px] font-bold text-emerald-700">{completedTaskCount} tarefas concluídas</span>
                  <span className="text-[13px] font-bold text-indigo-700">{comments.length} comentários registrados</span>
                </div>
                <div className="mt-2 grid grid-cols-4 divide-x border-t pt-2">
                  <CompactMetric value={workMetrics.deliverables} label="Entregáveis" tone="text-emerald-700" />
                  <CompactMetric value={workMetrics.priorities} label="Prioridades" tone="text-amber-700" />
                  <CompactMetric value={workMetrics.completedAudits} label="Aud. concluídas" tone="text-violet-700" />
                  <CompactMetric value={workMetrics.pendingAudits} label="Aud. pendentes" tone="text-rose-700" />
                </div>
                {(client.isPriority || isHighlighted) && (
                  <div className="mt-2 flex flex-wrap gap-1.5 border-t pt-2 text-[10px] font-semibold">
                    {client.isPriority && <span className="bg-amber-50 px-2 py-1 text-amber-700">Em prioridade</span>}
                    {isHighlighted && <span className="bg-red-50 px-2 py-1 text-red-700">Alerta de BO ativo</span>}
                  </div>
                )}
              </div>
            </div>


            {/* Collaborators */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Colaboradores</h4>
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${Math.max(collaborators.length, 1)}, minmax(0, 1fr))` }}
              >
                {collaborators.map((person) => {
                  const isAssigned = assignedCollaboratorIds.includes(person.id);
                  return (
                  <button
                    key={person.id}
                    onClick={() => onToggleCollaboratorAssignment(client.id, person.id)}
                    className="flex min-w-0 flex-col items-center border-b-2 px-1 py-1.5 transition-all"
                    style={{
                      backgroundColor: `${person.color}${isAssigned ? '30' : '12'}`,
                      borderBottomColor: isAssigned ? person.color : 'transparent',
                    }}
                    title={`${isAssigned ? 'Remover' : 'Vincular'} ${person.name}`}
                  >
                    <span 
                      className="grid h-5 w-5 place-items-center rounded-full text-[11px] font-extrabold uppercase text-white"
                      style={{ backgroundColor: person.color }}
                    >
                      {person.initials}
                    </span>
                    <span 
                      className="max-w-full truncate text-[9px] font-semibold capitalize"
                      style={{ color: person.color }}
                    >
                      {person.name}
                    </span>
                  </button>
                );})}
              </div>
            </div>

            <section className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <History className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Últimas movimentações</h4>
                  <p className="text-xs text-muted-foreground">Tarefas e comentários deste cliente</p>
                </div>
              </div>
              {recentActivity.length ? (
                <div className="max-h-52 divide-y overflow-y-auto">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-3 px-4 py-3">
                      <div className="mt-0.5">{activity.icon}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{activity.title}</p>
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{activity.detail}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{formatActivityDate(activity.occurredAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">Ainda não há movimentações registradas.</p>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>

      {/* Task Modal */}
      {showTaskModal && client && (
        <ClientWorkDialog
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          client={client}
          tasks={tasks}
          dependencies={dependencies}
          templates={templates}
          onAddTask={onAddTask}
          onAddTaskFromTemplate={onAddTaskFromTemplate}
          onToggleComplete={onToggleComplete}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onSetTaskDependencies={onSetTaskDependencies}
          initialView={workView}
        />
      )}

      {/* Comments Modal */}
      {showCommentsModal && client && (
        <CommentsModal
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
          clientId={client.id}
          clientName={client.name}
        />
      )}

      {reasonDialog && (
        <MarkerReasonDialog
          open={!!reasonDialog}
          kind={reasonDialog}
          defaultValue={reasonDialog === "priority" ? client.priorityReason : client.boReason}
          onOpenChange={(open) => !open && setReasonDialog(null)}
          onConfirm={(reason) => {
            if (reasonDialog === "priority") onTogglePriority(client.id, reason);
            else onToggleHighlight(client.id, reason);
          }}
        />
      )}
    </>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}

function ActionButton({ icon, label, active, color, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-xl p-2 transition-all ${
        active ? 'text-white' : 'bg-muted text-muted-foreground'
      }`}
      style={{
        backgroundColor: active ? color : undefined,
      }}
    >
      {icon}
      <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
    </button>
  );
}

function ManagementButton({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: 'emerald' | 'violet' | 'amber' | 'sky'; onClick: () => void }) {
  const colorClasses = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
    violet: 'border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
    sky: 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 border px-1 text-center text-[9px] font-semibold leading-tight transition-colors ${colorClasses[color]}`}
    >
      <span>{icon}</span>
      <span className="max-w-full truncate">{label}</span>
    </button>
  );
}

function CompactMetric({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="min-w-0 px-1 text-center">
      <div className={`text-base font-extrabold leading-none ${tone}`}>{value}</div>
      <div className="mt-1 truncate text-[8px] font-semibold uppercase text-muted-foreground" title={label}>{label}</div>
    </div>
  );
}

function formatActivityDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="flex flex-col items-center gap-1 p-4 rounded-xl border border-border bg-card">
      {icon}
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

interface DemandStatusCardProps {
  label: string;
  count: number;
  color: string;
}

function DemandStatusCard({ label, count, color }: DemandStatusCardProps) {
  return (
    <div className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border">
      <div className={`w-full h-2 rounded-full ${color}`} />
      <span className="text-lg font-bold text-foreground">{count}</span>
      <span className="text-[9px] text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}
