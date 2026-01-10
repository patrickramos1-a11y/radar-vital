import { useState, useMemo } from 'react';
import { ArrowLeft, Download, Filter, Search, CheckSquare, Square, X } from 'lucide-react';
import { ExcelDemand, MatchResult, DemandStatus, STATUS_LABELS, STATUS_COLORS } from '@/types/demand';
import { supabase } from '@/integrations/supabase/client';
import { useClients } from '@/contexts/ClientContext';
import { toast } from 'sonner';

interface PreviewStepProps {
  matchResults: MatchResult[];
  demands: ExcelDemand[];
  selectedDemands: Set<string>;
  setSelectedDemands: (value: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  onBack: () => void;
  onStartImport: () => void;
  onImportComplete: () => void;
  setImportProgress: (value: { current: number; total: number }) => void;
}

type DuplicateAction = 'skip' | 'update' | 'overwrite';

export function PreviewStep({
  matchResults,
  demands,
  selectedDemands,
  setSelectedDemands,
  onBack,
  onStartImport,
  onImportComplete,
  setImportProgress,
}: PreviewStepProps) {
  const { refetch } = useClients();
  
  // Filters
  const [filterEmpresa, setFilterEmpresa] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<DemandStatus | ''>('');
  const [filterResponsavel, setFilterResponsavel] = useState<string>('');
  const [filterTopico, setFilterTopico] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [filterAPT, setFilterAPT] = useState(false);
  const [ignoreCancelled, setIgnoreCancelled] = useState(false);
  
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>('skip');
  const [isImporting, setIsImporting] = useState(false);

  // Build client map for quick lookup
  const clientMap = useMemo(() => {
    const map = new Map<string, { clientId?: string; clientName?: string; createNew?: boolean }>();
    for (const result of matchResults) {
      map.set(result.empresaExcel, {
        clientId: result.clientId,
        clientName: result.clientName,
        createNew: (result as any).createNew,
      });
    }
    return map;
  }, [matchResults]);

  // Get unique values for filters
  const uniqueEmpresas = useMemo(() => 
    [...new Set(demands.map(d => d.empresa))].sort()
  , [demands]);
  
  const uniqueResponsaveis = useMemo(() => 
    [...new Set(demands.map(d => d.responsavel).filter(Boolean))].sort()
  , [demands]);
  
  const uniqueTopicos = useMemo(() => 
    [...new Set(demands.map(d => d.topico).filter(Boolean))].sort()
  , [demands]);

  // Filter demands
  const filteredDemands = useMemo(() => {
    return demands.filter((d, i) => {
      if (filterEmpresa && d.empresa !== filterEmpresa) return false;
      if (filterStatus && d.status !== filterStatus) return false;
      if (filterResponsavel && d.responsavel !== filterResponsavel) return false;
      if (filterTopico && d.topico !== filterTopico) return false;
      if (searchText && !d.descricao.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (filterAPT && !d.descricao.toUpperCase().includes('APT')) return false;
      if (ignoreCancelled && d.status === 'CANCELADO') return false;
      return true;
    });
  }, [demands, filterEmpresa, filterStatus, filterResponsavel, filterTopico, searchText, filterAPT, ignoreCancelled]);

  // Summary stats
  const summary = useMemo(() => {
    const selected = demands.filter((d, i) => selectedDemands.has(`${d.empresa}-${i}`));
    const byStatus: Record<DemandStatus, number> = {
      CONCLUIDO: 0,
      EM_EXECUCAO: 0,
      NAO_FEITO: 0,
      CANCELADO: 0,
    };
    const byResponsavel: Record<string, number> = {};
    
    for (const d of selected) {
      byStatus[d.status]++;
      if (d.responsavel) {
        byResponsavel[d.responsavel] = (byResponsavel[d.responsavel] || 0) + 1;
      }
    }
    
    return { total: selected.length, byStatus, byResponsavel };
  }, [demands, selectedDemands]);

  const toggleDemand = (key: string) => {
    setSelectedDemands((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAll = () => {
    const keys = new Set(filteredDemands.map((d, i) => {
      const originalIndex = demands.findIndex(od => od === d);
      return `${d.empresa}-${originalIndex}`;
    }));
    setSelectedDemands(keys);
  };

  const deselectAll = () => {
    setSelectedDemands(new Set());
  };

  const selectNonCompleted = () => {
    const keys = new Set(
      demands
        .filter((d, i) => d.status !== 'CONCLUIDO')
        .map((d, i) => {
          const originalIndex = demands.findIndex(od => od === d);
          return `${d.empresa}-${originalIndex}`;
        })
    );
    setSelectedDemands(keys);
  };

  const handleImport = async () => {
    if (selectedDemands.size === 0) {
      toast.error('Selecione ao menos uma demanda para importar');
      return;
    }

    setIsImporting(true);
    onStartImport();

    try {
      // Get selected demands
      const toImport = demands.filter((d, i) => selectedDemands.has(`${d.empresa}-${i}`));
      let imported = 0;
      let skipped = 0;
      let updated = 0;
      const affectedClients = new Set<string>();

      // Create new clients if needed
      const newClientsToCreate = [...new Set(
        toImport
          .map(d => d.empresa)
          .filter(e => clientMap.get(e)?.createNew)
      )];

      for (const empresaName of newClientsToCreate) {
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert({
            name: empresaName,
            initials: empresaName.slice(0, 2).toUpperCase(),
            display_order: 999,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating client:', error);
          continue;
        }

        // Update clientMap with new client
        clientMap.set(empresaName, {
          clientId: newClient.id,
          clientName: newClient.name,
          createNew: false,
        });
      }

      setImportProgress({ current: 0, total: toImport.length });

      for (let i = 0; i < toImport.length; i++) {
        const demand = toImport[i];
        const match = clientMap.get(demand.empresa);
        const clientId = match?.clientId;

        if (clientId) {
          affectedClients.add(clientId);
        }

        // Check for duplicates by codigo
        if (demand.codigo) {
          const { data: existing } = await supabase
            .from('demands')
            .select('id')
            .eq('codigo', demand.codigo)
            .maybeSingle();

          if (existing) {
            if (duplicateAction === 'skip') {
              skipped++;
              setImportProgress({ current: i + 1, total: toImport.length });
              continue;
            } else if (duplicateAction === 'update' || duplicateAction === 'overwrite') {
              await supabase
                .from('demands')
                .update({
                  data: demand.data || null,
                  client_id: clientId || null,
                  empresa_excel: demand.empresa,
                  descricao: demand.descricao,
                  responsavel: demand.responsavel || null,
                  status: demand.status,
                  topico: demand.topico || null,
                  subtopico: demand.subtopico || null,
                  plano: demand.plano || null,
                  comentario: demand.comentario || null,
                  origem: demand.origem || null,
                })
                .eq('id', existing.id);
              updated++;
              setImportProgress({ current: i + 1, total: toImport.length });
              continue;
            }
          }
        }

        // Insert new demand
        await supabase.from('demands').insert({
          codigo: demand.codigo || null,
          data: demand.data || null,
          client_id: clientId || null,
          empresa_excel: demand.empresa,
          descricao: demand.descricao,
          responsavel: demand.responsavel || null,
          status: demand.status,
          topico: demand.topico || null,
          subtopico: demand.subtopico || null,
          plano: demand.plano || null,
          comentario: demand.comentario || null,
          origem: demand.origem || null,
        });

        imported++;
        setImportProgress({ current: i + 1, total: toImport.length });
      }

      // Recalculate demand counts for affected clients
      for (const clientId of affectedClients) {
        await supabase.rpc('recalculate_client_demands', { p_client_id: clientId });
      }

      // Refetch clients to update UI
      await refetch();

      toast.success(
        `Importação concluída! ${imported} importadas, ${updated} atualizadas, ${skipped} ignoradas`
      );
      
      onImportComplete();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erro durante a importação');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{summary.total}</div>
          <div className="text-xs text-muted-foreground">Selecionadas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{summary.byStatus.CONCLUIDO}</div>
          <div className="text-xs text-muted-foreground">Concluídas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">{summary.byStatus.EM_EXECUCAO}</div>
          <div className="text-xs text-muted-foreground">Em Execução</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-500">{summary.byStatus.NAO_FEITO}</div>
          <div className="text-xs text-muted-foreground">Não Feitas</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <select
          value={filterEmpresa}
          onChange={(e) => setFilterEmpresa(e.target.value)}
          className="px-2 py-1 text-sm border rounded bg-background"
        >
          <option value="">Todas Empresas</option>
          {uniqueEmpresas.map(e => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as DemandStatus | '')}
          className="px-2 py-1 text-sm border rounded bg-background"
        >
          <option value="">Todos Status</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        <select
          value={filterResponsavel}
          onChange={(e) => setFilterResponsavel(e.target.value)}
          className="px-2 py-1 text-sm border rounded bg-background"
        >
          <option value="">Todos Responsáveis</option>
          {uniqueResponsaveis.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select
          value={filterTopico}
          onChange={(e) => setFilterTopico(e.target.value)}
          className="px-2 py-1 text-sm border rounded bg-background"
        >
          <option value="">Todos Tópicos</option>
          {uniqueTopicos.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Buscar descrição..."
            className="pl-7 pr-2 py-1 text-sm border rounded bg-background w-40"
          />
        </div>

        <label className="flex items-center gap-1 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={filterAPT}
            onChange={(e) => setFilterAPT(e.target.checked)}
            className="rounded"
          />
          Somente APT
        </label>

        <label className="flex items-center gap-1 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={ignoreCancelled}
            onChange={(e) => setIgnoreCancelled(e.target.checked)}
            className="rounded"
          />
          Ignorar Cancelados
        </label>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={selectAll}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-muted rounded hover:bg-muted/80"
        >
          <CheckSquare className="w-4 h-4" />
          Selecionar Todas ({filteredDemands.length})
        </button>
        <button
          onClick={deselectAll}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-muted rounded hover:bg-muted/80"
        >
          <Square className="w-4 h-4" />
          Desmarcar Todas
        </button>
        <button
          onClick={selectNonCompleted}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Importar Não Concluídas
        </button>

        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Duplicados:</span>
          <select
            value={duplicateAction}
            onChange={(e) => setDuplicateAction(e.target.value as DuplicateAction)}
            className="px-2 py-1 border rounded bg-background"
          >
            <option value="skip">Ignorar</option>
            <option value="update">Atualizar</option>
            <option value="overwrite">Sobrescrever</option>
          </select>
        </div>
      </div>

      {/* Demands Table */}
      <div className="max-h-[300px] overflow-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="p-2 w-8"></th>
              <th className="p-2 text-left">Empresa</th>
              <th className="p-2 text-left">Cliente</th>
              <th className="p-2 text-left w-8">Status</th>
              <th className="p-2 text-left">Descrição</th>
              <th className="p-2 text-left">Responsável</th>
              <th className="p-2 text-left">Tópico</th>
            </tr>
          </thead>
          <tbody>
            {filteredDemands.map((demand, index) => {
              const originalIndex = demands.findIndex(d => d === demand);
              const key = `${demand.empresa}-${originalIndex}`;
              const isSelected = selectedDemands.has(key);
              const match = clientMap.get(demand.empresa);

              return (
                <tr
                  key={key}
                  className={`border-t hover:bg-muted/50 cursor-pointer ${
                    isSelected ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => toggleDemand(key)}
                >
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleDemand(key)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded"
                    />
                  </td>
                  <td className="p-2 font-medium truncate max-w-[120px]" title={demand.empresa}>
                    {demand.empresa}
                  </td>
                  <td className="p-2">
                    {match?.clientName ? (
                      <span className="text-green-600">{match.clientName}</span>
                    ) : match?.createNew ? (
                      <span className="text-blue-600 italic">Novo cliente</span>
                    ) : (
                      <span className="text-red-500 italic">Sem match</span>
                    )}
                  </td>
                  <td className="p-2">
                    <span className={`inline-block w-3 h-3 rounded-full ${STATUS_COLORS[demand.status]}`} 
                          title={STATUS_LABELS[demand.status]} />
                  </td>
                  <td className="p-2 truncate max-w-[300px]" title={demand.descricao}>
                    {demand.descricao}
                  </td>
                  <td className="p-2 truncate max-w-[80px]">{demand.responsavel}</td>
                  <td className="p-2 truncate max-w-[100px]">{demand.topico}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground"
          disabled={isImporting}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          onClick={handleImport}
          disabled={isImporting || selectedDemands.size === 0}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Importar {summary.total} Demandas
        </button>
      </div>
    </div>
  );
}
