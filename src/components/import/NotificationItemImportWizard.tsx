import { useState, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Building2, Loader2, Plus } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { parseNotificationItemExcel, groupNotificationItemsByCompany } from '@/lib/notificationItemParser';
import { ExcelNotificationItem, NotificationItemMatchResult, createNotificationItemSummary } from '@/types/notificationItem';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Client, generateInitials } from '@/types/client';
import { useClients } from '@/contexts/ClientContext';

interface NotificationItemImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onImportComplete?: () => void;
}

type WizardStep = 'upload' | 'match' | 'importing' | 'complete';

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function calculateMatchScore(excelName: string, clientName: string): number {
  const normalizedExcel = normalizeCompanyName(excelName);
  const normalizedClient = normalizeCompanyName(clientName);
  
  if (normalizedExcel === normalizedClient) return 100;
  if (normalizedClient.includes(normalizedExcel) || normalizedExcel.includes(normalizedClient)) return 80;
  
  const excelWords = normalizedExcel.split(/\s+/).filter(w => w.length > 2);
  const clientWords = normalizedClient.split(/\s+/).filter(w => w.length > 2);
  
  if (excelWords.length === 0 || clientWords.length === 0) return 0;
  
  const matchingWords = excelWords.filter(ew => 
    clientWords.some(cw => cw.includes(ew) || ew.includes(cw))
  );
  
  return Math.round((matchingWords.length / Math.max(excelWords.length, clientWords.length)) * 100);
}

