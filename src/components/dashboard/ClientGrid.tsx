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
  fitAllLocked: boolean;
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
  fitAllLocked,
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
    // Priority 1: fitAllLocked mode - calculate optimal fit for all clients
    if (fitAllLocked) {
      const clientCount = clients.length;
      if (clientCount === 0) return { columns: 7, rows: 1, useFixedGrid: true };

      // Minimum card dimensions for fit-all locked mode (smaller to allow more clients)
      const minCardWidth = 80;
      const minCardHeight = 70;
      const gap = 8;

      // Calculate max possible columns and rows based on container
      const maxCols = Math.floor((containerSize.width + gap) / (minCardWidth + gap));
      const maxRows = Math.floor((containerSize.height + gap) / (minCardHeight + gap));

      // Find optimal columns that fit all clients within the available rows
      let bestCols = Math.ceil(Math.sqrt(clientCount * 1.3)); // Start with slightly more columns than rows
      let bestRows = Math.ceil(clientCount / bestCols);

      // If rows exceed max, increase columns
      while (bestRows > maxRows && bestCols < maxCols) {
        bestCols++;
        bestRows = Math.ceil(clientCount / bestCols);
      }

      // Clamp to valid ranges
      bestCols = Math.max(Math.min(bestCols, maxCols), 4);
      bestRows = Math.max(Math.ceil(clientCount / bestCols), 1);

      return {
        columns: bestCols,
        rows: bestRows,
        useFixedGrid: true,
      };
    }

    // Priority 2: User selected a fixed grid size
    if (gridSize) {
      return {
        columns: gridSize.cols,
        rows: gridSize.rows,
        useFixedGrid: true,
      };
    }

    // Priority 3: Auto-calculate based on view mode
    if (viewMode === 'fit-all') {
      const clientCount = clients.length;
      if (clientCount === 0) return { columns: 7, rows: 1, useFixedGrid: false };

      const minCardWidth = 120;
      const minCardHeight = 100;
      const gap = 8;

      const maxCols = Math.floor((containerSize.width + gap) / (minCardWidth + gap));
      const maxRows = Math.floor((containerSize.height + gap) / (minCardHeight + gap));

      let bestCols = Math.ceil(Math.sqrt(clientCount * 1.2));
      let bestRows = Math.ceil(clientCount / bestCols);

      if (bestCols > maxCols) {
        bestCols = Math.max(maxCols, 4);
        bestRows = Math.ceil(clientCount / bestCols);
      }

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

    // Default: Scroll mode - responsive columns based on screen width
    const baseColumns = Math.floor((containerSize.width + 8) / 168);
    return {
      columns: Math.max(Math.min(baseColumns, 6), 4),
      rows: null,
      useFixedGrid: false,
    };
  }, [fitAllLocked, gridSize, viewMode, clients.length, containerSize]);

  // Calculate styles based on layout
  const gridStyles = useMemo((): React.CSSProperties => {
    // When fitAllLocked is active, force fixed dimensions and no overflow
    if (fitAllLocked) {
      return {
        display: 'grid',
        gridTemplateColumns: `repeat(${gridLayout.columns}, 1fr)`,
        gridTemplateRows: `repeat(${gridLayout.rows || 1}, 1fr)`,
        overflow: 'hidden',
        height: `${containerSize.height}px`,
        maxHeight: `${containerSize.height}px`,
        width: '100%',
      };
    }

    if (gridLayout.useFixedGrid && gridLayout.rows) {
      // Fixed grid - force both columns and rows
      return {
        display: 'grid',
        gridTemplateColumns: `repeat(${gridLayout.columns}, 1fr)`,
        gridTemplateRows: `repeat(${gridLayout.rows}, 1fr)`,
        overflow: 'hidden',
        height: '100%',
      };
    }

    // Scroll mode - auto rows
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${gridLayout.columns}, minmax(140px, 1fr))`,
      gridAutoRows: 'auto',
      overflow: 'auto',
      height: 'auto',
    };
  }, [gridLayout, containerSize, fitAllLocked]);

  // Determine if we should use fit-all layout
  const useFitAll = fitAllLocked || gridLayout.useFixedGrid;

  return (
    <div 
      className={`grid gap-2 p-3 w-full transition-all duration-300 ${fitAllLocked ? '' : 'h-full'}`}
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
