import { ThumbsUp, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeliverableRating, RatingType, ratingScore } from '@/hooks/useDeliverableRatings';

interface Props {
  deliverableId: string;
  ratings: DeliverableRating[]; // ratings for this deliverable
  currentUser: string;
  onRate: (deliverableId: string, type: RatingType, value: number) => void;
  onRemove: (deliverableId: string) => void;
}

export function DeliverableRatingControl({ deliverableId, ratings, currentUser, onRate, onRemove }: Props) {
  const totalScore = ratings.reduce((s, r) => s + ratingScore(r), 0);
  const mine = ratings.find(r => r.rater_name.toLowerCase() === currentUser.toLowerCase());

  const handleStar = (n: number) => {
    if (mine?.rating_type === 'star' && mine.value === n) {
      onRemove(deliverableId);
    } else {
      onRate(deliverableId, 'star', n);
    }
  };

  const handleThumbs = () => {
    if (mine?.rating_type === 'thumbs') onRemove(deliverableId);
    else onRate(deliverableId, 'thumbs', 1);
  };

  const handleSuper = () => {
    if (mine?.rating_type === 'superstar') onRemove(deliverableId);
    else onRate(deliverableId, 'superstar', 10);
  };

  const isMineStar = mine?.rating_type === 'star';

  return (
    <div className="mt-2 pt-2 border-t border-dashed">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={handleThumbs}
            title="Joinha (+1)"
            className={cn(
              'p-1.5 rounded-md transition',
              mine?.rating_type === 'thumbs'
                ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-0.5 mx-1">
            {[1, 2, 3, 4, 5].map(n => {
              const active = isMineStar && (mine?.value ?? 0) >= n;
              return (
                <button
                  key={n}
                  onClick={() => handleStar(n)}
                  title={`${n} estrela${n > 1 ? 's' : ''}`}
                  className="p-0.5 hover:scale-110 transition"
                >
                  <Star
                    className={cn(
                      'w-3.5 h-3.5 transition',
                      active ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'
                    )}
                  />
                </button>
              );
            })}
          </div>

          <button
            onClick={handleSuper}
            title="Super Estrela (+10)"
            className={cn(
              'p-1 rounded-md transition',
              mine?.rating_type === 'superstar'
                ? 'bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-md ring-1 ring-amber-500'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          {totalScore} <span className="text-muted-foreground font-normal">({ratings.length})</span>
        </div>
      </div>
    </div>
  );
}
