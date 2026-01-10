import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Client, ClientFormData, generateInitials, DEFAULT_COLLABORATORS } from '@/types/client';

const STORAGE_KEY = 'painel-ac-clients-v2'; // Versão atualizada para forçar reset com novos nomes

// Lista oficial de empresas
const OFFICIAL_COMPANIES = [
  "PHS DA MATA",
  "PLASNORT - AMAZONPET",
  "SANTA HELENA",
  "SIMETRIA / ÍCONE",
  "GUARÁ",
  "NORFRUTAS / AÇAÍ PREMIUM",
  "PARA SUPER FOODS",
  "BREVES",
  "NORSUL",
  "FLORATTA",
  "NUTRILATINO",
  "TAPAJÓS",
  "AÇAÍ VITANAT",
  "CTC",
  "DA CASA",
  "CTC - MANACAPURU",
  "FAZENDA BRASIL / BARU",
  "FLOR DE AÇAÍ",
  "LDV - J.A",
  "NATURE AMAZON",
  "XINGU",
  "TEU AÇAÍ",
  "AÇAÍ OKAY",
  "FROM AMAZÔNIA",
  "CEIBA",
  "RAJÁ",
  "KMTEC",
  "4 ELEMENTOS",
  "AÇAI KAA",
  "PRENORTE",
  "ESTRELA DALVA",
  "ARRUDÃO",
  "SC CONSTRUÇÃO",
  "P S MARTINS LOBATO",
  "VALE DO AÇAÍ",
  "100% AMAZÔNIA",
  "OYAMOTA",
  "POSTO AV. BRASIL",
  "FARIZA",
];

// Dados iniciais com as empresas oficiais - valores zerados
const createInitialClients = (): Client[] => {
  return OFFICIAL_COMPANIES.map((name, i) => ({
    id: `client-${i + 1}`,
    name,
    initials: generateInitials(name),
    isPriority: false,
    isActive: true,
    order: i + 1,
    processes: 0,
    licenses: 0,
    demands: {
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      cancelled: 0,
    },
    collaborators: {
      celine: false,
      gabi: false,
      darley: false,
      vanessa: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

interface ClientContextType {
  clients: Client[];
  activeClients: Client[];
  highlightedClients: Set<string>;
  addClient: (data: ClientFormData) => void;
  updateClient: (id: string, data: Partial<ClientFormData>) => void;
  deleteClient: (id: string) => void;
  deleteSelectedClients: (ids: string[]) => void;
  clearAllClients: () => void;
  toggleClientActive: (id: string) => void;
  togglePriority: (id: string) => void;
  toggleCollaborator: (id: string, collaborator: keyof Client['collaborators']) => void;
  toggleHighlight: (id: string) => void;
  clearHighlights: () => void;
  getClient: (id: string) => Client | undefined;
  moveClient: (id: string, direction: 'up' | 'down') => void;
  moveClientToPosition: (id: string, newPosition: number) => void;
  reorderClients: () => void;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  resetToDefault: () => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

// Migrar dados antigos que não têm collaborators
const migrateClient = (client: any): Client => {
  return {
    ...client,
    collaborators: client.collaborators || DEFAULT_COLLABORATORS,
  };
};

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map(migrateClient);
      } catch {
        return createInitialClients();
      }
    }
    return createInitialClients();
  });

  const [highlightedClients, setHighlightedClients] = useState<Set<string>>(new Set());

  // Persistir no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  const activeClients = clients
    .filter(c => c.isActive)
    .sort((a, b) => a.order - b.order);

  const addClient = useCallback((data: ClientFormData) => {
    const newClient: Client = {
      ...data,
      id: `client-${Date.now()}`,
      initials: data.initials || generateInitials(data.name),
      collaborators: data.collaborators || DEFAULT_COLLABORATORS,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setClients(prev => [...prev, newClient]);
  }, []);

  const updateClient = useCallback((id: string, data: Partial<ClientFormData>) => {
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
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(client => client.id !== id));
    setHighlightedClients(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const deleteSelectedClients = useCallback((ids: string[]) => {
    setClients(prev => prev.filter(client => !ids.includes(client.id)));
    setHighlightedClients(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  }, []);

  const clearAllClients = useCallback(() => {
    setClients([]);
    setHighlightedClients(new Set());
  }, []);

  const toggleClientActive = useCallback((id: string) => {
    setClients(prev => prev.map(client => {
      if (client.id === id) {
        return {
          ...client,
          isActive: !client.isActive,
          updatedAt: new Date().toISOString(),
        };
      }
      return client;
    }));
  }, []);

  const togglePriority = useCallback((id: string) => {
    setClients(prev => prev.map(client => {
      if (client.id === id) {
        return {
          ...client,
          isPriority: !client.isPriority,
          updatedAt: new Date().toISOString(),
        };
      }
      return client;
    }));
  }, []);

  const toggleCollaborator = useCallback((id: string, collaborator: keyof Client['collaborators']) => {
    setClients(prev => prev.map(client => {
      if (client.id === id) {
        return {
          ...client,
          collaborators: {
            ...client.collaborators,
            [collaborator]: !client.collaborators[collaborator],
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return client;
    }));
  }, []);

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

  const reorderClients = useCallback(() => {
    setClients(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      return sorted.map((client, index) => ({
        ...client,
        order: index + 1,
        updatedAt: new Date().toISOString(),
      }));
    });
  }, []);

  const moveClient = useCallback((id: string, direction: 'up' | 'down') => {
    setClients(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const currentIndex = sorted.findIndex(c => c.id === id);
      
      if (currentIndex === -1) return prev;
      
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (targetIndex < 0 || targetIndex >= sorted.length) return prev;
      
      const currentOrder = sorted[currentIndex].order;
      const targetOrder = sorted[targetIndex].order;
      
      return prev.map(client => {
        if (client.id === id) {
          return { ...client, order: targetOrder, updatedAt: new Date().toISOString() };
        }
        if (client.id === sorted[targetIndex].id) {
          return { ...client, order: currentOrder, updatedAt: new Date().toISOString() };
        }
        return client;
      });
    });
  }, []);

  const moveClientToPosition = useCallback((id: string, newPosition: number) => {
    setClients(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const currentIndex = sorted.findIndex(c => c.id === id);
      
      if (currentIndex === -1) return prev;
      
      const targetPosition = Math.max(1, Math.min(newPosition, sorted.length));
      const targetIndex = targetPosition - 1;
      
      if (currentIndex === targetIndex) return prev;
      
      const [movedClient] = sorted.splice(currentIndex, 1);
      sorted.splice(targetIndex, 0, movedClient);
      
      const reordered = sorted.map((client, index) => ({
        ...client,
        order: index + 1,
        updatedAt: new Date().toISOString(),
      }));
      
      return reordered;
    });
  }, []);

  // Export data as JSON
  const exportData = useCallback(() => {
    return JSON.stringify(clients, null, 2);
  }, [clients]);

  // Import data from JSON
  const importData = useCallback((jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) {
        setClients(parsed.map(migrateClient));
        setHighlightedClients(new Set());
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Reset to default companies
  const resetToDefault = useCallback(() => {
    setClients(createInitialClients());
    setHighlightedClients(new Set());
  }, []);

  return (
    <ClientContext.Provider value={{
      clients,
      activeClients,
      highlightedClients,
      addClient,
      updateClient,
      deleteClient,
      deleteSelectedClients,
      clearAllClients,
      toggleClientActive,
      togglePriority,
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
