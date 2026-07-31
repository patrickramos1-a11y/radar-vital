import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { actorName } from '@/lib/auth';

export type RatingType = 'thumbs' | 'star' | 'superstar';

export interface DeliverableRating {
  id: string;
  deliverable_id: string;
  rater_name: string;
  rating_type: RatingType;
  value: number;
  created_at: string;
  updated_at: string;
}

/**
 * OFFICIAL SCORE: thumbs = 0 (just a like), star = value (1-5), superstar = 10.
 * Thumbs is a like/recognition indicator only and does NOT count in the ranking.
 */
export function ratingScore(r: Pick<DeliverableRating, 'rating_type' | 'value'>) {
  if (r.rating_type === 'thumbs') return 0;
  if (r.rating_type === 'superstar') return 10;
  return Math.max(1, Math.min(5, r.value || 1));
}

/** Split ratings by type — thumbs counted separately (not part of score). */
export function summarizeRatings(list: Pick<DeliverableRating, 'rating_type' | 'value'>[]) {
  let thumbs = 0, stars = 0, superstars = 0, score = 0;
  list.forEach(r => {
    if (r.rating_type === 'thumbs') thumbs += 1;
    else if (r.rating_type === 'superstar') { superstars += 1; score += 10; }
    else { stars += Math.max(1, Math.min(5, r.value || 1)); score += Math.max(1, Math.min(5, r.value || 1)); }
  });
  return { thumbs, stars, superstars, score };
}

export function useDeliverableRatings() {
  const { currentUser, isAdmin } = useAuth();
  const currentUserName = actorName(currentUser);
  const [ratings, setRatings] = useState<DeliverableRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('deliverable_ratings').select('*');
      if (error) throw error;
      setRatings(data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const ch = supabase
      .channel('deliverable_ratings_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliverable_ratings' }, () => setTimeout(fetch, 100))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetch]);

  const rate = useCallback(async (deliverableId: string, rating_type: RatingType, value: number) => {
    try {
      if (!isAdmin) { toast.error('Apenas o administrador pode avaliar'); return; }
      const { error } = await supabase.rpc('set_deliverable_rating', {
        p_deliverable_id: deliverableId,
        p_rater_name: currentUserName,
        p_rating_type: rating_type,
        p_value: value,
      });
      if (error) throw error;
      await fetch();
      toast.success('Avaliação registrada');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao avaliar');
    }
  }, [currentUserName, fetch, isAdmin]);

  const removeRating = useCallback(async (deliverableId: string) => {
    try {
      if (!isAdmin) { toast.error('Apenas o administrador pode avaliar'); return; }
      const { error } = await supabase.rpc('remove_deliverable_rating', {
        p_deliverable_id: deliverableId,
        p_rater_name: currentUserName,
      });
      if (error) throw error;
      await fetch();
    } catch (e) { console.error(e); }
  }, [currentUserName, fetch, isAdmin]);

  return { ratings, isLoading, rate, removeRating, currentUser: currentUserName };
}
