import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { ExcelDemand, MatchResult } from '@/types/demand';
import { Client } from '@/types/client';
import { parseExcelFile, groupDemandsByEmpresa } from '@/lib/excelParser';
import { MatchStep } from './MatchStep';
import { PreviewStep } from './PreviewStep';
import { ImportProgress } from './ImportProgress';
import { toast } from 'sonner';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onImportComplete: () => void;
}

type WizardStep = 'upload' | 'match' | 'preview' | 'importing' | 'complete';

export function ImportWizard({ isOpen, onClose, clients, onImportComplete }: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [demands, setDemands] = useState<ExcelDemand[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [selectedDemands, setSelectedDemands] = useState<Set<string>>(new Set());
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
      
      // Group by empresa and create match results
      const groups = groupDemandsByEmpresa(parsedDemands);
      const results = createMatchResults(groups, clients);
      setMatchResults(results);
      
      // Select all demands by default
      const allKeys = new Set(parsedDemands.map((d, i) => `${d.empresa}-${i}`));
      setSelectedDemands(allKeys);
      
      setStep('match');
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
    setSelectedDemands(new Set());
    setError(null);
    onClose();
  };

  const handleMatchConfirm = (updatedResults: MatchResult[]) => {
    setMatchResults(updatedResults);
    setStep('preview');
  };

  const handleBack = () => {
    if (step === 'match') {
      setStep('upload');
      setFile(null);
    } else if (step === 'preview') {
      setStep('match');
    }
  };

  const handleImportComplete = () => {
    setStep('complete');
    onImportComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Importar Programação
            <StepIndicator currentStep={step} />
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

          {step === 'match' && (
            <MatchStep
              matchResults={matchResults}
              clients={clients}
              onConfirm={handleMatchConfirm}
              onBack={handleBack}
            />
          )}

          {step === 'preview' && (
            <PreviewStep
              matchResults={matchResults}
              demands={demands}
              selectedDemands={selectedDemands}
              setSelectedDemands={setSelectedDemands}
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

function StepIndicator({ currentStep }: { currentStep: WizardStep }) {
  const steps = [
    { key: 'upload', label: '1. Upload' },
    { key: 'match', label: '2. Empresas' },
    { key: 'preview', label: '3. Preview' },
    { key: 'importing', label: '4. Importar' },
  ];

  return (
    <div className="flex items-center gap-2 ml-auto text-sm">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <span
            className={`px-2 py-0.5 rounded text-xs ${
              s.key === currentStep
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && <ArrowRight className="w-3 h-3 mx-1 text-muted-foreground" />}
        </div>
      ))}
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
        As demandas foram importadas e os indicadores do painel foram atualizados.
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
      });
      continue;
    }
    
    // Calculate similarity scores
    const suggestions = clients
      .map(c => {
        const normalizedClient = c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        
        // Check if one contains the other
        let score = 0;
        if (normalizedClient.includes(normalizedEmpresa) || normalizedEmpresa.includes(normalizedClient)) {
          score = 0.8;
        } else {
          // Word overlap
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
      });
    } else {
      results.push({
        empresaExcel: empresa,
        matchType: 'none',
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        demands: demandas,
      });
    }
  }
  
  return results.sort((a, b) => {
    // Sort: exact first, then suggested, then none
    const order = { exact: 0, suggested: 1, none: 2 };
    return order[a.matchType] - order[b.matchType];
  });
}
