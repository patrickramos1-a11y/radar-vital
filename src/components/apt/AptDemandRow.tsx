import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { StatusCircle } from './StatusCircle';
import { AptDemand, SETOR_COLORS, RESPONSAVEL_COLORS, SEMANA_LABELS, FeitoResponsavelStatus, AprovadoGestorStatus } from '@/types/apt';
import { cn } from '@/lib/utils';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AptDemandRowProps {
  demand: AptDemand;
  onUpdateFeitoResponsavel: (id: string, status: FeitoResponsavelStatus) => void;
  onUpdateAprovadoGestor: (id: string, status: AprovadoGestorStatus) => void;
  onEdit?: (demand: AptDemand) => void;
  onDelete?: (id: string) => void;
  isGestor: boolean;
  canEditFeito: boolean;
}

export function AptDemandRow({
  demand,
  onUpdateFeitoResponsavel,
  onUpdateAprovadoGestor,
  onEdit,
  onDelete,
  isGestor,
  canEditFeito,
}: AptDemandRowProps) {
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
    <TableRow 
      className={cn(
        'border-b border-border hover:bg-muted/30 transition-colors',
        demand.is_highlighted && 'bg-yellow-100 dark:bg-yellow-900/30'
      )}
    >
      {/* Nº */}
      <TableCell className="text-center font-bold text-sm py-2 px-2 w-12">
        {demand.numero}
      </TableCell>

      {/* Setor */}
      <TableCell 
        className="text-center font-semibold text-xs py-2 px-2 w-24"
        style={{ backgroundColor: setorColor }}
      >
        <span className="text-gray-800">{demand.setor}</span>
      </TableCell>

      {/* Responsável */}
      <TableCell 
        className="text-center font-semibold text-xs py-2 px-2 w-20"
        style={{ backgroundColor: responsavelColor }}
      >
        <span className="text-gray-800">{demand.responsavel}</span>
      </TableCell>

      {/* Descrição */}
      <TableCell className="text-left text-xs py-2 px-3 min-w-[200px]">
        <p className="line-clamp-2 text-foreground">{demand.descricao}</p>
      </TableCell>

      {/* Feito pelo Responsável */}
      <TableCell className="text-center py-2 px-2 w-24">
        <div className="flex justify-center">
          <StatusCircle
            status={demand.feito_responsavel}
            onClick={cycleFeitoStatus}
            disabled={!canEditFeito}
          />
        </div>
      </TableCell>

      {/* Aprovado pelo Gestor */}
      <TableCell className="text-center py-2 px-2 w-24">
        <div className="flex justify-center">
          <StatusCircle
            status={demand.aprovado_gestor}
            onClick={cycleGestorStatus}
            disabled={!isGestor}
          />
        </div>
      </TableCell>

      {/* X (Repetições) */}
      <TableCell className="text-center font-bold text-sm py-2 px-2 w-12">
        {demand.repeticoes}x
      </TableCell>

      {/* Data Limite (Semana) */}
      <TableCell className="text-center py-2 px-2 w-24">
        <span 
          className={cn(
            'text-xs font-semibold px-2 py-1 rounded',
            demand.semana_limite === 1 && 'bg-green-200 text-green-800',
            demand.semana_limite === 2 && 'bg-blue-200 text-blue-800',
            demand.semana_limite === 3 && 'bg-yellow-200 text-yellow-800',
            demand.semana_limite === 4 && 'bg-orange-200 text-orange-800',
            demand.semana_limite === 5 && 'bg-red-200 text-red-800',
          )}
        >
          {SEMANA_LABELS[demand.semana_limite] || `${demand.semana_limite}ª SEMANA`}
        </span>
      </TableCell>

      {/* Actions (Gestor only) */}
      {isGestor && (
        <TableCell className="text-center py-2 px-2 w-20">
          <div className="flex justify-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(demand)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(demand.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
