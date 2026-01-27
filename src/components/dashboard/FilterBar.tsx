import { ArrowDownAZ, ArrowUpAZ, Star, ListChecks, RotateCcw, Users, Building2, Briefcase, Search, X } from "lucide-react";
import { COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName, ClientType } from "@/types/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { GridSizePicker } from "./GridSizePicker";

export type SortOption = 'order' | 'processes' | 'licenses' | 'demands' | 'name' | 'priority' | 'jackbox' | 'comments';
export type SortDirection = 'asc' | 'desc';
export type ClientTypeFilter = 'all' | 'AC' | 'AV';
export type ViewMode = 'fit-all' | 'scroll';
export type GridSize = { cols: number; rows: number } | null;

// Multi-select filter flags
export interface FilterFlags {
  priority: boolean;
  highlighted: boolean;
  selected: boolean;
  hasCollaborators: boolean;
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
  searchQuery: string;
  viewMode: ViewMode;
  gridSize: GridSize;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: SortOption) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
  onFilterFlagToggle: (flag: keyof FilterFlags) => void;
  onCollaboratorFilterToggle: (collaborator: CollaboratorName) => void;
  onClientTypeFilterChange: (type: ClientTypeFilter) => void;
  onClearHighlights: () => void;
  onClearAllFilters: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onGridSizeChange: (size: GridSize) => void;
}

export function FilterBar({
  sortBy,
  sortDirection,
  filterFlags,
  collaboratorFilters,
  clientTypeFilter,
  visibleCount,
  totalCount,
  acCount,
  avCount,
  searchQuery,
  viewMode,
  gridSize,
  onSearchChange,
  onSortChange,
  onSortDirectionChange,
  onFilterFlagToggle,
  onCollaboratorFilterToggle,
  onClientTypeFilterChange,
  onClearHighlights,
  onClearAllFilters,
  onViewModeChange,
  onGridSizeChange,
  highlightedCount,
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
    filterFlags.hasCollaborators ||
    filterFlags.withJackbox || 
    filterFlags.withoutJackbox || 
    filterFlags.withComments ||
    filterFlags.withoutComments ||
    collaboratorFilters.length > 0 ||
    clientTypeFilter !== 'all' ||
    searchQuery.trim().length > 0;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 bg-card border-b border-border">
        {/* Left side: Sort Options */}
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

        {/* Search Bar */}
        <div className="relative flex-1 max-w-xs min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Pesquisar cliente, colaborador..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-7 pl-8 pr-8 text-xs border-border bg-background/50 focus:bg-background"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Grid Size Picker */}
        <GridSizePicker 
          selectedSize={gridSize} 
          onSizeSelect={onGridSizeChange}
        />

        {/* Center: Visible Client Count */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 border border-primary/30">
          <Users className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-primary">{visibleCount}</span>
          {visibleCount !== totalCount && (
            <span className="text-[10px] text-muted-foreground">/ {totalCount}</span>
          )}
        </div>

        {/* Right side: Client Type + Collaborators + Reset */}
        <div className="flex items-center gap-1.5 flex-wrap">
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

          {/* Separator */}
          <div className="w-px h-5 bg-border mx-0.5" />

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
