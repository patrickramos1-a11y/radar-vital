import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CollaboratorAvatar } from './CollaboratorAvatar';

interface RespOption { name: string; color: string; initials: string; }

interface CollabStats {
  openTasks: number;
  openPriorities: number;
  score: number;
}

interface Props {
  options: RespOption[];
  selected: string;
  onSelect: (name: string) => void;
  statsByName: Map<string, CollabStats>;
}

export const TEAM_VIEW = '__EQUIPE__';

export function TeamSelector({ options, selected, onSelect, statsByName }: Props) {
  return (
    <section className="rounded-2xl border bg-card/70 p-3 shadow-sm backdrop-blur-sm">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
        <button
          type="button"
          title="Ver toda a equipe"
          onClick={() => onSelect(TEAM_VIEW)}
          className={cn(
            'group flex min-h-[116px] flex-col items-center justify-center gap-2 rounded-xl border bg-background p-3 text-center transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md',
            selected === TEAM_VIEW && 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
          )}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm ring-2 ring-primary/15">
            <Users className="h-8 w-8" />
          </span>
          <span className="max-w-full truncate text-sm font-semibold text-foreground">Equipe</span>
        </button>

        {options.map(opt => {
          const s = statsByName.get(opt.name) || { openTasks: 0, openPriorities: 0, score: 0 };
          const isSelected = selected.toLowerCase() === opt.name.toLowerCase();
          return (
            <button
              key={opt.name}
              type="button"
              title={`${opt.name}: ${s.openTasks} tarefa(s), ${s.openPriorities} prioridade(s), ${s.score} ponto(s)`}
              onClick={() => onSelect(opt.name)}
              className={cn(
                'group flex min-h-[116px] flex-col items-center justify-center gap-2 rounded-xl border bg-background p-3 text-center transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md',
                isSelected && 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
              )}
            >
              <CollaboratorAvatar
                name={opt.name}
                color={opt.color}
                initials={opt.initials}
                size={64}
                ring={isSelected}
                className="shadow-sm"
              />
              <span
                className="max-w-full truncate text-sm font-semibold text-foreground"
                style={isSelected ? { color: opt.color } : undefined}
              >
                {opt.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
