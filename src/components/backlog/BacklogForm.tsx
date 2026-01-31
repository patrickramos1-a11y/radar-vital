import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import type { BacklogItemCreate, BacklogCategory, BacklogModule, BacklogPriority, BacklogImpact, BacklogEffort } from '@/types/backlog';
import { 
  BACKLOG_CATEGORY_LABELS, 
  BACKLOG_MODULE_LABELS, 
  BACKLOG_PRIORITY_LABELS,
  BACKLOG_IMPACT_LABELS,
  BACKLOG_EFFORT_LABELS
} from '@/types/backlog';
import { getCurrentUserName } from '@/contexts/AuthContext';

interface BacklogFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BacklogItemCreate) => Promise<unknown>;
  isLoading?: boolean;
}

const DESCRIPTION_PLACEHOLDER = `## Contexto / Problema

## Objetivo da melhoria

## Comportamento atual

## Comportamento esperado

## Regras de negócio

## Observações técnicas

## Impacto no usuário`;

export function BacklogForm({ open, onOpenChange, onSubmit, isLoading }: BacklogFormProps) {
  const currentUserName = getCurrentUserName();
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<BacklogCategory>('NOVA_FUNCIONALIDADE');
  const [modulosImpactados, setModulosImpactados] = useState<BacklogModule[]>([]);
  const [descricaoDetalhada, setDescricaoDetalhada] = useState('');
  const [prioridade, setPrioridade] = useState<BacklogPriority>('MEDIA');
  const [impactoEsperado, setImpactoEsperado] = useState<BacklogImpact>('MEDIO');
  const [estimativaEsforco, setEstimativaEsforco] = useState<BacklogEffort>('MEDIO');
  const [dependenteDeCreditos, setDependenteDeCreditos] = useState(false);
  const [responsavelTecnico, setResponsavelTecnico] = useState('');

  const handleSubmit = async () => {
    if (!titulo.trim()) return;

    await onSubmit({
      titulo: titulo.trim(),
      categoria,
      modulos_impactados: modulosImpactados,
      descricao_detalhada: descricaoDetalhada || undefined,
      prioridade,
      impacto_esperado: impactoEsperado,
      estimativa_esforco: estimativaEsforco,
      dependente_de_creditos: dependenteDeCreditos,
      responsavel_produto: currentUserName,
      responsavel_tecnico: responsavelTecnico || undefined
    });

    // Reset form
    setTitulo('');
    setCategoria('NOVA_FUNCIONALIDADE');
    setModulosImpactados([]);
    setDescricaoDetalhada('');
    setPrioridade('MEDIA');
    setImpactoEsperado('MEDIO');
    setEstimativaEsforco('MEDIO');
    setDependenteDeCreditos(false);
    setResponsavelTecnico('');
    onOpenChange(false);
  };

  const toggleModule = (mod: BacklogModule) => {
    setModulosImpactados(prev => 
      prev.includes(mod) 
        ? prev.filter(m => m !== mod)
        : [...prev, mod]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Item de Backlog</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Título */}
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título curto e objetivo"
              className="mt-1"
            />
          </div>

          {/* Categoria */}
          <div>
            <Label>Categoria *</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as BacklogCategory)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(BACKLOG_CATEGORY_LABELS) as BacklogCategory[]).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {BACKLOG_CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Módulos Impactados */}
          <div>
            <Label>Módulos Impactados</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(Object.keys(BACKLOG_MODULE_LABELS) as BacklogModule[]).map((mod) => (
                <Badge
                  key={mod}
                  variant={modulosImpactados.includes(mod) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleModule(mod)}
                >
                  {BACKLOG_MODULE_LABELS[mod]}
                  {modulosImpactados.includes(mod) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Descrição Detalhada */}
          <div>
            <Label htmlFor="descricao">Descrição Detalhada</Label>
            <Textarea
              id="descricao"
              value={descricaoDetalhada}
              onChange={(e) => setDescricaoDetalhada(e.target.value)}
              placeholder={DESCRIPTION_PLACEHOLDER}
              className="mt-1 min-h-[200px] font-mono text-sm"
            />
          </div>

          {/* Grid de campos */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Prioridade */}
            <div>
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={(v) => setPrioridade(v as BacklogPriority)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(BACKLOG_PRIORITY_LABELS) as BacklogPriority[]).map((pri) => (
                    <SelectItem key={pri} value={pri}>
                      {BACKLOG_PRIORITY_LABELS[pri]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Impacto */}
            <div>
              <Label>Impacto Esperado</Label>
              <Select value={impactoEsperado} onValueChange={(v) => setImpactoEsperado(v as BacklogImpact)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(BACKLOG_IMPACT_LABELS) as BacklogImpact[]).map((imp) => (
                    <SelectItem key={imp} value={imp}>
                      {BACKLOG_IMPACT_LABELS[imp]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Esforço */}
            <div>
              <Label>Estimativa de Esforço</Label>
              <Select value={estimativaEsforco} onValueChange={(v) => setEstimativaEsforco(v as BacklogEffort)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(BACKLOG_EFFORT_LABELS) as BacklogEffort[]).map((eff) => (
                    <SelectItem key={eff} value={eff}>
                      {BACKLOG_EFFORT_LABELS[eff]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Responsável Técnico */}
          <div>
            <Label htmlFor="responsavel-tecnico">Responsável Técnico (opcional)</Label>
            <Input
              id="responsavel-tecnico"
              value={responsavelTecnico}
              onChange={(e) => setResponsavelTecnico(e.target.value)}
              placeholder="Nome do responsável técnico"
              className="mt-1"
            />
          </div>

          {/* Dependente de Créditos */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
            <div>
              <Label htmlFor="creditos" className="text-base font-medium">Dependente de Créditos</Label>
              <p className="text-sm text-muted-foreground">
                Este item requer créditos disponíveis para ser implementado
              </p>
            </div>
            <Switch
              id="creditos"
              checked={dependenteDeCreditos}
              onCheckedChange={setDependenteDeCreditos}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!titulo.trim() || isLoading}>
            {isLoading ? 'Criando...' : 'Criar Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