export function NotificationItemImportWizard({ isOpen, onClose, clients, onImportComplete }: NotificationItemImportWizardProps) {
  const { refetch } = useClients();
  const [step, setStep] = useState<WizardStep>('upload');
  const [items, setItems] = useState<ExcelNotificationItem[]>([]);
  const [matchResults, setMatchResults] = useState<NotificationItemMatchResult[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);

  const resetWizard = useCallback(() => {
    setStep('upload');
    setItems([]);
    setMatchResults([]);
    setImportProgress(0);
    setImportedCount(0);
  }, []);

  const handleClose = useCallback(() => {
    resetWizard();
    onClose();
  }, [onClose, resetWizard]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    const buffer = await file.arrayBuffer();
    const parsed = parseNotificationItemExcel(buffer);
    
    if (parsed.length === 0) {
      toast.error('Nenhum item válido encontrado na planilha');
      return;
    }
    
    setItems(parsed);
    
    // Group by company and match
    const grouped = groupNotificationItemsByCompany(parsed);
    const results: NotificationItemMatchResult[] = [];
    
    grouped.forEach((groupItems, empresaExcel) => {
      const normalizedExcel = normalizeCompanyName(empresaExcel);
      
      // Find exact match
      const exactMatch = clients.find(c => normalizeCompanyName(c.name) === normalizedExcel);
      
      if (exactMatch) {
        results.push({
          empresaExcel,
          clientId: exactMatch.id,
          clientName: exactMatch.name,
          matchType: 'exact',
          suggestions: [],
          items: groupItems,
          selected: true,
        });
      } else {
        // Find suggestions
        const suggestions = clients
          .map(c => ({ id: c.id, name: c.name, score: calculateMatchScore(empresaExcel, c.name) }))
          .filter(s => s.score > 30)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);
        
        const bestSuggestion = suggestions[0];
        
        results.push({
          empresaExcel,
          clientId: bestSuggestion?.score >= 70 ? bestSuggestion.id : undefined,
          clientName: bestSuggestion?.score >= 70 ? bestSuggestion.name : undefined,
          matchType: bestSuggestion?.score >= 70 ? 'suggested' : 'none',
          suggestions,
          items: groupItems,
          selected: bestSuggestion?.score >= 70,
        });
      }
    });
    
    // Sort: exact first, then suggested, then none
    results.sort((a, b) => {
      const order = { exact: 0, suggested: 1, none: 2 };
      return order[a.matchType] - order[b.matchType];
    });
    
    setMatchResults(results);
    setStep('match');
    
    toast.success(`${parsed.length} itens encontrados de ${grouped.size} empresas`);
  }, [clients]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handleClientChange = (empresaExcel: string, clientId: string) => {
    setMatchResults(prev => prev.map(r => {
      if (r.empresaExcel === empresaExcel) {
        const client = clients.find(c => c.id === clientId);
        return {
          ...r,
          clientId,
          clientName: client?.name,
          matchType: 'suggested' as const,
          selected: true,
        };
      }
      return r;
    }));
  };

  const handleToggleSelect = (empresaExcel: string) => {
    setMatchResults(prev => prev.map(r => {
      if (r.empresaExcel === empresaExcel && r.clientId) {
        return { ...r, selected: !r.selected };
      }
      return r;
    }));
  };

  // Handle create new company
  const handleCreateCompany = async (empresaExcel: string) => {
    try {
      const initials = generateInitials(empresaExcel);
      const { data: newClient, error } = await supabase
        .from('clients')
        .insert({
          name: empresaExcel,
          initials,
          is_active: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (newClient) {
        setMatchResults(prev => prev.map(r => {
          if (r.empresaExcel === empresaExcel) {
            return {
              ...r,
              clientId: newClient.id,
              clientName: newClient.name,
              matchType: 'exact' as const,
              selected: true,
            };
          }
          return r;
        }));
        
        toast.success(`Empresa "${empresaExcel}" criada com sucesso!`);
        await refetch();
      }
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Erro ao criar empresa');
    }
  };

  const handleImport = async () => {
    const selectedResults = matchResults.filter(r => r.selected && r.clientId);
    
    if (selectedResults.length === 0) {
      toast.error('Nenhuma empresa selecionada para importação');
      return;
    }
    
    setStep('importing');
    let imported = 0;
    
    for (const result of selectedResults) {
      // Calculate counts for this client
      const summary = createNotificationItemSummary(
        result.empresaExcel,
        result.items,
        result.clientId,
        result.clientName,
        result.matchType
      );
      
      // Update client with aggregated counts
      const { error } = await supabase
        .from('clients')
        .update({
          notif_item_atendido_count: summary.atendidoCount,
          notif_item_pendente_count: summary.pendenteCount,
          notif_item_vencido_count: summary.vencidoCount,
        })
        .eq('id', result.clientId!);
      
      if (error) {
        console.error('Error updating client:', error);
      } else {
        imported++;
      }
      
      setImportProgress(Math.round((imported / selectedResults.length) * 100));
      setImportedCount(imported);
    }
    
    await refetch();
    setStep('complete');
    toast.success(`${imported} empresas atualizadas com sucesso`);
    onImportComplete?.();
  };

  const stats = useMemo(() => {
    const exact = matchResults.filter(r => r.matchType === 'exact').length;
    const suggested = matchResults.filter(r => r.matchType === 'suggested').length;
    const none = matchResults.filter(r => r.matchType === 'none').length;
    const selected = matchResults.filter(r => r.selected).length;
    const totalItems = items.length;
    
    return { exact, suggested, none, selected, totalItems };
  }, [matchResults, items]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Itens de Notificação
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {step === 'upload' && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Solte o arquivo aqui' : 'Arraste a planilha de itens ou clique para selecionar'}
              </p>
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: .xlsx, .xls
              </p>
            </div>
          )}

          {step === 'match' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-xl font-bold">{stats.totalItems}</div>
                  <div className="text-xs text-muted-foreground">Itens</div>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-center">
                  <div className="text-xl font-bold text-emerald-600">{stats.exact}</div>
                  <div className="text-xs text-muted-foreground">Match exato</div>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-center">
                  <div className="text-xl font-bold text-amber-600">{stats.suggested}</div>
                  <div className="text-xs text-muted-foreground">Sugerido</div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-center">
                  <div className="text-xl font-bold text-red-600">{stats.none}</div>
                  <div className="text-xs text-muted-foreground">Sem match</div>
                </div>
              </div>

              {/* Match list */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium">Empresa (Excel)</th>
                      <th className="text-left py-2 px-3 font-medium">Cliente Sistema</th>
                      <th className="text-center py-2 px-3 font-medium">Itens</th>
                      <th className="text-center py-2 px-3 font-medium">Status</th>
                      <th className="text-center py-2 px-3 font-medium">Importar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchResults.map((result) => (
                      <tr key={result.empresaExcel} className="border-t hover:bg-muted/30">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium truncate max-w-[180px]">{result.empresaExcel}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          {result.matchType === 'exact' ? (
                            <span className="text-emerald-600 font-medium">{result.clientName}</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Select
                                value={result.clientId || ''}
                                onValueChange={(v) => handleClientChange(result.empresaExcel, v)}
                              >
                                <SelectTrigger className="h-8 text-xs flex-1">
                                  <SelectValue placeholder="Selecionar cliente..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {result.suggestions.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                      {s.name} ({s.score}%)
                                    </SelectItem>
                                  ))}
                                  <div className="border-t my-1" />
                                  {clients
                                    .filter(c => !result.suggestions.find(s => s.id === c.id))
                                    .slice(0, 20)
                                    .map((c) => (
                                      <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              {result.matchType === 'none' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCreateCompany(result.empresaExcel)}
                                  className="h-8 gap-1 shrink-0"
                                >
                                  <Plus className="w-3 h-3" />
                                  Criar
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Badge variant="outline">{result.items.length}</Badge>
                        </td>
                        <td className="py-2 px-3 text-center">
                          {result.matchType === 'exact' && (
                            <Badge className="bg-emerald-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Exato
                            </Badge>
                          )}
                          {result.matchType === 'suggested' && (
                            <Badge className="bg-amber-500">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Sugerido
                            </Badge>
                          )}
                          {result.matchType === 'none' && (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Sem match
                            </Badge>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={result.selected}
                            onChange={() => handleToggleSelect(result.empresaExcel)}
                            disabled={!result.clientId}
                            className="rounded"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {stats.selected} empresas selecionadas para importação
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                  <Button onClick={handleImport} disabled={stats.selected === 0}>
                    Importar Selecionados
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="py-12 text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-lg font-medium mb-4">Importando itens...</p>
              <Progress value={importProgress} className="max-w-md mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">{importedCount} empresas processadas</p>
            </div>
          )}

          {step === 'complete' && (
            <div className="py-12 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
              <p className="text-xl font-bold mb-2">Importação Concluída!</p>
              <p className="text-muted-foreground mb-6">
                {importedCount} empresas foram atualizadas com sucesso.
              </p>
              <Button onClick={handleClose}>Fechar</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
