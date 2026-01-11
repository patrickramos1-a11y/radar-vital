import { useState } from 'react';
import { Check, AlertTriangle, ChevronDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { CompanySummary, ExcelDemand, MatchResult, DemandStatus, STATUS_COLORS, STATUS_LABELS, ImportMode } from '@/types/demand';
import { Client, COLLABORATOR_COLORS, CollaboratorName } from '@/types/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FoundCompaniesStepProps {
  summaries: CompanySummary[];
  matchResults: MatchResult[];
  clients: Client[];
  mode: ImportMode;
  demands: ExcelDemand[];
  selectedDemands: Set<string>;
  setSelectedDemands: (value: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  onConfirm: (summaries: CompanySummary[], results?: MatchResult[]) => void;
  onBack: () => void;
}

export function FoundCompaniesStep({
  summaries,
  matchResults,
  clients,
  mode,
  demands,
  selectedDemands,
  setSelectedDemands,
  onConfirm,
  onBack,
}: FoundCompaniesStepProps) {
  const [localSummaries, setLocalSummaries] = useState<CompanySummary[]>(summaries);
  const [localResults, setLocalResults] = useState<MatchResult[]>(matchResults);

  // Only show found companies (exact or suggested matches)
  const foundCompanies = localSummaries.filter(s => s.matchType !== 'none' || s.clientId);
  const notFoundCount = localSummaries.filter(s => s.matchType === 'none' && !s.clientId).length;

  const toggleSelection = (empresaExcel: string) => {
    setLocalSummaries(prev => prev.map(s => 
      s.empresaExcel === empresaExcel ? { ...s, selected: !s.selected } : s
    ));
    setLocalResults(prev => prev.map(r => 
      r.empresaExcel === empresaExcel ? { ...r, selected: !r.selected } : r
    ));
  };

  const selectAll = () => {
    setLocalSummaries(prev => prev.map(s => 
      (s.matchType !== 'none' || s.clientId) ? { ...s, selected: true } : s
    ));
    setLocalResults(prev => prev.map(r => 
      (r.matchType !== 'none' || r.clientId) ? { ...r, selected: true } : r
    ));
  };

  const deselectAll = () => {
    setLocalSummaries(prev => prev.map(s => ({ ...s, selected: false })));
    setLocalResults(prev => prev.map(r => ({ ...r, selected: false })));
  };

  const updateClientMatch = (empresaExcel: string, clientId: string, clientName: string) => {
    setLocalSummaries(prev => prev.map(s => 
      s.empresaExcel === empresaExcel 
        ? { ...s, clientId, clientName, matchType: 'exact', selected: true } 
        : s
    ));
    setLocalResults(prev => prev.map(r => 
      r.empresaExcel === empresaExcel 
        ? { ...r, clientId, clientName, matchType: 'exact', selected: true } 
        : r
    ));
  };

  const totalSelected = foundCompanies.filter(c => c.selected).length;
  const totalDemands = foundCompanies.filter(c => c.selected).reduce((sum, c) => sum + c.totalDemands, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-3">
          <Check className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-800">Etapa 1: Empresas Encontradas</h3>
            <p className="text-sm text-green-600">
              {foundCompanies.length} empresas com match automático
              {notFoundCount > 0 && ` • ${notFoundCount} sem match (próxima etapa)`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-700">{totalSelected} selecionadas</div>
          <div className="text-sm text-green-600">{totalDemands} demandas</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          onClick={selectAll}
          className="px-3 py-1.5 text-sm bg-muted rounded hover:bg-muted/80"
        >
          Selecionar Todas
        </button>
        <button
          onClick={deselectAll}
          className="px-3 py-1.5 text-sm bg-muted rounded hover:bg-muted/80"
        >
          Desmarcar Todas
        </button>
      </div>

      {/* Company List */}
      <div className="max-h-[400px] overflow-y-auto space-y-2">
        {foundCompanies.map((company) => (
          <CompanyRow
            key={company.empresaExcel}
            company={company}
            clients={clients}
            mode={mode}
            onToggle={() => toggleSelection(company.empresaExcel)}
            onUpdateClient={(clientId, clientName) => updateClientMatch(company.empresaExcel, clientId, clientName)}
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
          onClick={() => onConfirm(localSummaries, localResults)}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          {notFoundCount > 0 ? 'Próxima Etapa' : 'Ir para Confirmação'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CompanyRow({
  company,
  clients,
  mode,
  onToggle,
  onUpdateClient,
}: {
  company: CompanySummary;
  clients: Client[];
  mode: ImportMode;
  onToggle: () => void;
  onUpdateClient: (clientId: string, clientName: string) => void;
}) {
  return (
    <div 
      className={`p-3 rounded-lg border transition-all cursor-pointer ${
        company.selected 
          ? 'border-green-300 bg-green-50/50' 
          : 'border-border bg-card hover:bg-muted/30'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={company.selected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded"
        />

        {/* Company Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{company.empresaExcel}</span>
            <span className="text-xs text-muted-foreground">→</span>
            <span className="text-sm text-green-600 font-medium truncate">
              {company.clientName}
            </span>
            {company.matchType === 'suggested' && (
              <span className="text-xs text-yellow-600 bg-yellow-100 px-1.5 rounded">sugerido</span>
            )}
          </div>
          
          {/* Quick Mode: Show stats */}
          {mode === 'quick' && (
            <div className="flex items-center gap-3 mt-1.5">
              {/* Status badges */}
              <div className="flex items-center gap-1">
                {Object.entries(company.byStatus).map(([status, count]) => (
                  count > 0 && (
                    <span 
                      key={status}
                      className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded text-xs font-medium text-white ${STATUS_COLORS[status as DemandStatus]}`}
                      title={STATUS_LABELS[status as DemandStatus]}
                    >
                      {count}
                    </span>
                  )
                ))}
              </div>
              
              {/* Collaborators */}
              <div className="flex items-center gap-0.5">
                {Object.entries(company.collaborators).map(([name, active]) => (
                  active && (
                    <span
                      key={name}
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: COLLABORATOR_COLORS[name as CollaboratorName] }}
                      title={name.charAt(0).toUpperCase() + name.slice(1)}
                    />
                  )
                ))}
              </div>
              
              <span className="text-xs text-muted-foreground">
                {company.totalDemands} demandas
              </span>
            </div>
          )}
        </div>

        {/* Change Client (optional) */}
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={company.clientId || ''}
            onValueChange={(value) => {
              const client = clients.find(c => c.id === value);
              if (client) onUpdateClient(client.id, client.name);
            }}
          >
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Alterar..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
