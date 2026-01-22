import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AptDemand, FeitoResponsavelStatus, AprovadoGestorStatus } from '@/types/apt';

interface AptDemandModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demand?: AptDemand | null;
  onSave: (demand: Omit<AptDemand, 'id' | 'created_at' | 'updated_at'>) => void;
  existingSetores: string[];
  existingResponsaveis: string[];
}

const DEFAULT_SETORES = ['ALIMENTAÇÃO', 'AUDITAR', 'SERVIÇO', 'FEEDBACK', 'FINANCEIRO', 'COMERCIAL', 'OPERACIONAL', 'RH'];
const DEFAULT_RESPONSAVEIS = ['CELINE', 'GABI', 'DARLEY', 'VANESSA', 'PATRICK'];

export function AptDemandModal({
  open,
  onOpenChange,
  demand,
  onSave,
  existingSetores,
  existingResponsaveis,
}: AptDemandModalProps) {
  const [formData, setFormData] = useState<{
    numero: number;
    setor: string;
    responsavel: string;
    descricao: string;
    feito_responsavel: FeitoResponsavelStatus;
    aprovado_gestor: AprovadoGestorStatus;
    repeticoes: number;
    semana_limite: number;
    mes: number;
    ano: number;
    is_highlighted: boolean;
    is_active: boolean;
  }>({
    numero: 1,
    setor: '',
    responsavel: '',
    descricao: '',
    feito_responsavel: 'pendente',
    aprovado_gestor: 'pendente',
    repeticoes: 1,
    semana_limite: 1,
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear(),
    is_highlighted: false,
    is_active: true,
  });

  const setores = [...new Set([...DEFAULT_SETORES, ...existingSetores])].sort();
  const responsaveis = [...new Set([...DEFAULT_RESPONSAVEIS, ...existingResponsaveis])].sort();

  useEffect(() => {
    if (demand) {
      setFormData({
        numero: demand.numero,
        setor: demand.setor,
        responsavel: demand.responsavel,
        descricao: demand.descricao,
        feito_responsavel: demand.feito_responsavel,
        aprovado_gestor: demand.aprovado_gestor,
        repeticoes: demand.repeticoes,
        semana_limite: demand.semana_limite,
        mes: demand.mes,
        ano: demand.ano,
        is_highlighted: demand.is_highlighted,
        is_active: demand.is_active,
      });
    } else {
      setFormData({
        numero: 1,
        setor: '',
        responsavel: '',
        descricao: '',
        feito_responsavel: 'pendente',
        aprovado_gestor: 'pendente',
        repeticoes: 1,
        semana_limite: 1,
        mes: new Date().getMonth() + 1,
        ano: new Date().getFullYear(),
        is_highlighted: false,
        is_active: true,
      });
    }
  }, [demand, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.setor || !formData.responsavel || !formData.descricao) return;
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{demand ? 'Editar Demanda' : 'Nova Demanda'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Número */}
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                type="number"
                min={1}
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: Number(e.target.value) })}
                required
              />
            </div>

            {/* Setor */}
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select
                value={formData.setor}
                onValueChange={(v) => setFormData({ ...formData, setor: v })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {setores.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Responsável */}
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select
                value={formData.responsavel}
                onValueChange={(v) => setFormData({ ...formData, responsavel: v })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {responsaveis.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Repetições */}
            <div className="space-y-2">
              <Label htmlFor="repeticoes">Repetições (X)</Label>
              <Input
                id="repeticoes"
                type="number"
                min={1}
                max={99}
                value={formData.repeticoes}
                onChange={(e) => setFormData({ ...formData, repeticoes: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva a demanda..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Mês */}
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select
                value={formData.mes.toString()}
                onValueChange={(v) => setFormData({ ...formData, mes: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2000, i).toLocaleString('pt-BR', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ano */}
            <div className="space-y-2">
              <Label>Ano</Label>
              <Select
                value={formData.ano.toString()}
                onValueChange={(v) => setFormData({ ...formData, ano: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Semana Limite */}
            <div className="space-y-2">
              <Label>Semana Limite</Label>
              <Select
                value={formData.semana_limite.toString()}
                onValueChange={(v) => setFormData({ ...formData, semana_limite: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1ª Semana</SelectItem>
                  <SelectItem value="2">2ª Semana</SelectItem>
                  <SelectItem value="3">3ª Semana</SelectItem>
                  <SelectItem value="4">4ª Semana</SelectItem>
                  <SelectItem value="5">5ª Semana</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Highlighted */}
            <div className="flex items-center gap-2">
              <Switch
                id="highlighted"
                checked={formData.is_highlighted}
                onCheckedChange={(checked) => setFormData({ ...formData, is_highlighted: checked })}
              />
              <Label htmlFor="highlighted" className="cursor-pointer">Destaque (amarelo)</Label>
            </div>

            {/* Active */}
            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="active" className="cursor-pointer">Ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {demand ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
