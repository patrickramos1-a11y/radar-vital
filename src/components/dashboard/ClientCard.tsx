import { Star, Sparkles, Building2, Plus } from "lucide-react";
import { Client } from "@/types/client";
import { Collaborator } from "@/types/collaborator";
import { ChecklistButton } from "@/components/checklist/ChecklistButton";
import { CommentButton } from "@/components/comments/CommentButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ClientCardProps {
  client: Client;
  displayNumber: number;
  isSelected: boolean;
  isHighlighted: boolean;
  activeTaskCount: number;
  commentCount: number;
  allCollaborators: Collaborator[];
  assignedCollaboratorIds: string[];
  onSelect: (id: string) => void;
  onHighlight: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onToggleCollaboratorAssignment: (clientId: string, collaboratorId: string) => void;
  onOpenChecklist: (id: string) => void;
  clientCount?: number;
  fitAll?: boolean;
}

function getCollaboratorGradient(assignedCollaborators: Collaborator[]): string {
  if (assignedCollaborators.length === 0) return 'transparent';
  if (assignedCollaborators.length === 1) return assignedCollaborators[0].color;

  const step = 100 / assignedCollaborators.length;
  const gradientStops = assignedCollaborators.map((c, i) => {
    const start = i * step;
    const end = (i + 1) * step;
    return `${c.color} ${start}%, ${c.color} ${end}%`;
  }).join(', ');

  return `linear-gradient(90deg, ${gradientStops})`;
}

function getOptimalFontSize(name: string, clientCount: number): { fontSize: string; lineHeight: string } {
  const len = name.trim().length;
  let baseSize: number;
  if (clientCount <= 4) baseSize = 36;
  else if (clientCount <= 8) baseSize = 30;
  else if (clientCount <= 12) baseSize = 26;
  else if (clientCount <= 20) baseSize = 22;
  else if (clientCount <= 30) baseSize = 18;
  else if (clientCount <= 40) baseSize = 16;
  else baseSize = 14;

  let finalSize: number;
  if (len <= 6) finalSize = baseSize + 8;
  else if (len <= 10) finalSize = baseSize + 4;
  else if (len <= 16) finalSize = baseSize;
  else if (len <= 24) finalSize = Math.max(baseSize - 2, 12);
  else finalSize = Math.max(baseSize - 4, 10);

  return { fontSize: `${finalSize}px`, lineHeight: '1.1' };
}

function getLogoAreaStyle(clientCount: number): { minHeight: string; flex: number } {
  if (clientCount <= 4) return { minHeight: '200px', flex: 1 };
  else if (clientCount <= 8) return { minHeight: '160px', flex: 1 };
  else if (clientCount <= 12) return { minHeight: '120px', flex: 1 };
  else if (clientCount <= 20) return { minHeight: '100px', flex: 1 };
  else if (clientCount <= 30) return { minHeight: '80px', flex: 1 };
  else return { minHeight: '60px', flex: 1 };
}

function getLogoMaxHeight(clientCount: number): string {
  if (clientCount <= 4) return 'max-h-48';
  else if (clientCount <= 8) return 'max-h-40';
  else if (clientCount <= 12) return 'max-h-32';
  else if (clientCount <= 20) return 'max-h-24';
  else if (clientCount <= 30) return 'max-h-20';
  else return 'max-h-16';
}

function getHeaderSizes(clientCount: number): { numberSize: string; nameSize: string; headerPadding: string } {
  if (clientCount <= 4) return { numberSize: 'w-8 h-8 text-sm', nameSize: 'text-lg', headerPadding: 'px-3 py-2' };
  else if (clientCount <= 8) return { numberSize: 'w-6 h-6 text-xs', nameSize: 'text-base', headerPadding: 'px-2 py-1.5' };
  else if (clientCount <= 12) return { numberSize: 'w-5 h-5 text-[10px]', nameSize: 'text-sm', headerPadding: 'px-2 py-1' };
  else if (clientCount <= 20) return { numberSize: 'w-4 h-4 text-[9px]', nameSize: 'text-xs', headerPadding: 'px-1.5 py-0.5' };
  else return { numberSize: 'w-4 h-4 text-[8px]', nameSize: 'text-[9px]', headerPadding: 'px-1.5 py-0.5' };
}

