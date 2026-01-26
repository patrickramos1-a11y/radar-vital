import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { DashboardFilters as Filters } from "@/hooks/useDashboardStats";

interface DashboardFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  municipios: string[];
  isRefetching?: boolean;
  onRefresh?: () => void;
}

export function DashboardFiltersBar({ 
  filters, 
  onFiltersChange, 
  municipios,
  isRefetching,
  onRefresh 
}: DashboardFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
      </div>

      <Select
        value={filters.clientType || 'all'}
        onValueChange={(value) => onFiltersChange({ 
          ...filters, 
          clientType: value as 'AC' | 'AV' | 'all' 
        })}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Tipo de Cliente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Tipos</SelectItem>
          <SelectItem value="AC">Acompanhamento (AC)</SelectItem>
          <SelectItem value="AV">Avulso (AV)</SelectItem>
        </SelectContent>
      </Select>

      {municipios.length > 0 && (
        <Select
          value={filters.municipio || 'all'}
          onValueChange={(value) => onFiltersChange({ 
            ...filters, 
            municipio: value === 'all' ? undefined : value 
          })}
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Município" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Municípios</SelectItem>
            {municipios.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex-1" />

      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefetching}
          className="gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
          Atualizar
        </Button>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
