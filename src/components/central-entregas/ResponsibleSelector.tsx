import { cn } from '@/lib/utils';

interface ResponsibleOption { name: string; color: string; initials: string; }

interface Props {
  options: ResponsibleOption[];
  selected: string;
  onSelect: (name: string) => void;
}

export function ResponsibleSelector({ options, selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-card/60 backdrop-blur-sm border">
      {options.map(opt => {
        const isSelected = selected.toLowerCase() === opt.name.toLowerCase()
          || opt.name.toLowerCase().includes(selected.toLowerCase());
        return (
          <button
            key={opt.name}
            onClick={() => onSelect(opt.name)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-sm font-medium',
              isSelected
                ? 'shadow-md scale-[1.02]'
                : 'bg-background/50 border-border hover:bg-background'
            )}
            style={isSelected ? { backgroundColor: `${opt.color}22`, borderColor: opt.color, color: opt.color } : {}}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: opt.color }}
            >
              {opt.initials}
            </span>
            {opt.name}
          </button>
        );
      })}
    </div>
  );
}
