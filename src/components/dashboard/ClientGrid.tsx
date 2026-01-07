import { ClientCard, ClientData } from "./ClientCard";

interface ClientGridProps {
  clients: ClientData[];
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
  compact?: boolean;
}

export function ClientGrid({ 
  clients, 
  selectedClientId, 
  onSelectClient,
  compact 
}: ClientGridProps) {
  // Calculate optimal grid sizing based on client count
  const count = clients.length;
  const isCompact = compact || count > 20;
  
  const getMinWidth = () => {
    if (count <= 6) return "320px";
    if (count <= 12) return "280px";
    if (count <= 24) return "240px";
    return "200px";
  };

  return (
    <div 
      className="grid gap-3 p-4 w-full h-full overflow-hidden auto-rows-fr"
      style={{ 
        gridTemplateColumns: `repeat(auto-fit, minmax(${getMinWidth()}, 1fr))`,
      }}
    >
      {clients.map((client) => (
        <ClientCard
          key={client.id}
          client={client}
          isSelected={selectedClientId === client.id}
          onSelect={onSelectClient}
          compact={isCompact}
        />
      ))}
    </div>
  );
}
