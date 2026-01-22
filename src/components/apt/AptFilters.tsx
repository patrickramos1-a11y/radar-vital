import React from 'react';
import { AptFilters as AptFiltersType, getDefaultFilters, COLABORADORES } from '@/types/apt';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, RotateCcw, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface AptFiltersProps {
  filters: AptFiltersType;
  onFiltersChange: (filters: AptFiltersType) => void;
  setores: string[];
}

const MESES = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

const ANOS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
const SEMANAS = [1, 2, 3, 4, 5];

interface MultiSelectFilterProps {
  label: string;
  options: { value: string | number; label: string }[];
  selected: (string | number)[];
  onChange: (selected: (string | number)[]) => void;
}

function MultiSelectFilter({ label, options, selected, onChange }: MultiSelectFilterProps) {
  const toggleOption = (value: string | number) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 justify-between min-w-[120px]">
          <span className="truncate">
            {selected.length === 0 ? label : `${selected.length} selecionado(s)`}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
              onClick={() => toggleOption(option.value)}
            >
              <Checkbox
                checked={selected.includes(option.value)}
                onCheckedChange={() => toggleOption(option.value)}
              />
              <span className="text-sm">{option.label}</span>
            </div>
          ))}
        </div>
        {selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2"
            onClick={() => onChange([])}
          >
            Limpar seleção
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function AptFiltersComponent({ filters, onFiltersChange, setores }: AptFiltersProps) {
  const handleReset = () => {
    onFiltersChange(getDefaultFilters());
  };

  const removeFilter = (type: string, value: string | number) => {
    switch (type) {
      case 'responsavel':
        onFiltersChange({ ...filters, responsaveis: filters.responsaveis.filter(r => r !== value) });
        break;
      case 'setor':
        onFiltersChange({ ...filters, setores: filters.setores.filter(s => s !== value) });
        break;
      case 'mes':
        onFiltersChange({ ...filters, meses: filters.meses.filter(m => m !== value) });
        break;
      case 'ano':
        onFiltersChange({ ...filters, anos: filters.anos.filter(a => a !== value) });
        break;
      case 'semana':
        onFiltersChange({ ...filters, semanas: filters.semanas.filter(s => s !== value) });
        break;
    }
  };

  const hasActiveFilters = 
    filters.responsaveis.length > 0 ||
    filters.setores.length > 0 ||
    filters.meses.length > 0 ||
    filters.anos.length > 0 ||
    filters.semanas.length > 0 ||
    filters.status_responsavel ||
    filters.status_gestor ||
    filters.busca;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* First Row - Multi-Select Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Responsável */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Responsável</Label>
          <MultiSelectFilter
            label="Todos"
            options={COLABORADORES.map(c => ({ value: c, label: c }))}
            selected={filters.responsaveis}
            onChange={(selected) => onFiltersChange({ ...filters, responsaveis: selected as string[] })}
          />
        </div>

        {/* Setor */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Setor</Label>
          <MultiSelectFilter
            label="Todos"
            options={setores.map(s => ({ value: s, label: s }))}
            selected={filters.setores}
            onChange={(selected) => onFiltersChange({ ...filters, setores: selected as string[] })}
          />
        </div>

        {/* Mês */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Mês</Label>
          <MultiSelectFilter
            label="Todos"
            options={MESES.map(m => ({ value: m.value, label: m.label }))}
            selected={filters.meses}
            onChange={(selected) => onFiltersChange({ ...filters, meses: selected as number[] })}
          />
        </div>

        {/* Ano */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Ano</Label>
          <MultiSelectFilter
            label="Todos"
            options={ANOS.map(a => ({ value: a, label: a.toString() }))}
            selected={filters.anos}
            onChange={(selected) => onFiltersChange({ ...filters, anos: selected as number[] })}
          />
        </div>

        {/* Semana */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Semana</Label>
          <MultiSelectFilter
            label="Todas"
            options={SEMANAS.map(s => ({ value: s, label: `${s}ª Semana` }))}
            selected={filters.semanas}
            onChange={(selected) => onFiltersChange({ ...filters, semanas: selected as number[] })}
          />
        </div>
      </div>

      {/* Second Row - Search and Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        {/* Search */}
        <div className="flex-1 space-y-1 w-full sm:w-auto">
          <Label className="text-xs text-muted-foreground">Buscar descrição</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9"
              placeholder="Digite para buscar..."
              value={filters.busca}
              onChange={(e) => onFiltersChange({ ...filters, busca: e.target.value })}
            />
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-2 h-9">
          <Switch
            id="apenas-ativos"
            checked={filters.apenas_ativos}
            onCheckedChange={(checked) => onFiltersChange({ ...filters, apenas_ativos: checked })}
          />
          <Label htmlFor="apenas-ativos" className="text-sm cursor-pointer">
            Apenas ativos
          </Label>
        </div>

        {/* Reset Button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleReset}
          className="h-9"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      </div>

      {/* Active Filters Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          {filters.responsaveis.map(r => (
            <Badge key={`resp-${r}`} variant="secondary" className="gap-1">
              {r}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('responsavel', r)} />
            </Badge>
          ))}
          {filters.setores.map(s => (
            <Badge key={`setor-${s}`} variant="secondary" className="gap-1">
              {s}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('setor', s)} />
            </Badge>
          ))}
          {filters.meses.map(m => (
            <Badge key={`mes-${m}`} variant="secondary" className="gap-1">
              {MESES.find(mes => mes.value === m)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('mes', m)} />
            </Badge>
          ))}
          {filters.anos.map(a => (
            <Badge key={`ano-${a}`} variant="secondary" className="gap-1">
              {a}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('ano', a)} />
            </Badge>
          ))}
          {filters.semanas.map(s => (
            <Badge key={`sem-${s}`} variant="secondary" className="gap-1">
              {s}ª Semana
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('semana', s)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
