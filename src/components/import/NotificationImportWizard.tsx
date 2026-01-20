import { useState, useMemo, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, ArrowRight, ArrowLeft, Bell } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Client } from '@/types/client';
import { 
  ExcelNotification, 
  NotificationMatchResult, 
  NotificationSummary, 
  NOTIFICATION_STATUS_COLORS,
  createNotificationSummary 
} from '@/types/notification';
import { parseNotificationExcel, groupNotificationsByCompany } from '@/lib/notificationParser';
import { normalizeText, similarityScore } from '@/types/demand';
import { supabase } from '@/integrations/supabase/client';
import { useClients } from '@/contexts/ClientContext';
import { toast } from 'sonner';

type WizardStep = 'upload' | 'found' | 'notfound' | 'preview';

interface NotificationImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onImportComplete: () => void;
}

export function NotificationImportWizard({ isOpen, onClose, clients, onImportComplete }: NotificationImportWizardProps) {
  const { refetch } = useClients();
  const [step, setStep] = useState<WizardStep>('upload');
  const [notifications, setNotifications] = useState<ExcelNotification[]>([]);
  const [matchResults, setMatchResults] = useState<NotificationMatchResult[]>([]);
  const [summaries, setSummaries] = useState<NotificationSummary[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  // Match companies from Excel to existing clients
  const matchCompanies = useCallback((grouped: Map<string, ExcelNotification[]>) => {
    const results: NotificationMatchResult[] = [];
    
    for (const [empresa, notifList] of grouped) {
      const normalizedEmpresa = normalizeText(empresa);
      
      // Try exact match first
      let bestMatch = clients.find(c => normalizeText(c.name) === normalizedEmpresa);
      let matchType: 'exact' | 'suggested' | 'none' = bestMatch ? 'exact' : 'none';
      
      // Find suggestions if no exact match
      const suggestions: { id: string; name: string; score: number }[] = [];
      if (!bestMatch) {
        for (const client of clients) {
          const score = similarityScore(empresa, client.name);
          if (score >= 0.5) {
            suggestions.push({ id: client.id, name: client.name, score });
          }
        }
        suggestions.sort((a, b) => b.score - a.score);
        
        if (suggestions.length > 0 && suggestions[0].score >= 0.7) {
          bestMatch = clients.find(c => c.id === suggestions[0].id);
          matchType = 'suggested';
        }
      }
      
      results.push({
        empresaExcel: empresa,
        clientId: bestMatch?.id,
        clientName: bestMatch?.name,
        matchType,
        suggestions: suggestions.slice(0, 3),
        notifications: notifList,
        selected: matchType !== 'none',
      });
    }
    
    return results;
  }, [clients]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const buffer = await file.arrayBuffer();
      const parsedNotifications = parseNotificationExcel(buffer);
      
      if (parsedNotifications.length === 0) {
        toast.error('Nenhuma notificação encontrada no arquivo');
        return;
      }
      
      setNotifications(parsedNotifications);
      
      const grouped = groupNotificationsByCompany(parsedNotifications);
      const results = matchCompanies(grouped);
      setMatchResults(results);
      
      // Create summaries
      const newSummaries = results.map(r => 
        createNotificationSummary(r.empresaExcel, r.notifications, r.clientId, r.clientName, r.matchType)
      );
      setSummaries(newSummaries);
      
      toast.success(`${parsedNotifications.length} notificações carregadas de ${grouped.size} empresas`);
      setStep('found');
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Erro ao processar arquivo');
    }
  };

  // Handle manual link
  const handleManualLink = (empresaExcel: string, clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    
    setMatchResults(prev => prev.map(r => {
      if (r.empresaExcel === empresaExcel) {
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
    
    setSummaries(prev => prev.map(s => {
      if (s.empresaExcel === empresaExcel) {
        return {
          ...s,
          clientId,
          clientName: client?.name,
          matchType: 'suggested' as const,
          selected: true,
        };
      }
      return s;
    }));
  };

  // Handle ignore
  const handleIgnore = (empresaExcel: string) => {
    setMatchResults(prev => prev.map(r => {
      if (r.empresaExcel === empresaExcel) {
        return { ...r, ignored: true, selected: false };
      }
      return r;
    }));
    
    setSummaries(prev => prev.map(s => {
      if (s.empresaExcel === empresaExcel) {
        return { ...s, ignored: true, selected: false };
      }
      return s;
    }));
  };

  // Stats
  const foundResults = matchResults.filter(r => r.matchType !== 'none' && !r.ignored);
  const notFoundResults = matchResults.filter(r => r.matchType === 'none' && !r.ignored);
  const selectedSummaries = summaries.filter(s => s.selected && !s.ignored);

  // Import notifications
  const handleImport = async () => {
    setIsImporting(true);
    const selectedEmpresas = new Set(selectedSummaries.map(s => s.empresaExcel));
    const toImport = notifications.filter(n => selectedEmpresas.has(n.empresa));
    
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    setImportProgress({ current: 0, total: toImport.length });

    try {
      const affectedClientIds = new Set<string>();

      for (const notification of toImport) {
        const match = matchResults.find(r => r.empresaExcel === notification.empresa);
        const clientId = match?.clientId;

        if (clientId) {
          affectedClientIds.add(clientId);
        }

        // Try to upsert (insert or update on conflict)
        const { error } = await supabase
          .from('notifications')
          .upsert({
            client_id: clientId || null,
            empresa_excel: notification.empresa,
            numero_processo: notification.numeroProcesso,
            numero_notificacao: notification.numeroNotificacao,
            descricao: notification.descricao,
            data_recebimento: notification.dataRecebimento?.toISOString().split('T')[0] || null,
            status: notification.status,
          }, {
            onConflict: 'empresa_excel,numero_notificacao',
            ignoreDuplicates: false,
          });

        if (error) {
          console.error('Error upserting notification:', error);
          skipped++;
        } else {
          imported++;
        }

        setImportProgress({ current: imported + skipped, total: toImport.length });
      }

      // Recalculate notification counts for affected clients
      for (const clientId of affectedClientIds) {
        await supabase.rpc('recalculate_client_notifications', { p_client_id: clientId });
      }

      await refetch();
      toast.success(`Importação concluída! ${imported} notificações salvas${updated > 0 ? `, ${updated} atualizadas` : ''}${skipped > 0 ? `, ${skipped} ignoradas` : ''}`);
      onImportComplete();
      handleClose();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erro durante a importação');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setStep('upload');
    setNotifications([]);
    setMatchResults([]);
    setSummaries([]);
    setIsImporting(false);
    onClose();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Importar Notificações
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 px-4">
          {(['upload', 'found', 'notfound', 'preview'] as WizardStep[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s ? 'bg-primary text-primary-foreground' : 
                ['upload', 'found', 'notfound', 'preview'].indexOf(step) > i ? 'bg-green-500 text-white' : 
                'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              {i < 3 && <ArrowRight className="w-4 h-4 mx-1 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-4">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Importe sua planilha de notificações. O sistema identificará automaticamente as empresas 
                  e evitará duplicações, atualizando apenas os registros com mudanças de status.
                </p>
              </div>

              {/* Upload area */}
              <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                <span className="text-lg font-medium">Arraste o arquivo XLSX aqui</span>
                <span className="text-sm text-muted-foreground">ou clique para selecionar</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Step 2: Found companies */}
          {step === 'found' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-green-600 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Empresas Encontradas ({foundResults.length})
                </h3>
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {foundResults.map((result) => {
                  const summary = summaries.find(s => s.empresaExcel === result.empresaExcel);
                  return (
                    <div key={result.empresaExcel} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div>
                        <span className="font-medium">{result.empresaExcel}</span>
                        <span className="text-muted-foreground mx-2">→</span>
                        <span className="text-green-600">{result.clientName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs text-white ${NOTIFICATION_STATUS_COLORS.PENDENTE}`}>
                          {summary?.pendentesCount || 0} pendentes
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs text-white ${NOTIFICATION_STATUS_COLORS.ATENDIDA}`}>
                          {summary?.atendidasCount || 0} atendidas
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={() => setStep('notfound')}>
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Not found companies */}
          {step === 'notfound' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-yellow-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Empresas Não Encontradas ({notFoundResults.length})
                </h3>
              </div>

              {notFoundResults.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Todas as empresas foram encontradas!
                </p>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {notFoundResults.map((result) => {
                    const summary = summaries.find(s => s.empresaExcel === result.empresaExcel);
                    return (
                      <div key={result.empresaExcel} className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{result.empresaExcel}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {summary?.totalNotifications || 0} notificações
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleIgnore(result.empresaExcel)}
                              className="h-6 px-2"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <Select onValueChange={(value) => handleManualLink(result.empresaExcel, value)}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Vincular a cliente existente..." />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('found')}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={() => setStep('preview')}>
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Resumo da Importação</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{selectedSummaries.length}</div>
                    <div className="text-xs text-muted-foreground">Empresas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-500">
                      {selectedSummaries.reduce((sum, s) => sum + s.pendentesCount, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Pendentes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-500">
                      {selectedSummaries.reduce((sum, s) => sum + s.atendidasCount, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Atendidas</div>
                  </div>
                </div>
              </div>

              <div className="max-h-[250px] overflow-y-auto space-y-2">
                {selectedSummaries.map((summary) => (
                  <div key={summary.empresaExcel} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <span className="font-medium">{summary.empresaExcel}</span>
                      {summary.clientName && (
                        <>
                          <span className="text-muted-foreground mx-2">→</span>
                          <span className="text-primary">{summary.clientName}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs text-white ${NOTIFICATION_STATUS_COLORS.PENDENTE}`}>
                        {summary.pendentesCount}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs text-white ${NOTIFICATION_STATUS_COLORS.ATENDIDA}`}>
                        {summary.atendidasCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {isImporting && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Importando...</span>
                    <span className="text-sm text-muted-foreground">
                      {importProgress.current} / {importProgress.total}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('notfound')} disabled={isImporting}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={handleImport} disabled={isImporting || selectedSummaries.length === 0}>
                  {isImporting ? 'Importando...' : 'Importar Notificações'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
