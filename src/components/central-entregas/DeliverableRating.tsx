import { useState } from 'react';
import { ThumbsUp, Star, Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeliverableRating, RatingType, summarizeRatings } from '@/hooks/useDeliverableRatings';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  deliverableId: string;
  ratings: DeliverableRating[];
  currentUser: string;
  disabled?: boolean;
  compact?: boolean;
  onRate: (deliverableId: string, type: RatingType, value: number) => Promise<boolean> | boolean;
  onRemove: (deliverableId: string) => Promise<boolean> | boolean;
}

export function DeliverableRatingControl({ deliverableId, ratings, currentUser, disabled, compact = false, onRate, onRemove }: Props) {
  const { isAdmin } = useAuth();
  const [saving, setSaving] = useState(false);
  const { thumbs, stars, superstars, score } = summarizeRatings(ratings);
  const mine = ratings.find(r => r.rater_name.toLowerCase() === currentUser.toLowerCase());
  const locked = disabled || !isAdmin;

  const submit = async (type: RatingType, value: number) => {
    if (locked || saving) return;
    setSaving(true);
    try {
      if (mine?.rating_type === type && mine.value === value) await onRemove(deliverableId);
      else await onRate(deliverableId, type, value);
    } finally {
      setSaving(false);
    }
  };
  const handleStar = (n: number) => submit('star', n);
  const handleThumbs = () => submit('thumbs', 1);
  const handleSuper = () => submit('superstar', 10);

  const isMineStar = mine?.rating_type === 'star';

  if (compact) {
    return (
      <div className="flex min-h-8 flex-wrap items-center gap-x-1 gap-y-0.5 text-[10px]" aria-label="Avaliação da entrega">
        <button
          type="button"
          onClick={handleThumbs}
          disabled={locked || saving}
          aria-label="Avaliar com joinha"
          aria-pressed={mine?.rating_type === 'thumbs'}
          title="Joinha (sem pontos)"
          className={cn('grid h-7 w-7 place-items-center rounded border transition-colors disabled:cursor-not-allowed', mine?.rating_type === 'thumbs' ? 'border-emerald-300 bg-emerald-100 text-emerald-700' : 'border-transparent text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700')}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center" role="group" aria-label="Quantidade de estrelas">
          {[1, 2, 3, 4, 5].map(value => (
            <button
              key={value}
              type="button"
              onClick={() => handleStar(value)}
              disabled={locked || saving}
              aria-label={`Avaliar com ${value} estrela${value > 1 ? 's' : ''}`}
              aria-pressed={isMineStar && mine?.value === value}
              title={`${value} estrela${value > 1 ? 's' : ''}`}
              className="grid h-7 w-6 place-items-center rounded hover:bg-amber-50 disabled:cursor-not-allowed"
            >
              <Star className={cn('h-3.5 w-3.5', isMineStar && (mine?.value ?? 0) >= value ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground')} />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleSuper}
          disabled={locked || saving}
          aria-label="Avaliar com Super Estrela"
          aria-pressed={mine?.rating_type === 'superstar'}
          title="Super Estrela (10 pontos)"
          className={cn('grid h-7 w-7 place-items-center rounded border transition-colors disabled:cursor-not-allowed', mine?.rating_type === 'superstar' ? 'border-orange-300 bg-orange-100 text-orange-700' : 'border-transparent text-muted-foreground hover:bg-orange-50 hover:text-orange-700')}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </button>
        {ratings.length > 0 && (
          <span className="min-w-full text-[10px] text-muted-foreground">
            {thumbs > 0 ? `${thumbs} joinha${thumbs > 1 ? 's' : ''} · ` : ''}{stars > 0 ? `${stars} estrelas · ` : ''}{superstars > 0 ? `${superstars} Super · ` : ''}{score} pts
          </span>
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
