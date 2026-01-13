import { ArrowDownAZ, ArrowUpAZ, Star, Sparkles, X, ListChecks, RotateCcw, Users, Building2, Briefcase, MessageCircle, MessageCircleOff, CheckSquare } from "lucide-react";
import { COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName, ClientType } from "@/types/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type SortOption = 'order' | 'processes' | 'licenses' | 'demands' | 'name' | 'priority' | 'jackbox' | 'comments';
export type SortDirection = 'asc' | 'desc';
export type ClientTypeFilter = 'all' | 'AC' | 'AV';

// Multi-select filter flags
export interface FilterFlags {
  priority: boolean;
  highlighted: boolean;
  selected: boolean;
  withJackbox: boolean;
  withoutJackbox: boolean;
  withComments: boolean;
  withoutComments: boolean;
}

interface FilterBarProps {
  sortBy: SortOption;
  sortDirection: SortDirection;
  filterFlags: FilterFlags;
  collaboratorFilters: CollaboratorName[];
  clientTypeFilter: ClientTypeFilter;
  priorityCount: number;
  highlightedCount: number;
  selectedCount: number;
  jackboxCount: number;
  commentsCount: number;
  visibleCount: number;
  totalCount: number;
  acCount: number;
  avCount: number;
  onSortChange: (sort: SortOption) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
  onFilterFlagToggle: (flag: keyof FilterFlags) => void;
  onCollaboratorFilterToggle: (collaborator: CollaboratorName) => void;
  onClientTypeFilterChange: (type: ClientTypeFilter) => void;
  onClearHighlights: () => void;
  onClearAllFilters: () => void;
}

