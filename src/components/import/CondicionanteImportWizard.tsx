import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Search,
  Building2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Client } from '@/types/client';
import { 
  ExcelCondicionante, 
  CondicionanteMatchResult, 
  createCondicionanteSummary 
} from '@/types/condicionante';
import { parseCondicionanteExcel, groupCondicionantesByCompany } from '@/lib/condicionanteParser';
import { supabase } from '@/integrations/supabase/client';
import { ImportProgress } from './ImportProgress';

interface CondicionanteImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onImportComplete: () => void;
}

type Step = 'upload' | 'match' | 'preview' | 'importing' | 'complete';

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeCompanyName(str1);
  const s2 = normalizeCompanyName(str2);
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  
  return matches / longer.length;
}

export function CondicionanteImportWizard({ 
  isOpen, 
  onClose, 
  clients,
  onImportComplete 
}: CondicionanteImportWizardProps) {
  const [step, setStep] = useState<Step>('upload');
  const [condicionantes, setCondicionantes] = useState<ExcelCondicionante[]>([]);
  const [matchResults, setMatchResults] = useState<CondicionanteMatchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  const resetWizard = useCallback(() => {
    setStep('upload');
    setCondicionantes([]);
    setMatchResults([]);
    setSearchQuery('');
    setImportProgress({ current: 0, total: 0 });
  }, []);

  const handleClose = useCallback(() => {
    resetWizard();
    onClose();
  }, [onClose, resetWizard]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const parsed = parseCondicionanteExcel(arrayBuffer);
      
      if (parsed.length === 0) {
        toast.error('Nenhuma condicionante encontrada na planilha');
        return;
      }

      setCondicionantes(parsed);
      
      // Group by company and match with clients
      const grouped = groupCondicionantesByCompany(parsed);
      const results: CondicionanteMatchResult[] = [];

      grouped.forEach((conds, empresaExcel) => {
        // Try exact match first
        const exactMatch = clients.find(c => 
          normalizeCompanyName(c.name) === normalizeCompanyName(empresaExcel)
        );

        if (exactMatch) {
          results.push({
            empresaExcel,
            clientId: exactMatch.id,
            clientName: exactMatch.name,
            matchType: 'exact',
            condicionantes: conds,
            selected: true,
          });
        } else {
          // Find suggestions
          const suggestions = clients
            .map(c => ({
              id: c.id,
              name: c.name,
              score: calculateSimilarity(empresaExcel, c.name),
            }))
            .filter(s => s.score > 0.3)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

          const topSuggestion = suggestions[0];
          
          results.push({
            empresaExcel,
            clientId: topSuggestion?.id,
            clientName: topSuggestion?.name,
            matchType: topSuggestion && topSuggestion.score > 0.5 ? 'suggested' : 'none',
            suggestions,
            condicionantes: conds,
            selected: topSuggestion && topSuggestion.score > 0.5,
          });
        }
      });

      setMatchResults(results);
      setStep('match');
      toast.success(`${parsed.length} condicionantes de ${grouped.size} empresas carregadas`);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Erro ao processar o arquivo');
    }
  }, [clients]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handleSelectClient = (empresaExcel: string, clientId: string, clientName: string) => {
    setMatchResults(prev => prev.map(r => 
      r.empresaExcel === empresaExcel 
        ? { ...r, clientId, clientName, matchType: 'suggested' as const, selected: true }
        : r
    ));
  };

  const handleToggleSelect = (empresaExcel: string) => {
    setMatchResults(prev => prev.map(r => 
      r.empresaExcel === empresaExcel 
        ? { ...r, selected: !r.selected }
        : r
    ));
  };

  const handleIgnore = (empresaExcel: string) => {
    setMatchResults(prev => prev.map(r => 
      r.empresaExcel === empresaExcel 
        ? { ...r, ignored: true, selected: false }
        : r
    ));
  };

  const filteredResults = useMemo(() => {
    if (!searchQuery) return matchResults;
    const query = searchQuery.toLowerCase();
    return matchResults.filter(r => 
      r.empresaExcel.toLowerCase().includes(query) ||
      r.clientName?.toLowerCase().includes(query)
    );
  }, [matchResults, searchQuery]);

  const stats = useMemo(() => {
    const exact = matchResults.filter(r => r.matchType === 'exact').length;
    const suggested = matchResults.filter(r => r.matchType === 'suggested').length;
    const unmatched = matchResults.filter(r => r.matchType === 'none' && !r.ignored).length;
    const selected = matchResults.filter(r => r.selected && r.clientId).length;
    return { exact, suggested, unmatched, selected };
  }, [matchResults]);

  const handleImport = async () => {
    const toImport = matchResults.filter(r => r.selected && r.clientId);
    
    if (toImport.length === 0) {
      toast.error('Nenhuma empresa selecionada para importação');
      return;
    }

    setStep('importing');
    setImportProgress({ current: 0, total: toImport.length });

    try {
      for (let i = 0; i < toImport.length; i++) {
        const match = toImport[i];
        const summary = createCondicionanteSummary(
          match.empresaExcel,
          match.condicionantes,
          match.clientId,
          match.clientName,
          match.matchType
        );

        // Update client with condicionantes counts
        const { error } = await supabase
          .from('clients')
          .update({
            cond_atendidas_count: summary.atendidasCount,
            cond_a_vencer_count: summary.aVencerCount,
            cond_vencidas_count: summary.vencidasCount,
          })
          .eq('id', match.clientId!);

        if (error) {
          console.error('Error updating client:', error);
          toast.error(`Erro ao atualizar ${match.clientName}`);
        }

        setImportProgress({ current: i + 1, total: toImport.length });
      }

      setStep('complete');
      toast.success(`${toImport.length} empresas atualizadas com sucesso!`);
      onImportComplete();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erro durante a importação');
      setStep('match');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Condicionantes
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Faça upload da planilha de condicionantes'}
            {step === 'match' && 'Associe as empresas do Excel aos clientes cadastrados'}
            {step === 'preview' && 'Revise os dados antes de importar'}
            {step === 'importing' && 'Importando...'}
            {step === 'complete' && 'Importação concluída'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Upload Step */}
          {step === 'upload' && (
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Solte o arquivo aqui' : 'Arraste a planilha ou clique para selecionar'}
              </p>
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: .xlsx, .xls
              </p>
            </div>
          )}

          {/* Match Step */}
          {step === 'match' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {stats.exact} exatos
                </Badge>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {stats.suggested} sugeridos
                </Badge>
                <Badge variant="outline" className="bg-red-500/10 text-red-600">
                  <XCircle className="w-3 h-3 mr-1" />
                  {stats.unmatched} não encontrados
                </Badge>
                <div className="flex-1" />
                <Badge variant="default">
                  {stats.selected} selecionados
                </Badge>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar empresa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Results List */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredResults.map((result) => (
                    <CondicionanteMatchRow
                      key={result.empresaExcel}
                      result={result}
                      clients={clients}
                      onSelectClient={handleSelectClient}
                      onToggleSelect={handleToggleSelect}
                      onIgnore={handleIgnore}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button onClick={handleImport} disabled={stats.selected === 0}>
                  Importar {stats.selected} empresas
                </Button>
              </div>
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <ImportProgress 
              current={importProgress.current} 
              total={importProgress.total} 
            />
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Importação Concluída!</h3>
              <p className="text-muted-foreground mb-6">
                As condicionantes foram importadas com sucesso.
              </p>
              <Button onClick={handleClose}>Fechar</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Match Row Component
interface CondicionanteMatchRowProps {
  result: CondicionanteMatchResult;
  clients: Client[];
  onSelectClient: (empresaExcel: string, clientId: string, clientName: string) => void;
  onToggleSelect: (empresaExcel: string) => void;
  onIgnore: (empresaExcel: string) => void;
}

function CondicionanteMatchRow({ 
  result, 
  clients, 
  onSelectClient, 
  onToggleSelect,
  onIgnore,
}: CondicionanteMatchRowProps) {
  const [showClientSelect, setShowClientSelect] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients.slice(0, 10);
    const query = clientSearch.toLowerCase();
    return clients.filter(c => c.name.toLowerCase().includes(query)).slice(0, 10);
  }, [clients, clientSearch]);

  const summary = createCondicionanteSummary(
    result.empresaExcel,
    result.condicionantes,
    result.clientId,
    result.clientName,
    result.matchType
  );

  if (result.ignored) return null;

  return (
    <div className={cn(
      'p-3 border rounded-lg transition-colors',
      result.selected && 'border-primary bg-primary/5',
      !result.selected && 'border-border'
    )}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={result.selected}
          onCheckedChange={() => onToggleSelect(result.empresaExcel)}
          disabled={!result.clientId}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium truncate">{result.empresaExcel}</span>
            <Badge 
              variant="outline" 
              className={cn(
                'text-xs',
                result.matchType === 'exact' && 'bg-emerald-500/10 text-emerald-600',
                result.matchType === 'suggested' && 'bg-amber-500/10 text-amber-600',
                result.matchType === 'none' && 'bg-red-500/10 text-red-600',
              )}
            >
              {result.matchType === 'exact' && 'Exato'}
              {result.matchType === 'suggested' && 'Sugerido'}
              {result.matchType === 'none' && 'Não encontrado'}
            </Badge>
          </div>

          {/* Status counts */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span className="text-emerald-600">{summary.atendidasCount} atendidas</span>
            <span className="text-amber-600">{summary.aVencerCount} a vencer</span>
            <span className="text-red-600">{summary.vencidasCount} vencidas</span>
          </div>

          {/* Client selection */}
          {result.clientId && !showClientSelect && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">→</span>
              <span className="text-sm font-medium text-primary">{result.clientName}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs"
                onClick={() => setShowClientSelect(true)}
              >
                Alterar
              </Button>
            </div>
          )}

          {(showClientSelect || !result.clientId) && (
            <div className="mt-2 space-y-2">
              <Input
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="h-8 text-sm"
              />
              <div className="flex flex-wrap gap-1">
                {filteredClients.map(c => (
                  <Button
                    key={c.id}
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      onSelectClient(result.empresaExcel, c.id, c.name);
                      setShowClientSelect(false);
                      setClientSearch('');
                    }}
                  >
                    {c.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button 
          variant="ghost" 
          size="sm"
          className="text-muted-foreground hover:text-red-600"
          onClick={() => onIgnore(result.empresaExcel)}
        >
          <XCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
