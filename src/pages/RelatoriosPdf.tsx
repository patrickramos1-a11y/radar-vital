import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PdfImportWizard } from '@/components/pdf-import/PdfImportWizard';
import { PdfImportsList } from '@/components/pdf-import/PdfImportsList';
import { PdfImportDetails } from '@/components/pdf-import/PdfImportDetails';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';

export default function RelatoriosPdf() {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);

  const handleImportComplete = () => {
    setShowWizard(false);
    setSelectedImportId(null);
  };

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Relatórios PDF</h1>
              <p className="text-xs text-muted-foreground">Importar e visualizar boletins do SISRAMOS</p>
            </div>
          </div>
          
          {!showWizard && !selectedImportId && (
            <Button onClick={() => setShowWizard(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Importar PDF
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {showWizard ? (
            <PdfImportWizard 
              onComplete={handleImportComplete}
              onCancel={() => setShowWizard(false)}
            />
          ) : selectedImportId ? (
            <PdfImportDetails 
              importId={selectedImportId}
              onBack={() => setSelectedImportId(null)}
            />
          ) : (
            <PdfImportsList 
              onSelectImport={setSelectedImportId}
              onNewImport={() => setShowWizard(true)}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}