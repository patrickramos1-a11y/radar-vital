import React from 'react';
import { AptFilters as AptFiltersType, getDefaultFilters } from '@/types/apt';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, RotateCcw } from 'lucide-react';

interface AptFiltersProps {
  filters: AptFiltersType;
  onFiltersChange: (filters: AptFiltersType) => void;
  setores: string[];
  responsaveis: string[];
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

export function AptFiltersComponent({ filters, onFiltersChange, setores, responsaveis }: AptFiltersProps) {
  const handleReset = () => {
    onFiltersChange(getDefaultFilters());
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* First Row - Main Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Responsável */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Responsável</Label>
          <Select
            value={filters.responsavel || 'all'}
            onValueChange={(v) => onFiltersChange({ ...filters, responsavel: v === 'all' ? null : v })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {responsaveis.map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Setor */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Setor</Label>
          <Select
            value={filters.setor || 'all'}
            onValueChange={(v) => onFiltersChange({ ...filters, setor: v === 'all' ? null : v })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {setores.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mês */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Mês</Label>
          <Select
            value={filters.mes?.toString() || 'all'}
            onValueChange={(v) => onFiltersChange({ ...filters, mes: v === 'all' ? null : Number(v) })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {MESES.map(m => (
                <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ano */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Ano</Label>
          <Select
            value={filters.ano?.toString() || 'all'}
            onValueChange={(v) => onFiltersChange({ ...filters, ano: v === 'all' ? null : Number(v) })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {ANOS.map(a => (
                <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Semana */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Semana</Label>
          <Select
            value={filters.semana_limite?.toString() || 'all'}
            onValueChange={(v) => onFiltersChange({ ...filters, semana_limite: v === 'all' ? null : Number(v) })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="1">1ª Semana</SelectItem>
              <SelectItem value="2">2ª Semana</SelectItem>
              <SelectItem value="3">3ª Semana</SelectItem>
              <SelectItem value="4">4ª Semana</SelectItem>
              <SelectItem value="5">5ª Semana</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Responsável */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status Resp.</Label>
          <Select
            value={filters.status_responsavel || 'all'}
            onValueChange={(v) => onFiltersChange({ ...filters, status_responsavel: v === 'all' ? null : v as any })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="executado">Executado</SelectItem>
              <SelectItem value="nao_realizado">Não Realizado</SelectItem>
            </SelectContent>
          </Select>
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
    </div>
  );
}
