import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, Link2, ArrowRight, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLinkPdfClient } from '@/hooks/usePdfImports';
import type { ClientMatchResult, ParsedPdfData } from '@/types/pdfImport';

interface PdfCorrelationStepProps {
  importId: string;
  matchResults: ClientMatchResult[];
  parsedData: ParsedPdfData | null;
  onComplete: (updatedResults: ClientMatchResult[]) => void;
  stats: {
    autoMatched: number;
    linked: number;
    pending: number;
    unmatched: number;
  };
}

export function PdfCorrelationStep({ 
  importId,
  matchResults: initialResults, 
  parsedData,
  onComplete,
  stats,
}: PdfCorrelationStepProps) {
  const [results, setResults] = useState(initialResults);
  const [createAliases, setCreateAliases] = useState<Record<string, boolean>>({});
  const linkClient = useLinkPdfClient();

  // Fetch existing clients for manual linking
  const { data: existingClients = [] } = useQuery({
    queryKey: ['clients-for-linking'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, name, initials')
        .eq('is_active', true)
        .order('name');
      return data || [];
    },
  });

  const handleLinkClient = async (pdfClientName: string, clientId: string) => {
    const result = results.find(r => r.pdfClientName === pdfClientName);
    if (!result) return;
    
    const client = existingClients.find(c => c.id === clientId);
    const shouldCreateAlias = createAliases[pdfClientName] ?? true;
    
    // Update local state
    setResults(prev => prev.map(r => 
      r.pdfClientName === pdfClientName
        ? { ...r, matchedClientId: clientId, matchedClientName: client?.name || null, matchStatus: 'linked' as const }
        : r
    ));
    
    // Note: The actual DB update will happen when the import is completed
  };

  const pendingItems = results.filter(r => r.matchStatus === 'pending' || r.matchStatus === 'unmatched');
  const matchedItems = results.filter(r => r.matchStatus === 'auto' || r.matchStatus === 'linked');

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.autoMatched + stats.linked}</div>
            <div className="text-xs text-muted-foreground">Correlacionados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pendentes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.unmatched}</div>
            <div className="text-xs text-muted-foreground">Não encontrados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-center">
            <div className="text-2xl font-bold text-primary">{results.length}</div>
            <div className="text-xs text-muted-foreground">Total no PDF</div>
          </CardContent>
        </Card>
      </div>

      {/* Period Info */}
      {parsedData?.period.year && parsedData?.period.month && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">
                Período: {parsedData.period.month}/{parsedData.period.year}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending/Unmatched Items */}
      {pendingItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Clientes para vincular manualmente ({pendingItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {pendingItems.map((item) => (
                  <div 
                    key={item.pdfClientName}
                    className="p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.pdfClientName}</span>
                          <Badge variant={item.matchStatus === 'pending' ? 'secondary' : 'destructive'} className="text-[10px]">
                            {item.matchStatus === 'pending' ? 'Sugestões' : 'Não encontrado'}
                          </Badge>
                        </div>
                        
                        {/* Suggestions */}
                        {item.suggestions && item.suggestions.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Sugestões: {item.suggestions.map(s => (
                              <button
                                key={s.clientId}
                                onClick={() => handleLinkClient(item.pdfClientName, s.clientId)}
                                className="ml-1 px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors"
                              >
                                {s.clientName} ({Math.round(s.score * 100)}%)
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select
                          onValueChange={(value) => handleLinkClient(item.pdfClientName, value)}
                        >
                          <SelectTrigger className="w-[200px] h-8 text-xs">
                            <SelectValue placeholder="Selecionar cliente..." />
                          </SelectTrigger>
                          <SelectContent>
                            {existingClients.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Create alias checkbox */}
                    <div className="mt-2 flex items-center gap-2">
                      <Checkbox
                        id={`alias-${item.pdfClientName}`}
                        checked={createAliases[item.pdfClientName] ?? true}
                        onCheckedChange={(checked) => 
                          setCreateAliases(prev => ({ ...prev, [item.pdfClientName]: !!checked }))
                        }
                      />
                      <label 
                        htmlFor={`alias-${item.pdfClientName}`}
                        className="text-xs text-muted-foreground"
                      >
                        Lembrar vínculo para importações futuras
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Matched Items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Clientes correlacionados ({matchedItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-1">
              {matchedItems.map((item) => (
                <div 
                  key={item.pdfClientName}
                  className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{item.pdfClientName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowRight className="w-3 h-3" />
                    <span>{item.matchedClientName}</span>
                    {item.matchScore && item.matchScore < 1 && (
                      <Badge variant="outline" className="text-[10px]">
                        {Math.round(item.matchScore * 100)}%
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button onClick={() => onComplete(results)} className="gap-2">
          Continuar
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}