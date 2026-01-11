import { useState } from 'react';
import { Check, AlertTriangle, HelpCircle, ChevronDown, Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { MatchResult } from '@/types/demand';
import { Client } from '@/types/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MatchStepProps {
  matchResults: MatchResult[];
  clients: Client[];
  onConfirm: (results: MatchResult[]) => void;
  onBack: () => void;
}

export function MatchStep({ matchResults, clients, onConfirm, onBack }: MatchStepProps) {
  const [results, setResults] = useState<MatchResult[]>(matchResults);
  const [createNewClients, setCreateNewClients] = useState<Set<string>>(new Set());

  const updateMatch = (index: number, clientId: string, clientName: string) => {
    setResults(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        clientId,
        clientName,
        matchType: 'exact',
      };
      return updated;
    });
    // Remove from create new if was marked
    setCreateNewClients(prev => {
      const next = new Set(prev);
      next.delete(results[index].empresaExcel);
      return next;
    });
  };

  const toggleCreateNew = (empresa: string) => {
    setCreateNewClients(prev => {
      const next = new Set(prev);
      if (next.has(empresa)) {
        next.delete(empresa);
      } else {
        next.add(empresa);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    // Mark empresas that should create new clients
    const finalResults = results.map(r => ({
      ...r,
      createNew: createNewClients.has(r.empresaExcel),
    }));
    onConfirm(finalResults as any);
  };

  const exactCount = results.filter(r => r.matchType === 'exact' || r.clientId).length;
  const suggestedCount = results.filter(r => r.matchType === 'suggested' && !r.clientId).length;
  const noMatchCount = results.filter(r => r.matchType === 'none' && !r.clientId && !createNewClients.has(r.empresaExcel)).length;
  const createNewCount = createNewClients.size;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          <span className="text-sm">
            <strong>{exactCount}</strong> matches confirmados
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <span className="text-sm">
            <strong>{suggestedCount}</strong> sugestões pendentes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm">
            <strong>{noMatchCount}</strong> sem match
          </span>
        </div>
        {createNewCount > 0 && (
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-500" />
            <span className="text-sm">
              <strong>{createNewCount}</strong> novos clientes
            </span>
          </div>
        )}
      </div>

      {/* Match List */}
      <div className="max-h-[400px] overflow-y-auto space-y-2">
        {results.map((result, index) => (
          <MatchRow
            key={result.empresaExcel}
            result={result}
            clients={clients}
            isCreatingNew={createNewClients.has(result.empresaExcel)}
            onSelect={(clientId, clientName) => updateMatch(index, clientId, clientName)}
            onToggleCreateNew={() => toggleCreateNew(result.empresaExcel)}
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
          onClick={handleConfirm}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Confirmar Matches
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function MatchRow({
  result,
  clients,
  isCreatingNew,
  onSelect,
  onToggleCreateNew,
}: {
  result: MatchResult;
  clients: Client[];
  isCreatingNew: boolean;
  onSelect: (clientId: string, clientName: string) => void;
  onToggleCreateNew: () => void;
}) {
  const hasMatch = result.clientId !== undefined;
  
  const getIcon = () => {
    if (isCreatingNew) return <Plus className="w-4 h-4 text-blue-500" />;
    if (hasMatch) return <Check className="w-4 h-4 text-green-500" />;
    if (result.matchType === 'suggested') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <HelpCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className={`p-3 rounded-lg border ${
      isCreatingNew 
        ? 'border-blue-200 bg-blue-50/50' 
        : hasMatch 
          ? 'border-green-200 bg-green-50/50' 
          : 'border-yellow-200 bg-yellow-50/50'
    }`}>
      <div className="flex items-center gap-3">
        {getIcon()}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{result.empresaExcel}</span>
            <span className="text-xs text-muted-foreground">
              ({result.demands.length} demandas)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCreatingNew && (
            <Select
              value={result.clientId || ''}
              onValueChange={(value) => {
                const client = clients.find(c => c.id === value);
                if (client) onSelect(client.id, client.name);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecionar cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <button
            onClick={onToggleCreateNew}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              isCreatingNew
                ? 'bg-blue-500 text-white'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
            title={isCreatingNew ? 'Cancelar criação' : 'Criar novo cliente'}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {result.suggestions && result.suggestions.length > 0 && !hasMatch && !isCreatingNew && (
        <div className="mt-2 pl-7 text-xs text-muted-foreground">
          Sugestões: {result.suggestions.slice(0, 3).map(s => s.name).join(', ')}
        </div>
      )}
    </div>
  );
}
