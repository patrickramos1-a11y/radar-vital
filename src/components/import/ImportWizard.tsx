import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Zap, Settings } from 'lucide-react';
import { ExcelDemand, MatchResult, ImportMode, CompanyStats, DemandStatus, extractCollaborators } from '@/types/demand';
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

type WizardStep = 'upload' | 'mode' | 'found' | 'notfound' | 'preview' | 'importing' | 'complete';

export function ImportWizard({ isOpen, onClose, clients, onImportComplete }: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [importMode, setImportMode] = useState<ImportMode>('quick');
  const [file, setFile] = useState<File | null>(null);
  const [demands, setDemands] = useState<ExcelDemand[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyStats[]>([]);
  const [selectedDemands, setSelectedDemands] = useState<Set<string>>(new Set());
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const foundCompanies = useMemo(() => 
    companyStats.filter(c => c.matchType === 'exact' || c.clientId),
    [companyStats]
  );

  const notFoundCompanies = useMemo(() => 
    companyStats.filter(c => c.matchType !== 'exact' && !c.clientId),
    [companyStats]
  );

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
      
      // Group by empresa and create match results
      const groups = groupDemandsByEmpresa(parsedDemands);
      const results = createMatchResults(groups, clients);
      setMatchResults(results);
      
      // Create company stats for quick mode
      const stats = createCompanyStats(results);
      setCompanyStats(stats);
      
      // Select all demands by default
      const allKeys = new Set(parsedDemands.map((d, i) => `${d.empresa}-${i}`));
      setSelectedDemands(allKeys);
      
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
    setMatchResults([]);
    setCompanyStats([]);
    setSelectedDemands(new Set());
    setError(null);
    onClose();
  };

  const handleModeSelect = (mode: ImportMode) => {
    setImportMode(mode);
    if (foundCompanies.length > 0) {
      setStep('found');
    } else if (notFoundCompanies.length > 0) {
      setStep('notfound');
    } else {
      setStep('preview');
    }
  };

  const handleFoundConfirm = (updatedStats: CompanyStats[]) => {
    setCompanyStats(prev => {
      const notFoundIds = new Set(notFoundCompanies.map(c => c.empresa));
      return [...updatedStats, ...prev.filter(c => notFoundIds.has(c.empresa))];
    });
    
    if (notFoundCompanies.length > 0) {
      setStep('notfound');
    } else {
      setStep('preview');
    }
  };

  const handleNotFoundConfirm = (updatedStats: CompanyStats[]) => {
    setCompanyStats(prev => {
      const foundIds = new Set(foundCompanies.map(c => c.empresa));
      const updated = [...prev.filter(c => foundIds.has(c.empresa))];
      
      // Merge updated not-found companies
      for (const stat of updatedStats) {
        const existing = updated.find(u => u.empresa === stat.empresa);
        if (!existing) {
          updated.push(stat);
        }
      }
      return updated;
    });
    setStep('preview');
  };

  const handleBack = () => {
    if (step === 'mode') {
      setStep('upload');
      setFile(null);
    } else if (step === 'found') {
      setStep('mode');
    } else if (step === 'notfound') {
      if (foundCompanies.length > 0) {
        setStep('found');
      } else {
        setStep('mode');
      }
    } else if (step === 'preview') {
      if (notFoundCompanies.length > 0) {
        setStep('notfound');
      } else if (foundCompanies.length > 0) {
        setStep('found');
      } else {
        setStep('mode');
      }
    }
  };

  const handleImportComplete = () => {
    setStep('complete');
    onImportComplete();
  };

  const getStepNumber = () => {
    switch (step) {
      case 'found': return 1;
      case 'notfound': return 2;
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
              <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                importMode === 'quick' 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {importMode === 'quick' ? '⚡ Rápido' : '⚙️ Completo'}
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
              onSelect={handleModeSelect}
              onBack={handleBack}
              demandCount={demands.length}
              companyCount={companyStats.length}
            />
          )}

          {step === 'found' && (
            <FoundCompaniesStep
              companies={foundCompanies}
              mode={importMode}
              onConfirm={handleFoundConfirm}
              onBack={handleBack}
            />
          )}

          {step === 'notfound' && (
            <NotFoundCompaniesStep
              companies={notFoundCompanies}
              clients={clients}
              mode={importMode}
              matchResults={matchResults}
              onConfirm={handleNotFoundConfirm}
              onBack={handleBack}
            />
          )}

          {step === 'preview' && (
            <FinalPreviewStep
              companyStats={companyStats}
              matchResults={matchResults}
              demands={demands}
              selectedDemands={selectedDemands}
              setSelectedDemands={setSelectedDemands}
              mode={importMode}
              onBack={handleBack}
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
            <CompleteStep onClose={handleClose} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StepIndicator({ currentStep, mode }: { currentStep: number; mode: ImportMode }) {
  const steps = [
    { num: 1, label: 'Empresas Encontradas' },
    { num: 2, label: 'Empresas Não Encontradas' },
    { num: 3, label: 'Prévia Final' },
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
  onSelect, 
  onBack,
  demandCount,
  companyCount,
}: { 
  onSelect: (mode: ImportMode) => void;
  onBack: () => void;
  demandCount: number;
  companyCount: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <h3 className="text-lg font-semibold mb-2">Escolha o Modo de Importação</h3>
      <p className="text-muted-foreground mb-6 text-center">
        {demandCount} demandas encontradas em {companyCount} empresas
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        <button
          onClick={() => onSelect('quick')}
          className="p-6 border-2 rounded-lg hover:border-amber-500 hover:bg-amber-50/50 transition-colors text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
              <Zap className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold">Modo Rápido</h4>
              <span className="text-xs text-amber-600 font-medium">Recomendado</span>
            </div>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Importa apenas totais por empresa</li>
            <li>• Atualiza contadores de demandas (D)</li>
            <li>• Detecta colaboradores automaticamente</li>
            <li>• NÃO salva demandas individuais</li>
            <li>• Mais rápido e leve</li>
          </ul>
        </button>

        <button
          onClick={() => onSelect('complete')}
          className="p-6 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 transition-colors text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold">Modo Completo</h4>
              <span className="text-xs text-blue-600 font-medium">Detalhado</span>
            </div>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Salva cada demanda individual</li>
            <li>• Permite filtros e seleção por linha</li>
            <li>• Detecta duplicidades por código</li>
            <li>• Mantém descrições e comentários</li>
            <li>• Mais completo, mas mais lento</li>
          </ul>
        </button>
      </div>

      <button
        onClick={onBack}
        className="mt-6 flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>
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

function CompleteStep({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h3 className="text-xl font-semibold mb-2">Importação Concluída!</h3>
      <p className="text-muted-foreground mb-6">
        Os indicadores do painel foram atualizados com sucesso.
      </p>
      <button
        onClick={onClose}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Fechar
      </button>
    </div>
  );
}

function createMatchResults(groups: Map<string, ExcelDemand[]>, clients: Client[]): MatchResult[] {
  const results: MatchResult[] = [];
  
  for (const [empresa, demandas] of groups) {
    const normalizedEmpresa = empresa.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    
    // Try exact match first
    const exactMatch = clients.find(c => {
      const normalizedClient = c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      return normalizedClient === normalizedEmpresa;
    });
    
    if (exactMatch) {
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
      results.push({
        empresaExcel: empresa,
        matchType: 'none',
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        demands: demandas,
        selected: false,
        action: 'ignore',
      });
    }
  }
  
  return results.sort((a, b) => {
    const order = { exact: 0, suggested: 1, none: 2 };
    return order[a.matchType] - order[b.matchType];
  });
}

function createCompanyStats(results: MatchResult[]): CompanyStats[] {
  return results.map(r => {
    const byStatus: Record<DemandStatus, number> = {
      CONCLUIDO: 0,
      EM_EXECUCAO: 0,
      NAO_FEITO: 0,
      CANCELADO: 0,
    };
    
    const collaboratorsSet = new Set<string>();
    
    for (const d of r.demands) {
      byStatus[d.status]++;
      const collabs = extractCollaborators(d.responsavel);
      collabs.forEach(c => collaboratorsSet.add(c));
    }
    
    return {
      empresa: r.empresaExcel,
      clientId: r.clientId,
      clientName: r.clientName,
      matchType: r.matchType,
      total: r.demands.length,
      byStatus,
      collaborators: Array.from(collaboratorsSet),
      selected: r.matchType === 'exact' || r.matchType === 'suggested',
      createNew: false,
    };
  });
}
