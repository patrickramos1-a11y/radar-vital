import { Search, X, Coins } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { BacklogFilters as BacklogFiltersType, BacklogStatus, BacklogCategory, BacklogModule, BacklogPriority } from '@/types/backlog';
import { BACKLOG_STATUS_LABELS, BACKLOG_CATEGORY_LABELS, BACKLOG_MODULE_LABELS, BACKLOG_PRIORITY_LABELS } from '@/types/backlog';

interface BacklogFiltersProps {
  filters: BacklogFiltersType;
  onFiltersChange: (filters: BacklogFiltersType) => void;
  onReset: () => void;
}

export function BacklogFilters({ filters, onFiltersChange, onReset }: BacklogFiltersProps) {
  const hasActiveFilters = filters.search || 
    filters.status !== 'TODOS' || 
    filters.categoria !== 'TODOS' || 
    filters.modulo !== 'TODOS' || 
    filters.prioridade !== 'TODOS' ||
    filters.dependenteDeCreditos !== null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título ou descrição..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Status */}
        <div className="flex-1 min-w-[150px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value as BacklogStatus | 'TODOS' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os Status</SelectItem>
              {(Object.keys(BACKLOG_STATUS_LABELS) as BacklogStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {BACKLOG_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Categoria */}
        <div className="flex-1 min-w-[150px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Categoria</Label>
          <Select
            value={filters.categoria}
            onValueChange={(value) => onFiltersChange({ ...filters, categoria: value as BacklogCategory | 'TODOS' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todas as Categorias</SelectItem>
              {(Object.keys(BACKLOG_CATEGORY_LABELS) as BacklogCategory[]).map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {BACKLOG_CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Módulo */}
        <div className="flex-1 min-w-[150px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Módulo</Label>
          <Select
            value={filters.modulo}
            onValueChange={(value) => onFiltersChange({ ...filters, modulo: value as BacklogModule | 'TODOS' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os Módulos</SelectItem>
              {(Object.keys(BACKLOG_MODULE_LABELS) as BacklogModule[]).map((mod) => (
                <SelectItem key={mod} value={mod}>
                  {BACKLOG_MODULE_LABELS[mod]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Prioridade */}
        <div className="flex-1 min-w-[120px]">
          <Label className="text-xs text-muted-foreground mb-1 block">Prioridade</Label>
          <Select
            value={filters.prioridade}
            onValueChange={(value) => onFiltersChange({ ...filters, prioridade: value as BacklogPriority | 'TODOS' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todas</SelectItem>
              {(Object.keys(BACKLOG_PRIORITY_LABELS) as BacklogPriority[]).map((pri) => (
                <SelectItem key={pri} value={pri}>
                  {BACKLOG_PRIORITY_LABELS[pri]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dependente de Créditos */}
        <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md bg-background">
          <Coins className="w-4 h-4 text-amber-500" />
          <Label htmlFor="creditos-filter" className="text-sm cursor-pointer">
            Só créditos
          </Label>
          <Switch
            id="creditos-filter"
            checked={filters.dependenteDeCreditos === true}
            onCheckedChange={(checked) => 
              onFiltersChange({ ...filters, dependenteDeCreditos: checked ? true : null })
            }
          />
        </div>

        {/* Reset */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
