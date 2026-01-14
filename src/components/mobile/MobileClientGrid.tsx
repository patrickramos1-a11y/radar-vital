import { MobileClientCard } from "./MobileClientCard";
import { Client } from "@/types/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileClientGridProps {
  clients: Client[];
  highlightedClients: Set<string>;
  getActiveTaskCount: (clientId: string) => number;
  getCommentCount: (clientId: string) => number;
  onClientTap: (id: string) => void;
  columns?: 1 | 2;
}

export function MobileClientGrid({
  clients,
  highlightedClients,
  getActiveTaskCount,
  getCommentCount,
  onClientTap,
  columns = 1,
}: MobileClientGridProps) {
  return (
    <ScrollArea className="flex-1">
      <div 
        className={`grid gap-2 p-3 ${
          columns === 2 
            ? 'grid-cols-2' 
            : 'grid-cols-1'
        }`}
      >
        {clients.map((client, index) => (
          <MobileClientCard
            key={client.id}
            client={client}
            displayNumber={index + 1}
            isHighlighted={highlightedClients.has(client.id)}
            activeTaskCount={getActiveTaskCount(client.id)}
            commentCount={getCommentCount(client.id)}
            onTap={onClientTap}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
