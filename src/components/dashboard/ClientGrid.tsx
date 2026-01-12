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

// MÁXIMO 5 COLUNAS para melhor legibilidade em TV/monitores grandes
// Cards CRESCEM quando há menos clientes
function getGridLayout(count: number): { columns: number; rows: number } {
  if (count <= 0) return { columns: 1, rows: 1 };
  if (count <= 1) return { columns: 1, rows: 1 };
  if (count <= 2) return { columns: 2, rows: 1 };
  if (count <= 3) return { columns: 3, rows: 1 };
  if (count <= 4) return { columns: 4, rows: 1 };
  if (count <= 5) return { columns: 5, rows: 1 };
  if (count <= 10) return { columns: 5, rows: 2 };
  if (count <= 15) return { columns: 5, rows: 3 };
  if (count <= 20) return { columns: 5, rows: 4 };
  if (count <= 25) return { columns: 5, rows: 5 };
  
  // Para mais de 25, sempre 5 colunas com linhas calculadas
  const rows = Math.ceil(count / 5);
  return { columns: 5, rows };
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
  const { columns } = useMemo(() => getGridLayout(clients.length), [clients.length]);

  // Cards MAIORES quando há menos clientes (lógica invertida)
  const cardMinSize = useMemo(() => {
    if (clients.length <= 5) return '280px';
    if (clients.length <= 10) return '240px';
    if (clients.length <= 15) return '200px';
    if (clients.length <= 25) return '180px';
    if (clients.length <= 40) return '160px';
    return '140px';
  }, [clients.length]);

  return (
    <div 
      className="grid gap-3 p-4 w-full h-full overflow-auto transition-all duration-300"
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
