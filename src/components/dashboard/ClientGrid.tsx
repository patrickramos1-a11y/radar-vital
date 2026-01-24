import React, { useMemo } from "react";
import { ClientCard } from "./ClientCard";
import { Client, CollaboratorName } from "@/types/client";
import { ViewMode } from "./FilterBar";

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
  viewMode: ViewMode;
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
  viewMode,
}: ClientGridProps) {
  const { columns, rows } = useMemo(() => getGridLayout(clients.length), [clients.length]);

  // Calcula o tamanho mínimo dos cards baseado na quantidade - aumentado para melhor legibilidade
  const cardMinSize = useMemo(() => {
    if (clients.length <= 4) return '200px';
    if (clients.length <= 6) return '180px';
    if (clients.length <= 12) return '160px';
    if (clients.length <= 20) return '140px';
    if (clients.length <= 30) return '120px';
    if (clients.length <= 40) return '110px';
    if (clients.length <= 60) return '100px';
    return '90px';
  }, [clients.length]);

  // For scroll mode, use 7 fixed columns (as in January 15 layout) with vertical scroll
  // For fit-all mode, calculate to fit everything without scroll
  const gridStyles = useMemo(() => {
    if (viewMode === 'scroll') {
      return {
        gridTemplateColumns: `repeat(7, minmax(160px, 1fr))`,
        gridAutoRows: 'auto',
        overflow: 'auto',
      };
    }
    // fit-all mode - use calculated grid
    return {
      gridTemplateColumns: `repeat(${columns}, minmax(${cardMinSize}, 1fr))`,
      gridAutoRows: 'minmax(auto, 1fr)',
      overflow: 'hidden',
    };
  }, [viewMode, columns, cardMinSize]);

  return (
    <div 
      className="grid gap-2 p-3 w-full h-full transition-all duration-300"
      style={gridStyles}
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
