import { useState } from "react";
import { 
  Search, 
  Filter, 
  Star, 
  Sparkles, 
  CheckSquare, 
  ListChecks, 
  MessageCircle,
  ArrowUpDown,
  X,
  Building2,
  Briefcase,
  RotateCcw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName, ClientType } from "@/types/client";
import { SortOption, SortDirection, FilterFlags, ClientTypeFilter } from "@/components/dashboard/FilterBar";

interface MobileFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  sortDirection: SortDirection;
  filterFlags: FilterFlags;
  collaboratorFilters: CollaboratorName[];
  clientTypeFilter: ClientTypeFilter;
  visibleCount: number;
  totalCount: number;
  onSortChange: (sort: SortOption) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
  onFilterFlagToggle: (flag: keyof FilterFlags) => void;
  onCollaboratorFilterToggle: (collaborator: CollaboratorName) => void;
  onClientTypeFilterChange: (type: ClientTypeFilter) => void;
  onClearAllFilters: () => void;
}

export function MobileFilterBar({
  searchQuery,
  onSearchChange,
  sortBy,
  sortDirection,
  filterFlags,
  collaboratorFilters,
  clientTypeFilter,
  visibleCount,
  totalCount,
  onSortChange,
  onSortDirectionChange,
  onFilterFlagToggle,
  onCollaboratorFilterToggle,
  onClientTypeFilterChange,
  onClearAllFilters,
}: MobileFilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  const activeFilterCount = [
    filterFlags.priority,
    filterFlags.highlighted,
    filterFlags.selected,
    filterFlags.withJackbox,
    filterFlags.withoutJackbox,
    filterFlags.withComments,
    filterFlags.withoutComments,
    clientTypeFilter !== 'all',
    ...collaboratorFilters.map(() => true),
  ].filter(Boolean).length;

  const handleSortClick = (sort: SortOption) => {
    if (sortBy === sort) {
      onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(sort);
      onSortDirectionChange('desc');
    }
  };

  return (
    <div className="flex flex-col gap-2 px-3 py-2 bg-card border-b border-border">
      {/* Search + Filter buttons row */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar..."
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

        {/* Filter button */}
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <button className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-background">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
            <SheetHeader className="pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <SheetTitle>Filtros e Ordenação</SheetTitle>
                {hasActiveFilters && (
                  <button
                    onClick={onClearAllFilters}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Limpar
                  </button>
                )}
              </div>
            </SheetHeader>

            <div className="py-4 space-y-6 overflow-y-auto">
              {/* Sort options */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  Ordenar por
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: 'order', label: 'Ordem' },
                    { key: 'priority', label: 'Prioridade' },
                    { key: 'jackbox', label: 'Jackbox' },
                    { key: 'demands', label: 'Demandas' },
                    { key: 'processes', label: 'Processos' },
                    { key: 'licenses', label: 'Licenças' },
                    { key: 'name', label: 'Nome' },
                  ] as { key: SortOption; label: string }[]).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleSortClick(key)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sortBy === key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {label}
                      {sortBy === key && (
                        <span className="text-xs opacity-80">
                          {sortDirection === 'desc' ? '↓' : '↑'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client type filter */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Tipo de Cliente
                </h4>
                <div className="flex gap-2">
                  {([
                    { key: 'all', label: 'Todos', icon: Building2 },
                    { key: 'AC', label: 'AC', icon: Building2 },
                    { key: 'AV', label: 'AV', icon: Briefcase },
                  ] as { key: ClientTypeFilter; label: string; icon: typeof Building2 }[]).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => onClientTypeFilterChange(key)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        clientTypeFilter === key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick filters */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros Rápidos
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <FilterToggle
                    icon={<Star className="w-4 h-4" />}
                    label="Prioridade"
                    active={filterFlags.priority}
                    onClick={() => onFilterFlagToggle('priority')}
                    color="rgb(245, 158, 11)"
                  />
                  <FilterToggle
                    icon={<Sparkles className="w-4 h-4" />}
                    label="Destaque"
                    active={filterFlags.highlighted}
                    onClick={() => onFilterFlagToggle('highlighted')}
                    color="rgb(59, 130, 246)"
                  />
                  <FilterToggle
                    icon={<CheckSquare className="w-4 h-4" />}
                    label="Selecionados"
                    active={filterFlags.selected}
                    onClick={() => onFilterFlagToggle('selected')}
                    color="rgb(16, 185, 129)"
                  />
                  <FilterToggle
                    icon={<ListChecks className="w-4 h-4" />}
                    label="Com Jackbox"
                    active={filterFlags.withJackbox}
                    onClick={() => onFilterFlagToggle('withJackbox')}
                    color="rgb(234, 179, 8)"
                  />
                  <FilterToggle
                    icon={<MessageCircle className="w-4 h-4" />}
                    label="Com Comentários"
                    active={filterFlags.withComments}
                    onClick={() => onFilterFlagToggle('withComments')}
                    color="rgb(99, 102, 241)"
                  />
                </div>
              </div>

              {/* Collaborator filters */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Colaboradores</h4>
                <div className="flex gap-2">
                  {COLLABORATOR_NAMES.map(name => (
                    <button
                      key={name}
                      onClick={() => onCollaboratorFilterToggle(name)}
                      className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                        collaboratorFilters.includes(name)
                          ? 'ring-2 ring-offset-2'
                          : 'opacity-50'
                      }`}
                      style={{
                        backgroundColor: collaboratorFilters.includes(name) 
                          ? COLLABORATOR_COLORS[name] 
                          : `${COLLABORATOR_COLORS[name]}30`,
                        color: collaboratorFilters.includes(name) ? 'white' : COLLABORATOR_COLORS[name],
                      }}
                    >
                      <span className="text-sm font-bold uppercase">
                        {name.slice(0, 2)}
                      </span>
                      <span className="text-[10px] font-medium capitalize">
                        {name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Visible count badge */}
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-primary/10 text-primary">
          <span className="text-sm font-bold">{visibleCount}</span>
          {visibleCount !== totalCount && (
            <span className="text-xs text-muted-foreground">/{totalCount}</span>
          )}
        </div>
      </div>

      {/* Active collaborator filter pills */}
      {collaboratorFilters.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {collaboratorFilters.map(name => (
            <button
              key={name}
              onClick={() => onCollaboratorFilterToggle(name)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: COLLABORATOR_COLORS[name] }}
            >
              {name}
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface FilterToggleProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  color: string;
}

function FilterToggle({ icon, label, active, onClick, color }: FilterToggleProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active ? 'text-white' : 'bg-muted text-muted-foreground'
      }`}
      style={{
        backgroundColor: active ? color : undefined,
      }}
    >
      {icon}
      {label}
    </button>
  );
}
