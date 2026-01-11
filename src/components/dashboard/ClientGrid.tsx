import React, { useMemo } from "react";
import { ClientCard } from "./ClientCard";
import { Client, CollaboratorName, ClientTask } from "@/types/client";

interface ClientGridProps {
  clients: Client[];
  selectedClientId: string | null;
  highlightedClients: Set<string>;
  clientTasks: Map<string, ClientTask[]>;
  onSelectClient: (id: string) => void;
  onHighlightClient: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onToggleCollaborator: (id: string, collaborator: CollaboratorName) => void;
  onAddTask: (clientId: string, text: string) => void;
  onToggleTask: (clientId: string, taskId: string) => void;
  onDeleteTask: (clientId: string, taskId: string) => void;
}

// Calcula o layout do grid baseado na quantidade de clientes
function getGridLayout(count: number): { columns: number; rows: number } {
  if (count <= 0) return { columns: 1, rows: 1 };
  if (count <= 4) return { columns: 2, rows: 2 };
  if (count <= 6) return { columns: 3, rows: 2 };
  if (count <= 9) return { columns: 3, rows: 3 };
  if (count <= 12) return { columns: 4, rows: 3 };
  if (count <= 16) return { columns: 4, rows: 4 };
  if (count <= 20) return { columns: 5, rows: 4 };
  if (count <= 25) return { columns: 5, rows: 5 };
  if (count <= 30) return { columns: 6, rows: 5 };
  if (count <= 35) return { columns: 7, rows: 5 };
  return { columns: 8, rows: 5 }; // Max 40
}

export function ClientGrid({ 
  clients, 
  selectedClientId, 
  highlightedClients,
  clientTasks,
  onSelectClient,
  onHighlightClient,
  onTogglePriority,
  onToggleCollaborator,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: ClientGridProps) {
  const { columns, rows } = useMemo(() => getGridLayout(clients.length), [clients.length]);

  const getTaskCount = (clientId: string) => {
    const tasks = clientTasks.get(clientId) || [];
    return tasks.filter(t => !t.completed).length;
  };

  return (
    <div 
      className="grid gap-2 p-3 w-full h-full overflow-hidden transition-all duration-300"
      style={{ 
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {clients.slice(0, 40).map((client, index) => (
        <ClientCard
          key={client.id}
          client={{ ...client, tasks: clientTasks.get(client.id) }}
          displayNumber={index + 1}
          isSelected={selectedClientId === client.id}
          isHighlighted={highlightedClients.has(client.id)}
          taskCount={getTaskCount(client.id)}
          onSelect={onSelectClient}
          onHighlight={onHighlightClient}
          onTogglePriority={onTogglePriority}
          onToggleCollaborator={onToggleCollaborator}
          onAddTask={onAddTask}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
        />
      ))}
    </div>
  );
}
