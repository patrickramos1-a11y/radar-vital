import { useState } from 'react';
import { ThumbsUp, Star, Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeliverableRating, RatingType, summarizeRatings } from '@/hooks/useDeliverableRatings';
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Props {
  deliverableId: string;
  ratings: DeliverableRating[];
  currentUser: string;
  disabled?: boolean;
  compact?: boolean;
  onRate: (deliverableId: string, type: RatingType, value: number) => void;
  onRemove: (deliverableId: string) => void;
}

export function DeliverableRatingControl({ deliverableId, ratings, currentUser, disabled, compact = false, onRate, onRemove }: Props) {
  const { isAdmin } = useAuth();
  const [compactOpen, setCompactOpen] = useState(false);
  const { thumbs, stars, superstars, score } = summarizeRatings(ratings);
  const mine = ratings.find(r => r.rater_name.toLowerCase() === currentUser.toLowerCase());
  const locked = disabled || !isAdmin;

  const handleStar = (n: number) => {
    if (locked) return;
    if (mine?.rating_type === 'star' && mine.value === n) onRemove(deliverableId);
    else onRate(deliverableId, 'star', n);
  };
  const handleThumbs = () => {
    if (locked) return;
    if (mine?.rating_type === 'thumbs') onRemove(deliverableId);
    else onRate(deliverableId, 'thumbs', 1);
  };
  const handleSuper = () => {
    if (locked) return;
    if (mine?.rating_type === 'superstar') onRemove(deliverableId);
    else onRate(deliverableId, 'superstar', 10);
  };

  const isMineStar = mine?.rating_type === 'star';

  if (compact) {
    return (
      <div className="relative flex min-h-8 items-center gap-1.5 text-[10px]">
        {thumbs > 0 && <span className="flex items-center gap-0.5 text-emerald-700"><ThumbsUp className="h-3 w-3" />{thumbs}</span>}
        {stars > 0 && <span className="flex items-center gap-0.5 text-amber-700"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{stars}</span>}
        {superstars > 0 && <span className="flex items-center gap-0.5 font-semibold text-orange-700"><Sparkles className="h-3 w-3" />{superstars}</span>}
        <span className="font-semibold text-amber-800">{score} pts</span>
        {isAdmin && !disabled && (
          <Popover open={compactOpen} onOpenChange={setCompactOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded border bg-background text-muted-foreground hover:bg-muted"
                title="Avaliar entrega"
              >
                <Star className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="flex w-auto items-center gap-1 p-2">
              <button onClick={handleThumbs} title="Joinha" className={cn('rounded p-1.5', mine?.rating_type === 'thumbs' ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-muted')}>
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              {[1, 2, 3, 4, 5].map(value => (
                <button key={value} onClick={() => handleStar(value)} title={`${value} estrela${value > 1 ? 's' : ''}`} className="p-0.5">
                  <Star className={cn('h-3.5 w-3.5', isMineStar && (mine?.value ?? 0) >= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
                </button>
              ))}
              <button onClick={handleSuper} title="Super Estrela" className={cn('rounded p-1.5', mine?.rating_type === 'superstar' ? 'bg-orange-100 text-orange-700' : 'hover:bg-muted')}>
                <Sparkles className="h-3.5 w-3.5" />
              </button>
            </PopoverContent>
          </Popover>
        )}
      </div>
    );
  }

  return (
    <div className={cn(!compact && 'mt-2 border-t border-dashed pt-2')}>
      {disabled && !compact && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1.5 italic">
          <Lock className="w-3 h-3" />
          A avaliação ficará disponível após a conclusão do entregável.
        </div>
      )}
      {!disabled && !isAdmin && !compact && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1.5 italic">
          <Lock className="w-3 h-3" />
          Apenas o administrador pode avaliar.
        </div>
      )}
      <div className={cn('flex items-center justify-between gap-2 flex-wrap', locked && 'opacity-50 pointer-events-none')}>

        <div className="flex items-center gap-1">
          <button onClick={handleThumbs} title="Joinha (reconhecimento — não pontua)"
            className={cn('p-1.5 rounded-md transition',
              mine?.rating_type === 'thumbs' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300' : 'text-muted-foreground hover:bg-muted')}>
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-0.5 mx-1">
            {[1, 2, 3, 4, 5].map(n => {
              const active = isMineStar && (mine?.value ?? 0) >= n;
              return (
                <button key={n} onClick={() => handleStar(n)} title={`${n} estrela${n > 1 ? 's' : ''} (${n} ponto${n > 1 ? 's' : ''})`}
                  className="p-0.5 hover:scale-110 transition">
                  <Star className={cn('w-3.5 h-3.5 transition', active ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')} />
                </button>
              );
            })}
          </div>

          <button onClick={handleSuper} title="Super Estrela (10 pontos)"
            className={cn('p-1 rounded-md transition',
              mine?.rating_type === 'superstar' ? 'bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-md ring-1 ring-amber-500' : 'text-muted-foreground hover:bg-muted')}>
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          {thumbs > 0 && (
            <span className="flex items-center gap-0.5 text-emerald-700">
              <ThumbsUp className="w-3 h-3" />{thumbs}
            </span>
          )}
          {stars > 0 && (
            <span className="flex items-center gap-0.5 text-amber-700">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{stars}
            </span>
          )}
          {superstars > 0 && (
            <span className="flex items-center gap-0.5 text-orange-700 font-semibold">
              <Sparkles className="w-3 h-3" />{superstars}
            </span>
          )}
          <span className="font-bold text-amber-800 ml-1">{score} pts</span>
        </div>
      </div>
    </div>
  );
}
