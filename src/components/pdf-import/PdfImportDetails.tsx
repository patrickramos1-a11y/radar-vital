import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Users, 
  Check, 
  X,
  TrendingUp,
  Download,
  ExternalLink
} from 'lucide-react';
import { usePdfImportDetails } from '@/hooks/usePdfImports';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PdfImportDetailsProps {
  importId: string;
  onBack: () => void;
}

export function PdfImportDetails({ importId, onBack }: PdfImportDetailsProps) {
  const { data, isLoading } = usePdfImportDetails(importId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Card>
          <CardContent className="py-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Importação não encontrada</p>
        <Button onClick={onBack} variant="link" className="mt-2">
          Voltar
        </Button>
      </div>
    );
  }

  const { import: pdfImport, detectedClients, metrics } = data;
  const matchedClients = detectedClients.filter(c => c.match_status === 'auto' || c.match_status === 'linked');
  const pendingClients = detectedClients.filter(c => c.match_status === 'pending' || c.match_status === 'unmatched');

  const formatPeriod = (year: number | null, month: number | null) => {
    if (!year || !month) return 'Não detectado';
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${monthNames[month - 1]} de ${year}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">{pdfImport.file_name}</h1>
          <p className="text-sm text-muted-foreground">
            Importado em {format(new Date(pdfImport.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-bold">{pdfImport.total_clients_detected}</div>
            <div className="text-xs text-muted-foreground">No PDF</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-bold text-green-600">{pdfImport.total_clients_matched}</div>
            <div className="text-xs text-muted-foreground">Importados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-bold text-amber-600">{pdfImport.total_clients_pending}</div>
            <div className="text-xs text-muted-foreground">Pendentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-bold text-red-600">{pdfImport.total_clients_unmatched}</div>
            <div className="text-xs text-muted-foreground">Ignorados</div>
          </CardContent>
        </Card>
      </div>

      {/* Import Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Informações do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Período:</span>
                <Badge variant="outline">
                  {formatPeriod(pdfImport.report_period_year, pdfImport.report_period_month)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={pdfImport.status === 'imported' ? 'default' : 'secondary'}>
                  {pdfImport.status === 'imported' ? 'Importado' : pdfImport.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Importado por:</span>
                <span className="text-sm">{pdfImport.imported_by}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tamanho:</span>
                <span className="text-sm">
                  {pdfImport.file_size ? `${(pdfImport.file_size / 1024).toFixed(1)} KB` : '-'}
                </span>
              </div>
              {pdfImport.file_url && (
                <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                  <a href={pdfImport.file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4" />
                    Baixar PDF original
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matched Clients */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Clientes Importados ({matchedClients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {matchedClients.map((client) => (
                <div 
                  key={client.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {client.matched_client?.initials || '??'}
                    </div>
                    <div>
                      <p className="font-medium">{client.matched_client?.name || client.client_name_raw}</p>
                      <p className="text-xs text-muted-foreground">
                        PDF: {client.client_name_raw}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={client.match_status === 'auto' ? 'default' : 'secondary'}
                      className="text-[10px]"
                    >
                      {client.match_status === 'auto' ? 'Auto' : 'Vinculado'}
                    </Badge>
                    {client.match_score && client.match_score < 1 && (
                      <Badge variant="outline" className="text-[10px]">
                        {Math.round(Number(client.match_score) * 100)}%
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pending/Unmatched */}
      {pendingClients.length > 0 && (
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
              <X className="w-4 h-4" />
              Não Importados ({pendingClients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pendingClients.map((client) => (
                <Badge key={client.id} variant="outline" className="text-xs">
                  {client.client_name_raw}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}