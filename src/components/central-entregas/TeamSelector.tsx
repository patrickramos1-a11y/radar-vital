import { CollaboratorChip } from './CollaboratorChip';

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
    <div className="rounded-xl bg-card/60 backdrop-blur-sm border p-2">
      <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
        <CollaboratorChip
          name="Equipe"
          color="hsl(var(--primary))"
          isTeam
          selected={selected === TEAM_VIEW}
          onClick={() => onSelect(TEAM_VIEW)}
        />
        <div className="w-px bg-border shrink-0 mx-1" />
        {options.map(opt => {
          const s = statsByName.get(opt.name) || { openTasks: 0, openPriorities: 0, score: 0 };
          const isSelected = selected.toLowerCase() === opt.name.toLowerCase();
          return (
            <CollaboratorChip
              key={opt.name}
              name={opt.name}
              color={opt.color}
              selected={isSelected}
              openTasks={s.openTasks}
              openPriorities={s.openPriorities}
              score={s.score}
              onClick={() => onSelect(opt.name)}
            />
          );
        })}
      </div>
    </div>
  );
}
