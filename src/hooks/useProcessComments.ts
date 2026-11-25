import { useCallback, useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { actorName } from '@/lib/auth';
import { ActivityLogger } from '@/lib/activityLogger';
import type { ProcessComment } from '@/lib/processFollowUp';
import { triggerCommentCountRefresh } from '@/hooks/useClientComments';

export type AddProcessComment = (target: { taskId: string; clientId: string; clientName?: string }, text: string) => Promise<boolean>;

/**
 * Comentários de acompanhamento ligados a processos (`client_comments.task_id`).
 * São comentários comuns do cliente: aparecem também nos Comentários do cliente.
 */
export function useProcessComments() {
  const { currentUser } = useAuth();
  const currentUserName = actorName(currentUser);
  const [comments, setComments] = useState<ProcessComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const channelId = useId();

  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('client_comments')
      .select('id, client_id, task_id, author_name, comment_text, created_at')
      .not('task_id', 'is', null)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching process comments:', error);
    } else {
      setComments((data ?? []).flatMap(row => row.task_id ? [{
        id: row.id,
        clientId: row.client_id,
        taskId: row.task_id,
        authorName: row.author_name,
        text: row.comment_text,
        createdAt: row.created_at,
      }] : []));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchComments();
    const channel = supabase
      .channel(`process_comments_${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_comments' }, () => { void fetchComments(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [channelId, fetchComments]);

  const addComment = useCallback<AddProcessComment>(async ({ taskId, clientId, clientName }, text) => {
    const commentText = text.trim();
    if (!commentText) return false;
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from('client_comments').insert({
      client_id: clientId,
      task_id: taskId,
      author_user_id: userData?.user?.id || null,
      author_name: currentUserName,
      comment_text: commentText,
      comment_type: 'informativo',
      required_readers: [],
      read_timestamps: {},
    });
    if (error) {
      console.error('Error adding process comment:', error);
      toast.error('Erro ao registrar o comentário');
      return false;
    }
    toast.success('Comentário registrado');
    ActivityLogger.createComment(currentUserName, clientName || 'Cliente', clientId, commentText);
    triggerCommentCountRefresh();
    await fetchComments();
    return true;
  }, [currentUserName, fetchComments]);

  return { comments, isLoading, addComment, refetch: fetchComments };
}
