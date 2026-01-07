import { ClientCard } from "./ClientCard";
import { Client } from "@/types/client";

interface ClientGridProps {
  clients: Client[];
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
}

export function ClientGrid({ 
  clients, 
  selectedClientId, 
  onSelectClient,
}: ClientGridProps) {
  // Fixed grid for up to 40 clients: 8 columns x 5 rows
  return (
    <div 
      className="grid gap-2 p-3 w-full h-full overflow-hidden"
      style={{ 
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(5, 1fr)',
      }}
    >
      {clients.slice(0, 40).map((client, index) => (
        <ClientCard
          key={client.id}
          client={client}
          displayNumber={index + 1}
          isSelected={selectedClientId === client.id}
          onSelect={onSelectClient}
        />
      ))}
    </div>
  );
}
