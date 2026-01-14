import { useState } from "react";
import { 
  Star, 
  Sparkles, 
  CheckSquare, 
  MessageCircle, 
  ListChecks,
  FileText,
  Shield,
  ClipboardList,
  X
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Client, calculateTotalDemands, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";
import { TaskModal } from "@/components/checklist/TaskModal";
import { CommentsModal } from "@/components/comments/CommentsModal";
import { Task, TaskFormData } from "@/types/task";

interface MobileClientDetailProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  isHighlighted: boolean;
  activeTaskCount: number;
  commentCount: number;
  tasks: Task[];
  onTogglePriority: (id: string) => void;
  onToggleHighlight: (id: string) => void;
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

  if (!client) return null;

  const totalDemands = calculateTotalDemands(client.demands);

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
            {/* Quick actions */}
            <div className="grid grid-cols-4 gap-2">
              <ActionButton
                icon={<Star className={`w-5 h-5 ${client.isPriority ? 'fill-current' : ''}`} />}
                label="Prioridade"
                active={client.isPriority}
                color="rgb(245, 158, 11)"
                onClick={() => onTogglePriority(client.id)}
              />
              <ActionButton
                icon={<Sparkles className={`w-5 h-5 ${isHighlighted ? 'fill-current' : ''}`} />}
                label="Destaque"
                active={isHighlighted}
                color="rgb(59, 130, 246)"
                onClick={() => onToggleHighlight(client.id)}
              />
              <ActionButton
                icon={<CheckSquare className="w-5 h-5" />}
                label="Selecionado"
                active={client.isChecked}
                color="rgb(16, 185, 129)"
                onClick={() => onToggleChecked(client.id)}
              />
              <ActionButton
                icon={<ListChecks className="w-5 h-5" />}
                label={`Jackbox (${activeTaskCount})`}
                active={activeTaskCount > 0}
                color="rgb(234, 179, 8)"
                onClick={() => setShowTaskModal(true)}
              />
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                icon={<FileText className="w-5 h-5 text-blue-500" />}
                value={client.processes}
                label="Processos"
              />
              <StatCard
                icon={<Shield className="w-5 h-5 text-green-500" />}
                value={client.licenses}
                label="Licenças"
              />
              <StatCard
                icon={<ClipboardList className="w-5 h-5 text-purple-500" />}
                value={totalDemands}
                label="Demandas"
              />
            </div>

            {/* Demand breakdown */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Status das Demandas</h4>
              <div className="grid grid-cols-4 gap-2">
                <DemandStatusCard 
                  label="Concluído" 
                  count={client.demands.completed} 
                  color="bg-green-600" 
                />
                <DemandStatusCard 
                  label="Em Exec." 
                  count={client.demands.inProgress} 
                  color="bg-emerald-400" 
                />
                <DemandStatusCard 
                  label="Não Feito" 
                  count={client.demands.notStarted} 
                  color="bg-gray-400" 
                />
                <DemandStatusCard 
                  label="Cancelado" 
                  count={client.demands.cancelled} 
                  color="bg-red-500" 
                />
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

            {/* Comments section */}
            <button
              onClick={() => setShowCommentsModal(true)}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-foreground">Comentários</h4>
                  <p className="text-xs text-muted-foreground">
                    {commentCount > 0 ? `${commentCount} comentários` : 'Nenhum comentário'}
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold text-indigo-600">{commentCount}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Task Modal */}
      {showTaskModal && client && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          client={client}
          tasks={tasks}
          onAddTask={onAddTask}
          onToggleComplete={onToggleComplete}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
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
      className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
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