function getBadgeSize(clientCount: number): { size: string; fontSize: string } {
  if (clientCount <= 8) return { size: 'w-5 h-5', fontSize: 'text-[9px]' };
  else if (clientCount <= 20) return { size: 'w-4.5 h-4.5', fontSize: 'text-[8px]' };
  else if (clientCount <= 40) return { size: 'w-4 h-4', fontSize: 'text-[7px]' };
  else return { size: 'w-3.5 h-3.5', fontSize: 'text-[6px]' };
}

export function ClientCard({
  client,
  displayNumber,
  isSelected,
  isHighlighted,
  activeTaskCount,
  commentCount,
  allCollaborators,
  assignedCollaboratorIds,
  onSelect,
  onHighlight,
  onTogglePriority,
  onToggleCollaboratorAssignment,
  onOpenChecklist,
  clientCount = 40,
  fitAll = false,
}: ClientCardProps) {
  const assignedCollaborators = allCollaborators.filter(c => assignedCollaboratorIds.includes(c.id));
  const hasCollaborators = assignedCollaborators.length > 0;
  const collaboratorBg = getCollaboratorGradient(assignedCollaborators);
  const logoAreaStyle = getLogoAreaStyle(clientCount);
  const fontStyle = getOptimalFontSize(client.name, clientCount);
  const logoMaxHeight = getLogoMaxHeight(clientCount);
  const headerSizes = getHeaderSizes(clientCount);

  const handleHighlightClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHighlight(client.id);
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePriority(client.id);
  };

  const handleCollaboratorClick = (e: React.MouseEvent, collaboratorId: string) => {
    e.stopPropagation();
    onToggleCollaboratorAssignment(client.id, collaboratorId);
  };

  const handleChecklistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenChecklist(client.id);
  };

  return (
    <div
      className={`client-card-compact h-full min-h-0 min-w-0 ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
      onClick={() => onSelect(client.id)}
    >
      {/* Top right icons */}
      <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5">
        <CommentButton clientId={client.id} clientName={client.name} commentCount={commentCount} />
        <ChecklistButton activeCount={activeTaskCount} onClick={handleChecklistClick} />
        <button onClick={handleHighlightClick} className="p-0.5 rounded transition-colors hover:bg-muted/50" title={isHighlighted ? "Remover destaque" : "Destacar cliente"}>
          <Sparkles className={`w-3.5 h-3.5 transition-colors ${isHighlighted ? 'text-blue-400 fill-blue-400' : 'text-muted-foreground/40 hover:text-blue-400'}`} />
        </button>
        <button onClick={handleStarClick} className="p-0.5 rounded transition-colors hover:bg-muted/50" title={client.isPriority ? "Remover prioridade" : "Marcar como prioritário"}>
          <Star className={`w-3.5 h-3.5 transition-colors ${client.isPriority ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/40 hover:text-yellow-400'}`} />
        </button>
      </div>

      {/* Header */}
      <div className={`flex items-center gap-1.5 ${headerSizes.headerPadding} bg-card-elevated/80 border-b border-border/50`}>
        <div className={`flex items-center justify-center ${headerSizes.numberSize} rounded-md bg-primary/90 text-primary-foreground font-bold shrink-0`}>
          {displayNumber.toString().padStart(2, '0')}
        </div>
        <span className={`${headerSizes.nameSize} font-medium text-foreground truncate flex-1 pr-12`}>
          {client.name}
        </span>
      </div>

      {/* Collaborator Row */}
      <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-muted/20 border-b border-border/30">
        {assignedCollaborators.map((collab) => (
          <CollaboratorBadge
            key={collab.id}
            collaborator={collab}
            onClick={(e) => handleCollaboratorClick(e, collab.id)}
            clientCount={clientCount}
          />
        ))}
        <CollaboratorAddButton
          allCollaborators={allCollaborators}
          assignedCollaboratorIds={assignedCollaboratorIds}
          onToggle={(e, collaboratorId) => handleCollaboratorClick(e, collaboratorId)}
          clientCount={clientCount}
        />
      </div>

      {/* Logo/Name Area */}
      <div
        className={`flex flex-col items-center justify-center transition-all overflow-hidden ${fitAll ? 'p-2' : 'p-3'}`}
        style={{
          background: hasCollaborators ? collaboratorBg : (isHighlighted ? 'hsl(230 75% 62% / 0.15)' : 'hsl(var(--muted) / 0.2)'),
          ...(fitAll ? {} : { minHeight: logoAreaStyle.minHeight }),
          flex: logoAreaStyle.flex,
        }}
      >
        {client.logoUrl ? (
          <div className="flex items-center justify-center w-full h-full">
            <img src={client.logoUrl} alt={`Logo ${client.name}`} className={`${logoMaxHeight} max-w-[85%] object-contain rounded`} style={{ objectFit: 'contain', width: 'auto', height: 'auto' }} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full px-2">
            <span
              className={`font-bold text-center break-words ${hasCollaborators || isHighlighted ? 'text-white drop-shadow-md' : 'text-foreground/80'}`}
              style={{
                ...fontStyle,
                display: '-webkit-box',
                WebkitLineClamp: fitAll ? 2 : 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-word',
              }}
            >
              {client.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface CollaboratorBadgeProps {
  collaborator: Collaborator;
  onClick: (e: React.MouseEvent) => void;
  clientCount: number;
}

function CollaboratorBadge({ collaborator, onClick, clientCount }: CollaboratorBadgeProps) {
  const { size, fontSize } = getBadgeSize(clientCount);
  return (
    <button
      onClick={onClick}
      className={`${size} rounded-full transition-all hover:opacity-80 hover:scale-110 flex items-center justify-center shadow-sm ring-1 ring-background/20`}
      style={{ backgroundColor: collaborator.color }}
      title={`${collaborator.name} - Clique para remover`}
    >
      <span className={`${fontSize} font-bold text-white leading-none`}>{collaborator.initials?.charAt(0) || collaborator.name.charAt(0).toUpperCase()}</span>
    </button>
  );
}

interface CollaboratorAddButtonProps {
  allCollaborators: Collaborator[];
  assignedCollaboratorIds: string[];
  onToggle: (e: React.MouseEvent, collaboratorId: string) => void;
  clientCount: number;
}

function CollaboratorAddButton({ allCollaborators, assignedCollaboratorIds, onToggle, clientCount }: CollaboratorAddButtonProps) {
  const { size } = getBadgeSize(clientCount);
  const unassigned = allCollaborators.filter(c => !assignedCollaboratorIds.includes(c.id));

  if (unassigned.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className={`${size} rounded-full border border-dashed border-muted-foreground/30 transition-all hover:border-muted-foreground/60 hover:bg-muted/30 flex items-center justify-center`}
          title="Adicionar colaborador"
        >
          <Plus className={`${clientCount <= 8 ? 'w-3 h-3' : 'w-2.5 h-2.5'} text-muted-foreground/50`} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="end" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground px-1 mb-1">Adicionar colaborador</span>
          <div className="flex gap-1 flex-wrap">
            {unassigned.map((collab) => (
              <button
                key={collab.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(e, collab.id);
                }}
                className="w-8 h-8 rounded-full transition-all hover:opacity-80 hover:scale-110 flex items-center justify-center shadow-sm"
                style={{ backgroundColor: collab.color }}
                title={`Adicionar ${collab.name}`}
              >
                <span className="text-xs font-bold text-white">{collab.initials?.charAt(0) || collab.name.charAt(0).toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
