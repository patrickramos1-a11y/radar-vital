import { Star } from "lucide-react";
import { Client, calculateTotalDemands, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";
import { ChecklistButton } from "@/components/checklist/ChecklistButton";
import { CommentButton } from "@/components/comments/CommentButton";

interface ClientCardProps {
  client: Client;
  displayNumber: number;
  isSelected: boolean;
  isHighlighted: boolean;
  activeTaskCount: number;
  commentCount: number;
  onSelect: (id: string) => void;
  onHighlight: (id: string) => void;
  onTogglePriority: (id: string) => void;
  onToggleCollaborator: (id: string, collaborator: CollaboratorName) => void;
  onOpenChecklist: (id: string) => void;
  clientCount?: number;
}

// Get gradient background for active collaborators
function getCollaboratorGradient(collaborators: Client['collaborators']): string {
  const activeColors: string[] = [];
  
  COLLABORATOR_NAMES.forEach((name) => {
    if (collaborators[name]) {
      activeColors.push(COLLABORATOR_COLORS[name]);
    }
  });
  
  if (activeColors.length === 0) {
    return 'transparent';
  }
  
  if (activeColors.length === 1) {
    return activeColors[0];
  }
  
  // Create gradient with multiple colors
  const step = 100 / activeColors.length;
  const gradientStops = activeColors.map((color, i) => {
    const start = i * step;
    const end = (i + 1) * step;
    return `${color} ${start}%, ${color} ${end}%`;
  }).join(', ');
  
  return `linear-gradient(90deg, ${gradientStops})`;
}

function hasActiveCollaborators(collaborators: Client['collaborators']): boolean {
  return COLLABORATOR_NAMES.some(name => collaborators[name]);
}

// Escala de tamanho baseado na quantidade de clientes
type CardScale = 'xlarge' | 'large' | 'medium' | 'compact';

function getCardScale(clientCount: number): CardScale {
  if (clientCount <= 5) return 'xlarge';
  if (clientCount <= 15) return 'large';
  if (clientCount <= 30) return 'medium';
  return 'compact';
}

// Tamanho da fonte do nome - MUITO MAIOR para TV
function getNameFontSize(name: string, scale: CardScale): string {
  const len = name.trim().length;
  
  const baseSizes: Record<CardScale, number> = {
    xlarge: 36,
    large: 28,
    medium: 22,
    compact: 18,
  };
  
  const base = baseSizes[scale];
  
  if (len <= 8) return `${base + 8}px`;
  if (len <= 14) return `${base + 4}px`;
  if (len <= 22) return `${base}px`;
  if (len <= 30) return `${base - 4}px`;
  return `${Math.max(base - 6, 14)}px`;
}

// Estilos por escala - AUMENTADOS para TV
function getScaleStyles(scale: CardScale) {
  const styles = {
    xlarge: {
      headerPadding: 'px-3 py-2',
      numberSize: 'w-10 h-10 text-base',
      miniLogoSize: 'w-10 h-10',
      iconSize: 'w-6 h-6',
      nameAreaHeight: 'min-h-[120px]',
      indicatorText: 'text-base',
      indicatorLabel: 'text-sm',
      indicatorValue: 'text-2xl',
      chipSize: 'min-w-[32px] h-8 text-base px-2',
      collabHeight: 'h-8',
      collabText: 'text-sm',
    },
    large: {
      headerPadding: 'px-2.5 py-1.5',
      numberSize: 'w-8 h-8 text-sm',
      miniLogoSize: 'w-8 h-8',
      iconSize: 'w-5 h-5',
      nameAreaHeight: 'min-h-[100px]',
      indicatorText: 'text-sm',
      indicatorLabel: 'text-xs',
      indicatorValue: 'text-xl',
      chipSize: 'min-w-[26px] h-7 text-sm px-1.5',
      collabHeight: 'h-7',
      collabText: 'text-xs',
    },
    medium: {
      headerPadding: 'px-2 py-1',
      numberSize: 'w-6 h-6 text-xs',
      miniLogoSize: 'w-6 h-6',
      iconSize: 'w-4 h-4',
      nameAreaHeight: 'min-h-[80px]',
      indicatorText: 'text-xs',
      indicatorLabel: 'text-[10px]',
      indicatorValue: 'text-lg',
      chipSize: 'min-w-[22px] h-6 text-xs px-1',
      collabHeight: 'h-6',
      collabText: 'text-[11px]',
    },
    compact: {
      headerPadding: 'px-1.5 py-1',
      numberSize: 'w-5 h-5 text-[10px]',
      miniLogoSize: 'w-5 h-5',
      iconSize: 'w-3.5 h-3.5',
      nameAreaHeight: 'min-h-[60px]',
      indicatorText: 'text-[10px]',
      indicatorLabel: 'text-[8px]',
      indicatorValue: 'text-base',
      chipSize: 'min-w-[18px] h-5 text-[10px] px-0.5',
      collabHeight: 'h-5',
      collabText: 'text-[9px]',
    },
  };
  
  return styles[scale];
}

export function ClientCard({ 
  client, 
  displayNumber, 
  isSelected, 
  isHighlighted,
  activeTaskCount,
  commentCount,
  onSelect, 
  onHighlight,
  onTogglePriority,
  onToggleCollaborator,
  onOpenChecklist,
  clientCount = 40,
}: ClientCardProps) {
  const totalDemands = calculateTotalDemands(client.demands);
  const hasCollaborators = hasActiveCollaborators(client.collaborators);
  const collaboratorBg = getCollaboratorGradient(client.collaborators);
  
  const scale = getCardScale(clientCount);
  const styles = getScaleStyles(scale);
  const nameFontSize = getNameFontSize(client.name, scale);

  const handleNameAreaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHighlight(client.id);
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePriority(client.id);
  };

  const handleCollaboratorClick = (e: React.MouseEvent, collaborator: CollaboratorName) => {
    e.stopPropagation();
    onToggleCollaborator(client.id, collaborator);
  };

  const handleChecklistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenChecklist(client.id);
  };

  return (
    <div
      className={`client-card-compact ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
      onClick={() => onSelect(client.id)}
    >
      {/* HEADER: Número + Mini Logo + Nome truncado + Ícones */}
      <div className={`flex items-center gap-2 ${styles.headerPadding} bg-card-elevated border-b border-border`}>
        {/* Número */}
        <div className={`flex items-center justify-center rounded bg-primary text-primary-foreground font-bold shrink-0 ${styles.numberSize}`}>
          {displayNumber.toString().padStart(2, '0')}
        </div>
        
        {/* Mini Logo (se existir) */}
        {client.logoUrl && (
          <div className={`shrink-0 ${styles.miniLogoSize} rounded overflow-hidden bg-muted flex items-center justify-center`}>
            <img 
              src={client.logoUrl} 
              alt="" 
              className="w-full h-full object-contain"
            />
          </div>
        )}
        
        {/* Espaço flexível */}
        <div className="flex-1 min-w-0" />
        
        {/* Ícones: Comentários + Checklist + Estrela */}
        <div className="flex items-center gap-1 shrink-0">
          <CommentButton
            clientId={client.id}
            clientName={client.name}
            commentCount={commentCount}
          />
          <ChecklistButton
            activeCount={activeTaskCount}
            onClick={handleChecklistClick}
          />
          <button
            onClick={handleStarClick}
            className="p-0.5 rounded transition-colors hover:bg-muted/50"
            title={client.isPriority ? "Remover prioridade" : "Marcar como prioritário"}
          >
            <Star 
              className={`${styles.iconSize} transition-colors ${
                client.isPriority 
                  ? 'text-yellow-500 fill-yellow-500' 
                  : 'text-muted-foreground/40 hover:text-yellow-400'
              }`} 
            />
          </button>
        </div>
      </div>

      {/* ÁREA CENTRAL: NOME GRANDE - sempre visível, clique destaca */}
      <div 
        className={`flex items-center justify-center p-3 ${styles.nameAreaHeight} transition-colors cursor-pointer overflow-hidden`}
        style={{
          background: hasCollaborators ? collaboratorBg : 'hsl(var(--muted) / 0.3)',
        }}
        onClick={handleNameAreaClick}
        title="Clique para destacar"
      >
        <span 
          className={`font-bold text-center leading-tight line-clamp-2 ${
            hasCollaborators || isHighlighted ? 'text-white drop-shadow-md' : 'text-foreground'
          }`}
          style={{
            fontSize: nameFontSize,
            wordBreak: 'break-word',
            hyphens: 'auto',
          }}
        >
          {client.name}
        </span>
      </div>

      {/* INDICADORES: P, L, D + Chips de status - nunca overflow */}
      <div className={`${styles.headerPadding} border-t border-border bg-card-elevated/50`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* P - Processos */}
          <div className="flex flex-col items-center min-w-[28px]">
            <span className={`${styles.indicatorLabel} text-muted-foreground font-medium leading-none`}>P</span>
            <span className={`${styles.indicatorValue} font-bold text-foreground leading-tight`}>{client.processes}</span>
          </div>

          {/* L - Licenças */}
          <div className="flex flex-col items-center min-w-[28px]">
            <span className={`${styles.indicatorLabel} text-muted-foreground font-medium leading-none`}>L</span>
            <span className={`${styles.indicatorValue} font-bold text-foreground leading-tight`}>{client.licenses}</span>
          </div>

          {/* D - Demandas */}
          <div className="flex flex-col items-center min-w-[28px]">
            <span className={`${styles.indicatorLabel} text-muted-foreground font-medium leading-none`}>D</span>
            <span className={`${styles.indicatorValue} font-bold text-foreground leading-tight`}>{totalDemands}</span>
          </div>

          {/* Chips de status - flex-wrap para não estourar */}
          <div className="flex items-center gap-1.5 flex-wrap flex-1 justify-end">
            <DemandChip status="completed" count={client.demands.completed} scale={scale} />
            <DemandChip status="in-progress" count={client.demands.inProgress} scale={scale} />
            <DemandChip status="not-started" count={client.demands.notStarted} scale={scale} />
            <DemandChip status="cancelled" count={client.demands.cancelled} scale={scale} />
          </div>
        </div>
      </div>

      {/* COLABORADORES: 4 botões na base - SEMPRE VISÍVEIS */}
      <div className="grid grid-cols-4 border-t border-border shrink-0">
        {COLLABORATOR_NAMES.map((name) => (
          <CollaboratorButton
            key={name}
            name={name}
            isActive={client.collaborators[name]}
            onClick={(e) => handleCollaboratorClick(e, name)}
            scale={scale}
          />
        ))}
      </div>
    </div>
  );
}

interface DemandChipProps {
  status: 'completed' | 'in-progress' | 'not-started' | 'cancelled';
  count: number;
  scale: CardScale;
}

function DemandChip({ status, count, scale }: DemandChipProps) {
  const statusColors = {
    'completed': 'bg-green-600',
    'in-progress': 'bg-emerald-400', 
    'not-started': 'bg-gray-400',
    'cancelled': 'bg-red-500',
  };
  
  const sizeClasses: Record<CardScale, string> = {
    xlarge: 'min-w-[36px] h-9 px-2 text-lg',
    large: 'min-w-[28px] h-7 px-1.5 text-sm',
    medium: 'min-w-[22px] h-6 px-1 text-xs',
    compact: 'min-w-[18px] h-5 px-0.5 text-[10px]',
  };
  
  return (
    <div className={`flex items-center justify-center rounded font-bold text-white ${statusColors[status]} ${sizeClasses[scale]}`}>
      {count}
    </div>
  );
}

interface CollaboratorButtonProps {
  name: CollaboratorName;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
  scale: CardScale;
}

function CollaboratorButton({ name, isActive, onClick, scale }: CollaboratorButtonProps) {
  const color = COLLABORATOR_COLORS[name];
  const initials = name.slice(0, 2).toUpperCase();
  
const heightClasses: Record<CardScale, string> = {
    xlarge: 'h-10',
    large: 'h-8',
    medium: 'h-7',
    compact: 'h-6',
  };
  
  const textClasses: Record<CardScale, string> = {
    xlarge: 'text-base',
    large: 'text-sm',
    medium: 'text-xs',
    compact: 'text-[10px]',
  };
  
  return (
    <button
      onClick={onClick}
      className={`${heightClasses[scale]} w-full transition-all hover:opacity-70 flex items-center justify-center`}
      style={{ 
        backgroundColor: color,
        opacity: isActive ? 1 : 0.25,
      }}
      title={`${name.charAt(0).toUpperCase() + name.slice(1)} - Clique para ${isActive ? 'desativar' : 'ativar'}`}
    >
      <span className={`${textClasses[scale]} font-bold text-white leading-none`}>{initials}</span>
    </button>
  );
}
