import { Search, X, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";

export type VisualSortOption = 'order' | 'name' | 'priority' | 'tasks' | 'comments' | 'days_open';
export type VisualSortDirection = 'asc' | 'desc';
export type VisualClientTypeFilter = 'all' | 'AC' | 'AV';

export interface FilterFlags {
  priority: boolean;
  highlighted: boolean;
  selected: boolean;
  hasCollaborators: boolean;
  withJackbox?: boolean;
  withComments?: boolean;
  withoutJackbox?: boolean;
  withoutComments?: boolean;
}

interface VisualPanelFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: VisualSortOption;
  sortDirection: VisualSortDirection;
  clientTypeFilter?: VisualClientTypeFilter;
  collaboratorFilters: CollaboratorName[];
  onSortChange: (sort: VisualSortOption) => void;
  onSortDirectionChange: (dir: VisualSortDirection) => void;
  onClientTypeFilterChange?: (type: VisualClientTypeFilter) => void;
  onCollaboratorFilterToggle: (name: CollaboratorName) => void;
  onClearFilters: () => void;
  
  // Optional counts for badges
  highlightedCount?: number;
  jackboxCount?: number;
  checkedCount?: number;
  commentsCount?: number;
  
  // Flags support
  filterFlags?: FilterFlags;
  onFilterFlagToggle?: (flag: keyof FilterFlags) => void;
  
  showCollaborators?: boolean;
  sortOptions?: { value: VisualSortOption; label: string }[];
}

export function VisualPanelFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  sortDirection,
  clientTypeFilter,
  collaboratorFilters,
  onSortChange,
  onSortDirectionChange,
  onClientTypeFilterChange,
  onCollaboratorFilterToggle,
  onClearFilters,
  sortOptions = [
    { value: 'order', label: 'Ordem' },
    { value: 'name', label: 'Nome' },
    { value: 'priority', label: 'Prioridade' },
    { value: 'tasks', label: 'Tarefas' },
  ],
  showCollaborators = true,
}: VisualPanelFiltersProps) {
  const handleSortClick = (sort: VisualSortOption) => {
    if (sortBy === sort) {
      onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(sort);
      onSortDirectionChange('desc');
    }
  };

  const hasActiveFilters = collaboratorFilters.length > 0 || (clientTypeFilter && clientTypeFilter !== 'all') || searchQuery.trim() !== '';

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-card border-b border-border shrink-0">
      {/* Sort */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground uppercase">Ordenar:</span>
        {sortOptions.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleSortClick(value)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              sortBy === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
            }`}
          >
            {label}
            {sortBy === value && (
              <span className="text-[10px] ml-0.5">{sortDirection === 'desc' ? '↓' : '↑'}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-xs min-w-[150px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Pesquisar..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-7 pl-8 pr-8 text-xs"
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Type filter */}
      {onClientTypeFilterChange && clientTypeFilter && (
        <div className="flex items-center gap-0.5">
          {(['all', 'AC', 'AV'] as const).map(type => (
            <button
              key={type}
              onClick={() => onClientTypeFilterChange(type)}
              className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                clientTypeFilter === type
                  ? type === 'AC' ? 'bg-emerald-500 text-white' : type === 'AV' ? 'bg-amber-500 text-white' : 'bg-foreground text-background'
                  : 'bg-secondary/30 text-muted-foreground'
              }`}
            >
              {type === 'all' ? 'TODOS' : type}
            </button>
          ))}
        </div>
      )}

      {/* Collaborator filters */}
      {showCollaborators && (
        <div className="flex items-center gap-1">
          {COLLABORATOR_NAMES.map(name => (
            <button
              key={name}
              onClick={() => onCollaboratorFilterToggle(name)}
              className={`w-7 h-7 rounded-md text-[10px] font-bold flex items-center justify-center border-2 transition-all ${
                collaboratorFilters.includes(name) ? 'text-white' : 'opacity-40 hover:opacity-70'
              }`}
              style={{
                backgroundColor: collaboratorFilters.includes(name) ? COLLABORATOR_COLORS[name] : 'transparent',
                borderColor: COLLABORATOR_COLORS[name],
                color: collaboratorFilters.includes(name) ? '#fff' : COLLABORATOR_COLORS[name],
              }}
            >
              {name.slice(0, 2).toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Clear */}
      {hasActiveFilters && (
        <button onClick={onClearFilters} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
