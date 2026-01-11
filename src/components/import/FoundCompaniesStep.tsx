import { useState, useMemo } from 'react';
import { Check, ArrowLeft, ArrowRight, CheckSquare, Square } from 'lucide-react';
import { CompanyStats, ImportMode, STATUS_LABELS, DemandStatus } from '@/types/demand';

interface FoundCompaniesStepProps {
  companies: CompanyStats[];
  mode: ImportMode;
  onConfirm: (companies: CompanyStats[]) => void;
  onBack: () => void;
}

export function FoundCompaniesStep({ companies, mode, onConfirm, onBack }: FoundCompaniesStepProps) {
  const [stats, setStats] = useState<CompanyStats[]>(companies);

  const toggleCompany = (empresa: string) => {
    setStats(prev => prev.map(c => 
      c.empresa === empresa ? { ...c, selected: !c.selected } : c
    ));
  };

  const selectAll = () => {
    setStats(prev => prev.map(c => ({ ...c, selected: true })));
  };

  const deselectAll = () => {
    setStats(prev => prev.map(c => ({ ...c, selected: false })));
  };

  const selectedCount = stats.filter(c => c.selected).length;
  const totalDemands = stats.filter(c => c.selected).reduce((sum, c) => sum + c.total, 0);

  const summary = useMemo(() => {
    const byStatus: Record<DemandStatus, number> = {
      CONCLUIDO: 0,
      EM_EXECUCAO: 0,
      NAO_FEITO: 0,
      CANCELADO: 0,
    };
    
    for (const c of stats.filter(s => s.selected)) {
      byStatus.CONCLUIDO += c.byStatus.CONCLUIDO;
      byStatus.EM_EXECUCAO += c.byStatus.EM_EXECUCAO;
      byStatus.NAO_FEITO += c.byStatus.NAO_FEITO;
      byStatus.CANCELADO += c.byStatus.CANCELADO;
    }
    
    return byStatus;
  }, [stats]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Etapa 1: Empresas Encontradas</h3>
          <p className="text-sm text-muted-foreground">
            {companies.length} empresas com match automático
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            {selectedCount} selecionadas ({totalDemands} demandas)
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 p-4 bg-muted/50 rounded-lg">
        <div className="text-center">
          <div className="text-xl font-bold text-green-500">{summary.CONCLUIDO}</div>
          <div className="text-xs text-muted-foreground">Concluídas</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-blue-500">{summary.EM_EXECUCAO}</div>
          <div className="text-xs text-muted-foreground">Em Execução</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-yellow-500">{summary.NAO_FEITO}</div>
          <div className="text-xs text-muted-foreground">Não Feitas</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-red-500">{summary.CANCELADO}</div>
          <div className="text-xs text-muted-foreground">Canceladas</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          onClick={selectAll}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-muted rounded hover:bg-muted/80"
        >
          <CheckSquare className="w-4 h-4" />
          Selecionar Todas
        </button>
        <button
          onClick={deselectAll}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-muted rounded hover:bg-muted/80"
        >
          <Square className="w-4 h-4" />
          Desmarcar Todas
        </button>
      </div>

      {/* Companies List */}
      <div className="max-h-[350px] overflow-y-auto space-y-2">
        {stats.map((company) => (
          <CompanyRow
            key={company.empresa}
            company={company}
            mode={mode}
            onToggle={() => toggleCompany(company.empresa)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          onClick={() => onConfirm(stats)}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Próxima Etapa
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CompanyRow({
  company,
  mode,
  onToggle,
}: {
  company: CompanyStats;
  mode: ImportMode;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        company.selected
          ? 'border-green-300 bg-green-50/50'
          : 'border-border bg-background hover:bg-muted/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={company.selected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="rounded"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{company.empresa}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-green-600 truncate">{company.clientName}</span>
          </div>
          
          {mode === 'quick' && (
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span>{company.total} demandas</span>
              <span className="text-green-600">✓ {company.byStatus.CONCLUIDO}</span>
              <span className="text-blue-600">● {company.byStatus.EM_EXECUCAO}</span>
              <span className="text-yellow-600">○ {company.byStatus.NAO_FEITO}</span>
              <span className="text-red-600">✕ {company.byStatus.CANCELADO}</span>
              {company.collaborators.length > 0 && (
                <span className="text-purple-600">
                  👤 {company.collaborators.join(', ')}
                </span>
              )}
            </div>
          )}
        </div>

        {company.selected && (
          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}
