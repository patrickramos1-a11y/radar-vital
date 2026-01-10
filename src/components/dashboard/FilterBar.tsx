import { ArrowDownAZ, Star, Sparkles, X, Users } from "lucide-react";
import { COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";

export type SortOption = 'order' | 'processes' | 'licenses' | 'demands' | 'name' | 'priority';
export type FilterOption = 'all' | 'priority' | 'highlighted' | CollaboratorName;

interface FilterBarProps {
  sortBy: SortOption;
  filterBy: FilterOption;
  highlightedCount: number;
  onSortChange: (sort: SortOption) => void;
  onFilterChange: (filter: FilterOption) => void;
  onClearHighlights: () => void;
  isPresentationMode: boolean;
}

export function FilterBar({
  sortBy,
  filterBy,
  highlightedCount,
  onSortChange,
  onFilterChange,
  onClearHighlights,
  isPresentationMode,
}: FilterBarProps) {
  if (isPresentationMode) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-card border-b border-border">
      {/* Sort Options */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <ArrowDownAZ className="w-3.5 h-3.5" />
          Ordenar:
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          <SortButton 
            active={sortBy === 'order'} 
            onClick={() => onSortChange('order')}
          >
            Ordem
          </SortButton>
          <SortButton 
            active={sortBy === 'priority'} 
            onClick={() => onSortChange('priority')}
          >
            Prioridade
          </SortButton>
          <SortButton 
            active={sortBy === 'processes'} 
            onClick={() => onSortChange('processes')}
          >
            + Processos
          </SortButton>
          <SortButton 
            active={sortBy === 'licenses'} 
            onClick={() => onSortChange('licenses')}
          >
            + Licenças
          </SortButton>
          <SortButton 
            active={sortBy === 'demands'} 
            onClick={() => onSortChange('demands')}
          >
            + Demandas
          </SortButton>
          <SortButton 
            active={sortBy === 'name'} 
            onClick={() => onSortChange('name')}
          >
            Nome
          </SortButton>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-muted-foreground">Filtrar:</span>
        <div className="flex items-center gap-1 flex-wrap">
          <FilterButton 
            active={filterBy === 'all'} 
            onClick={() => onFilterChange('all')}
          >
            Todos
          </FilterButton>
          <FilterButton 
            active={filterBy === 'priority'} 
            onClick={() => onFilterChange('priority')}
            icon={<Star className="w-3 h-3" />}
          >
            Prioridade
          </FilterButton>
          <FilterButton 
            active={filterBy === 'highlighted'} 
            onClick={() => onFilterChange('highlighted')}
            icon={<Sparkles className="w-3 h-3" />}
            badge={highlightedCount > 0 ? highlightedCount : undefined}
          >
            Destacados
          </FilterButton>
          
          {/* Collaborator filters */}
          <span className="text-xs text-muted-foreground ml-2 flex items-center gap-1">
            <Users className="w-3 h-3" />
          </span>
          {COLLABORATOR_NAMES.map((name) => (
            <CollaboratorFilterButton
              key={name}
              name={name}
              active={filterBy === name}
              onClick={() => onFilterChange(name)}
            />
          ))}
        </div>

        {highlightedCount > 0 && (
          <button
            onClick={onClearHighlights}
            className="ml-2 flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-3 h-3" />
            Limpar destaques
          </button>
        )}
      </div>
    </div>
  );
}

interface SortButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function SortButton({ active, onClick, children }: SortButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
        active 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      }`}
    >
      {children}
    </button>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  badge?: number;
}

function FilterButton({ active, onClick, children, icon, badge }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
        active 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      }`}
    >
      {icon}
      {children}
      {badge !== undefined && (
        <span className={`ml-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
          active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-yellow-400 text-yellow-900'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

interface CollaboratorFilterButtonProps {
  name: CollaboratorName;
  active: boolean;
  onClick: () => void;
}

function CollaboratorFilterButton({ name, active, onClick }: CollaboratorFilterButtonProps) {
  const color = COLLABORATOR_COLORS[name];
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs font-medium transition-all border ${
        active 
          ? 'text-white' 
          : 'hover:opacity-80'
      }`}
      style={{
        backgroundColor: active ? color : 'transparent',
        borderColor: color,
        color: active ? '#fff' : color,
      }}
    >
      {displayName}
    </button>
  );
}
