import React, { useMemo, useEffect, useState } from "react";
import { ClientCard } from "./ClientCard";
import { Client, CollaboratorName } from "@/types/client";
import { ViewMode, GridSize } from "./FilterBar";

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
  gridSize: GridSize;
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
  gridSize,
}: ClientGridProps) {
  // Track container dimensions for responsive calculations
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      // Get viewport dimensions minus header/filter bar height (approx 180px)
      const width = window.innerWidth - 280; // Subtract sidebar width
      const height = window.innerHeight - 180; // Subtract headers
      setContainerSize({ width: Math.max(width, 400), height: Math.max(height, 300) });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Calculate grid layout based on mode and settings
  const gridLayout = useMemo(() => {
    // If user selected a fixed grid size, use that
    if (gridSize) {
      return {
        columns: gridSize.cols,
        rows: gridSize.rows,
        useFixedGrid: true,
      };
    }

    // Auto-calculate based on view mode
    if (viewMode === 'fit-all') {
      // Calculate optimal columns and rows to fit all clients without scrolling
      const clientCount = clients.length;
      if (clientCount === 0) return { columns: 7, rows: 1, useFixedGrid: false };

      // Estimate card dimensions based on container size
      const minCardWidth = 120;
      const minCardHeight = 100;
      const gap = 8;

      // Calculate max possible columns based on width
      const maxCols = Math.floor((containerSize.width + gap) / (minCardWidth + gap));
      
      // Calculate max possible rows based on height
      const maxRows = Math.floor((containerSize.height + gap) / (minCardHeight + gap));

      // Find the best combination to fit all clients
      let bestCols = Math.ceil(Math.sqrt(clientCount * 1.2));
      let bestRows = Math.ceil(clientCount / bestCols);

      // Ensure we can fit within the available space
      if (bestCols > maxCols) {
        bestCols = Math.max(maxCols, 4);
        bestRows = Math.ceil(clientCount / bestCols);
      }

      // Expand columns if we have extra space
      while (bestCols < maxCols && bestRows > 1 && (bestCols * (bestRows - 1)) >= clientCount) {
        bestCols++;
        bestRows = Math.ceil(clientCount / bestCols);
      }

      return {
        columns: Math.max(bestCols, 4),
        rows: Math.max(bestRows, 1),
        useFixedGrid: true,
      };
    }

    // Scroll mode - responsive columns based on screen width
    const baseColumns = Math.floor((containerSize.width + 8) / 168); // 160px card + 8px gap
    return {
      columns: Math.max(Math.min(baseColumns, 6), 4),
      rows: null, // Auto rows for scroll
      useFixedGrid: false,
    };
  }, [gridSize, viewMode, clients.length, containerSize]);

  // Calculate styles based on layout
  const gridStyles = useMemo(() => {
    if (gridLayout.useFixedGrid && gridLayout.rows) {
      // Fixed grid - force both columns and rows
      return {
        gridTemplateColumns: `repeat(${gridLayout.columns}, 1fr)`,
        gridTemplateRows: `repeat(${gridLayout.rows}, 1fr)`,
        overflow: 'hidden',
        height: '100%',
      };
    }

    // Scroll mode - auto rows
    return {
      gridTemplateColumns: `repeat(${gridLayout.columns}, minmax(140px, 1fr))`,
      gridAutoRows: 'auto',
      overflow: 'auto',
      height: 'auto',
    };
  }, [gridLayout]);

  // Determine if we should use fit-all layout
  const useFitAll = gridLayout.useFixedGrid;

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
          fitAll={useFitAll}
        />
      ))}
    </div>
  );
}
