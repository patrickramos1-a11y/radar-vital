import { Star, Sparkles, ListChecks, CheckCircle } from "lucide-react";
import { Client, COLLABORATOR_COLORS, COLLABORATOR_NAMES } from "@/types/client";

interface ClientRowProps {
  client: Client;
  isHighlighted: boolean;
  activeTaskCount: number;
  onTogglePriority: (id: string) => void;
  onToggleHighlight: (id: string) => void;
  onToggleChecked: (id: string) => void;
  onOpenChecklist: (id: string) => void;
  children: React.ReactNode;
}

export function ClientRow({
  client,
  isHighlighted,
  activeTaskCount,
  onTogglePriority,
  onToggleHighlight,
  onToggleChecked,
  onOpenChecklist,
  children,
}: ClientRowProps) {
  const hasActiveCollaborators = COLLABORATOR_NAMES.some(name => client.collaborators[name]);

  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg transition-all hover:shadow-md ${
        isHighlighted 
          ? 'bg-card border-4 border-red-500 ring-2 ring-red-500/30' 
          : 'bg-card border border-border hover:bg-muted/30'
      }`}
    >
      {/* Client Info */}
      <div className="flex items-center gap-3 min-w-[200px]">
        {/* Logo */}
        <div 
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0`}
          style={{
            background: hasActiveCollaborators 
              ? getCollaboratorGradient(client.collaborators) 
              : 'hsl(var(--muted) / 0.5)',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleHighlight(client.id);
          }}
        >
          {client.logoUrl ? (
            <img 
              src={client.logoUrl} 
              alt={client.name} 
              className="w-8 h-8 object-contain rounded"
            />
          ) : (
            <span className={`text-xs font-bold ${
              hasActiveCollaborators ? 'text-white' : 'text-foreground'
            }`}>
              {client.initials}
            </span>
          )}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm text-foreground truncate block">
            {client.name}
          </span>
        </div>
      </div>

      {/* Flags */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onTogglePriority(client.id)}
          className="p-1 rounded hover:bg-muted/50 transition-colors"
          title={client.isPriority ? "Remover prioridade" : "Marcar como prioritário"}
        >
          <Star 
            className={`w-4 h-4 ${
              client.isPriority 
                ? 'text-amber-500 fill-amber-500' 
                : 'text-muted-foreground/40 hover:text-amber-400'
            }`} 
          />
        </button>

        <button
          onClick={() => onToggleHighlight(client.id)}
          className="p-1 rounded hover:bg-muted/50 transition-colors"
          title={isHighlighted ? "Remover destaque" : "Destacar"}
        >
          <Sparkles 
            className={`w-4 h-4 ${
              isHighlighted 
                ? 'text-blue-500 fill-blue-500' 
                : 'text-muted-foreground/40 hover:text-blue-400'
            }`} 
          />
        </button>

        <button
          onClick={() => onOpenChecklist(client.id)}
          className="p-1 rounded hover:bg-muted/50 transition-colors relative"
          title="Abrir tarefas"
        >
          <ListChecks 
            className={`w-4 h-4 ${
              activeTaskCount > 0 
                ? 'text-emerald-500' 
                : 'text-muted-foreground/40 hover:text-emerald-400'
            }`} 
          />
          {activeTaskCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center text-white bg-emerald-500">
              {activeTaskCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onToggleChecked(client.id)}
          className="p-1 rounded hover:bg-muted/50 transition-colors"
          title={client.isChecked ? "Remover check" : "Marcar check"}
        >
          <CheckCircle 
            className={`w-4 h-4 ${
              client.isChecked 
                ? 'text-violet-500 fill-violet-500' 
                : 'text-muted-foreground/40 hover:text-violet-400'
            }`} 
          />
        </button>
      </div>

      {/* Custom Content */}
      <div className="flex-1 flex items-center gap-4">
        {children}
      </div>
    </div>
  );
}

function getCollaboratorGradient(collaborators: Client['collaborators']): string {
  const activeColors: string[] = [];
  
  COLLABORATOR_NAMES.forEach((name) => {
    if (collaborators[name]) {
      activeColors.push(COLLABORATOR_COLORS[name]);
    }
  });
  
  if (activeColors.length === 0) return 'hsl(var(--muted) / 0.5)';
  if (activeColors.length === 1) return activeColors[0];
  
  const step = 100 / activeColors.length;
  const gradientStops = activeColors.map((color, i) => {
    const start = i * step;
    const end = (i + 1) * step;
    return `${color} ${start}%, ${color} ${end}%`;
  }).join(', ');
  
  return `linear-gradient(90deg, ${gradientStops})`;
}
