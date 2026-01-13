import React, { useMemo } from "react";
import { ClientCard } from "./ClientCard";
import { Client, CollaboratorName } from "@/types/client";

interface ClientGridProps {
  clients: Client[];
  selectedClientId: string | null;
  highlightedClients: Set<string>;
  getActiveTaskCount: (clientId: string) => number;
  getCommentCount: (clientId: string) => number;
  onSelectClient: (id: string) => void;
  onHighlightClient: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onToggleCollaborator: (id: string, collaborator: CollaboratorName) => void;
  onOpenChecklist: (id: string) => void;
}

// Calcula o layout do grid de forma orgânica - sem limite de clientes
function getGridLayout(count: number): { columns: number; rows: number } {
  if (count <= 0) return { columns: 1, rows: 1 };
  if (count <= 2) return { columns: 2, rows: 1 };
  if (count <= 4) return { columns: 2, rows: 2 };
  if (count <= 6) return { columns: 3, rows: 2 };
  if (count <= 9) return { columns: 3, rows: 3 };
  if (count <= 12) return { columns: 4, rows: 3 };
  if (count <= 16) return { columns: 4, rows: 4 };
  if (count <= 20) return { columns: 5, rows: 4 };
  if (count <= 25) return { columns: 5, rows: 5 };
  if (count <= 30) return { columns: 6, rows: 5 };
  if (count <= 36) return { columns: 6, rows: 6 };
  if (count <= 42) return { columns: 7, rows: 6 };
  if (count <= 49) return { columns: 7, rows: 7 };
  if (count <= 56) return { columns: 8, rows: 7 };
  if (count <= 64) return { columns: 8, rows: 8 };
  if (count <= 72) return { columns: 9, rows: 8 };
  if (count <= 81) return { columns: 9, rows: 9 };
  if (count <= 90) return { columns: 10, rows: 9 };
  
  // Para mais de 90 clientes, calcula dinamicamente
  const cols = Math.ceil(Math.sqrt(count * 1.2)); // Levemente mais colunas que linhas
  const rows = Math.ceil(count / cols);
  return { columns: cols, rows };
}

export function ClientGrid({ 
  clients, 
  selectedClientId, 
  highlightedClients,
  getActiveTaskCount,
  getCommentCount,
  onSelectClient,
  onHighlightClient,
  onTogglePriority,
  onToggleCollaborator,
  onOpenChecklist,
}: ClientGridProps) {
  const { columns, rows } = useMemo(() => getGridLayout(clients.length), [clients.length]);

  // Calcula o tamanho mínimo dos cards baseado na quantidade
  const cardMinSize = useMemo(() => {
    if (clients.length <= 6) return '140px';
    if (clients.length <= 12) return '120px';
    if (clients.length <= 25) return '100px';
    if (clients.length <= 40) return '90px';
    if (clients.length <= 60) return '80px';
    return '70px';
  }, [clients.length]);

  return (
    <div 
      className="grid gap-2 p-3 w-full h-full overflow-auto transition-all duration-300"
      style={{ 
        gridTemplateColumns: `repeat(${columns}, minmax(${cardMinSize}, 1fr))`,
        gridAutoRows: 'minmax(auto, 1fr)',
      }}
    >
      {clients.map((client, index) => (
        <ClientCard
          key={client.id}
          client={client}
          displayNumber={index + 1}
          isSelected={selectedClientId === client.id}
          isHighlighted={highlightedClients.has(client.id)}
          activeTaskCount={getActiveTaskCount(client.id)}
          commentCount={getCommentCount(client.id)}
          onSelect={onSelectClient}
          onHighlight={onHighlightClient}
          onTogglePriority={onTogglePriority}
          onToggleCollaborator={onToggleCollaborator}
          onOpenChecklist={onOpenChecklist}
          clientCount={clients.length}
        />
      ))}
    </div>
  );
}
