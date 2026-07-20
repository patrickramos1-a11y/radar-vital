import { ThumbsUp, Star, Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeliverableRating, RatingType, summarizeRatings } from '@/hooks/useDeliverableRatings';

interface Props {
  deliverableId: string;
  ratings: DeliverableRating[];
  currentUser: string;
  disabled?: boolean;
  onRate: (deliverableId: string, type: RatingType, value: number) => void;
  onRemove: (deliverableId: string) => void;
}

export function DeliverableRatingControl({ deliverableId, ratings, currentUser, disabled, onRate, onRemove }: Props) {
  const { thumbs, stars, superstars, score } = summarizeRatings(ratings);
  const mine = ratings.find(r => r.rater_name.toLowerCase() === currentUser.toLowerCase());

  const handleStar = (n: number) => {
    if (disabled) return;
    if (mine?.rating_type === 'star' && mine.value === n) onRemove(deliverableId);
    else onRate(deliverableId, 'star', n);
  };
  const handleThumbs = () => {
    if (disabled) return;
    if (mine?.rating_type === 'thumbs') onRemove(deliverableId);
    else onRate(deliverableId, 'thumbs', 1);
  };
  const handleSuper = () => {
    if (disabled) return;
    if (mine?.rating_type === 'superstar') onRemove(deliverableId);
    else onRate(deliverableId, 'superstar', 10);
  };

  const isMineStar = mine?.rating_type === 'star';

  return (
    <div className="mt-2 pt-2 border-t border-dashed">
      {disabled && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1.5 italic">
          <Lock className="w-3 h-3" />
          A avaliação ficará disponível após a conclusão do entregável.
        </div>
      )}
      <div className={cn('flex items-center justify-between gap-2 flex-wrap', disabled && 'opacity-50 pointer-events-none')}>
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
