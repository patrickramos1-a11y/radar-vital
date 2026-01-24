import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Users, CheckCircle2, ArrowLeft, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreatePdfImport, useProcessPdfImport, useCompleteImport } from '@/hooks/usePdfImports';
import { parsePdf } from '@/lib/pdfParser';
import type { ImportWizardStep, ParsedPdfData, ClientMatchResult } from '@/types/pdfImport';
import { PdfUploadStep } from './steps/PdfUploadStep';
import { PdfCorrelationStep } from './steps/PdfCorrelationStep';
import { PdfPreviewStep } from './steps/PdfPreviewStep';

interface PdfImportWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

const STEPS: { key: ImportWizardStep; label: string; icon: React.ElementType }[] = [
  { key: 'upload', label: 'Upload', icon: Upload },
  { key: 'parsing', label: 'Processando', icon: FileText },
  { key: 'correlation', label: 'Correlação', icon: Users },
  { key: 'preview', label: 'Prévia', icon: CheckCircle2 },
];

export function PdfImportWizard({ onComplete, onCancel }: PdfImportWizardProps) {
  const [step, setStep] = useState<ImportWizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedPdfData | null>(null);
  const [matchResults, setMatchResults] = useState<ClientMatchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const createImport = useCreatePdfImport();
  const processImport = useProcessPdfImport();
  const completeImport = useCompleteImport();

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    
    try {
      setIsProcessing(true);
      
      // Create import record
      const importRecord = await createImport.mutateAsync(selectedFile);
      setImportId(importRecord.id);
      
      // Parse PDF
      setStep('parsing');
      const parsed = await parsePdf(selectedFile);
      setParsedData(parsed);
      
      if (parsed.clients.length === 0) {
        throw new Error('Nenhum cliente encontrado no PDF. Verifique se o formato está correto.');
      }
      
      // Process matching
      const results = await processImport.mutateAsync({
        importId: importRecord.id,
        parsedData: parsed,
      });
      setMatchResults(results);
      
      setStep('correlation');
      
      toast({
        title: 'PDF processado',
        description: `${parsed.clients.length} clientes detectados no relatório.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao processar PDF';
      setError(message);
      setStep('upload');
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [createImport, processImport, toast]);

  const handleCorrelationComplete = useCallback((updatedResults: ClientMatchResult[]) => {
    setMatchResults(updatedResults);
    setStep('preview');
  }, []);

  const handleImport = useCallback(async (includeLinked: boolean) => {
    if (!importId) return;
    
    try {
      setIsProcessing(true);
      const result = await completeImport.mutateAsync({
        importId,
        includeLinked,
      });
      
      toast({
        title: 'Importação concluída',
        description: `${result.importedCount} clientes importados com sucesso.`,
      });
      
      setStep('complete');
      onComplete();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao importar';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [importId, completeImport, toast, onComplete]);

  const currentStepIndex = STEPS.findIndex(s => s.key === step);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  // Calculate stats
  const autoMatched = matchResults.filter(r => r.matchStatus === 'auto').length;
  const linked = matchResults.filter(r => r.matchStatus === 'linked').length;
  const pending = matchResults.filter(r => r.matchStatus === 'pending').length;
  const unmatched = matchResults.filter(r => r.matchStatus === 'unmatched').length;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Importar Relatório PDF</CardTitle>
              <CardDescription>
                {step === 'upload' && 'Selecione o arquivo PDF do boletim'}
                {step === 'parsing' && 'Processando e extraindo dados...'}
                {step === 'correlation' && 'Revise a correlação com os clientes existentes'}
                {step === 'preview' && 'Confirme a importação'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = s.key === step;
                const isCompleted = i < currentStepIndex;
                return (
                  <div
                    key={s.key}
                    className={`flex items-center gap-1.5 text-xs ${
                      isActive ? 'text-primary font-medium' :
                      isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      {step === 'upload' && (
        <PdfUploadStep 
          onFileSelect={handleFileSelect}
          isProcessing={isProcessing}
          file={file}
        />
      )}

      {step === 'parsing' && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="text-center">
                <p className="font-medium">Processando PDF...</p>
                <p className="text-sm text-muted-foreground">
                  Extraindo dados e correlacionando com clientes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'correlation' && (
        <PdfCorrelationStep
          importId={importId!}
          matchResults={matchResults}
          parsedData={parsedData}
          onComplete={handleCorrelationComplete}
          stats={{ autoMatched, linked, pending, unmatched }}
        />
      )}

      {step === 'preview' && (
        <PdfPreviewStep
          parsedData={parsedData}
          matchResults={matchResults}
          stats={{ autoMatched, linked, pending, unmatched }}
          onImport={handleImport}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}