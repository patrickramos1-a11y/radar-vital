import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClientComment, CommentFormData } from '@/types/comment';
import { toast } from 'sonner';
import { ActivityLogger } from '@/lib/activityLogger';

// Get current user from localStorage for logging
const getCurrentUserName = () => localStorage.getItem('painel_ac_user') || 'Sistema';

interface UseClientCommentsReturn {
  comments: ClientComment[];
  isLoading: boolean;
  addComment: (data: CommentFormData) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  togglePinned: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useClientComments(clientId: string): UseClientCommentsReturn {
  const [comments, setComments] = useState<ClientComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    if (!clientId) return;
    
    try {
      const { data, error } = await supabase
        .from('client_comments')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: ClientComment[] = (data || []).map(row => ({
        id: row.id,
        clientId: row.client_id,
        authorUserId: row.author_user_id || undefined,
        authorName: row.author_name,
        commentText: row.comment_text,
        createdAt: row.created_at,
        isPinned: row.is_pinned,
      }));

      setComments(mapped);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Erro ao carregar comentários');
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = useCallback(async (data: CommentFormData, clientName?: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const authorName = data.authorName || getCurrentUserName();
      
      const { error } = await supabase
        .from('client_comments')
        .insert({
          client_id: clientId,
          author_user_id: userData?.user?.id || null,
          author_name: authorName,
          comment_text: data.commentText,
        });

      if (error) throw error;

      await fetchComments();
      toast.success('Comentário adicionado');
      
      // Log the activity
      ActivityLogger.createComment(
        getCurrentUserName(), 
        clientName || 'Cliente', 
        clientId, 
        data.commentText
      );
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erro ao adicionar comentário');
    }
  }, [clientId, fetchComments]);

  const deleteComment = useCallback(async (id: string, clientName?: string) => {
    try {
      const { error } = await supabase
        .from('client_comments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== id));
      toast.success('Comentário excluído');
      
      // Log the activity
      ActivityLogger.deleteComment(getCurrentUserName(), clientName || 'Cliente', clientId);
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Erro ao excluir comentário');
    }
  }, [clientId]);

  const togglePinned = useCallback(async (id: string, clientName?: string) => {
    const comment = comments.find(c => c.id === id);
    if (!comment) return;

    const newPinned = !comment.isPinned;

    try {
      const { error } = await supabase
        .from('client_comments')
        .update({ is_pinned: newPinned })
        .eq('id', id);

      if (error) throw error;

      setComments(prev => prev.map(c => 
        c.id === id ? { ...c, isPinned: newPinned } : c
      ));
      
      // Log the activity
      ActivityLogger.pinComment(getCurrentUserName(), clientName || 'Cliente', clientId, newPinned);
    } catch (error) {
      console.error('Error toggling pinned:', error);
      toast.error('Erro ao fixar comentário');
    }
  }, [comments, clientId]);

  return {
    comments,
    isLoading,
    addComment,
    deleteComment,
    togglePinned,
    refetch: fetchComments,
  };
}

// Hook to get comment counts for all clients
export function useAllClientsCommentCounts(): Map<string, number> {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, comment_count');

      if (error) throw error;

      const countMap = new Map<string, number>();
      (data || []).forEach(row => {
        countMap.set(row.id, row.comment_count || 0);
      });
      setCounts(countMap);
    } catch (error) {
      console.error('Error fetching comment counts:', error);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts, refreshTrigger]);

  useEffect(() => {
    // Subscribe to realtime updates on client_comments table
    const commentsChannel = supabase
      .channel('client_comments_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'client_comments' },
        () => {
          // Small delay to allow trigger to update comment_count
          setTimeout(() => {
            setRefreshTrigger(prev => prev + 1);
          }, 100);
        }
      )
      .subscribe();

    // Also subscribe to clients table for comment_count updates
    const clientsChannel = supabase
      .channel('clients_comment_count_realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'clients' },
        (payload) => {
          // Update the specific client's count directly
          if (payload.new && 'id' in payload.new && 'comment_count' in payload.new) {
            setCounts(prev => {
              const newMap = new Map(prev);
              newMap.set(payload.new.id as string, payload.new.comment_count as number);
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(clientsChannel);
    };
  }, []);

  return counts;
}

// Function to manually trigger a refresh (exported for use after adding comments)
let globalRefreshCallback: (() => void) | null = null;

export function triggerCommentCountRefresh() {
  if (globalRefreshCallback) {
    globalRefreshCallback();
  }
}

// Updated hook with manual refresh capability
export function useAllClientsCommentCountsWithRefresh(): [Map<string, number>, () => void] {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());

  const fetchCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, comment_count');

      if (error) throw error;

      const countMap = new Map<string, number>();
      (data || []).forEach(row => {
        countMap.set(row.id, row.comment_count || 0);
      });
      setCounts(countMap);
    } catch (error) {
      console.error('Error fetching comment counts:', error);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    globalRefreshCallback = fetchCounts;

    // Subscribe to realtime updates
    const channel = supabase
      .channel('comment_counts_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'client_comments' },
        () => {
          setTimeout(fetchCounts, 150);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      globalRefreshCallback = null;
    };
  }, [fetchCounts]);

  return [counts, fetchCounts];
}
