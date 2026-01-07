import { ClientCard, ClientData } from "./ClientCard";

interface ClientGridProps {
  clients: ClientData[];
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
  onLogoClick?: (id: string) => void;
}

export function ClientGrid({ 
  clients, 
  selectedClientId, 
  onSelectClient,
  onLogoClick
}: ClientGridProps) {
  // Fixed grid for 40 clients: 8 columns x 5 rows
  return (
    <div 
      className="grid gap-2 p-3 w-full h-full overflow-hidden"
      style={{ 
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(5, 1fr)',
      }}
    >
      {clients.slice(0, 40).map((client) => (
        <ClientCard
          key={client.id}
          client={client}
          isSelected={selectedClientId === client.id}
          onSelect={onSelectClient}
          onLogoClick={onLogoClick}
        />
      ))}
    </div>
  );
}
