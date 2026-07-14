import { cn } from '@/lib/utils';
import { CollaboratorAvatar } from './CollaboratorAvatar';
import { CheckSquare, Star, Trophy, Users } from 'lucide-react';

interface Props {
  name: string;
  color: string;
  isTeam?: boolean;
  selected: boolean;
  openTasks?: number;
  openPriorities?: number;
  score?: number;
  onClick: () => void;
}

export function CollaboratorChip({ name, color, isTeam, selected, openTasks = 0, openPriorities = 0, score = 0, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all text-left min-w-[180px]',
        selected
          ? 'shadow-md scale-[1.02] ring-2 ring-offset-1 bg-card'
          : 'bg-card/60 backdrop-blur-sm hover:bg-card hover:border-primary/40'
      )}
      style={selected ? { borderColor: color, ['--tw-ring-color' as any]: color } : {}}
    >
      {isTeam ? (
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
        >
          <Users className="w-4 h-4" />
        </div>
      ) : (
        <CollaboratorAvatar name={name} size={36} />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate" style={selected ? { color } : {}}>
          {isTeam ? 'Equipe' : name}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
          <span className="flex items-center gap-0.5"><CheckSquare className="w-3 h-3" />{openTasks}</span>
          <span className="flex items-center gap-0.5"><Star className="w-3 h-3" />{openPriorities}</span>
          {score > 0 && (
            <span className="flex items-center gap-0.5 text-amber-700 font-semibold">
              <Trophy className="w-3 h-3" />{score}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
