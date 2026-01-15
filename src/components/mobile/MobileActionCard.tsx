import { useState } from "react";
import { 
  Star, 
  Sparkles, 
  MessageCircle, 
  ListChecks,
} from "lucide-react";
import { Client, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";
import { Task, TaskFormData } from "@/types/task";

interface MobileActionCardProps {
  client: Client;
  isHighlighted: boolean;
  activeTaskCount: number;
  commentCount: number;
  tasks: Task[];
  onTap: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onToggleHighlight: (id: string) => void;
  onToggleCollaborator: (id: string, collaborator: CollaboratorName) => void;
  onOpenComments: (id: string) => void;
  onOpenJackbox: (id: string) => void;
}

export function MobileActionCard({
  client,
  isHighlighted,
  activeTaskCount,
  commentCount,
  onTap,
  onTogglePriority,
  onToggleHighlight,
  onToggleCollaborator,
  onOpenComments,
  onOpenJackbox,
}: MobileActionCardProps) {
  const activeCollaborators = COLLABORATOR_NAMES.filter(name => client.collaborators[name]);
  
  // Determine border color based on highlight/collaborator
  const getBorderStyle = () => {
    if (isHighlighted) {
      return { borderColor: 'rgb(239, 68, 68)', borderWidth: '2px' };
    }
    if (activeCollaborators.length > 0) {
      return { 
        borderLeftColor: COLLABORATOR_COLORS[activeCollaborators[0]], 
        borderLeftWidth: '4px',
        borderColor: 'var(--border)',
        borderWidth: '1px',
      };
    }
    return { borderColor: 'var(--border)', borderWidth: '1px' };
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      className={`relative flex flex-col rounded-xl bg-card overflow-hidden transition-all active:scale-[0.98] ${
        isHighlighted ? 'ring-2 ring-red-500/30' : ''
      }`}
      style={getBorderStyle()}
    >
      {/* Main content - tappable to open detail */}
      <button
        onClick={() => onTap(client.id)}
        className="flex items-center gap-2.5 p-3 text-left"
      >
        {/* Logo or Initials */}
        <div className="w-11 h-11 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {client.logoUrl ? (
            <img 
              src={client.logoUrl} 
              alt={client.name} 
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-sm font-bold text-primary">
              {client.initials}
            </span>
          )}
        </div>
        
        {/* Name - full, truncated with ellipsis */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground truncate">
            {client.name}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {client.clientType}
          </p>
        </div>
      </button>

      {/* Action buttons row */}
      <div className="flex items-center justify-between px-2 pb-2">
        {/* Priority button */}
        <button
          onClick={(e) => handleAction(e, () => onTogglePriority(client.id))}
          className={`p-2 rounded-lg transition-colors ${
            client.isPriority 
              ? 'bg-amber-100 text-amber-600' 
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Star className={`w-4 h-4 ${client.isPriority ? 'fill-current' : ''}`} />
        </button>

        {/* Highlight button */}
        <button
          onClick={(e) => handleAction(e, () => onToggleHighlight(client.id))}
          className={`p-2 rounded-lg transition-colors ${
            isHighlighted 
              ? 'bg-blue-100 text-blue-600' 
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Sparkles className={`w-4 h-4 ${isHighlighted ? 'fill-current' : ''}`} />
        </button>

        {/* Jackbox button with badge */}
        <button
          onClick={(e) => handleAction(e, () => onOpenJackbox(client.id))}
          className={`relative p-2 rounded-lg transition-colors ${
            activeTaskCount > 0 
              ? 'bg-yellow-100 text-yellow-700' 
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          {activeTaskCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-yellow-500 text-white text-[10px] font-bold flex items-center justify-center">
              {activeTaskCount}
            </span>
          )}
        </button>

        {/* Comments button with badge */}
        <button
          onClick={(e) => handleAction(e, () => onOpenComments(client.id))}
          className={`relative p-2 rounded-lg transition-colors ${
            commentCount > 0 
              ? 'bg-indigo-100 text-indigo-600' 
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          {commentCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
              {commentCount}
            </span>
          )}
        </button>

        {/* Collaborator dots */}
        <div className="flex items-center gap-0.5 ml-1">
          {COLLABORATOR_NAMES.map(name => (
            <button
              key={name}
              onClick={(e) => handleAction(e, () => onToggleCollaborator(client.id, name))}
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                client.collaborators[name] 
                  ? 'ring-1 ring-white shadow-sm' 
                  : 'opacity-30'
              }`}
              style={{ backgroundColor: COLLABORATOR_COLORS[name] }}
            >
              <span className="text-[7px] font-bold text-white uppercase">
                {name.charAt(0)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Status indicator bar at bottom */}
      {(client.isPriority || isHighlighted || activeTaskCount > 0) && (
        <div className="absolute top-0 right-0 flex gap-0.5 p-1">
          {client.isPriority && (
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          )}
          {isHighlighted && (
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          )}
        </div>
      )}
    </div>
  );
}