export function FilterBar({
  sortBy,
  sortDirection,
  filterFlags,
  collaboratorFilters,
  clientTypeFilter,
  priorityCount,
  highlightedCount,
  selectedCount,
  jackboxCount,
  commentsCount,
  visibleCount,
  totalCount,
  acCount,
  avCount,
  onSortChange,
  onSortDirectionChange,
  onFilterFlagToggle,
  onCollaboratorFilterToggle,
  onClientTypeFilterChange,
  onClearHighlights,
  onClearAllFilters,
}: FilterBarProps) {

  const handleSortClick = (sort: SortOption) => {
    if (sortBy === sort) {
      onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(sort);
      onSortDirectionChange('desc');
    }
  };

  // Check if any filter is active
  const hasActiveFilters = 
    filterFlags.priority || 
    filterFlags.highlighted || 
    filterFlags.selected ||
    filterFlags.withJackbox || 
    filterFlags.withoutJackbox || 
    filterFlags.withComments ||
    filterFlags.withoutComments ||
    collaboratorFilters.length > 0 ||
    clientTypeFilter !== 'all';

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-1.5 px-4 py-1.5 bg-card border-b border-border">
        {/* Row 1: Sort Options + Client Type */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Sort Options */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              {sortDirection === 'desc' ? (
                <ArrowDownAZ className="w-3 h-3" />
              ) : (
                <ArrowUpAZ className="w-3 h-3" />
              )}
              Ordenar:
            </span>
            <div className="flex items-center gap-0.5 flex-wrap">
              <SortButton 
                active={sortBy === 'order'} 
                direction={sortBy === 'order' ? sortDirection : undefined}
                onClick={() => handleSortClick('order')}
              >
                Ordem
              </SortButton>
              <SortButton 
                active={sortBy === 'priority'} 
                direction={sortBy === 'priority' ? sortDirection : undefined}
                onClick={() => handleSortClick('priority')}
                icon={<Star className="w-3 h-3" />}
              >
                Prioridade
              </SortButton>
              <SortButton 
                active={sortBy === 'jackbox'} 
                direction={sortBy === 'jackbox' ? sortDirection : undefined}
                onClick={() => handleSortClick('jackbox')}
                icon={<ListChecks className="w-3 h-3" />}
              >
                Jackbox
              </SortButton>
              <SortButton 
                active={sortBy === 'processes'} 
                direction={sortBy === 'processes' ? sortDirection : undefined}
                onClick={() => handleSortClick('processes')}
              >
                Processos
              </SortButton>
              <SortButton 
                active={sortBy === 'licenses'} 
                direction={sortBy === 'licenses' ? sortDirection : undefined}
                onClick={() => handleSortClick('licenses')}
              >
                Licenças
              </SortButton>
              <SortButton 
                active={sortBy === 'demands'} 
                direction={sortBy === 'demands' ? sortDirection : undefined}
                onClick={() => handleSortClick('demands')}
              >
                Demandas
              </SortButton>
              <SortButton 
                active={sortBy === 'name'} 
                direction={sortBy === 'name' ? sortDirection : undefined}
                onClick={() => handleSortClick('name')}
              >
                Nome
              </SortButton>
            </div>
          </div>

          {/* Client Type Filter (AC/AV) */}
          <div className="flex items-center gap-0.5">
            <ClientTypeButton
              type="all"
              active={clientTypeFilter === 'all'}
              count={totalCount}
              onClick={() => onClientTypeFilterChange('all')}
            />
            <ClientTypeButton
              type="AC"
              active={clientTypeFilter === 'AC'}
              count={acCount}
              onClick={() => onClientTypeFilterChange('AC')}
            />
            <ClientTypeButton
              type="AV"
              active={clientTypeFilter === 'AV'}
              count={avCount}
              onClick={() => onClientTypeFilterChange('AV')}
            />
          </div>
        </div>

        {/* Row 2: Filter Badges + Collaborators + Client Count */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Filter Badges - All clickable with counters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Priority filter */}
            <IconFilterButton
              active={filterFlags.priority}
              onClick={() => onFilterFlagToggle('priority')}
              tooltip="Filtrar por prioridade"
              badge={priorityCount > 0 ? priorityCount : undefined}
              activeColor="rgb(245, 158, 11)"
            >
              <Star className={`w-3.5 h-3.5 ${filterFlags.priority ? 'fill-current' : ''}`} />
            </IconFilterButton>

            {/* Highlighted filter */}
            <IconFilterButton
              active={filterFlags.highlighted}
              onClick={() => onFilterFlagToggle('highlighted')}
              tooltip="Filtrar destacados"
              badge={highlightedCount > 0 ? highlightedCount : undefined}
              activeColor="rgb(59, 130, 246)"
            >
              <Sparkles className={`w-3.5 h-3.5 ${filterFlags.highlighted ? 'fill-current' : ''}`} />
            </IconFilterButton>

            {/* Selected filter (checkbox) */}
            <IconFilterButton
              active={filterFlags.selected}
              onClick={() => onFilterFlagToggle('selected')}
              tooltip="Filtrar selecionados (checkbox)"
              badge={selectedCount > 0 ? selectedCount : undefined}
              activeColor="rgb(16, 185, 129)"
            >
              <CheckSquare className={`w-3.5 h-3.5 ${filterFlags.selected ? 'fill-current' : ''}`} />
            </IconFilterButton>

            {/* Jackbox filter - with tasks */}
            <IconFilterButton
              active={filterFlags.withJackbox}
              onClick={() => onFilterFlagToggle('withJackbox')}
              tooltip="Com tarefas abertas"
              badge={jackboxCount > 0 ? jackboxCount : undefined}
              activeColor="rgb(34, 197, 94)"
            >
              <ListChecks className="w-3.5 h-3.5" />
            </IconFilterButton>

            {/* Comments filter - with comments */}
            <IconFilterButton
              active={filterFlags.withComments}
              onClick={() => onFilterFlagToggle('withComments')}
              tooltip="Com comentários"
              badge={commentsCount > 0 ? commentsCount : undefined}
              activeColor="rgb(99, 102, 241)"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </IconFilterButton>

            {/* Comments filter - without comments */}
            <IconFilterButton
              active={filterFlags.withoutComments}
              onClick={() => onFilterFlagToggle('withoutComments')}
              tooltip="Sem comentários"
              activeColor="rgb(148, 163, 184)"
            >
              <MessageCircleOff className="w-3.5 h-3.5" />
            </IconFilterButton>

            {/* Separator */}
            <div className="w-px h-5 bg-border mx-1" />

            {/* Collaborator filters - larger colored squares */}
            <div className="flex items-center gap-1">
              {COLLABORATOR_NAMES.map((name) => (
                <CollaboratorColorSquare
                  key={name}
                  name={name}
                  active={collaboratorFilters.includes(name)}
                  onClick={() => onCollaboratorFilterToggle(name)}
                />
              ))}
            </div>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <>
                <div className="w-px h-4 bg-border mx-0.5" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onClearAllFilters}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Limpar filtros
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            {/* Clear highlights button */}
            {highlightedCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onClearHighlights}
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Limpar destaques
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Client Count Badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 border border-primary/30">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-primary">{visibleCount}</span>
            {visibleCount !== totalCount && (
              <span className="text-[10px] text-muted-foreground">/ {totalCount}</span>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

interface SortButtonProps {
  active: boolean;
  direction?: SortDirection;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function SortButton({ active, direction, onClick, children, icon }: SortButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
        active 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
      }`}
    >
      {icon}
      {children}
      {active && direction && (
        <span className="text-[10px] opacity-80">
          {direction === 'desc' ? '↓' : '↑'}
        </span>
      )}
    </button>
  );
}

interface IconFilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tooltip: string;
  badge?: number;
  activeColor: string;
}

function IconFilterButton({ active, onClick, children, tooltip, badge, activeColor }: IconFilterButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`relative min-w-[28px] h-7 px-1.5 rounded transition-all flex items-center justify-center border ${
            active 
              ? 'border-current' 
              : 'border-transparent bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
          }`}
          style={{
            color: active ? activeColor : undefined,
            backgroundColor: active ? `${activeColor}15` : undefined,
          }}
        >
          {children}
          {badge !== undefined && badge > 0 && (
            <span 
              className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
              style={{ backgroundColor: activeColor }}
            >
              {badge}
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

interface ClientTypeButtonProps {
  type: ClientTypeFilter;
  active: boolean;
  count: number;
  onClick: () => void;
}

function ClientTypeButton({ type, active, onClick, count }: ClientTypeButtonProps) {
  const labels: Record<ClientTypeFilter, { short: string; tooltip: string; color: string }> = {
    all: { short: 'TODOS', tooltip: 'Todos os clientes', color: 'rgb(100, 116, 139)' },
    AC: { short: 'AC', tooltip: 'Acompanhamento Ambiental', color: 'rgb(16, 185, 129)' },
    AV: { short: 'AV', tooltip: 'Avulso', color: 'rgb(245, 158, 11)' },
  };
  
  const { short, tooltip, color } = labels[type];
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`px-2 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 border ${
            active 
              ? 'text-white border-transparent' 
              : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/50 border-transparent'
          }`}
          style={{
            backgroundColor: active ? color : undefined,
          }}
        >
          {type === 'all' ? (
            <Building2 className="w-3 h-3" />
          ) : type === 'AC' ? (
            <Building2 className="w-3 h-3" />
          ) : (
            <Briefcase className="w-3 h-3" />
          )}
          {short}
          <span className={`text-[10px] ${active ? 'opacity-80' : 'opacity-60'}`}>
            ({count})
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

interface CollaboratorColorSquareProps {
  name: CollaboratorName;
  active: boolean;
  onClick: () => void;
}

function CollaboratorColorSquare({ name, active, onClick }: CollaboratorColorSquareProps) {
  const color = COLLABORATOR_COLORS[name];
  const initials = name.slice(0, 2).toUpperCase();
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`w-8 h-8 rounded-md text-[11px] font-bold transition-all border-2 flex items-center justify-center shadow-sm hover:scale-105 ${
            active 
              ? 'text-white ring-2 ring-offset-1 ring-offset-background' 
              : 'opacity-40 hover:opacity-70'
          }`}
          style={{
            backgroundColor: active ? color : 'transparent',
            borderColor: color,
            color: active ? '#fff' : color,
            boxShadow: active ? `0 2px 8px ${color}50` : 'none',
          }}
        >
          {initials}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {displayName}
      </TooltipContent>
    </Tooltip>
  );
}
