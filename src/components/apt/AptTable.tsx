import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AptDemandRow } from './AptDemandRow';
import { AptDemand, FeitoResponsavelStatus, AprovadoGestorStatus } from '@/types/apt';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface AptTableProps {
  demands: AptDemand[];
  onUpdateFeitoResponsavel: (id: string, status: FeitoResponsavelStatus) => void;
  onUpdateAprovadoGestor: (id: string, status: AprovadoGestorStatus) => void;
  onEdit?: (demand: AptDemand) => void;
  onDelete?: (id: string) => void;
  isGestor: boolean;
  currentUserName: string;
}

export function AptTable({
  demands,
  onUpdateFeitoResponsavel,
  onUpdateAprovadoGestor,
  onEdit,
  onDelete,
  isGestor,
  currentUserName,
}: AptTableProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Header Note */}
      <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 text-xs p-2 text-center border-b border-border">
        <strong>OBS:</strong> CASO O RESPONSÁVEL PELA APT MARQUE A CAIXA NA COR{' '}
        <span className="text-red-600 font-bold">VERMELHA</span>, SIGNIFICA QUE A DEMANDA NÃO FOI REALIZADA OU NÃO HOUVE MOVIMENTAÇÃO. 
        QUANDO MARCADA NAS CORES <span className="text-blue-600 font-bold">AZUL</span> OU{' '}
        <span className="font-bold">PRETA</span>, SIGNIFICA QUE A DEMANDA FOI EXECUTADA.
      </div>

      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="bg-green-600 hover:bg-green-600">
              <TableHead className="text-white font-bold text-center text-xs py-3 w-12">Nº</TableHead>
              <TableHead className="text-white font-bold text-center text-xs py-3 w-24">SETOR</TableHead>
              <TableHead className="text-white font-bold text-center text-xs py-3 w-20">RESP</TableHead>
              <TableHead className="text-white font-bold text-center text-xs py-3 min-w-[200px]">DEMANDAS</TableHead>
              <TableHead className="text-white font-bold text-center text-xs py-3 w-24">
                <div className="leading-tight">
                  FEITO PELO<br />RESPONSÁVEL?
                </div>
              </TableHead>
              <TableHead className="text-white font-bold text-center text-xs py-3 w-24">
                <div className="leading-tight">
                  APROVADO<br />PELO GESTOR?
                </div>
              </TableHead>
              <TableHead className="text-white font-bold text-center text-xs py-3 w-12">X</TableHead>
              <TableHead className="text-white font-bold text-center text-xs py-3 w-24">
                <div className="leading-tight">
                  DATA<br />LIMITE
                </div>
              </TableHead>
              {isGestor && (
                <TableHead className="text-white font-bold text-center text-xs py-3 w-20">AÇÕES</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {demands.length === 0 ? (
              <TableRow>
                <td 
                  colSpan={isGestor ? 9 : 8} 
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhuma demanda encontrada com os filtros selecionados.
                </td>
              </TableRow>
            ) : (
              demands.map((demand) => (
                <AptDemandRow
                  key={demand.id}
                  demand={demand}
                  onUpdateFeitoResponsavel={onUpdateFeitoResponsavel}
                  onUpdateAprovadoGestor={onUpdateAprovadoGestor}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isGestor={isGestor}
                  canEditFeito={isGestor || demand.responsavel.toUpperCase() === currentUserName.toUpperCase()}
                />
              ))
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
