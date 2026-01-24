import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  Plus, 
  Calendar, 
  Users, 
  Check, 
  AlertTriangle, 
  Trash2,
  ChevronRight,
  Clock,
  Loader2
} from 'lucide-react';
import { usePdfImports, useDeletePdfImport } from '@/hooks/usePdfImports';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PdfImportsListProps {
  onSelectImport: (importId: string) => void;
  onNewImport: () => void;
}

const STATUS_CONFIG = {
  uploaded: { label: 'Enviado', color: 'bg-blue-500', icon: Clock },
  parsing: { label: 'Processando', color: 'bg-amber-500', icon: Loader2 },
  ready: { label: 'Pronto', color: 'bg-green-500', icon: Check },
  imported: { label: 'Importado', color: 'bg-primary', icon: Check },
  error: { label: 'Erro', color: 'bg-red-500', icon: AlertTriangle },
};

export function PdfImportsList({ onSelectImport, onNewImport }: PdfImportsListProps) {
  const { data: imports, isLoading } = usePdfImports();
  const deleteImport = useDeletePdfImport();

  const handleDelete = async (importId: string) => {
    await deleteImport.mutateAsync(importId);
  };

  const formatPeriod = (year: number | null, month: number | null) => {
    if (!year || !month) return null;
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[month - 1]} ${year}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!imports || imports.length === 0) {
    return (
      <Card className="py-12">
        <CardContent>
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Nenhum relatório importado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Importe um PDF de boletim para visualizar os indicadores dos clientes.
            </p>
            <Button onClick={onNewImport} className="gap-2">
              <Plus className="w-4 h-4" />
              Importar primeiro PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Importações realizadas</h2>
        <Badge variant="secondary">{imports.length} arquivo(s)</Badge>
      </div>

      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="space-y-3">
          {imports.map((item) => {
            const statusConfig = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.uploaded;
            const StatusIcon = statusConfig.icon;
            const period = formatPeriod(item.report_period_year, item.report_period_month);

            return (
              <Card 
                key={item.id}
                className="group hover:shadow-md transition-all cursor-pointer"
                onClick={() => onSelectImport(item.id)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{item.file_name}</h3>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] shrink-0 ${statusConfig.color} text-white border-0`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(item.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                        {period && (
                          <Badge variant="outline" className="text-[10px]">
                            Período: {period}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {item.total_clients_matched} / {item.total_clients_detected} clientes
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir importação?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O arquivo e todos os dados associados serão removidos.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(item.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}