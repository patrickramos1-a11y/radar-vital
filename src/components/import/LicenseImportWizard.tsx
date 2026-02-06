import { useState, useMemo, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, ArrowRight, ArrowLeft, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Client } from '@/types/client';
import { ExcelLicense, LicenseSummary, LicenseMatchResult, LICENSE_STATUS_COLORS, createLicenseSummary } from '@/types/license';
import { parseLicenseExcel, groupLicensesByCompany } from '@/lib/licenseParser';
import { normalizeText, similarityScore } from '@/types/demand';
import { supabase } from '@/integrations/supabase/client';
import { useClients } from '@/contexts/ClientContext';
import { toast } from 'sonner';

type WizardStep = 'upload' | 'found' | 'notfound' | 'preview';

interface LicenseImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onImportComplete: () => void;
}

export function LicenseImportWizard({ isOpen, onClose, clients, onImportComplete }: LicenseImportWizardProps) {
  const { refetch } = useClients();
  const [step, setStep] = useState<WizardStep>('upload');
  
  const [licenses, setLicenses] = useState<ExcelLicense[]>([]);
  const [matchResults, setMatchResults] = useState<LicenseMatchResult[]>([]);
  const [summaries, setSummaries] = useState<LicenseSummary[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  // Match companies from Excel to existing clients
  const matchCompanies = useCallback((grouped: Map<string, ExcelLicense[]>) => {
    const results: LicenseMatchResult[] = [];
    
    for (const [empresa, licenseList] of grouped) {
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
        licenses: licenseList,
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
      const parsedLicenses = parseLicenseExcel(buffer);
      
      if (parsedLicenses.length === 0) {
        toast.error('Nenhuma licença encontrada no arquivo');
        return;
      }
      
      setLicenses(parsedLicenses);
      
      const grouped = groupLicensesByCompany(parsedLicenses);
      const results = matchCompanies(grouped);
      setMatchResults(results);
      
      // Create summaries
      const newSummaries = results.map(r => 
        createLicenseSummary(r.empresaExcel, r.licenses, r.clientId, r.clientName, r.matchType)
      );
      setSummaries(newSummaries);
      
      toast.success(`${parsedLicenses.length} licenças carregadas de ${grouped.size} empresas`);
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

        // Update license counts on client
        const { error } = await supabase
          .from('clients')
          .update({
            lic_validas_count: summary.validasCount,
            lic_proximo_venc_count: summary.proximoVencCount,
            lic_fora_validade_count: summary.foraValidadeCount,
            lic_proxima_data_vencimento: summary.proximaDataVencimento?.toISOString().split('T')[0] || null,
          })
          .eq('id', summary.clientId);

        if (error) {
          console.error('Error updating client:', error);
        }

        processed++;
        setImportProgress({ current: processed, total });
      }

      await refetch();
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
    const toImport = licenses.filter(l => selectedEmpresas.has(l.empresa));
    
    let imported = 0;
    setImportProgress({ current: 0, total: toImport.length });

    try {
      // First update aggregates
      await importQuickMode();

      // Then insert individual licenses
      for (const license of toImport) {
        const match = matchResults.find(r => r.empresaExcel === license.empresa);
        const clientId = match?.clientId;

        await supabase.from('licenses').insert({
          client_id: clientId || null,
          empresa_excel: license.empresa,
          tipo_licenca: license.tipoLicenca || null,
          licenca: license.licenca || null,
          num_processo: license.numProcesso || null,
          data_emissao: license.dataEmissao?.toISOString().split('T')[0] || null,
          vencimento: license.vencimento?.toISOString().split('T')[0] || null,
          status_calculado: license.statusCalculado,
        });

        imported++;
        setImportProgress({ current: imported, total: toImport.length });
      }

      await refetch();
      toast.success(`Importação completa! ${imported} licenças salvas`);
      onImportComplete();
      handleClose();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erro durante a importação');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = async () => {
    // Always use complete mode - saves individual licenses + updates aggregates
    await importCompleteMode();
  };

  const handleClose = () => {
    setStep('upload');
    setLicenses([]);
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
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importar Licenças
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
              {/* Info about import */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">A importação irá considerar:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <span className="text-foreground font-medium">Total de licenças</span> por empresa</li>
                  <li>• <span className="text-foreground font-medium">Tipos de licenças</span> (LO, LI, LP, etc.)</li>
                  <li>• <span className="text-foreground font-medium">Status das licenças</span> (Válidas, Próx. Vencimento, Vencidas)</li>
                </ul>
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
                        <span className={`px-2 py-0.5 rounded text-xs text-white ${LICENSE_STATUS_COLORS.VALIDA}`}>
                          {summary?.validasCount || 0}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs text-white ${LICENSE_STATUS_COLORS.PROXIMO_VENCIMENTO}`}>
                          {summary?.proximoVencCount || 0}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs text-white ${LICENSE_STATUS_COLORS.FORA_VALIDADE}`}>
                          {summary?.foraValidadeCount || 0}
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
                              {summary?.totalLicenses || 0} licenças
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

          {/* Step 4: Preview and confirm */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-primary flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Confirmação Final ({selectedSummaries.length} empresas)
                </h3>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-3 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {selectedSummaries.reduce((sum, s) => sum + s.validasCount, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Válidas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">
                    {selectedSummaries.reduce((sum, s) => sum + s.proximoVencCount, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Próx. Vencimento</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">
                    {selectedSummaries.reduce((sum, s) => sum + s.foraValidadeCount, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Fora Validade</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {selectedSummaries.reduce((sum, s) => sum + s.totalLicenses, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>

              <div className="max-h-[200px] overflow-y-auto space-y-1.5">
                {selectedSummaries.map((summary) => (
                  <div key={summary.empresaExcel} className="flex items-center justify-between p-2 bg-card rounded border">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{summary.empresaExcel}</span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="text-sm text-green-600">{summary.clientName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className={`px-1.5 py-0.5 rounded text-white ${LICENSE_STATUS_COLORS.VALIDA}`}>
                        {summary.validasCount}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-white ${LICENSE_STATUS_COLORS.PROXIMO_VENCIMENTO}`}>
                        {summary.proximoVencCount}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-white ${LICENSE_STATUS_COLORS.FORA_VALIDADE}`}>
                        {summary.foraValidadeCount}
                      </span>
                      {summary.proximaDataVencimento && (
                        <span className="ml-2 text-muted-foreground">
                          Próx: {formatDate(summary.proximaDataVencimento)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Import progress */}
              {isImporting && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Importando...</span>
                    <span className="text-sm">{importProgress.current} / {importProgress.total}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
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
                  {isImporting ? 'Importando...' : 'Importar Licenças'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}