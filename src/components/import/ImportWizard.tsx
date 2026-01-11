import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, Zap, Settings2 } from 'lucide-react';
import { ExcelDemand, MatchResult, ImportMode, CompanySummary, createCompanySummary } from '@/types/demand';
import { Client } from '@/types/client';
import { parseExcelFile, groupDemandsByEmpresa } from '@/lib/excelParser';
import { FoundCompaniesStep } from './FoundCompaniesStep';
import { NotFoundCompaniesStep } from './NotFoundCompaniesStep';
import { FinalPreviewStep } from './FinalPreviewStep';
import { ImportProgress } from './ImportProgress';
import { toast } from 'sonner';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onImportComplete: () => void;
}

type WizardStep = 'upload' | 'mode' | 'found' | 'not-found' | 'preview' | 'importing' | 'complete';

export function ImportWizard({ isOpen, onClose, clients, onImportComplete }: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [importMode, setImportMode] = useState<ImportMode>('quick');
  const [file, setFile] = useState<File | null>(null);
  const [demands, setDemands] = useState<ExcelDemand[]>([]);
  const [companySummaries, setCompanySummaries] = useState<CompanySummary[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]); // For complete mode
  const [selectedDemands, setSelectedDemands] = useState<Set<string>>(new Set()); // For complete mode
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError(null);
    
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setError('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }
    
    setFile(selectedFile);
    
    try {
      const parsedDemands = await parseExcelFile(selectedFile);
      
      if (parsedDemands.length === 0) {
        setError('Nenhuma demanda encontrada no arquivo');
        return;
      }
      
      setDemands(parsedDemands);
      
      // Group by empresa and create summaries/match results
      const groups = groupDemandsByEmpresa(parsedDemands);
      const { summaries, results } = createMatchData(groups, clients);
      setCompanySummaries(summaries);
      setMatchResults(results);
      
      // Select all demands by default (for complete mode)
      const allKeys = new Set(parsedDemands.map((d, i) => `${d.empresa}-${i}`));
      setSelectedDemands(allKeys);
      
      // Move to mode selection
      setStep('mode');
      toast.success(`${parsedDemands.length} demandas encontradas em ${groups.size} empresas`);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [clients]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setDemands([]);
    setCompanySummaries([]);
    setMatchResults([]);
    setSelectedDemands(new Set());
    setError(null);
    setImportMode('quick');
    onClose();
  };

  const handleModeSelect = (mode: ImportMode) => {
    setImportMode(mode);
    setStep('found');
  };

  const handleFoundConfirm = (updatedSummaries: CompanySummary[], updatedResults?: MatchResult[]) => {
    setCompanySummaries(updatedSummaries);
    if (updatedResults) setMatchResults(updatedResults);
    
    // Check if there are any unmatched companies
    const hasUnmatched = updatedSummaries.some(s => s.matchType === 'none' && !s.clientId && !s.ignored);
    if (hasUnmatched) {
      setStep('not-found');
    } else {
      setStep('preview');
    }
  };

  const handleNotFoundConfirm = (updatedSummaries: CompanySummary[], updatedResults?: MatchResult[]) => {
    setCompanySummaries(updatedSummaries);
    if (updatedResults) setMatchResults(updatedResults);
    setStep('preview');
  };

  const handleImportComplete = () => {
    setStep('complete');
    onImportComplete();
  };

  const getStepNumber = () => {
    switch (step) {
      case 'found': return 1;
      case 'not-found': return 2;
      case 'preview': return 3;
      default: return 0;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importar Programação
            {step !== 'upload' && step !== 'mode' && step !== 'complete' && (
              <StepIndicator currentStep={getStepNumber()} mode={importMode} />
            )}
            {importMode && step !== 'upload' && step !== 'mode' && (
              <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                importMode === 'quick' 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {importMode === 'quick' ? '⚡ Modo Rápido' : '⚙️ Modo Completo'}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {step === 'upload' && (
            <UploadStep
              error={error}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              onDrop={handleDrop}
              onFileSelect={handleFileSelect}
            />
          )}

          {step === 'mode' && (
            <ModeSelectionStep
              onSelectMode={handleModeSelect}
              demandCount={demands.length}
              companyCount={companySummaries.length}
            />
          )}

          {step === 'found' && (
            <FoundCompaniesStep
              summaries={companySummaries}
              matchResults={matchResults}
              clients={clients}
              mode={importMode}
              demands={demands}
              selectedDemands={selectedDemands}
              setSelectedDemands={setSelectedDemands}
              onConfirm={handleFoundConfirm}
              onBack={() => setStep('mode')}
            />
          )}

          {step === 'not-found' && (
            <NotFoundCompaniesStep
              summaries={companySummaries}
              matchResults={matchResults}
              clients={clients}
              mode={importMode}
              onConfirm={handleNotFoundConfirm}
              onBack={() => setStep('found')}
            />
          )}

          {step === 'preview' && (
            <FinalPreviewStep
              summaries={companySummaries}
              matchResults={matchResults}
              demands={demands}
              selectedDemands={selectedDemands}
              setSelectedDemands={setSelectedDemands}
              mode={importMode}
              clients={clients}
              onBack={() => {
                const hasUnmatched = companySummaries.some(s => s.matchType === 'none' && !s.clientId && !s.ignored);
                setStep(hasUnmatched ? 'not-found' : 'found');
              }}
              onStartImport={() => setStep('importing')}
              onImportComplete={handleImportComplete}
              setImportProgress={setImportProgress}
            />
          )}

          {step === 'importing' && (
            <ImportProgress 
              current={importProgress.current} 
              total={importProgress.total} 
            />
          )}

          {step === 'complete' && (
            <CompleteStep onClose={handleClose} mode={importMode} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StepIndicator({ currentStep, mode }: { currentStep: number; mode: ImportMode }) {
  const steps = [
    { num: 1, label: 'Encontradas' },
    { num: 2, label: 'Não Encontradas' },
    { num: 3, label: 'Confirmação' },
  ];

  return (
    <div className="flex items-center gap-2 ml-auto text-sm">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center">
          <span
            className={`px-2 py-0.5 rounded text-xs ${
              s.num === currentStep
                ? 'bg-primary text-primary-foreground'
                : s.num < currentStep
                  ? 'bg-green-100 text-green-700'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {s.num}. {s.label}
          </span>
          {i < steps.length - 1 && <ArrowRight className="w-3 h-3 mx-1 text-muted-foreground" />}
        </div>
      ))}
    </div>
  );
}

function ModeSelectionStep({
  onSelectMode,
  demandCount,
  companyCount,
}: {
  onSelectMode: (mode: ImportMode) => void;
  demandCount: number;
  companyCount: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <h3 className="text-lg font-semibold mb-2">Escolha o Modo de Importação</h3>
      <p className="text-sm text-muted-foreground mb-6">
        {demandCount} demandas em {companyCount} empresas
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        {/* Quick Mode */}
        <button
          onClick={() => onSelectMode('quick')}
          className="p-6 border-2 rounded-lg hover:border-amber-400 hover:bg-amber-50/50 transition-all text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-lg">Modo Rápido</h4>
              <span className="text-xs text-amber-600 font-medium">RECOMENDADO</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Importa apenas os quantitativos agregados por empresa e status.
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>✓ Atualiza indicadores D (done, doing, todo, canceled)</li>
            <li>✓ Detecta colaboradores automaticamente</li>
            <li>✓ Não salva detalhes individuais</li>
            <li>✓ Processamento ultra-rápido</li>
          </ul>
        </button>

        {/* Complete Mode */}
        <button
          onClick={() => onSelectMode('complete')}
          className="p-6 border-2 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Settings2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-lg">Modo Completo</h4>
              <span className="text-xs text-blue-600 font-medium">DETALHADO</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Importa cada demanda individualmente com todos os detalhes.
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>✓ Salva descrição, comentário, tópico, etc.</li>
            <li>✓ Permite selecionar demandas individualmente</li>
            <li>✓ Controle total sobre o que importar</li>
            <li>✓ Ideal para rastreabilidade completa</li>
          </ul>
        </button>
      </div>
    </div>
  );
}

function UploadStep({
  error,
  isDragging,
  setIsDragging,
  onDrop,
  onFileSelect,
}: {
  error: string | null;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (file: File) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div
        className={`w-full max-w-md p-8 border-2 border-dashed rounded-lg transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <div className="flex flex-col items-center text-center">
          <Upload className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            Arraste o arquivo Excel aqui
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            ou clique para selecionar
          </p>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileSelect(file);
              }}
            />
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              <FileSpreadsheet className="w-4 h-4" />
              Selecionar Arquivo
            </span>
          </label>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="mt-8 text-sm text-muted-foreground max-w-md">
        <h4 className="font-medium mb-2">Formato esperado:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Arquivo Excel (.xlsx ou .xls)</li>
          <li>Colunas: Data, Empresa, Descrição, Responsável, Status, Tópico, Subtópico, Plano, Comentário</li>
          <li>Status aceitos: CONCLUIDO, EM_EXECUCAO, NAO_FEITO, CANCELADO</li>
        </ul>
      </div>
    </div>
  );
}

function CompleteStep({ onClose, mode }: { onClose: () => void; mode: ImportMode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h3 className="text-xl font-semibold mb-2">Importação Concluída!</h3>
      <p className="text-muted-foreground mb-2">
        {mode === 'quick' 
          ? 'Os indicadores do painel foram atualizados com os totais agregados.'
          : 'As demandas foram importadas e os indicadores do painel foram atualizados.'
        }
      </p>
      <button
        onClick={onClose}
        className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Fechar
      </button>
    </div>
  );
}

function createMatchData(
  groups: Map<string, ExcelDemand[]>, 
  clients: Client[]
): { summaries: CompanySummary[]; results: MatchResult[] } {
  const summaries: CompanySummary[] = [];
  const results: MatchResult[] = [];
  
  for (const [empresa, demandas] of groups) {
    const normalizedEmpresa = empresa.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    
    // Try exact match first
    const exactMatch = clients.find(c => {
      const normalizedClient = c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      return normalizedClient === normalizedEmpresa;
    });
    
    if (exactMatch) {
      summaries.push(createCompanySummary(empresa, demandas, exactMatch.id, exactMatch.name, 'exact'));
      results.push({
        empresaExcel: empresa,
        clientId: exactMatch.id,
        clientName: exactMatch.name,
        matchType: 'exact',
        demands: demandas,
        selected: true,
      });
      continue;
    }
    
    // Calculate similarity scores
    const suggestions = clients
      .map(c => {
        const normalizedClient = c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        
        let score = 0;
        if (normalizedClient.includes(normalizedEmpresa) || normalizedEmpresa.includes(normalizedClient)) {
          score = 0.8;
        } else {
          const words1 = new Set(normalizedEmpresa.split(/\s+/));
          const words2 = new Set(normalizedClient.split(/\s+/));
          const intersection = [...words1].filter(x => words2.has(x)).length;
          const union = new Set([...words1, ...words2]).size;
          score = intersection / union;
        }
        
        return { id: c.id, name: c.name, score };
      })
      .filter(s => s.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    if (suggestions.length > 0 && suggestions[0].score >= 0.6) {
      summaries.push(createCompanySummary(empresa, demandas, suggestions[0].id, suggestions[0].name, 'suggested'));
      results.push({
        empresaExcel: empresa,
        clientId: suggestions[0].id,
        clientName: suggestions[0].name,
        matchType: 'suggested',
        suggestions,
        demands: demandas,
        selected: true,
      });
    } else {
      summaries.push(createCompanySummary(empresa, demandas, undefined, undefined, 'none'));
      results.push({
        empresaExcel: empresa,
        matchType: 'none',
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        demands: demandas,
        selected: false,
      });
    }
  }
  
  // Sort: exact first, then suggested, then none
  const order = { exact: 0, suggested: 1, none: 2 };
  summaries.sort((a, b) => order[a.matchType] - order[b.matchType]);
  results.sort((a, b) => order[a.matchType] - order[b.matchType]);
  
  return { summaries, results };
}
