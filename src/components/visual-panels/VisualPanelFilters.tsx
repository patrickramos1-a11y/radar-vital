import { useState, useMemo } from "react";
import { Search, X, RotateCcw, ChevronDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";

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
  collaboratorFilters: string[];
  onSortChange: (sort: VisualSortOption) => void;
  onSortDirectionChange: (dir: VisualSortDirection) => void;
  onClientTypeFilterChange?: (type: VisualClientTypeFilter) => void;
  onCollaboratorFilterToggle: (name: string) => void;
  onClearFilters: () => void;
  
  highlightedCount?: number;
  jackboxCount?: number;
  checkedCount?: number;
  commentsCount?: number;
  
  filterFlags?: FilterFlags;
  onFilterFlagToggle?: (flag: keyof FilterFlags) => void;
  
  showCollaborators?: boolean;
  sortOptions?: { value: VisualSortOption; label: string }[];
}

function CollaboratorDropdown({ collaborators: collabs, selected, onToggle }: {
  collaborators: { id: string; name: string; initials: string; color: string }[];
  selected: string[];
  onToggle: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = useMemo(() =>
    collabs.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [collabs, search]
  );
  const label = selected.length === 0 ? 'Colaboradores' : selected.length === 1
    ? collabs.find(c => c.name === selected[0])?.name || selected[0]
    : `${selected.length} colaboradores`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${
          selected.length > 0 ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary/50 border-border text-secondary-foreground hover:bg-secondary'
        }`}>
          {label}
          <ChevronDown className="w-3 h-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <Input
          placeholder="Pesquisar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-7 text-xs mb-2"
        />
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => onToggle(c.name)}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors"
            >
              <span className="w-5 h-5 rounded-md text-[9px] font-bold flex items-center justify-center border-2 shrink-0"
                style={{
                  backgroundColor: selected.includes(c.name) ? c.color : 'transparent',
                  borderColor: c.color,
                  color: selected.includes(c.name) ? '#fff' : c.color,
                }}
              >
                {c.initials}
              </span>
              <span className="flex-1 text-left truncate">{c.name}</span>
              {selected.includes(c.name) && <Check className="w-3 h-3 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
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
  const { collaborators } = useAuth();

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

      {/* Collaborator filters - searchable multi-select dropdown */}
      {showCollaborators && (
        <CollaboratorDropdown
          collaborators={collaborators}
          selected={collaboratorFilters}
          onToggle={onCollaboratorFilterToggle}
        />
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
