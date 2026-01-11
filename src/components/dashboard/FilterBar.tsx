import { ArrowDownAZ, Star, Sparkles, X, CheckSquare } from "lucide-react";
import { COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";

export type SortOption = 'order' | 'processes' | 'licenses' | 'demands' | 'name' | 'priority' | 'tasks';
export type FilterOption = 'all' | 'priority' | 'highlighted' | 'tasks' | CollaboratorName;

interface FilterBarProps {
  sortBy: SortOption;
  filterBy: FilterOption;
  highlightedCount: number;
  taskCount: number;
  onSortChange: (sort: SortOption) => void;
  onFilterChange: (filter: FilterOption) => void;
  onClearHighlights: () => void;
}

export function FilterBar({
  sortBy,
  filterBy,
  highlightedCount,
  taskCount,
  onSortChange,
  onFilterChange,
  onClearHighlights,
}: FilterBarProps) {

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
            active={sortBy === 'tasks'} 
            onClick={() => onSortChange('tasks')}
          >
            Tarefas
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
          <FilterButton 
            active={filterBy === 'tasks'} 
            onClick={() => onFilterChange('tasks')}
            icon={<CheckSquare className="w-3 h-3" />}
            badge={taskCount > 0 ? taskCount : undefined}
            variant="task"
          >
            Tarefas
          </FilterButton>
          
          {/* Collaborator filters - Color bars */}
          <div className="flex items-center ml-2">
            {COLLABORATOR_NAMES.map((name) => (
              <CollaboratorFilterBar
                key={name}
                name={name}
                active={filterBy === name}
                onClick={() => onFilterChange(name)}
              />
            ))}
          </div>
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
  variant?: 'default' | 'task';
}

function FilterButton({ active, onClick, children, icon, badge, variant = 'default' }: FilterButtonProps) {
  const badgeColor = variant === 'task' 
    ? 'bg-orange-400 text-orange-900'
    : 'bg-yellow-400 text-yellow-900';

  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
        active 
          ? variant === 'task' 
            ? 'bg-orange-500 text-white' 
            : 'bg-primary text-primary-foreground'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      }`}
    >
      {icon}
      {children}
      {badge !== undefined && (
        <span className={`ml-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
          active ? 'bg-white/20 text-white' : badgeColor
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}

interface CollaboratorFilterBarProps {
  name: CollaboratorName;
  active: boolean;
  onClick: () => void;
}

function CollaboratorFilterBar({ name, active, onClick }: CollaboratorFilterBarProps) {
  const color = COLLABORATOR_COLORS[name];
  const initial = name.charAt(0).toUpperCase();
  
  return (
    <button
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center transition-all border-2 first:rounded-l last:rounded-r ${
        active ? 'ring-2 ring-offset-1' : 'hover:opacity-80'
      }`}
      style={{
        backgroundColor: active ? color : `${color}30`,
        borderColor: color,
        color: active ? '#fff' : color,
      }}
      title={`${name.charAt(0).toUpperCase() + name.slice(1)}`}
    >
      <span className="text-xs font-bold">{initial}</span>
    </button>
  );
}
