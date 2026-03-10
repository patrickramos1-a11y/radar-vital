import { Star } from "lucide-react";
import { Client } from "@/types/client";
import { useAuth } from "@/contexts/AuthContext";
import { useClientAssignments } from "@/hooks/useClientAssignments";

interface ClientRowProps {
  client: Client;
  isHighlighted: boolean;
  activeTaskCount?: number;
  onTogglePriority: (id: string) => void;
  onToggleHighlight: (id: string) => void;
  onToggleChecked: (id: string) => void;
  onOpenChecklist: (id: string) => void;
  children?: React.ReactNode;
}

export function ClientRow({ client, isHighlighted, activeTaskCount, children, onTogglePriority }: ClientRowProps) {
  const { collaborators: allCollaborators } = useAuth();
  const { getAssignedCollaboratorIds } = useClientAssignments();
  const assignedIds = getAssignedCollaboratorIds(client.id);
  const activeCollaborators = allCollaborators.filter(c => assignedIds.includes(c.id));

  return (
    <div className={`border rounded-lg p-3 bg-card ${isHighlighted ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-border'}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-6 h-6 rounded bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
          {client.order}
        </div>
        {client.logoUrl ? (
          <img src={client.logoUrl} alt="" className="w-8 h-8 object-contain rounded" />
        ) : (
          <div className="w-8 h-8 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
            {client.initials}
          </div>
        )}
        <span className="font-medium text-sm text-foreground flex-1 truncate">{client.name}</span>
        
        <button onClick={() => onTogglePriority(client.id)}>
          <Star className={`w-4 h-4 ${client.isPriority ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
        </button>
        
        {activeCollaborators.length > 0 && (
          <div className="flex gap-0.5">
            {activeCollaborators.map(collab => (
              <div key={collab.id} className="w-4 h-4 rounded-full text-white text-[7px] font-bold flex items-center justify-center" style={{ backgroundColor: collab.color }}>
                {collab.name[0].toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
