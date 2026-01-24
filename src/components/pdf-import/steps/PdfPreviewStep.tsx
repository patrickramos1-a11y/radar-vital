import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Download, Loader2, Users, FileText, TrendingUp } from 'lucide-react';
import type { ClientMatchResult, ParsedPdfData } from '@/types/pdfImport';

interface PdfPreviewStepProps {
  parsedData: ParsedPdfData | null;
  matchResults: ClientMatchResult[];
  stats: {
    autoMatched: number;
    linked: number;
    pending: number;
    unmatched: number;
  };
  onImport: (includeLinked: boolean) => void;
  isProcessing: boolean;
}

export function PdfPreviewStep({ 
  parsedData,
  matchResults, 
  stats,
  onImport,
  isProcessing,
}: PdfPreviewStepProps) {
  const importableResults = matchResults.filter(r => r.matchStatus === 'auto' || r.matchStatus === 'linked');
  const autoOnly = matchResults.filter(r => r.matchStatus === 'auto');
  const linkedCount = matchResults.filter(r => r.matchStatus === 'linked').length;

  // Collect all unique metric keys from results
  const allMetricKeys = new Set<string>();
  matchResults.forEach(r => {
    r.metrics.forEach(m => allMetricKeys.add(m.key));
  });

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Resumo da Importação
          </CardTitle>
          {parsedData?.period.year && parsedData?.period.month && (
            <CardDescription>
              Período: {parsedData.period.month}/{parsedData.period.year}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted text-center">
              <div className="text-2xl font-bold">{matchResults.length}</div>
              <div className="text-xs text-muted-foreground">Clientes no PDF</div>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.autoMatched}</div>
              <div className="text-xs text-muted-foreground">Automáticos</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 text-center">
              <div className="text-2xl font-bold text-blue-600">{linkedCount}</div>
              <div className="text-xs text-muted-foreground">Vinculados</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.pending + stats.unmatched}</div>
              <div className="text-xs text-muted-foreground">Ignorados</div>
            </div>
          </div>

          {/* Metrics Summary */}
          <div className="mt-4 p-3 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Métricas detectadas:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from(allMetricKeys).map(key => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients to Import */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Clientes que serão importados ({importableResults.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px]">
            <div className="space-y-2">
              {importableResults.map((item) => (
                <div 
                  key={item.pdfClientName}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="font-medium">{item.matchedClientName}</span>
                      <span className="text-xs text-muted-foreground">
                        (PDF: {item.pdfClientName})
                      </span>
                    </div>
                    <Badge 
                      variant={item.matchStatus === 'auto' ? 'default' : 'secondary'}
                      className="text-[10px]"
                    >
                      {item.matchStatus === 'auto' ? 'Auto' : 'Vinculado'}
                    </Badge>
                  </div>
                  
                  {/* Metrics preview */}
                  {item.metrics.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.metrics.slice(0, 5).map(m => (
                        <span 
                          key={m.key}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-muted"
                        >
                          {m.label}: {m.value ?? '-'}
                        </span>
                      ))}
                      {item.metrics.length > 5 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{item.metrics.length - 5} mais
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Not Imported */}
      {(stats.pending + stats.unmatched) > 0 && (
        <Card className="border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
              <X className="w-4 h-4" />
              Clientes ignorados ({stats.pending + stats.unmatched})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {matchResults
                .filter(r => r.matchStatus === 'pending' || r.matchStatus === 'unmatched')
                .map(item => (
                  <Badge key={item.pdfClientName} variant="outline" className="text-xs">
                    {item.pdfClientName}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button 
          variant="outline"
          onClick={() => onImport(false)}
          disabled={isProcessing || autoOnly.length === 0}
        >
          {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Importar apenas automáticos ({autoOnly.length})
        </Button>
        <Button 
          onClick={() => onImport(true)}
          disabled={isProcessing || importableResults.length === 0}
        >
          {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Download className="w-4 h-4 mr-2" />
          Importar todos ({importableResults.length})
        </Button>
      </div>
    </div>
  );
}