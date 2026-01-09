import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Client, ClientFormData, generateInitials } from '@/types/client';

const STORAGE_KEY = 'painel-ac-clients';

// Dados iniciais para demonstração
const initialClients: Client[] = Array.from({ length: 40 }, (_, i) => {
  const names = [
    "Mineração Vale Verde", "Construtora Horizonte", "Agropecuária Boa Terra", "Indústria Química Nova Era",
    "Energia Solar Brasil", "Frigorífico Bom Corte", "Logística Expressa", "Cerâmica Artesanal",
    "Metalúrgica Forte", "Têxtil Algodão Fino", "Plásticos Recicla", "Papel e Celulose Norte",
    "Alimentos Naturais", "Distribuidora Central", "Farmacêutica Vida", "Cosméticos Beleza Pura",
    "Petroquímica Sul", "Madeireira Floresta", "Bebidas Refrescantes", "Laticínios Campo Bom",
    "Cimento Estrutural", "Vidros Transparentes", "Borracha Flex", "Tintas ColorMix",
    "Aço Inox Premium", "Embalagens Verdes", "Transportes Rápido", "Granja Feliz",
    "Pescados do Mar", "Fertilizantes Terra", "Ração Animal Top", "Couro Natural",
    "Móveis Rustic", "Eletrônicos Tech", "Confecções Moda", "Calçados Confort",
    "Joias Brilhante", "Perfumes Essence", "Sabões Limpo", "Químicos Industriais"
  ];
  const name = names[i] || `Cliente ${i + 1}`;
  const priorityIndices = [0, 2, 8, 14, 16, 24, 30, 35];
  
  return {
    id: `client-${i + 1}`,
    name,
    initials: generateInitials(name),
    isPriority: priorityIndices.includes(i),
    isActive: true,
    order: i + 1,
    processes: Math.floor(Math.random() * 15) + 1,
    licenses: Math.floor(Math.random() * 10) + 1,
    demands: {
      completed: Math.floor(Math.random() * 20) + 5,
      inProgress: Math.floor(Math.random() * 8) + 1,
      notStarted: Math.floor(Math.random() * 5),
      cancelled: Math.floor(Math.random() * 3),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
});

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
  toggleHighlight: (id: string) => void;
  clearHighlights: () => void;
  getClient: (id: string) => Client | undefined;
  moveClient: (id: string, direction: 'up' | 'down') => void;
  moveClientToPosition: (id: string, newPosition: number) => void;
  reorderClients: () => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return initialClients;
      }
    }
    return initialClients;
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

  // Reorganiza a ordem de todos os clientes sequencialmente
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

  // Move cliente para cima ou para baixo na ordem
  const moveClient = useCallback((id: string, direction: 'up' | 'down') => {
    setClients(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const currentIndex = sorted.findIndex(c => c.id === id);
      
      if (currentIndex === -1) return prev;
      
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (targetIndex < 0 || targetIndex >= sorted.length) return prev;
      
      // Swap orders
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

  // Move cliente para uma posição específica
  const moveClientToPosition = useCallback((id: string, newPosition: number) => {
    setClients(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const currentIndex = sorted.findIndex(c => c.id === id);
      
      if (currentIndex === -1) return prev;
      
      // Limitar a posição entre 1 e o total de clientes
      const targetPosition = Math.max(1, Math.min(newPosition, sorted.length));
      const targetIndex = targetPosition - 1;
      
      if (currentIndex === targetIndex) return prev;
      
      // Remove o cliente da posição atual e insere na nova
      const [movedClient] = sorted.splice(currentIndex, 1);
      sorted.splice(targetIndex, 0, movedClient);
      
      // Reordena todos
      const reordered = sorted.map((client, index) => ({
        ...client,
        order: index + 1,
        updatedAt: new Date().toISOString(),
      }));
      
      return reordered;
    });
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
      toggleHighlight,
      clearHighlights,
      getClient,
      moveClient,
      moveClientToPosition,
      reorderClients,
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
