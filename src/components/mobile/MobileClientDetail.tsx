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
  ShieldCheck,
  X
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Client, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";
import { ClientWorkDialog } from "@/components/client-work/ClientWorkDialog";
import { CommentsModal } from "@/components/comments/CommentsModal";
import { MarkerReasonDialog } from "@/components/dashboard/MarkerReasonDialog";
import { Task, TaskFormData } from "@/types/task";
import type { WorkItemFilter } from "@/types/workItem";
import { useClientComments } from "@/hooks/useClientComments";

interface MobileClientDetailProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  isHighlighted: boolean;
  activeTaskCount: number;
  commentCount: number;
  tasks: Task[];
  onTogglePriority: (id: string, reason?: string) => void;
  onToggleHighlight: (id: string, reason?: string) => void;
  onToggleChecked: (id: string) => void;
  onToggleCollaborator: (id: string, collaborator: CollaboratorName) => void;
  onAddTask: (clientId: string, data: TaskFormData) => Promise<boolean>;
  onToggleComplete: (taskId: string) => Promise<boolean>;
  onUpdateTask: (taskId: string, data: Partial<Task>) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
}

export function MobileClientDetail({
  client,
  isOpen,
  onClose,
  isHighlighted,
  activeTaskCount,
  commentCount,
  tasks,
  onTogglePriority,
  onToggleHighlight,
  onToggleChecked,
  onToggleCollaborator,
  onAddTask,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
}: MobileClientDetailProps) {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [reasonDialog, setReasonDialog] = useState<"priority" | "bo" | null>(null);
  const [workView, setWorkView] = useState<WorkItemFilter>('all');
  const { comments } = useClientComments(client?.id ?? '');

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
            <div className="flex items-center justify-between">
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
                <div>
                  <SheetTitle className="text-left">{client.name}</SheetTitle>
                  <span className="text-xs text-muted-foreground">{client.clientType}</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </SheetHeader>

          <div className="p-4 space-y-6 overflow-y-auto h-[calc(85vh-80px)]">
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
              <div className="grid grid-cols-2 gap-2">
                <ManagementButton color="emerald" icon={<FileCheck2 className="h-4 w-4" />} label="Entregáveis" onClick={() => openWorkView('deliverable')} />
                <ManagementButton color="violet" icon={<ShieldCheck className="h-4 w-4" />} label="Auditorias" onClick={() => openWorkView('audit')} />
                <ManagementButton color="amber" icon={<ClipboardCheck className="h-4 w-4" />} label="Prioridades" onClick={() => openWorkView('priority')} />
                <ManagementButton color="sky" icon={<LayoutDashboard className="h-4 w-4" />} label="Visão do cliente" onClick={() => openWorkView('all')} />
              </div>
            </div>


            {/* Collaborators */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Colaboradores</h4>
              <div className="grid grid-cols-4 gap-2">
                {COLLABORATOR_NAMES.map(name => (
                  <button
                    key={name}
                    onClick={() => onToggleCollaborator(client.id, name)}
                    className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                      client.collaborators[name] ? '' : 'opacity-40'
                    }`}
                    style={{
                      backgroundColor: client.collaborators[name] 
                        ? COLLABORATOR_COLORS[name] 
                        : `${COLLABORATOR_COLORS[name]}30`,
                    }}
                  >
                    <span 
                      className={`text-sm font-bold uppercase ${
                        client.collaborators[name] ? 'text-white' : ''
                      }`}
                      style={{ 
                        color: client.collaborators[name] ? 'white' : COLLABORATOR_COLORS[name] 
                      }}
                    >
                      {name.slice(0, 2)}
                    </span>
                    <span 
                      className="text-[10px] font-medium capitalize"
                      style={{ 
                        color: client.collaborators[name] ? 'white' : COLLABORATOR_COLORS[name] 
                      }}
                    >
                      {name}
                    </span>
                  </button>
                ))}
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
          onAddTask={onAddTask}
          onToggleComplete={onToggleComplete}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
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
      className={`flex min-h-11 items-center gap-2 rounded-lg border px-3 text-left text-sm font-medium transition-colors ${colorClasses[color]}`}
    >
      <span>{icon}</span>
      {label}
    </button>
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
