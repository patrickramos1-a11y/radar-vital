import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, X, RotateCcw, Building2, Landmark, Briefcase, MapPin, Check, UserPlus, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Municipality } from "@/hooks/useMunicipalities";
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
  municipalities: Municipality[];
  clientMunicipioNames: Set<string>;
  municipioFilters: string[];
  onMunicipioFilterToggle: (municipio: string) => void;
  clientsWithoutMunicipioCount: number;
  onNewClient: () => void;
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
  municipalities,
  clientMunicipioNames,
  municipioFilters,
  onMunicipioFilterToggle,
  clientsWithoutMunicipioCount,
  onNewClient,
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
    { key: 'order', label: 'Nome' },
    { key: 'priority', label: 'Prioridade' },
    { key: 'jackbox', label: 'Tarefas' },
    { key: 'comments', label: 'Coment.' },
    { key: 'name', label: 'A-Z' },
  ];

  return (
    <div className="flex flex-col bg-card border-b border-border">
      {/* Row 1: Search + quick actions + count + clear */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar cliente..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-9 pr-8 text-sm"
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

        <button
          onClick={onNewClient}
          title="Novo Cliente"
          aria-label="Novo Cliente"
          className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-primary/10 border border-primary/30 text-primary"
        >
          <UserPlus className="w-4 h-4" />
        </button>
        <Link
          to="/central-entregas"
          title="Central de Entregas"
          aria-label="Central de Entregas"
          className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600"
        >
          <Target className="w-4 h-4" />
        </Link>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary">
            <span className="text-sm font-bold">{visibleCount}</span>
            {visibleCount !== totalCount && (
              <span className="text-[10px] text-muted-foreground">/{totalCount}</span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={onClearAllFilters}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
              title="Limpar filtros"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>


      {/* Row 2: Type filters + Municipality + Sort pills */}
      <div className="flex items-center gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => onClientTypeFilterChange('all')}
          className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
            clientTypeFilter === 'all' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
          }`}
        >
          <Building2 className="w-3 h-3" />
          ALL
        </button>
        <button
          onClick={() => onClientTypeFilterChange('AC')}
          className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
            clientTypeFilter === 'AC' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
          }`}
        >
          <Landmark className="w-3 h-3" />
          AC
        </button>
        <button
          onClick={() => onClientTypeFilterChange('AV')}
          className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
            clientTypeFilter === 'AV' ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'
          }`}
        >
          <Briefcase className="w-3 h-3" />
          AV
        </button>

        <div className="w-px h-5 bg-border shrink-0" />

        <MobileMunicipalityDropdown
          municipalities={municipalities}
          clientMunicipioNames={clientMunicipioNames}
          selectedMunicipios={municipioFilters}
          onToggle={onMunicipioFilterToggle}
          withoutCount={clientsWithoutMunicipioCount}
        />

        <div className="w-px h-5 bg-border shrink-0" />

        {sortOptions.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleSortClick(key)}
            className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
              sortBy === key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
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
  );
}

interface MobileMunicipalityDropdownProps {
  municipalities: Municipality[];
  clientMunicipioNames: Set<string>;
  selectedMunicipios: string[];
  onToggle: (municipio: string) => void;
  withoutCount: number;
}

function MobileMunicipalityDropdown({
  municipalities,
  clientMunicipioNames,
  selectedMunicipios,
  onToggle,
  withoutCount,
}: MobileMunicipalityDropdownProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const items = municipalities
    .filter(m => clientMunicipioNames.has(m.name))
    .map(m => ({ id: m.id, label: `${m.name} - ${m.state}`, key: `${m.name}|${m.state}` }));

  const filtered = search.trim()
    ? items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()))
    : items;

  const selectedCount = selectedMunicipios.length;
  const noneSelected = selectedMunicipios.includes('__none__');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
            selectedCount > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
        >
          <MapPin className="w-3 h-3" />
          {selectedCount === 0 ? 'Municípios' : `${selectedCount} sel.`}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar município..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 pl-7 text-xs"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-52 overflow-y-auto p-1">
          <button
            onClick={() => onToggle('__none__')}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors text-left border-b border-border/50 mb-1 ${
              noneSelected ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
              noneSelected ? 'bg-amber-500 border-amber-500' : 'border-border'
            }`}>
              {noneSelected && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="font-semibold">Sem município</span>
            <span className="ml-auto text-[10px] opacity-70">({withoutCount})</span>
          </button>
          {filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">Nenhum município encontrado</p>
          ) : (
            filtered.map(item => {
              const isSelected = selectedMunicipios.includes(item.key);
              return (
                <button
                  key={item.id}
                  onClick={() => onToggle(item.key)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors text-left ${
                    isSelected ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-primary border-primary' : 'border-border'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  {item.label}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
