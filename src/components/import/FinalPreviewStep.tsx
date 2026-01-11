import { useState, useMemo } from 'react';
import { ArrowLeft, Download, Filter, Search, CheckSquare, Square, CheckCircle } from 'lucide-react';
import { ExcelDemand, MatchResult, DemandStatus, STATUS_LABELS, STATUS_COLORS, ImportMode, CompanySummary, countDemandsByCollaborator } from '@/types/demand';
import { Client, COLLABORATOR_COLORS, CollaboratorName } from '@/types/client';
import { supabase } from '@/integrations/supabase/client';
import { useClients } from '@/contexts/ClientContext';
import { toast } from 'sonner';

interface FinalPreviewStepProps {
  summaries: CompanySummary[];
  matchResults: MatchResult[];
  demands: ExcelDemand[];
  selectedDemands: Set<string>;
  setSelectedDemands: (value: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  mode: ImportMode;
  clients: Client[];
  onBack: () => void;
  onStartImport: () => void;
  onImportComplete: () => void;
  setImportProgress: (value: { current: number; total: number }) => void;
}

type DuplicateAction = 'skip' | 'update' | 'overwrite';

export function FinalPreviewStep({
  summaries,
  matchResults,
  demands,
  selectedDemands,
  setSelectedDemands,
  mode,
  clients,
  onBack,
  onStartImport,
  onImportComplete,
  setImportProgress,
}: FinalPreviewStepProps) {
  const { refetch } = useClients();
  const [isImporting, setIsImporting] = useState(false);
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>('skip');

  // Filters for complete mode
  const [filterEmpresa, setFilterEmpresa] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<DemandStatus | ''>('');
  const [searchText, setSearchText] = useState<string>('');

  // Get selected summaries
  const selectedSummaries = summaries.filter(s => s.selected && !s.ignored);
  const ignoredSummaries = summaries.filter(s => s.ignored);

  // Build client map for quick lookup
  const clientMap = useMemo(() => {
    const map = new Map<string, { clientId?: string; clientName?: string; createNew?: boolean }>();
    for (const result of matchResults) {
      map.set(result.empresaExcel, {
        clientId: result.clientId,
        clientName: result.clientName,
        createNew: result.createNew,
      });
    }
    return map;
  }, [matchResults]);

  // Summary stats
  const totalStats = useMemo(() => {
    const stats = {
      companies: selectedSummaries.length,
      demands: 0,
      byStatus: { CONCLUIDO: 0, EM_EXECUCAO: 0, NAO_FEITO: 0, CANCELADO: 0 } as Record<DemandStatus, number>,
    };
    for (const s of selectedSummaries) {
      stats.demands += s.totalDemands;
      stats.byStatus.CONCLUIDO += s.byStatus.CONCLUIDO;
      stats.byStatus.EM_EXECUCAO += s.byStatus.EM_EXECUCAO;
      stats.byStatus.NAO_FEITO += s.byStatus.NAO_FEITO;
      stats.byStatus.CANCELADO += s.byStatus.CANCELADO;
    }
    return stats;
  }, [selectedSummaries]);

  // Filter demands for complete mode
  const filteredDemands = useMemo(() => {
    if (mode !== 'complete') return [];
    
    const selectedEmpresas = new Set(selectedSummaries.map(s => s.empresaExcel));
    
    return demands.filter((d) => {
      if (!selectedEmpresas.has(d.empresa)) return false;
      if (filterEmpresa && d.empresa !== filterEmpresa) return false;
      if (filterStatus && d.status !== filterStatus) return false;
      if (searchText && !d.descricao.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [demands, mode, selectedSummaries, filterEmpresa, filterStatus, searchText]);

  const handleImport = async () => {
    setIsImporting(true);
    onStartImport();

    try {
      if (mode === 'quick') {
        await importQuickMode();
      } else {
        await importCompleteMode();
      }
      
      await refetch();
      onImportComplete();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erro durante a importação');
    } finally {
      setIsImporting(false);
    }
  };

  const importQuickMode = async () => {
    let processed = 0;
    const total = selectedSummaries.length;
    setImportProgress({ current: 0, total });

    // First, create any new clients
    for (const summary of selectedSummaries) {
      if (summary.createNew && !summary.clientId) {
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert({
            name: summary.empresaExcel,
            initials: summary.empresaExcel.slice(0, 2).toUpperCase(),
            display_order: 999,
          })
          .select()
          .single();

        if (!error && newClient) {
          summary.clientId = newClient.id;
          summary.clientName = newClient.name;
        }
      }
    }

    // Update each client with aggregated stats
    // IMPORTANTE: Apenas atualiza contadores de demandas, NÃO altera seleções de colaboradores
    for (const summary of selectedSummaries) {
      if (!summary.clientId) continue;

      // Get the actual demands for this company to count by collaborator
      const companyDemands = demands.filter(d => d.empresa === summary.empresaExcel);
      const collaboratorCounts = countDemandsByCollaborator(companyDemands);

      // Update ONLY demand counts - do NOT touch collaborator selection flags
      const newStats = {
        demands_completed: summary.byStatus.CONCLUIDO,
        demands_in_progress: summary.byStatus.EM_EXECUCAO,
        demands_not_started: summary.byStatus.NAO_FEITO,
        demands_cancelled: summary.byStatus.CANCELADO,
        // Demand counts per collaborator (from import data)
        demands_celine: collaboratorCounts.celine,
        demands_gabi: collaboratorCounts.gabi,
        demands_darley: collaboratorCounts.darley,
        demands_vanessa: collaboratorCounts.vanessa,
        // collaborator_* flags are NOT modified - they represent manual user selections only
      };

      await supabase
        .from('clients')
        .update(newStats)
        .eq('id', summary.clientId);

      processed++;
      setImportProgress({ current: processed, total });
    }

    toast.success(`Importação rápida concluída! ${selectedSummaries.length} empresas atualizadas`);
  };

  const importCompleteMode = async () => {
    const selectedEmpresas = new Set(selectedSummaries.map(s => s.empresaExcel));
    const toImport = demands.filter(d => selectedEmpresas.has(d.empresa));
    
    let imported = 0;
    let skipped = 0;
    let updated = 0;
    const affectedClients = new Set<string>();

    // Create new clients first
    for (const summary of selectedSummaries) {
      if (summary.createNew && !summary.clientId) {
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert({
            name: summary.empresaExcel,
            initials: summary.empresaExcel.slice(0, 2).toUpperCase(),
            display_order: 999,
          })
          .select()
          .single();

        if (!error && newClient) {
          summary.clientId = newClient.id;
          clientMap.set(summary.empresaExcel, {
            clientId: newClient.id,
            clientName: newClient.name,
            createNew: false,
          });
        }
      }
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

    toast.success(
      `Importação concluída! ${imported} importadas, ${updated} atualizadas, ${skipped} ignoradas`
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-primary" />
          <div>
            <h3 className="font-semibold text-primary">Etapa 3: Confirmação Final</h3>
            <p className="text-sm text-primary/70">
              Revise os dados antes de importar
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 p-4 bg-muted/50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{totalStats.companies}</div>
          <div className="text-xs text-muted-foreground">Empresas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">{totalStats.demands}</div>
          <div className="text-xs text-muted-foreground">Demandas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{totalStats.byStatus.CONCLUIDO}</div>
          <div className="text-xs text-muted-foreground">Concluídas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-500">{totalStats.byStatus.EM_EXECUCAO}</div>
          <div className="text-xs text-muted-foreground">Em Execução</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-500">{totalStats.byStatus.NAO_FEITO}</div>
          <div className="text-xs text-muted-foreground">Não Feitas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-500">{totalStats.byStatus.CANCELADO}</div>
          <div className="text-xs text-muted-foreground">Canceladas</div>
        </div>
      </div>

      {/* Quick Mode: Company Summary */}
      {mode === 'quick' && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Empresas a Importar:</h4>
          <div className="max-h-[250px] overflow-y-auto space-y-1.5">
            {selectedSummaries.map((s) => (
              <div key={s.empresaExcel} className="flex items-center justify-between p-2 bg-card rounded border">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{s.empresaExcel}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-sm text-green-600">{s.clientName || '(criar novo)'}</span>
                </div>
                <div className="flex items-center gap-1">
                  {Object.entries(s.byStatus).map(([status, count]) => (
                    count > 0 && (
                      <span 
                        key={status}
                        className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded text-xs font-medium text-white ${STATUS_COLORS[status as DemandStatus]}`}
                      >
                        {count}
                      </span>
                    )
                  ))}
                  <div className="flex items-center gap-0.5 ml-2">
                    {Object.entries(s.collaborators).map(([name, active]) => (
                      active && (
                        <span
                          key={name}
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: COLLABORATOR_COLORS[name as CollaboratorName] }}
                        />
                      )
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {ignoredSummaries.length > 0 && (
            <div className="mt-3 p-2 bg-gray-100 rounded">
              <span className="text-xs text-gray-500">
                {ignoredSummaries.length} empresa(s) ignorada(s): {ignoredSummaries.map(s => s.empresaExcel).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Complete Mode: Demand Table */}
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
              {selectedSummaries.map(s => (
                <option key={s.empresaExcel} value={s.empresaExcel}>{s.empresaExcel}</option>
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
          <div className="max-h-[250px] overflow-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-2 text-left">Empresa</th>
                  <th className="p-2 text-left">Cliente</th>
                  <th className="p-2 text-left w-8">Status</th>
                  <th className="p-2 text-left">Descrição</th>
                  <th className="p-2 text-left">Responsável</th>
                </tr>
              </thead>
              <tbody>
                {filteredDemands.slice(0, 100).map((demand, index) => {
                  const match = clientMap.get(demand.empresa);
                  return (
                    <tr key={`${demand.empresa}-${index}`} className="border-t hover:bg-muted/50">
                      <td className="p-2 font-medium truncate max-w-[120px]">{demand.empresa}</td>
                      <td className="p-2">
                        {match?.clientName ? (
                          <span className="text-green-600">{match.clientName}</span>
                        ) : match?.createNew ? (
                          <span className="text-blue-600 italic">Novo cliente</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-2">
                        <span className={`inline-block w-3 h-3 rounded-full ${STATUS_COLORS[demand.status]}`} 
                              title={STATUS_LABELS[demand.status]} />
                      </td>
                      <td className="p-2 truncate max-w-[300px]">{demand.descricao}</td>
                      <td className="p-2 truncate max-w-[80px]">{demand.responsavel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredDemands.length > 100 && (
              <div className="p-2 text-center text-sm text-muted-foreground bg-muted">
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
          disabled={isImporting || selectedSummaries.length === 0}
          className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <Download className="w-5 h-5" />
          IMPORTAR DADOS
        </button>
      </div>
    </div>
  );
}
