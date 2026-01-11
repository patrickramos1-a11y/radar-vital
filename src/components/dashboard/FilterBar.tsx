import { ArrowDownAZ, ArrowUpAZ, Star, Sparkles, X, ListChecks, RotateCcw } from "lucide-react";
import { COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type SortOption = 'order' | 'processes' | 'licenses' | 'demands' | 'name' | 'priority' | 'jackbox';
export type SortDirection = 'asc' | 'desc';

// Multi-select filter flags
export interface FilterFlags {
  priority: boolean;
  highlighted: boolean;
  withJackbox: boolean;
  withoutJackbox: boolean;
}

interface FilterBarProps {
  sortBy: SortOption;
  sortDirection: SortDirection;
  filterFlags: FilterFlags;
  collaboratorFilters: CollaboratorName[];
  highlightedCount: number;
  jackboxCount: number;
  onSortChange: (sort: SortOption) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
  onFilterFlagToggle: (flag: keyof FilterFlags) => void;
  onCollaboratorFilterToggle: (collaborator: CollaboratorName) => void;
  onClearHighlights: () => void;
  onClearAllFilters: () => void;
}

export function FilterBar({
  sortBy,
  sortDirection,
  filterFlags,
  collaboratorFilters,
  highlightedCount,
  jackboxCount,
  onSortChange,
  onSortDirectionChange,
  onFilterFlagToggle,
  onCollaboratorFilterToggle,
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
    filterFlags.withJackbox || 
    filterFlags.withoutJackbox || 
    collaboratorFilters.length > 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 bg-card border-b border-border">
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

        {/* Filter Options - Multi-select with icons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Priority filter */}
          <IconFilterButton
            active={filterFlags.priority}
            onClick={() => onFilterFlagToggle('priority')}
            tooltip="Filtrar por prioridade"
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

          {/* Separator */}
          <div className="w-px h-4 bg-border mx-0.5" />

          {/* Collaborator filters - compact pills */}
          {COLLABORATOR_NAMES.map((name) => (
            <CollaboratorFilterPill
              key={name}
              name={name}
              active={collaboratorFilters.includes(name)}
              onClick={() => onCollaboratorFilterToggle(name)}
            />
          ))}

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

interface CollaboratorFilterPillProps {
  name: CollaboratorName;
  active: boolean;
  onClick: () => void;
}

function CollaboratorFilterPill({ name, active, onClick }: CollaboratorFilterPillProps) {
  const color = COLLABORATOR_COLORS[name];
  const initials = name.slice(0, 2).toUpperCase();
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`min-w-[26px] h-6 px-1 rounded text-[10px] font-bold transition-all border ${
            active 
              ? 'text-white' 
              : 'opacity-50 hover:opacity-80'
          }`}
          style={{
            backgroundColor: active ? color : 'transparent',
            borderColor: color,
            color: active ? '#fff' : color,
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