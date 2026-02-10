import React, { useMemo, useEffect, useState, useRef, useCallback } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // Use ResizeObserver to measure the real container dimensions
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Calculate grid layout based on mode and settings
  const gridLayout = useMemo(() => {
    if (fitAllLocked) {
      const clientCount = clients.length;
      if (clientCount === 0) return { columns: 7, rows: 1, useFixedGrid: true };

      const minCardWidth = 80;
      const minCardHeight = 70;
      const gap = 8;

      const maxCols = Math.floor((containerSize.width + gap) / (minCardWidth + gap));
      const maxRows = Math.floor((containerSize.height + gap) / (minCardHeight + gap));

      let bestCols = Math.ceil(Math.sqrt(clientCount * 1.3));
      let bestRows = Math.ceil(clientCount / bestCols);

      while (bestRows > maxRows && bestCols < maxCols) {
        bestCols++;
        bestRows = Math.ceil(clientCount / bestCols);
      }

      bestCols = Math.max(Math.min(bestCols, maxCols), 4);
      bestRows = Math.max(Math.ceil(clientCount / bestCols), 1);

      return { columns: bestCols, rows: bestRows, useFixedGrid: true };
    }

    if (gridSize) {
      return { columns: gridSize.cols, rows: gridSize.rows, useFixedGrid: true };
    }

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

      return { columns: Math.max(bestCols, 4), rows: Math.max(bestRows, 1), useFixedGrid: true };
    }

    const baseColumns = Math.floor((containerSize.width + 8) / 168);
    return { columns: Math.max(Math.min(baseColumns, 6), 4), rows: null, useFixedGrid: false };
  }, [fitAllLocked, gridSize, viewMode, clients.length, containerSize]);

  // Calculate styles based on layout
  const gridStyles = useMemo((): React.CSSProperties => {
    if (fitAllLocked) {
      return {
        display: 'grid',
        gridTemplateColumns: `repeat(${gridLayout.columns}, 1fr)`,
        gridTemplateRows: `repeat(${gridLayout.rows || 1}, 1fr)`,
        overflow: 'hidden',
        height: '100%',
        maxHeight: '100%',
        width: '100%',
      };
    }

    if (gridLayout.useFixedGrid && gridLayout.rows) {
      return {
        display: 'grid',
        gridTemplateColumns: `repeat(${gridLayout.columns}, 1fr)`,
        gridTemplateRows: `repeat(${gridLayout.rows}, 1fr)`,
        overflow: 'hidden',
        height: '100%',
      };
    }

    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${gridLayout.columns}, minmax(140px, 1fr))`,
      gridAutoRows: 'auto',
      overflow: 'auto',
      height: 'auto',
    };
  }, [gridLayout, fitAllLocked]);

  const useFitAll = fitAllLocked || gridLayout.useFixedGrid;

  return (
    <div 
      ref={containerRef}
      className={`grid gap-2 p-3 w-full transition-all duration-300 ${fitAllLocked ? 'h-full' : 'h-full'}`}
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
