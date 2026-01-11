import { useState } from 'react';
import { HelpCircle, Plus, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { CompanySummary, MatchResult, DemandStatus, STATUS_COLORS, STATUS_LABELS, ImportMode, createCompanySummary } from '@/types/demand';
import { Client, COLLABORATOR_COLORS, CollaboratorName } from '@/types/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NotFoundCompaniesStepProps {
  summaries: CompanySummary[];
  matchResults: MatchResult[];
  clients: Client[];
  mode: ImportMode;
  onConfirm: (summaries: CompanySummary[], results?: MatchResult[]) => void;
  onBack: () => void;
}

type ActionType = 'ignore' | 'link' | 'create';

interface CompanyAction {
  empresaExcel: string;
  action: ActionType;
  linkedClientId?: string;
  linkedClientName?: string;
}

export function NotFoundCompaniesStep({
  summaries,
  matchResults,
  clients,
  mode,
  onConfirm,
  onBack,
}: NotFoundCompaniesStepProps) {
  // Only show companies without match
  const notFoundCompanies = summaries.filter(s => s.matchType === 'none' && !s.clientId && !s.ignored);
  
  const [actions, setActions] = useState<Map<string, CompanyAction>>(() => {
    const map = new Map();
    notFoundCompanies.forEach(c => {
      map.set(c.empresaExcel, { empresaExcel: c.empresaExcel, action: 'ignore' });
    });
    return map;
  });

  const setAction = (empresaExcel: string, action: ActionType, clientId?: string, clientName?: string) => {
    setActions(prev => {
      const next = new Map(prev);
      next.set(empresaExcel, { 
        empresaExcel, 
        action, 
        linkedClientId: clientId, 
        linkedClientName: clientName 
      });
      return next;
    });
  };

  const handleConfirm = () => {
    // Update summaries and results based on actions
    const updatedSummaries = summaries.map(s => {
      const action = actions.get(s.empresaExcel);
      if (!action) return s;
      
      if (action.action === 'ignore') {
        return { ...s, ignored: true, selected: false };
      } else if (action.action === 'link' && action.linkedClientId) {
        return { 
          ...s, 
          clientId: action.linkedClientId, 
          clientName: action.linkedClientName,
          matchType: 'exact' as const,
          selected: true,
          ignored: false,
        };
      } else if (action.action === 'create') {
        return { 
          ...s, 
          createNew: true,
          selected: true,
          ignored: false,
        };
      }
      return s;
    });

    const updatedResults = matchResults.map(r => {
      const action = actions.get(r.empresaExcel);
      if (!action) return r;
      
      if (action.action === 'ignore') {
        return { ...r, ignored: true, selected: false };
      } else if (action.action === 'link' && action.linkedClientId) {
        return { 
          ...r, 
          clientId: action.linkedClientId, 
          clientName: action.linkedClientName,
          matchType: 'exact' as const,
          selected: true,
        };
      } else if (action.action === 'create') {
        return { 
          ...r, 
          createNew: true,
          selected: true,
        };
      }
      return r;
    });

    onConfirm(updatedSummaries, updatedResults);
  };

  const ignoredCount = [...actions.values()].filter(a => a.action === 'ignore').length;
  const linkedCount = [...actions.values()].filter(a => a.action === 'link').length;
  const createCount = [...actions.values()].filter(a => a.action === 'create').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-yellow-600" />
          <div>
            <h3 className="font-semibold text-yellow-800">Etapa 2: Empresas Não Encontradas</h3>
            <p className="text-sm text-yellow-600">
              {notFoundCompanies.length} empresas sem correspondência automática
            </p>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-gray-500">{ignoredCount}</div>
            <div className="text-xs text-gray-400">Ignorar</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-green-600">{linkedCount}</div>
            <div className="text-xs text-green-500">Vincular</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-blue-600">{createCount}</div>
            <div className="text-xs text-blue-500">Criar Novo</div>
          </div>
        </div>
      </div>

      {/* Company List */}
      <div className="max-h-[400px] overflow-y-auto space-y-2">
        {notFoundCompanies.map((company) => {
          const action = actions.get(company.empresaExcel);
          return (
            <NotFoundRow
              key={company.empresaExcel}
              company={company}
              clients={clients}
              mode={mode}
              currentAction={action?.action || 'ignore'}
              linkedClientId={action?.linkedClientId}
              onSetAction={(act, clientId, clientName) => 
                setAction(company.empresaExcel, act, clientId, clientName)
              }
            />
          );
        })}
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
          onClick={handleConfirm}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Ir para Confirmação
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function NotFoundRow({
  company,
  clients,
  mode,
  currentAction,
  linkedClientId,
  onSetAction,
}: {
  company: CompanySummary;
  clients: Client[];
  mode: ImportMode;
  currentAction: ActionType;
  linkedClientId?: string;
  onSetAction: (action: ActionType, clientId?: string, clientName?: string) => void;
}) {
  return (
    <div className={`p-3 rounded-lg border transition-all ${
      currentAction === 'ignore' 
        ? 'border-gray-200 bg-gray-50/50 opacity-60'
        : currentAction === 'link'
          ? 'border-green-300 bg-green-50/50'
          : 'border-blue-300 bg-blue-50/50'
    }`}>
      <div className="flex items-center gap-3">
        {/* Company Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{company.empresaExcel}</span>
            <span className="text-xs text-muted-foreground">
              ({company.totalDemands} demandas)
            </span>
          </div>
          
          {/* Quick Mode: Show stats */}
          {mode === 'quick' && (
            <div className="flex items-center gap-3 mt-1.5">
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
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Ignore */}
          <button
            onClick={() => onSetAction('ignore')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              currentAction === 'ignore'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <X className="w-3 h-3 inline mr-1" />
            Ignorar
          </button>

          {/* Link to existing */}
          <Select
            value={linkedClientId || ''}
            onValueChange={(value) => {
              const client = clients.find(c => c.id === value);
              if (client) onSetAction('link', client.id, client.name);
            }}
          >
            <SelectTrigger className={`w-[160px] h-8 text-xs ${
              currentAction === 'link' ? 'border-green-500 bg-green-50' : ''
            }`}>
              <SelectValue placeholder="Vincular a..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Create new */}
          <button
            onClick={() => onSetAction('create')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              currentAction === 'create'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}
          >
            <Plus className="w-3 h-3 inline mr-1" />
            Criar Novo
          </button>
        </div>
      </div>
    </div>
  );
}
