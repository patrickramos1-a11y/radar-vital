import { Client, CollaboratorName } from "@/types/client";
import { Task, TaskFormData } from "@/types/task";
import { MobileActionCard } from "./MobileActionCard";

interface MobileClientGridNewProps {
  clients: Client[];
  highlightedClients: Set<string>;
  getActiveTaskCount: (clientId: string) => number;
  getCommentCount: (clientId: string) => number;
  getTasksForClient: (clientId: string) => Task[];
  onClientTap: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onToggleHighlight: (id: string) => void;
  onToggleCollaborator: (id: string, collaborator: CollaboratorName) => void;
  onOpenComments: (id: string) => void;
  onOpenJackbox: (id: string) => void;
}

export function MobileClientGridNew({
  clients,
  highlightedClients,
  getActiveTaskCount,
  getCommentCount,
  getTasksForClient,
  onClientTap,
  onTogglePriority,
  onToggleHighlight,
  onToggleCollaborator,
  onOpenComments,
  onOpenJackbox,
}: MobileClientGridNewProps) {
  // Responsive grid: 2 columns on mobile
  // Last item spans full width if odd number of clients
  const isOddCount = clients.length % 2 !== 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-2 gap-2.5 p-3 pb-24">
        {clients.map((client, index) => {
          const isLastItem = index === clients.length - 1;
          const shouldSpanFull = isLastItem && isOddCount;
          
          return (
            <div 
              key={client.id}
              className={shouldSpanFull ? 'col-span-2' : ''}
            >
              <MobileActionCard
                client={client}
                isHighlighted={highlightedClients.has(client.id)}
                activeTaskCount={getActiveTaskCount(client.id)}
                commentCount={getCommentCount(client.id)}
                tasks={getTasksForClient(client.id)}
                onTap={onClientTap}
                onTogglePriority={onTogglePriority}
                onToggleHighlight={onToggleHighlight}
                onToggleCollaborator={onToggleCollaborator}
                onOpenComments={onOpenComments}
                onOpenJackbox={onOpenJackbox}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
