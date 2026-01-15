import { 
  Search, 
  Star, 
  Sparkles, 
  CheckSquare, 
  ListChecks, 
  MessageCircle,
  X,
  RotateCcw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";
import { SortOption, SortDirection, FilterFlags, ClientTypeFilter } from "@/components/dashboard/FilterBar";

interface MobileFilterBarNewProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  sortDirection: SortDirection;
  filterFlags: FilterFlags;
  collaboratorFilters: CollaboratorName[];
  clientTypeFilter: ClientTypeFilter;
  visibleCount: number;
  totalCount: number;
  // Counts for badges
  priorityCount: number;
  highlightedCount: number;
  selectedCount: number;
  jackboxCount: number;
  commentsCount: number;
  collaboratorCounts: Record<CollaboratorName, number>;
  onSortChange: (sort: SortOption) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
  onFilterFlagToggle: (flag: keyof FilterFlags) => void;
  onCollaboratorFilterToggle: (collaborator: CollaboratorName) => void;
  onClientTypeFilterChange: (type: ClientTypeFilter) => void;
  onClearAllFilters: () => void;
}

export function MobileFilterBarNew({
  searchQuery,
  onSearchChange,
  sortBy,
  sortDirection,
  filterFlags,
  collaboratorFilters,
  clientTypeFilter,
  visibleCount,
  totalCount,
  priorityCount,
  highlightedCount,
  selectedCount,
  jackboxCount,
  commentsCount,
  collaboratorCounts,
  onSortChange,
  onSortDirectionChange,
  onFilterFlagToggle,
  onCollaboratorFilterToggle,
  onClientTypeFilterChange,
  onClearAllFilters,
}: MobileFilterBarNewProps) {

  const hasActiveFilters = 
    filterFlags.priority || 
    filterFlags.highlighted || 
    filterFlags.selected ||
    filterFlags.withJackbox || 
    filterFlags.withComments ||
    collaboratorFilters.length > 0 ||
    clientTypeFilter !== 'all' ||
    searchQuery.trim() !== '';

  const handleSortClick = (sort: SortOption) => {
    if (sortBy === sort) {
      onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(sort);
      onSortDirectionChange('desc');
    }
  };

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: 'order', label: 'Ordem' },
    { key: 'priority', label: 'Prioridade' },
    { key: 'jackbox', label: 'Jackbox' },
    { key: 'demands', label: 'Demandas' },
    { key: 'processes', label: 'Processos' },
    { key: 'licenses', label: 'Licenças' },
    { key: 'name', label: 'Nome' },
  ];

  return (
    <div className="flex flex-col bg-card border-b border-border">
      {/* Search row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar cliente..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-9 pr-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Count + Clear */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-primary/10 text-primary">
            <span className="text-sm font-bold">{visibleCount}</span>
            {visibleCount !== totalCount && (
              <span className="text-xs text-muted-foreground">/{totalCount}</span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={onClearAllFilters}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sort options - horizontal scroll */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1.5 px-3 py-1.5 min-w-max">
          {sortOptions.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSortClick(key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                sortBy === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {label}
              {sortBy === key && (
                <span className="text-[10px]">
                  {sortDirection === 'desc' ? '↓' : '↑'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Quick filters - horizontal scroll */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1.5 px-3 py-1.5 min-w-max">
          <FilterPill
            icon={<Star className="w-3.5 h-3.5" />}
            active={filterFlags.priority}
            onClick={() => onFilterFlagToggle('priority')}
            color="rgb(245, 158, 11)"
            count={priorityCount}
          />
          <FilterPill
            icon={<Sparkles className="w-3.5 h-3.5" />}
            active={filterFlags.highlighted}
            onClick={() => onFilterFlagToggle('highlighted')}
            color="rgb(59, 130, 246)"
            count={highlightedCount}
          />
          <FilterPill
            icon={<CheckSquare className="w-3.5 h-3.5" />}
            active={filterFlags.selected}
            onClick={() => onFilterFlagToggle('selected')}
            color="rgb(16, 185, 129)"
            count={selectedCount}
          />
          <FilterPill
            icon={<ListChecks className="w-3.5 h-3.5" />}
            active={filterFlags.withJackbox}
            onClick={() => onFilterFlagToggle('withJackbox')}
            color="rgb(234, 179, 8)"
            count={jackboxCount}
          />
          <FilterPill
            icon={<MessageCircle className="w-3.5 h-3.5" />}
            active={filterFlags.withComments}
            onClick={() => onFilterFlagToggle('withComments')}
            color="rgb(99, 102, 241)"
            count={commentsCount}
          />
          
          {/* Separator */}
          <div className="w-px h-5 bg-border shrink-0 mx-1" />
          
          {/* Collaborator filters - icons only with count */}
          {COLLABORATOR_NAMES.map(name => (
            <button
              key={name}
              onClick={() => onCollaboratorFilterToggle(name)}
              className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                collaboratorFilters.includes(name)
                  ? 'ring-2 ring-offset-1 ring-white shadow-lg'
                  : 'opacity-50 hover:opacity-75'
              }`}
              style={{
                backgroundColor: COLLABORATOR_COLORS[name],
              }}
            >
              <span className="text-[9px] font-bold text-white uppercase">
                {name.slice(0, 2)}
              </span>
              {collaboratorCounts[name] > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-foreground text-background text-[8px] font-bold flex items-center justify-center px-0.5">
                  {collaboratorCounts[name]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface FilterPillProps {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  color: string;
  count?: number;
}

function FilterPill({ icon, active, onClick, color, count }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
        active ? 'text-white shadow-md' : 'bg-muted text-muted-foreground'
      }`}
      style={{
        backgroundColor: active ? color : undefined,
      }}
    >
      {icon}
      {count !== undefined && count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-foreground text-background text-[8px] font-bold flex items-center justify-center px-0.5">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
