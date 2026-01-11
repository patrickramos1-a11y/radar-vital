import { useState, useMemo } from 'react';
import { ArrowLeft, Download, Filter, Search, CheckSquare, Square, Check, X, Plus } from 'lucide-react';
import { ExcelDemand, MatchResult, CompanyStats, ImportMode, DemandStatus, STATUS_LABELS, STATUS_COLORS, KNOWN_COLLABORATORS } from '@/types/demand';
import { supabase } from '@/integrations/supabase/client';
import { useClients } from '@/contexts/ClientContext';
import { toast } from 'sonner';

interface FinalPreviewStepProps {
  companyStats: CompanyStats[];
  matchResults: MatchResult[];
  demands: ExcelDemand[];
  selectedDemands: Set<string>;
  setSelectedDemands: (value: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  mode: ImportMode;
  onBack: () => void;
  onStartImport: () => void;
  onImportComplete: () => void;
  setImportProgress: (value: { current: number; total: number }) => void;
}

type DuplicateAction = 'skip' | 'update' | 'overwrite';

export function FinalPreviewStep({
  companyStats,
  matchResults,
  demands,
  selectedDemands,
  setSelectedDemands,
  mode,
  onBack,
  onStartImport,
  onImportComplete,
  setImportProgress,
}: FinalPreviewStepProps) {
  const { refetch } = useClients();
  
  // Filters (for complete mode)
  const [filterEmpresa, setFilterEmpresa] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<DemandStatus | ''>('');
  const [filterResponsavel, setFilterResponsavel] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [filterAPT, setFilterAPT] = useState(false);
  const [ignoreCancelled, setIgnoreCancelled] = useState(false);
  
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>('skip');
  const [isImporting, setIsImporting] = useState(false);

  // Get companies to import (selected ones)
  const companiesToImport = useMemo(() => 
    companyStats.filter(c => c.selected),
    [companyStats]
  );

  const companiesToIgnore = useMemo(() => 
    companyStats.filter(c => !c.selected),
    [companyStats]
  );

  const companiesLinked = useMemo(() => 
    companyStats.filter(c => c.selected && c.clientId && !c.createNew),
    [companyStats]
  );

  const companiesToCreate = useMemo(() => 
    companyStats.filter(c => c.selected && c.createNew),
    [companyStats]
  );

  // Build client map for quick lookup
  const clientMap = useMemo(() => {
    const map = new Map<string, { clientId?: string; clientName?: string; createNew?: boolean }>();
    for (const stat of companyStats) {
      map.set(stat.empresa, {
        clientId: stat.clientId,
        clientName: stat.clientName,
        createNew: stat.createNew,
      });
    }
    return map;
  }, [companyStats]);

  // Summary stats for quick mode
  const quickSummary = useMemo(() => {
    const byStatus: Record<DemandStatus, number> = {
      CONCLUIDO: 0,
      EM_EXECUCAO: 0,
      NAO_FEITO: 0,
      CANCELADO: 0,
    };
    
    let total = 0;
    for (const c of companiesToImport) {
      byStatus.CONCLUIDO += c.byStatus.CONCLUIDO;
      byStatus.EM_EXECUCAO += c.byStatus.EM_EXECUCAO;
      byStatus.NAO_FEITO += c.byStatus.NAO_FEITO;
      byStatus.CANCELADO += c.byStatus.CANCELADO;
      total += c.total;
    }
    
    return { total, byStatus };
  }, [companiesToImport]);

  // For complete mode - unique values for filters
  const uniqueEmpresas = useMemo(() => 
    [...new Set(demands.map(d => d.empresa))].filter(e => 
      companiesToImport.some(c => c.empresa === e)
    ).sort()
  , [demands, companiesToImport]);
  
  const uniqueResponsaveis = useMemo(() => 
    [...new Set(demands.map(d => d.responsavel).filter(Boolean))].sort()
  , [demands]);

  // Filter demands for complete mode
  const filteredDemands = useMemo(() => {
    const importEmpresas = new Set(companiesToImport.map(c => c.empresa));
    
    return demands.filter((d) => {
      if (!importEmpresas.has(d.empresa)) return false;
      if (filterEmpresa && d.empresa !== filterEmpresa) return false;
      if (filterStatus && d.status !== filterStatus) return false;
      if (filterResponsavel && d.responsavel !== filterResponsavel) return false;
      if (searchText && !d.descricao.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (filterAPT && !d.descricao.toUpperCase().includes('APT')) return false;
      if (ignoreCancelled && d.status === 'CANCELADO') return false;
      return true;
    });
  }, [demands, companiesToImport, filterEmpresa, filterStatus, filterResponsavel, searchText, filterAPT, ignoreCancelled]);

  // Complete mode summary
  const completeSummary = useMemo(() => {
    const selected = demands.filter((d, i) => selectedDemands.has(`${d.empresa}-${i}`));
    const byStatus: Record<DemandStatus, number> = {
      CONCLUIDO: 0,
      EM_EXECUCAO: 0,
      NAO_FEITO: 0,
      CANCELADO: 0,
    };
    
    for (const d of selected) {
      byStatus[d.status]++;
    }
    
    return { total: selected.length, byStatus };
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
    const keys = new Set(filteredDemands.map((d) => {
      const originalIndex = demands.findIndex(od => od === d);
      return `${d.empresa}-${originalIndex}`;
    }));
    setSelectedDemands(keys);
  };

  const deselectAll = () => {
    setSelectedDemands(new Set());
  };

  const selectNonCompleted = () => {
    const importEmpresas = new Set(companiesToImport.map(c => c.empresa));
    const keys = new Set(
      demands
        .filter((d) => importEmpresas.has(d.empresa) && d.status !== 'CONCLUIDO')
        .map((d) => {
          const originalIndex = demands.findIndex(od => od === d);
          return `${d.empresa}-${originalIndex}`;
        })
    );
    setSelectedDemands(keys);
  };

  const handleQuickImport = async () => {
    setIsImporting(true);
    onStartImport();

    try {
      const toProcess = companiesToImport;
      setImportProgress({ current: 0, total: toProcess.length });

      // Create new clients if needed
      const newClientsMap = new Map<string, string>();
      for (const stat of companiesToCreate) {
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert({
            name: stat.empresa,
            initials: stat.empresa.slice(0, 2).toUpperCase(),
            display_order: 999,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating client:', error);
          continue;
        }
        newClientsMap.set(stat.empresa, newClient.id);
      }

      // Update each client with demand counts
      for (let i = 0; i < toProcess.length; i++) {
        const stat = toProcess[i];
        let clientId = stat.clientId || newClientsMap.get(stat.empresa);

        if (!clientId) {
          setImportProgress({ current: i + 1, total: toProcess.length });
          continue;
        }

        // Get current client data
        const { data: client } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (!client) {
          setImportProgress({ current: i + 1, total: toProcess.length });
          continue;
        }

        // Calculate new totals (add to existing)
        const newCompleted = client.demands_completed + stat.byStatus.CONCLUIDO;
        const newInProgress = client.demands_in_progress + stat.byStatus.EM_EXECUCAO;
        const newNotStarted = client.demands_not_started + stat.byStatus.NAO_FEITO;
        const newCancelled = client.demands_cancelled + stat.byStatus.CANCELADO;

        // Detect collaborators from demands
        const collaborators = {
          celine: client.collaborator_celine || stat.collaborators.includes('celine'),
          gabi: client.collaborator_gabi || stat.collaborators.includes('gabi'),
          darley: client.collaborator_darley || stat.collaborators.includes('darley'),
          vanessa: client.collaborator_vanessa || stat.collaborators.includes('vanessa'),
        };

        await supabase
          .from('clients')
          .update({
            demands_completed: newCompleted,
            demands_in_progress: newInProgress,
            demands_not_started: newNotStarted,
            demands_cancelled: newCancelled,
            collaborator_celine: collaborators.celine,
            collaborator_gabi: collaborators.gabi,
            collaborator_darley: collaborators.darley,
            collaborator_vanessa: collaborators.vanessa,
          })
          .eq('id', clientId);

        setImportProgress({ current: i + 1, total: toProcess.length });
      }

      await refetch();
      toast.success(`Importação concluída! ${toProcess.length} empresas atualizadas`);
      onImportComplete();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erro durante a importação');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCompleteImport = async () => {
    if (selectedDemands.size === 0) {
      toast.error('Selecione ao menos uma demanda para importar');
      return;
    }

    setIsImporting(true);
    onStartImport();

    try {
      const toImport = demands.filter((d, i) => selectedDemands.has(`${d.empresa}-${i}`));
      let imported = 0;
      let skipped = 0;
      let updated = 0;
      const affectedClients = new Set<string>();
      const newClientsMap = new Map<string, string>();

      // Create new clients if needed
      for (const stat of companiesToCreate) {
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert({
            name: stat.empresa,
            initials: stat.empresa.slice(0, 2).toUpperCase(),
            display_order: 999,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating client:', error);
          continue;
        }
        newClientsMap.set(stat.empresa, newClient.id);
      }

      setImportProgress({ current: 0, total: toImport.length });

      for (let i = 0; i < toImport.length; i++) {
        const demand = toImport[i];
        const stat = companyStats.find(c => c.empresa === demand.empresa);
        const clientId = stat?.clientId || newClientsMap.get(demand.empresa);

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

  const handleImport = () => {
    if (mode === 'quick') {
      handleQuickImport();
    } else {
      handleCompleteImport();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Etapa 3: Prévia Final</h3>
          <p className="text-sm text-muted-foreground">
            {mode === 'quick' ? 'Resumo por empresa' : 'Detalhes por demanda'}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/50 rounded-lg">
        <div className="text-center p-3 bg-background rounded-lg">
          <div className="text-2xl font-bold text-primary">{companiesToImport.length}</div>
          <div className="text-xs text-muted-foreground">Empresas a Importar</div>
        </div>
        <div className="text-center p-3 bg-background rounded-lg">
          <div className="text-2xl font-bold text-red-500">{companiesToIgnore.length}</div>
          <div className="text-xs text-muted-foreground">Empresas Ignoradas</div>
        </div>
        <div className="text-center p-3 bg-background rounded-lg">
          <div className="text-2xl font-bold text-green-500">{companiesLinked.length}</div>
          <div className="text-xs text-muted-foreground">Vinculadas Manualmente</div>
        </div>
        <div className="text-center p-3 bg-background rounded-lg">
          <div className="text-2xl font-bold text-blue-500">{companiesToCreate.length}</div>
          <div className="text-xs text-muted-foreground">Novos Clientes</div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-3 p-4 bg-muted/30 rounded-lg">
        <div className="text-center">
          <div className="text-xl font-bold text-green-500">
            {mode === 'quick' ? quickSummary.byStatus.CONCLUIDO : completeSummary.byStatus.CONCLUIDO}
          </div>
          <div className="text-xs text-muted-foreground">Concluídas</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-blue-500">
            {mode === 'quick' ? quickSummary.byStatus.EM_EXECUCAO : completeSummary.byStatus.EM_EXECUCAO}
          </div>
          <div className="text-xs text-muted-foreground">Em Execução</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-yellow-500">
            {mode === 'quick' ? quickSummary.byStatus.NAO_FEITO : completeSummary.byStatus.NAO_FEITO}
          </div>
          <div className="text-xs text-muted-foreground">Não Feitas</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-red-500">
            {mode === 'quick' ? quickSummary.byStatus.CANCELADO : completeSummary.byStatus.CANCELADO}
          </div>
          <div className="text-xs text-muted-foreground">Canceladas</div>
        </div>
      </div>

      {/* Quick Mode: Company List */}
      {mode === 'quick' && (
        <div className="max-h-[250px] overflow-y-auto space-y-2">
          {companiesToImport.map((company) => (
            <div
              key={company.empresa}
              className="p-3 rounded-lg border border-green-200 bg-green-50/30 flex items-center gap-3"
            >
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{company.empresa}</span>
                  {company.clientName && (
                    <>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-green-600 truncate">{company.clientName}</span>
                    </>
                  )}
                  {company.createNew && (
                    <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                      Novo
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-green-600">✓ {company.byStatus.CONCLUIDO}</span>
                <span className="text-blue-600">● {company.byStatus.EM_EXECUCAO}</span>
                <span className="text-yellow-600">○ {company.byStatus.NAO_FEITO}</span>
                <span className="text-red-600">✕ {company.byStatus.CANCELADO}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complete Mode: Detailed Table */}
      {mode === 'complete' && (
        <>
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
          <div className="max-h-[200px] overflow-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-2 w-8"></th>
                  <th className="p-2 text-left">Empresa</th>
                  <th className="p-2 text-left">Cliente</th>
                  <th className="p-2 text-left w-8">Status</th>
                  <th className="p-2 text-left">Descrição</th>
                  <th className="p-2 text-left">Responsável</th>
                </tr>
              </thead>
              <tbody>
                {filteredDemands.slice(0, 100).map((demand) => {
                  const originalIndex = demands.findIndex(d => d === demand);
                  const key = `${demand.empresa}-${originalIndex}`;
                  const isSelected = selectedDemands.has(key);
                  const stat = companyStats.find(c => c.empresa === demand.empresa);

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
                        {stat?.clientName ? (
                          <span className="text-green-600">{stat.clientName}</span>
                        ) : stat?.createNew ? (
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredDemands.length > 100 && (
              <div className="p-2 text-center text-sm text-muted-foreground bg-muted/50">
                Mostrando 100 de {filteredDemands.length} demandas
              </div>
            )}
          </div>
        </>
      )}

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
          disabled={isImporting || companiesToImport.length === 0}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {mode === 'quick' 
            ? `Importar ${companiesToImport.length} Empresas`
            : `Importar ${completeSummary.total} Demandas`
          }
        </button>
      </div>
    </div>
  );
}
