import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CollaboratorAvatar } from './CollaboratorAvatar';

interface RespOption { name: string; color: string; initials: string; }

interface CollabStats {
  openTasks: number;
  openPriorities: number;
}

interface Props {
  options: RespOption[];
  selected: string;
  onSelect: (name: string) => void;
  statsByName: Map<string, CollabStats>;
  className?: string;
}

export const TEAM_VIEW = '__EQUIPE__';

const pillClass = (selected: boolean) => cn(
  'inline-flex h-9 shrink-0 snap-start items-center gap-1.5 rounded-full border bg-card pl-1 pr-2.5 text-sm transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  selected
    ? 'border-primary bg-primary/10 font-semibold text-primary'
    : 'text-foreground hover:border-primary/40 hover:bg-muted/50',
);

/** One-line row of collaborator pills; "Equipe" first. Scrolls sideways when narrow. */
export function TeamSelector({ options, selected, onSelect, statsByName, className }: Props) {
  return (
    <div role="group" aria-label="Colaborador" className={cn('flex snap-x gap-1.5 overflow-x-auto pb-0.5', className)}>
      <button
        type="button"
        aria-pressed={selected === TEAM_VIEW}
        title="Ver toda a equipe"
        onClick={() => onSelect(TEAM_VIEW)}
        className={pillClass(selected === TEAM_VIEW)}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Users className="h-4 w-4" />
        </span>
        Equipe
      </button>

      {options.map(opt => {
        const s = statsByName.get(opt.name) ?? { openTasks: 0, openPriorities: 0 };
        const isSelected = selected.toLowerCase() === opt.name.toLowerCase();
        const open = s.openTasks + s.openPriorities;
        return (
          <button
            key={opt.name}
            type="button"
            aria-pressed={isSelected}
            title={`${opt.name}: ${s.openPriorities} prioridade(s) e ${s.openTasks} tarefa(s) em aberto`}
            onClick={() => onSelect(opt.name)}
            className={pillClass(isSelected)}
          >
            <CollaboratorAvatar name={opt.name} color={opt.color} initials={opt.initials} size={28} />
            {opt.name}
            {open > 0 && (
              <span className={cn(
                'rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}>
                {open}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
