import { Search, X, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";
import { FilterFlags } from "@/components/visual-panels/VisualPanelFilters";

export type PanelSortOption = 'order' | 'name' | 'priority' | 'jackbox';
export type PanelSortDirection = 'asc' | 'desc';

interface PanelFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: PanelSortOption;
  sortDirection?: PanelSortDirection;
  onSortChange: (sort: PanelSortOption) => void;
  onSortDirectionChange?: (dir: PanelSortDirection) => void;
  collaboratorFilters: CollaboratorName[];
  onCollaboratorFilterToggle: (name: CollaboratorName) => void;
  
  // Optional counts
  visibleCount?: number;
  totalCount?: number;
  highlightedCount?: number;
  jackboxCount?: number;
  checkedCount?: number;
  
  onClearFilters?: () => void;
  
  filterFlags?: FilterFlags;
  onFilterFlagToggle?: (flag: keyof FilterFlags) => void;
  
  showCollaborators?: boolean;
}

export function PanelFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  sortDirection,
  onSortChange,
  onSortDirectionChange,
  collaboratorFilters,
  onCollaboratorFilterToggle,
  visibleCount,
  totalCount,
  onClearFilters,
  showCollaborators = true,
}: PanelFiltersProps) {
  const hasFilters = collaboratorFilters.length > 0 || searchQuery.trim() !== '';

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-card border-b border-border shrink-0">
      <div className="flex items-center gap-1">
        {(['order', 'name', 'priority', 'jackbox'] as const).map(key => (
          <button
            key={key}
            onClick={() => onSortChange(key)}
            className={`px-2 py-1 rounded text-xs font-medium ${
              sortBy === key ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-secondary-foreground'
            }`}
          >
            {key === 'order' ? 'Ordem' : key === 'name' ? 'Nome' : key === 'priority' ? 'Prioridade' : 'Jackbox'}
            {sortBy === key && sortDirection && (
              <span className="ml-1 text-[10px]">{sortDirection === 'desc' ? '↓' : '↑'}</span>
            )}
          </button>
        ))}
      </div>

      <div className="relative flex-1 max-w-xs min-w-[150px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input placeholder="Pesquisar..." value={searchQuery} onChange={e => onSearchChange(e.target.value)} className="h-7 pl-8 text-xs" />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {visibleCount !== undefined && totalCount !== undefined && (
        <span className="text-xs font-bold text-primary">{visibleCount}/{totalCount}</span>
      )}

      {showCollaborators && (
        <div className="flex items-center gap-1">
          {COLLABORATOR_NAMES.map(name => (
            <button
              key={name}
              onClick={() => onCollaboratorFilterToggle(name)}
              className={`w-6 h-6 rounded text-[9px] font-bold flex items-center justify-center border ${
                collaboratorFilters.includes(name) ? 'text-white' : 'opacity-40'
              }`}
              style={{
                backgroundColor: collaboratorFilters.includes(name) ? COLLABORATOR_COLORS[name] : 'transparent',
                borderColor: COLLABORATOR_COLORS[name],
                color: collaboratorFilters.includes(name) ? '#fff' : COLLABORATOR_COLORS[name],
              }}
            >
              {name[0].toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {hasFilters && onClearFilters && (
        <button onClick={onClearFilters} className="p-1 rounded text-muted-foreground hover:text-foreground">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
