import { Users, Star, Sparkles, UserCheck, MessageCircle, ListChecks, CheckSquare, ShieldCheck, AlertTriangle } from "lucide-react";
import { COLLABORATOR_COLORS, CollaboratorName } from "@/types/client";

interface MobileCompactHeaderProps {
  totalClients: number;
  acCount: number;
  avCount: number;
  collaboratorSelectedStats: Record<CollaboratorName, number>;
  priorityCount: number;
  highlightedCount: number;
  responsaveisCount: number;
  commentsCount: number;
  jackboxCount: number;
  selectedCount: number;
  deBoaCount: number;
  comAlertaCount: number;
  filterFlags: {
    priority: boolean;
    highlighted: boolean;
    hasCollaborators: boolean;
    withComments: boolean;
    withJackbox: boolean;
    selected: boolean;
  };
  collaboratorFilters: CollaboratorName[];
  alertFilter: 'all' | 'deBoa' | 'comAlerta';
  onFilterFlagToggle: (flag: 'priority' | 'highlighted' | 'hasCollaborators' | 'withComments' | 'withJackbox' | 'selected') => void;
  onCollaboratorFilterToggle: (collaborator: CollaboratorName) => void;
  onAlertFilterChange: (filter: 'all' | 'deBoa' | 'comAlerta') => void;
}

export function MobileCompactHeader({
  totalClients,
  acCount,
  avCount,
  collaboratorSelectedStats,
  priorityCount,
  highlightedCount,
  responsaveisCount,
  commentsCount,
  jackboxCount,
  selectedCount,
  deBoaCount,
  comAlertaCount,
  filterFlags,
  collaboratorFilters,
  alertFilter,
  onFilterFlagToggle,
  onCollaboratorFilterToggle,
  onAlertFilterChange,
}: MobileCompactHeaderProps) {
  const collaborators: CollaboratorName[] = ['celine', 'gabi', 'darley', 'vanessa'];
  
  return (
    <div className="flex flex-col bg-card border-b border-border">
      {/* Row 1: Main stats + De Boa / Com Alerta */}
      <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto scrollbar-hide">
        <StatCard icon={<Users className="w-3.5 h-3.5" />} value={totalClients} label="TOTAL" />
        <StatCard value={acCount} label="AC" variant="success" />
        <StatCard value={avCount} label="AV" variant="warning" />
        <div className="w-px h-7 bg-border shrink-0" />
        <AlertBadge
          icon={<ShieldCheck className="w-3 h-3" />}
          value={deBoaCount}
          label="DE BOA"
          color="rgb(16, 185, 129)"
          active={alertFilter === 'deBoa'}
          onClick={() => onAlertFilterChange(alertFilter === 'deBoa' ? 'all' : 'deBoa')}
        />
        <AlertBadge
          icon={<AlertTriangle className="w-3 h-3" />}
          value={comAlertaCount}
          label="ALERTA"
          color="rgb(239, 68, 68)"
          active={alertFilter === 'comAlerta'}
          onClick={() => onAlertFilterChange(alertFilter === 'comAlerta' ? 'all' : 'comAlerta')}
        />
      </div>

      {/* Row 2: Collaborator cards - clickable as filters */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto scrollbar-hide">
        {collaborators.map(name => (
          <button
            key={name}
            onClick={() => onCollaboratorFilterToggle(name)}
            className={`flex flex-col rounded-lg border overflow-hidden transition-all shrink-0 ${
              collaboratorFilters.includes(name)
                ? 'ring-2 ring-offset-1 ring-primary shadow-lg'
                : 'border-border'
            }`}
          >
            <div 
              className="px-2.5 py-0.5 text-center"
              style={{ backgroundColor: COLLABORATOR_COLORS[name] }}
            >
              <span className="text-[9px] font-bold text-white uppercase tracking-wide">
                {name}
              </span>
            </div>
            <div className="flex items-center justify-center px-2 py-0.5 bg-card">
              <span className="text-sm font-bold leading-none">{collaboratorSelectedStats[name]}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Row 3: Filter pills */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto scrollbar-hide">
        <FilterBadge
          icon={<Star className="w-3 h-3" />}
          value={priorityCount}
          label="PRIO"
          active={filterFlags.priority}
          onClick={() => onFilterFlagToggle('priority')}
          activeColor="rgb(245, 158, 11)"
        />
        <FilterBadge
          icon={<Sparkles className="w-3 h-3" />}
          value={highlightedCount}
          label="DEST"
          active={filterFlags.highlighted}
          onClick={() => onFilterFlagToggle('highlighted')}
          activeColor="rgb(59, 130, 246)"
        />
        <FilterBadge
          icon={<UserCheck className="w-3 h-3" />}
          value={responsaveisCount}
          label="RESP"
          active={filterFlags.hasCollaborators}
          onClick={() => onFilterFlagToggle('hasCollaborators')}
          activeColor="rgb(16, 185, 129)"
        />
        <FilterBadge
          icon={<MessageCircle className="w-3 h-3" />}
          value={commentsCount}
          label="COMENT"
          active={filterFlags.withComments}
          onClick={() => onFilterFlagToggle('withComments')}
          activeColor="rgb(99, 102, 241)"
        />
        <FilterBadge
          icon={<ListChecks className="w-3 h-3" />}
          value={jackboxCount}
          label="TAREFA"
          active={filterFlags.withJackbox}
          onClick={() => onFilterFlagToggle('withJackbox')}
          activeColor="rgb(234, 179, 8)"
        />
        <FilterBadge
          icon={<CheckSquare className="w-3 h-3" />}
          value={selectedCount}
          label="SELEC"
          active={filterFlags.selected}
          onClick={() => onFilterFlagToggle('selected')}
          activeColor="rgb(139, 92, 246)"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon?: React.ReactNode;
  value: number;
  label: string;
  variant?: 'default' | 'success' | 'warning';
}

function StatCard({ icon, value, label, variant = 'default' }: StatCardProps) {
  const variantClasses = {
    default: 'border-border bg-background',
    success: 'border-emerald-500/30 bg-emerald-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
  };
  const textClasses = {
    default: 'text-foreground',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
  };
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border shrink-0 ${variantClasses[variant]}`}>
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className={`text-sm font-bold ${textClasses[variant]}`}>{value}</span>
      <span className="text-[8px] text-muted-foreground uppercase">{label}</span>
    </div>
  );
}

interface AlertBadgeProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}

function AlertBadge({ icon, value, label, color, active, onClick }: AlertBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all shrink-0 ${
        active ? 'text-white ring-1 ring-offset-1' : 'text-muted-foreground'
      }`}
      style={{
        backgroundColor: active ? color : 'transparent',
        borderColor: color,
        color: active ? '#fff' : color,
      }}
    >
      {icon}
      <span className="text-xs font-bold">{value}</span>
      <span className="text-[7px] uppercase opacity-80">{label}</span>
    </button>
  );
}

interface FilterBadgeProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  active: boolean;
  onClick: () => void;
  activeColor: string;
}

function FilterBadge({ icon, value, label, active, onClick, activeColor }: FilterBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all shrink-0 ${
        active 
          ? 'text-white border-transparent shadow-md' 
          : 'border-border bg-background text-muted-foreground'
      }`}
      style={{
        backgroundColor: active ? activeColor : undefined,
        borderColor: active ? activeColor : undefined,
      }}
    >
      {icon}
      <span className="text-xs font-bold">{value}</span>
      <span className="text-[7px] uppercase">{label}</span>
    </button>
  );
}
