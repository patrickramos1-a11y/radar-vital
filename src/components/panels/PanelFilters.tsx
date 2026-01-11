import { ReactNode, useState } from "react";
import { Search, Star, Sparkles, ListChecks, CheckCircle, ArrowDownAZ, ArrowUpAZ, RotateCcw, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";

export type PanelSortOption = 
  | 'name' 
  | 'priority' 
  | 'jackbox' 
  | 'checked'
  | 'processes' 
  | 'licenses' 
  | 'demands'
  | 'critical'
  | 'expiring';

export type SortDirection = 'asc' | 'desc';

export interface PanelFilterFlags {
  priority: boolean;
  highlighted: boolean;
  withJackbox: boolean;
  checked: boolean;
}

interface PanelFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterFlags: PanelFilterFlags;
  onFilterFlagToggle: (flag: keyof PanelFilterFlags) => void;
  collaboratorFilters: CollaboratorName[];
  onCollaboratorFilterToggle: (collaborator: CollaboratorName) => void;
  sortBy: PanelSortOption;
  sortDirection: SortDirection;
  onSortChange: (sort: PanelSortOption) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
  onClearFilters: () => void;
  highlightedCount: number;
  jackboxCount: number;
  checkedCount: number;
  showCollaborators?: boolean;
  extraSortOptions?: { value: PanelSortOption; label: string }[];
  extraFilters?: ReactNode;
}

export function PanelFilters({
  searchQuery,
  onSearchChange,
  filterFlags,
  onFilterFlagToggle,
  collaboratorFilters,
  onCollaboratorFilterToggle,
  sortBy,
  sortDirection,
  onSortChange,
  onSortDirectionChange,
  onClearFilters,
  highlightedCount,
  jackboxCount,
  checkedCount,
  showCollaborators = true,
  extraSortOptions = [],
  extraFilters,
}: PanelFiltersProps) {
  const hasActiveFilters = 
    filterFlags.priority || 
    filterFlags.highlighted || 
    filterFlags.withJackbox || 
    filterFlags.checked ||
    collaboratorFilters.length > 0 ||
    searchQuery.length > 0;

  const handleSortClick = (sort: PanelSortOption) => {
    if (sortBy === sort) {
      onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(sort);
      onSortDirectionChange('desc');
    }
  };

  const baseSortOptions: { value: PanelSortOption; label: string }[] = [
    { value: 'priority', label: 'Prioridade' },
    { value: 'jackbox', label: 'Jackbox' },
    { value: 'checked', label: 'Check' },
    { value: 'name', label: 'Nome' },
  ];

  const sortOptions = [...baseSortOptions, ...extraSortOptions];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-muted/30 border-b border-border">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar empresa..."
            className="pl-8 h-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Filter Flags */}
        <div className="flex items-center gap-1">
          <IconFilterButton
            active={filterFlags.priority}
            onClick={() => onFilterFlagToggle('priority')}
            tooltip="Filtrar por prioridade"
            activeColor="rgb(245, 158, 11)"
          >
            <Star className={`w-3.5 h-3.5 ${filterFlags.priority ? 'fill-current' : ''}`} />
          </IconFilterButton>

          <IconFilterButton
            active={filterFlags.highlighted}
            onClick={() => onFilterFlagToggle('highlighted')}
            tooltip="Filtrar destacados"
            badge={highlightedCount > 0 ? highlightedCount : undefined}
            activeColor="rgb(59, 130, 246)"
          >
            <Sparkles className={`w-3.5 h-3.5 ${filterFlags.highlighted ? 'fill-current' : ''}`} />
          </IconFilterButton>

          <IconFilterButton
            active={filterFlags.withJackbox}
            onClick={() => onFilterFlagToggle('withJackbox')}
            tooltip="Com tarefas abertas"
            badge={jackboxCount > 0 ? jackboxCount : undefined}
            activeColor="rgb(34, 197, 94)"
          >
            <ListChecks className="w-3.5 h-3.5" />
          </IconFilterButton>

          <IconFilterButton
            active={filterFlags.checked}
            onClick={() => onFilterFlagToggle('checked')}
            tooltip="Filtrar por check adicional"
            badge={checkedCount > 0 ? checkedCount : undefined}
            activeColor="rgb(139, 92, 246)"
          >
            <CheckCircle className={`w-3.5 h-3.5 ${filterFlags.checked ? 'fill-current' : ''}`} />
          </IconFilterButton>
        </div>

        {/* Collaborator Filters */}
        {showCollaborators && (
          <>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-0.5">
              {COLLABORATOR_NAMES.map((name) => (
                <CollaboratorFilterPill
                  key={name}
                  name={name}
                  active={collaboratorFilters.includes(name)}
                  onClick={() => onCollaboratorFilterToggle(name)}
                />
              ))}
            </div>
          </>
        )}

        {/* Extra Filters */}
        {extraFilters && (
          <>
            <div className="w-px h-6 bg-border" />
            {extraFilters}
          </>
        )}

        {/* Divider */}
        <div className="flex-1" />

        {/* Sort Options */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
            {sortDirection === 'desc' ? (
              <ArrowDownAZ className="w-3 h-3" />
            ) : (
              <ArrowUpAZ className="w-3 h-3" />
            )}
            Ordenar:
          </span>
          <div className="flex items-center gap-0.5">
            {sortOptions.map((option) => (
              <SortButton
                key={option.value}
                active={sortBy === option.value}
                direction={sortBy === option.value ? sortDirection : undefined}
                onClick={() => handleSortClick(option.value)}
              >
                {option.label}
              </SortButton>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onClearFilters}
                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Limpar filtros
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

interface SortButtonProps {
  active: boolean;
  direction?: SortDirection;
  onClick: () => void;
  children: React.ReactNode;
}

function SortButton({ active, direction, onClick, children }: SortButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
        active 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
      }`}
    >
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
