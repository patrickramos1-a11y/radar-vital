import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusCircle } from './StatusCircle';
import { AptDemand, SETOR_COLORS, RESPONSAVEL_COLORS, SEMANA_LABELS, FeitoResponsavelStatus, AprovadoGestorStatus } from '@/types/apt';
import { cn } from '@/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileAptCardProps {
  demand: AptDemand;
  onUpdateFeitoResponsavel: (id: string, status: FeitoResponsavelStatus) => void;
  onUpdateAprovadoGestor: (id: string, status: AprovadoGestorStatus) => void;
  onEdit?: (demand: AptDemand) => void;
  onDelete?: (id: string) => void;
  isGestor: boolean;
  canEditFeito: boolean;
}

export function MobileAptCard({
  demand,
  onUpdateFeitoResponsavel,
  onUpdateAprovadoGestor,
  onEdit,
  onDelete,
  isGestor,
  canEditFeito,
}: MobileAptCardProps) {
  const setorColor = SETOR_COLORS[demand.setor.toUpperCase()] || 'hsl(0, 0%, 90%)';
  const responsavelColor = RESPONSAVEL_COLORS[demand.responsavel.toUpperCase()] || 'hsl(0, 0%, 85%)';

  const cycleFeitoStatus = () => {
    if (!canEditFeito) return;
    const statuses: FeitoResponsavelStatus[] = ['pendente', 'executado', 'nao_realizado'];
    const currentIndex = statuses.indexOf(demand.feito_responsavel);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onUpdateFeitoResponsavel(demand.id, nextStatus);
  };

  const cycleGestorStatus = () => {
    if (!isGestor) return;
    const statuses: AprovadoGestorStatus[] = ['pendente', 'aprovado', 'nao_aprovado'];
    const currentIndex = statuses.indexOf(demand.aprovado_gestor);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onUpdateAprovadoGestor(demand.id, nextStatus);
  };

  return (
    <Card 
      className={cn(
        'overflow-hidden',
        demand.is_highlighted && 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300'
      )}
    >
      <CardContent className="p-3 space-y-3">
        {/* Header Row */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-muted-foreground w-8">
            #{demand.numero}
          </span>
          <span 
            className="px-2 py-0.5 rounded text-xs font-semibold text-gray-800"
            style={{ backgroundColor: setorColor }}
          >
            {demand.setor}
          </span>
          <span 
            className="px-2 py-0.5 rounded text-xs font-semibold text-gray-800"
            style={{ backgroundColor: responsavelColor }}
          >
            {demand.responsavel}
          </span>
          <span 
            className={cn(
              'ml-auto px-2 py-0.5 rounded text-xs font-semibold',
              demand.semana_limite === 1 && 'bg-green-200 text-green-800',
              demand.semana_limite === 2 && 'bg-blue-200 text-blue-800',
              demand.semana_limite === 3 && 'bg-yellow-200 text-yellow-800',
              demand.semana_limite === 4 && 'bg-orange-200 text-orange-800',
              demand.semana_limite === 5 && 'bg-red-200 text-red-800',
            )}
          >
            {SEMANA_LABELS[demand.semana_limite]}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground line-clamp-3">
          {demand.descricao}
        </p>

        {/* Status Row */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">RESP.</span>
              <StatusCircle
                status={demand.feito_responsavel}
                onClick={cycleFeitoStatus}
                disabled={!canEditFeito}
                size="lg"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">GESTOR</span>
              <StatusCircle
                status={demand.aprovado_gestor}
                onClick={cycleGestorStatus}
                disabled={!isGestor}
                size="lg"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">REPET.</span>
              <span className="text-sm font-bold">{demand.repeticoes}x</span>
            </div>
          </div>

          {/* Actions */}
          {isGestor && (
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(demand)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(demand.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
