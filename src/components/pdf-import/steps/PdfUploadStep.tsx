import React, { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface PdfUploadStepProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  file: File | null;
}

export function PdfUploadStep({ onFileSelect, isProcessing, file }: PdfUploadStepProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardContent className="py-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Processando arquivo...</p>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um PDF ou clique para selecionar'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Apenas arquivos PDF são aceitos
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Formato esperado:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Relatório/Boletim do SISRAMOS com tabela de clientes</li>
            <li>• Colunas: Ano, Mês, Empresa, Cancelado, Em Execução, Não Feito, Concluído, etc.</li>
            <li>• O sistema detectará automaticamente os clientes e métricas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}