import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Client } from '@/types/client';
import { ExcelProcess, ProcessSummary, ProcessMatchResult, PROCESS_STATUS_COLORS, createProcessSummary } from '@/types/process';
import { parseProcessExcel, groupProcessesByCompany } from '@/lib/processParser';
import { normalizeText, similarityScore } from '@/types/demand';
import { supabase } from '@/integrations/supabase/client';
import { useClients } from '@/contexts/ClientContext';
import { toast } from 'sonner';

type ImportMode = 'quick' | 'complete';
type WizardStep = 'upload' | 'found' | 'notfound' | 'preview';

interface ProcessImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onImportComplete: () => void;
}

export function ProcessImportWizard({ isOpen, onClose, clients, onImportComplete }: ProcessImportWizardProps) {
  const { refetch } = useClients();
  const [step, setStep] = useState<WizardStep>('upload');
  const [mode, setMode] = useState<ImportMode>('quick');
  const [processes, setProcesses] = useState<ExcelProcess[]>([]);
  const [matchResults, setMatchResults] = useState<ProcessMatchResult[]>([]);
  const [summaries, setSummaries] = useState<ProcessSummary[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  // Match companies from Excel to existing clients
  const matchCompanies = useCallback((grouped: Map<string, ExcelProcess[]>) => {
    const results: ProcessMatchResult[] = [];
    
    for (const [empresa, processList] of grouped) {
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
        processes: processList,
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
      const parsedProcesses = parseProcessExcel(buffer);
      
      if (parsedProcesses.length === 0) {
        toast.error('Nenhum processo encontrado no arquivo');
        return;
      }
      
      setProcesses(parsedProcesses);
      
      const grouped = groupProcessesByCompany(parsedProcesses);
      const results = matchCompanies(grouped);
      setMatchResults(results);
      
      // Create summaries
      const newSummaries = results.map(r => 
        createProcessSummary(r.empresaExcel, r.processes, r.clientId, r.clientName, r.matchType)
      );
      setSummaries(newSummaries);
      
      toast.success(`${parsedProcesses.length} processos carregados de ${grouped.size} empresas`);
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

  // Import quick mode
  const importQuickMode = async () => {
    setIsImporting(true);
    let processed = 0;
    const total = selectedSummaries.length;
    setImportProgress({ current: 0, total });

    try {
      for (const summary of selectedSummaries) {
        if (!summary.clientId) continue;

        // Update process counts on client
        const { error } = await supabase
          .from('clients')
          .update({
            proc_total_count: summary.totalCount,
            proc_deferido_count: summary.deferidoCount,
            proc_em_analise_orgao_count: summary.emAnaliseOrgaoCount,
            proc_em_analise_ramos_count: summary.emAnaliseRamosCount,
            proc_notificado_count: summary.notificadoCount,
            proc_reprovado_count: summary.reprovadoCount,
          })
          .eq('id', summary.clientId);

        if (error) {
          console.error('Error updating client:', error);
        }

        processed++;
        setImportProgress({ current: processed, total });
      }

      await refetch();
      toast.success(`Importação rápida concluída! ${selectedSummaries.length} empresas atualizadas`);
      onImportComplete();
      handleClose();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erro durante a importação');
    } finally {
      setIsImporting(false);
    }
  };

  // Import complete mode
  const importCompleteMode = async () => {
    setIsImporting(true);
    const selectedEmpresas = new Set(selectedSummaries.map(s => s.empresaExcel));
    const toImport = processes.filter(p => selectedEmpresas.has(p.empresa));
    
    let imported = 0;
    setImportProgress({ current: 0, total: toImport.length });

    try {
      // First update aggregates
      await importQuickMode();

      // Then insert individual processes
      for (const process of toImport) {
        const match = matchResults.find(r => r.empresaExcel === process.empresa);
        const clientId = match?.clientId;

        await supabase.from('processes').insert({
          client_id: clientId || null,
          empresa_excel: process.empresa,
          tipo_processo: process.tipoProcesso || null,
          numero_processo: process.numeroProcesso || null,
          data_protocolo: process.dataProtocolo?.toISOString().split('T')[0] || null,
          status: process.statusNormalized,
        });

        imported++;
        setImportProgress({ current: imported, total: toImport.length });
      }

      toast.success(`Importação completa! ${imported} processos salvos`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erro durante a importação');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = async () => {
    if (mode === 'quick') {
      await importQuickMode();
    } else {
      await importCompleteMode();
    }
  };

  const handleClose = () => {
    setStep('upload');
    setProcesses([]);
    setMatchResults([]);
    setSummaries([]);
    setIsImporting(false);
    onClose();
  };

  // Calculate totals for preview
  const totalStats = selectedSummaries.reduce((acc, s) => ({
    total: acc.total + s.totalCount,
    deferido: acc.deferido + s.deferidoCount,
    emAnaliseOrgao: acc.emAnaliseOrgao + s.emAnaliseOrgaoCount,
    emAnaliseRamos: acc.emAnaliseRamos + s.emAnaliseRamosCount,
    notificado: acc.notificado + s.notificadoCount,
    reprovado: acc.reprovado + s.reprovadoCount,
    outros: acc.outros + s.outrosCount,
    criticos: acc.criticos + s.criticosCount,
    emAndamento: acc.emAndamento + s.emAndamentoCount,
  }), { total: 0, deferido: 0, emAnaliseOrgao: 0, emAnaliseRamos: 0, notificado: 0, reprovado: 0, outros: 0, criticos: 0, emAndamento: 0 });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importar Processos
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
              {/* Mode selection */}
              <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === 'quick'}
                    onChange={() => setMode('quick')}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Modo Rápido</span>
                  <span className="text-xs text-muted-foreground">(apenas totais)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === 'complete'}
                    onChange={() => setMode('complete')}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Modo Completo</span>
                  <span className="text-xs text-muted-foreground">(processo por processo)</span>
                </label>
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
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-0.5 rounded text-xs text-white ${PROCESS_STATUS_COLORS.DEFERIDO}`}>
                          {summary?.deferidoCount || 0}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs text-white ${PROCESS_STATUS_COLORS.EM_ANALISE_ORGAO}`}>
                          {summary?.emAnaliseOrgaoCount || 0}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs text-white ${PROCESS_STATUS_COLORS.NOTIFICADO}`}>
                          {summary?.notificadoCount || 0}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs text-white ${PROCESS_STATUS_COLORS.REPROVADO}`}>
                          {summary?.reprovadoCount || 0}
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
                              {summary?.totalCount || 0} processos
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
              <h3 className="font-semibold">Prévia da Importação</h3>

              {/* Summary stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">{selectedSummaries.length}</div>
                  <div className="text-sm text-muted-foreground">Empresas</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold">{totalStats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Processos</div>
                </div>
                <div className="p-4 bg-blue-100 dark:bg-blue-950/30 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalStats.emAndamento}</div>
                  <div className="text-sm text-muted-foreground">Em Andamento</div>
                </div>
                <div className="p-4 bg-red-100 dark:bg-red-950/30 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{totalStats.criticos}</div>
                  <div className="text-sm text-muted-foreground">Críticos</div>
                </div>
              </div>

              {/* Status breakdown */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-3">Por Status:</h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  <div className="text-center">
                    <div className={`${PROCESS_STATUS_COLORS.DEFERIDO} text-white rounded px-2 py-1 text-lg font-bold`}>
                      {totalStats.deferido}
                    </div>
                    <div className="text-xs mt-1">Deferido</div>
                  </div>
                  <div className="text-center">
                    <div className={`${PROCESS_STATUS_COLORS.EM_ANALISE_ORGAO} text-white rounded px-2 py-1 text-lg font-bold`}>
                      {totalStats.emAnaliseOrgao}
                    </div>
                    <div className="text-xs mt-1">Análise Órgão</div>
                  </div>
                  <div className="text-center">
                    <div className={`${PROCESS_STATUS_COLORS.EM_ANALISE_RAMOS} text-white rounded px-2 py-1 text-lg font-bold`}>
                      {totalStats.emAnaliseRamos}
                    </div>
                    <div className="text-xs mt-1">Análise Ramos</div>
                  </div>
                  <div className="text-center">
                    <div className={`${PROCESS_STATUS_COLORS.NOTIFICADO} text-white rounded px-2 py-1 text-lg font-bold`}>
                      {totalStats.notificado}
                    </div>
                    <div className="text-xs mt-1">Notificado</div>
                  </div>
                  <div className="text-center">
                    <div className={`${PROCESS_STATUS_COLORS.REPROVADO} text-white rounded px-2 py-1 text-lg font-bold`}>
                      {totalStats.reprovado}
                    </div>
                    <div className="text-xs mt-1">Reprovado</div>
                  </div>
                  <div className="text-center">
                    <div className={`${PROCESS_STATUS_COLORS.OUTROS} text-white rounded px-2 py-1 text-lg font-bold`}>
                      {totalStats.outros}
                    </div>
                    <div className="text-xs mt-1">Outros</div>
                  </div>
                </div>
              </div>

              {/* Ignored companies notice */}
              {matchResults.filter(r => r.ignored || (r.matchType === 'none' && !r.selected)).length > 0 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg text-sm">
                  <span className="text-yellow-600 font-medium">
                    {matchResults.filter(r => r.ignored || (r.matchType === 'none' && !r.selected)).length} empresas serão ignoradas
                  </span>
                </div>
              )}

              {/* Import progress */}
              {isImporting && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Importando...</span>
                    <span className="text-sm">{importProgress.current} / {importProgress.total}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
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
                  {isImporting ? 'Importando...' : `Confirmar Importação (${mode === 'quick' ? 'Rápido' : 'Completo'})`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
