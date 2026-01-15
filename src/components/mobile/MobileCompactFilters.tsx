import { Search, X, RotateCcw, Building2, Landmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SortOption, SortDirection, ClientTypeFilter } from "@/components/dashboard/FilterBar";

interface MobileCompactFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  sortDirection: SortDirection;
  clientTypeFilter: ClientTypeFilter;
  visibleCount: number;
  totalCount: number;
  acCount: number;
  avCount: number;
  hasActiveFilters: boolean;
  onSortChange: (sort: SortOption) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
  onClientTypeFilterChange: (type: ClientTypeFilter) => void;
  onClearAllFilters: () => void;
}

export function MobileCompactFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  sortDirection,
  clientTypeFilter,
  visibleCount,
  totalCount,
  acCount,
  avCount,
  hasActiveFilters,
  onSortChange,
  onSortDirectionChange,
  onClientTypeFilterChange,
  onClearAllFilters,
}: MobileCompactFiltersProps) {

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
    { key: 'processes', label: 'Processos' },
    { key: 'licenses', label: 'Licenças' },
    { key: 'demands', label: 'Demandas' },
    { key: 'name', label: 'Nome' },
  ];

  return (
    <div className="flex flex-col bg-card border-b border-border">
      {/* Separator line */}
      <div className="h-px bg-border" />
      
      {/* Row 1: "Ordenar:" label + sort pills */}
      <div className="px-3 pt-2 pb-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
          <span className="text-xs">↕</span> Ordenar:
        </span>
      </div>
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1.5 px-3 pb-2 min-w-max">
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

      {/* Row 2: Search + count + clear */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar cliente, colaborador..."
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
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary">
            <span className="text-sm font-bold">{visibleCount}</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={onClearAllFilters}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
              title="Limpar filtros"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Row 3: Type filters (TODOS, AC, AV) */}
      <div className="flex items-center gap-2 px-3 pb-2">
        <button
          onClick={() => onClientTypeFilterChange('all')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            clientTypeFilter === 'all'
              ? 'bg-foreground text-background'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          TODOS ({totalCount})
        </button>
        <button
          onClick={() => onClientTypeFilterChange('AC')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            clientTypeFilter === 'AC'
              ? 'bg-sky-500 text-white'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          AC ({acCount})
        </button>
        <button
          onClick={() => onClientTypeFilterChange('AV')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            clientTypeFilter === 'AV'
              ? 'bg-amber-500 text-white'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          AV ({avCount})
        </button>
      </div>
    </div>
  );
}
