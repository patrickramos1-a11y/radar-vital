import { Users, FileText, Shield, ClipboardList, Star, Sparkles, UserCheck, MessageCircle } from "lucide-react";
import { COLLABORATOR_COLORS, CollaboratorName } from "@/types/client";

interface MobileCompactHeaderProps {
  totalClients: number;
  totalProcesses: number;
  totalLicenses: number;
  totalDemands: number;
  collaboratorDemandStats: Record<CollaboratorName, number>;
  collaboratorSelectedStats: Record<CollaboratorName, number>;
  priorityCount: number;
  highlightedCount: number;
  responsaveisCount: number; // clients with at least one collaborator assigned
  commentsCount: number;
  // Filter state
  filterFlags: {
    priority: boolean;
    highlighted: boolean;
    hasCollaborators: boolean;
    withComments: boolean;
  };
  collaboratorFilters: CollaboratorName[];
  onFilterFlagToggle: (flag: 'priority' | 'highlighted' | 'hasCollaborators' | 'withComments') => void;
  onCollaboratorFilterToggle: (collaborator: CollaboratorName) => void;
}

export function MobileCompactHeader({
  totalClients,
  totalProcesses,
  totalLicenses,
  totalDemands,
  collaboratorDemandStats,
  collaboratorSelectedStats,
  priorityCount,
  highlightedCount,
  responsaveisCount,
  commentsCount,
  filterFlags,
  collaboratorFilters,
  onFilterFlagToggle,
  onCollaboratorFilterToggle,
}: MobileCompactHeaderProps) {
  const collaborators: CollaboratorName[] = ['celine', 'gabi', 'darley', 'vanessa'];
  
  return (
    <div className="flex flex-col bg-card border-b border-border">
      {/* Row 1: Main stats */}
      <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-hide">
        <StatCard icon={<Users className="w-3.5 h-3.5" />} value={totalClients} label="CLIENTES" />
        <StatCard icon={<FileText className="w-3.5 h-3.5" />} value={totalProcesses} label="PROCESSOS" />
        <StatCard icon={<Shield className="w-3.5 h-3.5" />} value={totalLicenses} label="LICENÇAS" />
        <StatCard icon={<ClipboardList className="w-3.5 h-3.5" />} value={totalDemands} label="DEMANDAS" />
      </div>

      {/* Row 2: Collaborator cards - clickable as filters */}
      <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-hide">
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
              className="px-3 py-1 text-center"
              style={{ backgroundColor: COLLABORATOR_COLORS[name] }}
            >
              <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                {name}
              </span>
            </div>
            <div className="flex items-stretch divide-x divide-border bg-card">
              <div className="flex flex-col items-center px-2.5 py-1">
                <span className="text-sm font-bold leading-none">{collaboratorDemandStats[name]}</span>
                <span className="text-[8px] text-muted-foreground uppercase">DEM</span>
              </div>
              <div className="flex flex-col items-center px-2.5 py-1">
                <span className="text-sm font-bold leading-none">{collaboratorSelectedStats[name]}</span>
                <span className="text-[8px] text-muted-foreground uppercase">SEL</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Row 3: Filter pills (Prioridade, Destaque, Selecionados, Comentários) */}
      <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-hide">
        <FilterBadge
          icon={<Star className="w-3.5 h-3.5" />}
          value={priorityCount}
          label="PRIORIDADE"
          active={filterFlags.priority}
          onClick={() => onFilterFlagToggle('priority')}
          activeColor="rgb(245, 158, 11)"
        />
        <FilterBadge
          icon={<Sparkles className="w-3.5 h-3.5" />}
          value={highlightedCount}
          label="DESTAQUE"
          active={filterFlags.highlighted}
          onClick={() => onFilterFlagToggle('highlighted')}
          activeColor="rgb(59, 130, 246)"
        />
        <FilterBadge
          icon={<UserCheck className="w-3.5 h-3.5" />}
          value={responsaveisCount}
          label="RESPONSÁVEIS"
          active={filterFlags.hasCollaborators}
          onClick={() => onFilterFlagToggle('hasCollaborators')}
          activeColor="rgb(16, 185, 129)"
        />
        <FilterBadge
          icon={<MessageCircle className="w-3.5 h-3.5" />}
          value={commentsCount}
          label="COMENTÁRIOS"
          active={filterFlags.withComments}
          onClick={() => onFilterFlagToggle('withComments')}
          activeColor="rgb(99, 102, 241)"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-background shrink-0">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
      <span className="text-[9px] text-muted-foreground uppercase">{label}</span>
    </div>
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
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all shrink-0 ${
        active 
          ? 'text-white border-transparent shadow-md' 
          : 'border-border bg-background text-muted-foreground hover:bg-muted'
      }`}
      style={{
        backgroundColor: active ? activeColor : undefined,
        borderColor: active ? activeColor : undefined,
      }}
    >
      {icon}
      <span className="text-sm font-bold">{value}</span>
      <span className="text-[9px] uppercase">{label}</span>
    </button>
  );
}
