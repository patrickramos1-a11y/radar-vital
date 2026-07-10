import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

const getCurrentUserName = () => localStorage.getItem('painel_ac_user') || 'Sistema';

/** Score weight: thumbs = 1, star = value (1-5), superstar = 10. */
export function ratingScore(r: Pick<DeliverableRating, 'rating_type' | 'value'>) {
  if (r.rating_type === 'thumbs') return 1;
  if (r.rating_type === 'superstar') return 10;
  return Math.max(1, Math.min(5, r.value || 1));
}

export function useDeliverableRatings() {
  const [ratings, setRatings] = useState<DeliverableRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('deliverable_ratings' as any).select('*');
      if (error) throw error;
      setRatings((data as any) || []);
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
      const rater = getCurrentUserName();
      const { error } = await supabase
        .from('deliverable_ratings' as any)
        .upsert(
          { deliverable_id: deliverableId, rater_name: rater, rating_type, value },
          { onConflict: 'deliverable_id,rater_name' }
        );
      if (error) throw error;
      toast.success('Avaliação registrada');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao avaliar');
    }
  }, []);

  const removeRating = useCallback(async (deliverableId: string) => {
    try {
      const rater = getCurrentUserName();
      const { error } = await supabase
        .from('deliverable_ratings' as any)
        .delete()
        .eq('deliverable_id', deliverableId)
        .eq('rater_name', rater);
      if (error) throw error;
    } catch (e) { console.error(e); }
  }, []);

  return { ratings, isLoading, rate, removeRating, currentUser: getCurrentUserName() };
}
