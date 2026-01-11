import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Client, ClientFormData, generateInitials, DEFAULT_COLLABORATORS, DEFAULT_COLLABORATOR_DEMAND_COUNTS, DEFAULT_LICENSE_BREAKDOWN, DEFAULT_PROCESS_BREAKDOWN } from '@/types/client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClientContextType {
  clients: Client[];
  activeClients: Client[];
  highlightedClients: Set<string>;
  isLoading: boolean;
  addClient: (data: ClientFormData) => Promise<void>;
  updateClient: (id: string, data: Partial<ClientFormData>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  deleteSelectedClients: (ids: string[]) => Promise<void>;
  clearAllClients: () => Promise<void>;
  toggleClientActive: (id: string) => void;
  togglePriority: (id: string) => void;
  toggleChecked: (id: string) => void;
  toggleCollaborator: (id: string, collaborator: keyof Client['collaborators']) => void;
  toggleHighlight: (id: string) => void;
  clearHighlights: () => void;
  getClient: (id: string) => Client | undefined;
  moveClient: (id: string, direction: 'up' | 'down') => void;
  moveClientToPosition: (id: string, newPosition: number) => void;
  reorderClients: () => void;
  exportData: () => string;
  importData: (jsonData: string) => Promise<boolean>;
  resetToDefault: () => Promise<void>;
  refetch: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

// Convert database row to Client type
const dbRowToClient = (row: any): Client => {
  // Calculate "em andamento" = análise órgão + análise ramos + notificado
  const procEmAndamento = (row.proc_em_analise_orgao_count || 0) + (row.proc_em_analise_ramos_count || 0) + (row.proc_notificado_count || 0);
  
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    logoUrl: row.logo_url || undefined,
    isPriority: row.is_priority,
    isActive: row.is_active,
    isChecked: row.is_checked || false,
    order: row.display_order,
    processes: procEmAndamento, // "P" = processes in progress (not deferido)
    processBreakdown: {
      total: row.proc_total_count || 0,
      deferido: row.proc_deferido_count || 0,
      emAnaliseOrgao: row.proc_em_analise_orgao_count || 0,
      emAnaliseRamos: row.proc_em_analise_ramos_count || 0,
      notificado: row.proc_notificado_count || 0,
      reprovado: row.proc_reprovado_count || 0,
    },
    licenses: (row.lic_validas_count || 0) + (row.lic_proximo_venc_count || 0), // Active = valid + near expiry
    licenseBreakdown: {
      validas: row.lic_validas_count || 0,
      proximoVencimento: row.lic_proximo_venc_count || 0,
      foraValidade: row.lic_fora_validade_count || 0,
      proximaDataVencimento: row.lic_proxima_data_vencimento || null,
    },
    demands: {
      completed: row.demands_completed,
      inProgress: row.demands_in_progress,
      notStarted: row.demands_not_started,
      cancelled: row.demands_cancelled,
    },
    demandsByCollaborator: {
      celine: row.demands_celine || 0,
      gabi: row.demands_gabi || 0,
      darley: row.demands_darley || 0,
      vanessa: row.demands_vanessa || 0,
    },
    collaborators: {
      celine: row.collaborator_celine,
      gabi: row.collaborator_gabi,
      darley: row.collaborator_darley,
      vanessa: row.collaborator_vanessa,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

// Convert Client to database row format
const clientToDbRow = (client: Partial<ClientFormData>) => {
  const row: any = {};
  
  if (client.name !== undefined) row.name = client.name;
  if (client.initials !== undefined) row.initials = client.initials;
  if (client.logoUrl !== undefined) row.logo_url = client.logoUrl || null;
  if (client.isPriority !== undefined) row.is_priority = client.isPriority;
  if (client.isActive !== undefined) row.is_active = client.isActive;
  if (client.isChecked !== undefined) row.is_checked = client.isChecked;
  if (client.order !== undefined) row.display_order = client.order;
  // Note: processes is calculated from processBreakdown, don't write directly
  if (client.processBreakdown !== undefined) {
    row.proc_total_count = client.processBreakdown.total;
    row.proc_deferido_count = client.processBreakdown.deferido;
    row.proc_em_analise_orgao_count = client.processBreakdown.emAnaliseOrgao;
    row.proc_em_analise_ramos_count = client.processBreakdown.emAnaliseRamos;
    row.proc_notificado_count = client.processBreakdown.notificado;
    row.proc_reprovado_count = client.processBreakdown.reprovado;
  }
  if (client.licenseBreakdown !== undefined) {
    row.lic_validas_count = client.licenseBreakdown.validas;
    row.lic_proximo_venc_count = client.licenseBreakdown.proximoVencimento;
    row.lic_fora_validade_count = client.licenseBreakdown.foraValidade;
    row.lic_proxima_data_vencimento = client.licenseBreakdown.proximaDataVencimento;
  }
  if (client.demands !== undefined) {
    row.demands_completed = client.demands.completed;
    row.demands_in_progress = client.demands.inProgress;
    row.demands_not_started = client.demands.notStarted;
    row.demands_cancelled = client.demands.cancelled;
  }
  if (client.demandsByCollaborator !== undefined) {
    row.demands_celine = client.demandsByCollaborator.celine;
    row.demands_gabi = client.demandsByCollaborator.gabi;
    row.demands_darley = client.demandsByCollaborator.darley;
    row.demands_vanessa = client.demandsByCollaborator.vanessa;
  }
  if (client.collaborators !== undefined) {
    row.collaborator_celine = client.collaborators.celine;
    row.collaborator_gabi = client.collaborators.gabi;
    row.collaborator_darley = client.collaborators.darley;
    row.collaborator_vanessa = client.collaborators.vanessa;
  }
  
  return row;
};

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedClients, setHighlightedClients] = useState<Set<string>>(new Set());

  // Fetch clients from database
  const fetchClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      
      setClients(data?.map(dbRowToClient) || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const activeClients = clients
    .filter(c => c.isActive)
    .sort((a, b) => a.order - b.order);

  const addClient = useCallback(async (data: ClientFormData) => {
    try {
      const newClient = {
        ...data,
        initials: data.initials || generateInitials(data.name),
        collaborators: data.collaborators || DEFAULT_COLLABORATORS,
      };
      
      const { error } = await supabase
        .from('clients')
        .insert(clientToDbRow(newClient));
      
      if (error) throw error;
      
      await fetchClients();
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Erro ao adicionar cliente');
    }
  }, [fetchClients]);

  const updateClient = useCallback(async (id: string, data: Partial<ClientFormData>) => {
    try {
      // Update local state immediately for responsiveness
      setClients(prev => prev.map(client => {
        if (client.id === id) {
          return {
            ...client,
            ...data,
            initials: data.initials || (data.name ? generateInitials(data.name) : client.initials),
            updatedAt: new Date().toISOString(),
          };
        }
        return client;
      }));

      // Then sync to database
      const { error } = await supabase
        .from('clients')
        .update(clientToDbRow(data))
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Erro ao atualizar cliente');
      // Refetch to restore correct state
      await fetchClients();
    }
  }, [fetchClients]);

  const deleteClient = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setClients(prev => prev.filter(client => client.id !== id));
      setHighlightedClients(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Erro ao excluir cliente');
    }
  }, []);

  const deleteSelectedClients = useCallback(async (ids: string[]) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
      
      setClients(prev => prev.filter(client => !ids.includes(client.id)));
      setHighlightedClients(prev => {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      });
    } catch (error) {
      console.error('Error deleting clients:', error);
      toast.error('Erro ao excluir clientes');
    }
  }, []);

  const clearAllClients = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (error) throw error;
      
      setClients([]);
      setHighlightedClients(new Set());
    } catch (error) {
      console.error('Error clearing clients:', error);
      toast.error('Erro ao limpar clientes');
    }
  }, []);

  const toggleClientActive = useCallback((id: string) => {
    const client = clients.find(c => c.id === id);
    if (client) {
      updateClient(id, { isActive: !client.isActive });
    }
  }, [clients, updateClient]);

  const togglePriority = useCallback((id: string) => {
    const client = clients.find(c => c.id === id);
    if (client) {
      updateClient(id, { isPriority: !client.isPriority });
    }
  }, [clients, updateClient]);

  const toggleChecked = useCallback((id: string) => {
    const client = clients.find(c => c.id === id);
    if (client) {
      updateClient(id, { isChecked: !client.isChecked });
    }
  }, [clients, updateClient]);

  const toggleCollaborator = useCallback((id: string, collaborator: keyof Client['collaborators']) => {
    const client = clients.find(c => c.id === id);
    if (client) {
      updateClient(id, { 
        collaborators: {
          ...client.collaborators,
          [collaborator]: !client.collaborators[collaborator],
        }
      });
    }
  }, [clients, updateClient]);

  const toggleHighlight = useCallback((id: string) => {
    setHighlightedClients(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearHighlights = useCallback(() => {
    setHighlightedClients(new Set());
  }, []);

  const getClient = useCallback((id: string) => {
    return clients.find(c => c.id === id);
  }, [clients]);

  const reorderClients = useCallback(async () => {
    const sorted = [...clients].sort((a, b) => a.order - b.order);
    const updates = sorted.map((client, index) => ({
      id: client.id,
      display_order: index + 1,
    }));
    
    try {
      for (const update of updates) {
        await supabase
          .from('clients')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
      await fetchClients();
    } catch (error) {
      console.error('Error reordering clients:', error);
      toast.error('Erro ao reordenar clientes');
    }
  }, [clients, fetchClients]);

  const moveClient = useCallback(async (id: string, direction: 'up' | 'down') => {
    const sorted = [...clients].sort((a, b) => a.order - b.order);
    const currentIndex = sorted.findIndex(c => c.id === id);
    
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    
    const currentOrder = sorted[currentIndex].order;
    const targetOrder = sorted[targetIndex].order;
    
    try {
      await supabase
        .from('clients')
        .update({ display_order: targetOrder })
        .eq('id', id);
      
      await supabase
        .from('clients')
        .update({ display_order: currentOrder })
        .eq('id', sorted[targetIndex].id);
      
      await fetchClients();
    } catch (error) {
      console.error('Error moving client:', error);
      toast.error('Erro ao mover cliente');
    }
  }, [clients, fetchClients]);

  const moveClientToPosition = useCallback(async (id: string, newPosition: number) => {
    const sorted = [...clients].sort((a, b) => a.order - b.order);
    const currentIndex = sorted.findIndex(c => c.id === id);
    
    if (currentIndex === -1) return;
    
    const targetPosition = Math.max(1, Math.min(newPosition, sorted.length));
    const targetIndex = targetPosition - 1;
    
    if (currentIndex === targetIndex) return;
    
    const [movedClient] = sorted.splice(currentIndex, 1);
    sorted.splice(targetIndex, 0, movedClient);
    
    try {
      for (let i = 0; i < sorted.length; i++) {
        await supabase
          .from('clients')
          .update({ display_order: i + 1 })
          .eq('id', sorted[i].id);
      }
      await fetchClients();
    } catch (error) {
      console.error('Error moving client to position:', error);
      toast.error('Erro ao mover cliente');
    }
  }, [clients, fetchClients]);

  // Export data as JSON
  const exportData = useCallback(() => {
    return JSON.stringify(clients, null, 2);
  }, [clients]);

  // Import data from JSON
  const importData = useCallback(async (jsonData: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!Array.isArray(parsed)) return false;
      
      // Clear existing and insert new
      await clearAllClients();
      
      for (const client of parsed) {
        const newClient: ClientFormData = {
          name: client.name,
          initials: client.initials || generateInitials(client.name),
          logoUrl: client.logoUrl,
          isPriority: client.isPriority || false,
          isActive: client.isActive ?? true,
          isChecked: client.isChecked || false,
          order: client.order || 1,
          processes: client.processes || 0,
          processBreakdown: client.processBreakdown || DEFAULT_PROCESS_BREAKDOWN,
          licenses: client.licenses || 0,
          licenseBreakdown: client.licenseBreakdown || DEFAULT_LICENSE_BREAKDOWN,
          demands: client.demands || { completed: 0, inProgress: 0, notStarted: 0, cancelled: 0 },
          demandsByCollaborator: client.demandsByCollaborator || DEFAULT_COLLABORATOR_DEMAND_COUNTS,
          collaborators: client.collaborators || DEFAULT_COLLABORATORS,
        };
        await supabase
          .from('clients')
          .insert(clientToDbRow(newClient));
      }
      
      await fetchClients();
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }, [clearAllClients, fetchClients]);

  // Default companies list
  const DEFAULT_COMPANIES = [
    'PHS DA MATA', 'SEARA', 'RODOBENS', 'COCATREL', 'COROMANDEL', 'USIMEC', 
    'UBERSERRA', 'AGUAS CLARAS', 'AGUAS VIRTUOSAS', 'BRADO', 'CENTRAL PARK',
    'CLEMENTINO', 'CONSÓRCIO LOG', 'COOXUPE', 'COOPERCAM', 'COPERCITRUS',
    'COPLACANA', 'COPRAM', 'COPROCAFE', 'DATERRA', 'DOIS REINOS', 'ECOLAB',
    'FRUM', 'IPANEMA', 'IRMAOS GONÇALVES', 'LAVORO', 'LIDER', 'MARCHESAN',
    'MARTINS ATACADISTA', 'MENDONÇA ADVOGADOS', 'MONTE ALEGRE', 'NUTRADE',
    'OURO FINO', 'PDCA', 'SAAEJ', 'SERTANEJO', 'TECHAGRO', 'TRANSCAFF', 'VERSATO'
  ];

  // Reset to default companies
  const resetToDefault = useCallback(async () => {
    try {
      // Clear all existing clients
      await clearAllClients();
      
      // Insert default companies
      for (let i = 0; i < DEFAULT_COMPANIES.length; i++) {
        const name = DEFAULT_COMPANIES[i];
        const newClient = {
          name,
          initials: generateInitials(name),
          logo_url: null,
          is_priority: false,
          is_active: true,
          display_order: i + 1,
          processes: 0,
          licenses: 0,
          demands_completed: 0,
          demands_in_progress: 0,
          demands_not_started: 0,
          demands_cancelled: 0,
          collaborator_celine: false,
          collaborator_gabi: false,
          collaborator_darley: false,
          collaborator_vanessa: false,
        };
        
        await supabase.from('clients').insert(newClient);
      }
      
      await fetchClients();
      toast.success('Empresas padrão restauradas com sucesso!');
    } catch (error) {
      console.error('Error resetting to default:', error);
      toast.error('Erro ao restaurar empresas padrão');
    }
  }, [clearAllClients, fetchClients]);

  return (
    <ClientContext.Provider value={{
      clients,
      activeClients,
      highlightedClients,
      isLoading,
      addClient,
      updateClient,
      deleteClient,
      deleteSelectedClients,
      clearAllClients,
      toggleClientActive,
      togglePriority,
      toggleChecked,
      toggleCollaborator,
      toggleHighlight,
      clearHighlights,
      getClient,
      moveClient,
      moveClientToPosition,
      reorderClients,
      exportData,
      importData,
      resetToDefault,
      refetch: fetchClients,
    }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClients() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClients must be used within a ClientProvider');
  }
  return context;
}
