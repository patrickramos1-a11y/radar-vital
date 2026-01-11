import { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, X, Link, Check } from 'lucide-react';
import { CompanyStats, ImportMode, MatchResult, DemandStatus, extractCollaborators } from '@/types/demand';
import { Client } from '@/types/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NotFoundCompaniesStepProps {
  companies: CompanyStats[];
  clients: Client[];
  mode: ImportMode;
  matchResults: MatchResult[];
  onConfirm: (companies: CompanyStats[]) => void;
  onBack: () => void;
}

type CompanyAction = 'ignore' | 'link' | 'create';

interface CompanyDecision {
  empresa: string;
  action: CompanyAction;
  linkedClientId?: string;
  linkedClientName?: string;
}

export function NotFoundCompaniesStep({ 
  companies, 
  clients, 
  mode, 
  matchResults,
  onConfirm, 
  onBack 
}: NotFoundCompaniesStepProps) {
  const [decisions, setDecisions] = useState<Map<string, CompanyDecision>>(() => {
    const map = new Map();
    companies.forEach(c => {
      map.set(c.empresa, { empresa: c.empresa, action: 'ignore' });
    });
    return map;
  });

  const updateDecision = (empresa: string, decision: Partial<CompanyDecision>) => {
    setDecisions(prev => {
      const next = new Map(prev);
      const current = next.get(empresa) || { empresa, action: 'ignore' };
      next.set(empresa, { ...current, ...decision });
      return next;
    });
  };

  const linkToClient = (empresa: string, clientId: string, clientName: string) => {
    updateDecision(empresa, { 
      action: 'link', 
      linkedClientId: clientId, 
      linkedClientName: clientName 
    });
  };

  const setAction = (empresa: string, action: CompanyAction) => {
    updateDecision(empresa, { 
      action, 
      linkedClientId: undefined, 
      linkedClientName: undefined 
    });
  };

  const handleConfirm = () => {
    const updatedCompanies: CompanyStats[] = companies.map(c => {
      const decision = decisions.get(c.empresa);
      
      if (decision?.action === 'link' && decision.linkedClientId) {
        return {
          ...c,
          clientId: decision.linkedClientId,
          clientName: decision.linkedClientName,
          matchType: 'exact' as const,
          selected: true,
        };
      }
      
      if (decision?.action === 'create') {
        return {
          ...c,
          createNew: true,
          selected: true,
        };
      }
      
      // Ignore
      return { ...c, selected: false };
    });
    
    onConfirm(updatedCompanies);
  };

  const getSuggestions = (empresa: string) => {
    const match = matchResults.find(m => m.empresaExcel === empresa);
    return match?.suggestions || [];
  };

  const ignoredCount = Array.from(decisions.values()).filter(d => d.action === 'ignore').length;
  const linkedCount = Array.from(decisions.values()).filter(d => d.action === 'link').length;
  const createCount = Array.from(decisions.values()).filter(d => d.action === 'create').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Etapa 2: Empresas Não Encontradas</h3>
          <p className="text-sm text-muted-foreground">
            {companies.length} empresas sem match automático
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-red-600">{ignoredCount} ignoradas</span>
          <span className="text-green-600">{linkedCount} vinculadas</span>
          <span className="text-blue-600">{createCount} novas</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 p-3 bg-muted/30 rounded-lg">
        <button
          onClick={() => companies.forEach(c => setAction(c.empresa, 'ignore'))}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          <X className="w-4 h-4" />
          Ignorar Todas
        </button>
      </div>

      {/* Companies List */}
      <div className="max-h-[350px] overflow-y-auto space-y-3">
        {companies.map((company) => {
          const decision = decisions.get(company.empresa);
          const suggestions = getSuggestions(company.empresa);
          
          return (
            <div
              key={company.empresa}
              className={`p-4 rounded-lg border ${
                decision?.action === 'ignore'
                  ? 'border-red-200 bg-red-50/30'
                  : decision?.action === 'link'
                    ? 'border-green-200 bg-green-50/30'
                    : decision?.action === 'create'
                      ? 'border-blue-200 bg-blue-50/30'
                      : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{company.empresa}</span>
                    <span className="text-xs text-muted-foreground">
                      ({company.total} demandas)
                    </span>
                  </div>
                  
                  {mode === 'quick' && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="text-green-600">✓ {company.byStatus.CONCLUIDO}</span>
                      <span className="text-blue-600">● {company.byStatus.EM_EXECUCAO}</span>
                      <span className="text-yellow-600">○ {company.byStatus.NAO_FEITO}</span>
                      <span className="text-red-600">✕ {company.byStatus.CANCELADO}</span>
                    </div>
                  )}

                  {suggestions.length > 0 && decision?.action !== 'link' && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Sugestões: {suggestions.slice(0, 3).map((s, i) => (
                        <button
                          key={s.id}
                          onClick={() => linkToClient(company.empresa, s.id, s.name)}
                          className="text-primary hover:underline ml-1"
                        >
                          {s.name}{i < 2 && suggestions.length > i + 1 ? ',' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {decision?.action === 'link' && decision.linkedClientName && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      {decision.linkedClientName}
                    </span>
                  )}

                  <Select
                    value={decision?.action === 'link' ? decision.linkedClientId : decision?.action}
                    onValueChange={(value) => {
                      if (value === 'ignore' || value === 'create') {
                        setAction(company.empresa, value);
                      } else {
                        const client = clients.find(c => c.id === value);
                        if (client) {
                          linkToClient(company.empresa, client.id, client.name);
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Escolher ação..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ignore">
                        <span className="flex items-center gap-2 text-red-600">
                          <X className="w-3 h-3" />
                          Ignorar
                        </span>
                      </SelectItem>
                      <SelectItem value="create">
                        <span className="flex items-center gap-2 text-blue-600">
                          <Plus className="w-3 h-3" />
                          Criar Novo Cliente
                        </span>
                      </SelectItem>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">
                        Vincular a cliente existente:
                      </div>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          <span className="flex items-center gap-2">
                            <Link className="w-3 h-3" />
                            {client.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
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
          Próxima Etapa
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
