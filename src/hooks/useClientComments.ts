import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ClientComment, CommentFormData, ReadStatusName, CommentType } from '@/types/comment';
import { toast } from 'sonner';
import { ActivityLogger } from '@/lib/activityLogger';

const getCurrentUserName = () => localStorage.getItem('painel_ac_user') || 'Sistema';

// Global refresh callback — must be declared before hooks that use it
let globalRefreshCallback: (() => void) | null = null;

export function triggerCommentCountRefresh() {
  if (globalRefreshCallback) globalRefreshCallback();
}

function mapRow(row: any): ClientComment {
  return {
    id: row.id,
    clientId: row.client_id,
    authorUserId: row.author_user_id || undefined,
    authorName: row.author_name,
    commentText: row.comment_text,
    createdAt: row.created_at,
    isPinned: row.is_pinned,
    readStatus: {
      celine: row.read_celine ?? false,
      gabi: row.read_gabi ?? false,
      darley: row.read_darley ?? false,
      vanessa: row.read_vanessa ?? false,
      patrick: row.read_patrick ?? false,
    },
    commentType: (row.comment_type as CommentType) || 'informativo',
    requiredReaders: row.required_readers || [],
    readTimestamps: (row.read_timestamps as Record<string, string>) || {},
    isClosed: row.is_closed ?? false,
    closedBy: row.closed_by || undefined,
    closedAt: row.closed_at || undefined,
    isEdited: row.is_edited ?? false,
  };
}

export function useClientComments(clientId: string) {
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
      setComments((data || []).map(mapRow));
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
      
      const insertData: any = {
        client_id: clientId,
        author_user_id: userData?.user?.id || null,
        author_name: authorName,
        comment_text: data.commentText,
        comment_type: data.commentType || 'informativo',
        required_readers: data.commentType === 'ciencia' ? data.requiredReaders : [],
        read_timestamps: {},
      };

      const { error } = await supabase
        .from('client_comments')
        .insert(insertData);
      if (error) throw error;

      await fetchComments();
      toast.success('Comentário adicionado');
      ActivityLogger.createComment(getCurrentUserName(), clientName || 'Cliente', clientId, data.commentText);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erro ao adicionar comentário');
    }
  }, [clientId, fetchComments]);

  const editComment = useCallback(async (id: string, newText: string) => {
    try {
      const { error } = await supabase
        .from('client_comments')
        .update({ comment_text: newText, is_edited: true })
        .eq('id', id);
      if (error) throw error;
      setComments(prev => prev.map(c =>
        c.id === id ? { ...c, commentText: newText, isEdited: true } : c
      ));
      toast.success('Comentário editado');
    } catch (error) {
      console.error('Error editing comment:', error);
      toast.error('Erro ao editar comentário');
    }
  }, []);

  const deleteComment = useCallback(async (id: string, clientName?: string) => {
    try {
      const { error } = await supabase.from('client_comments').delete().eq('id', id);
      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== id));
      toast.success('Comentário excluído');
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
      const { error } = await supabase.from('client_comments').update({ is_pinned: newPinned }).eq('id', id);
      if (error) throw error;
      setComments(prev => prev.map(c => c.id === id ? { ...c, isPinned: newPinned } : c));
      ActivityLogger.pinComment(getCurrentUserName(), clientName || 'Cliente', clientId, newPinned);
    } catch (error) {
      console.error('Error toggling pinned:', error);
      toast.error('Erro ao fixar comentário');
    }
  }, [comments, clientId]);

  const toggleReadStatus = useCallback(async (id: string, collaborator: ReadStatusName) => {
    const comment = comments.find(c => c.id === id);
    if (!comment) return;
    const newValue = !comment.readStatus[collaborator];
    const updateField = `read_${collaborator}`;
    try {
      const { error } = await supabase.from('client_comments').update({ [updateField]: newValue }).eq('id', id);
      if (error) throw error;
      setComments(prev => prev.map(c =>
        c.id === id ? { ...c, readStatus: { ...c.readStatus, [collaborator]: newValue } } : c
      ));
      // Refresh badge counts immediately after marking read/unread
      triggerCommentCountRefresh();
    } catch (error) {
      console.error('Error updating read status:', error);
      toast.error('Erro ao atualizar status');
    }
  }, [comments]);

  const confirmReading = useCallback(async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    const userName = getCurrentUserName();
    const newTimestamps = { ...comment.readTimestamps, [userName]: new Date().toISOString() };
    try {
      const { error } = await supabase
        .from('client_comments')
        .update({ read_timestamps: newTimestamps as any })
        .eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, readTimestamps: newTimestamps } : c
      ));
      toast.success('Ciência confirmada');
    } catch (error) {
      console.error('Error confirming reading:', error);
      toast.error('Erro ao confirmar ciência');
    }
  }, [comments]);

  const closeComment = useCallback(async (commentId: string) => {
    const userName = getCurrentUserName();
    try {
      const { error } = await supabase
        .from('client_comments')
        .update({ is_closed: true, closed_by: userName, closed_at: new Date().toISOString() })
        .eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, isClosed: true, closedBy: userName, closedAt: new Date().toISOString() } : c
      ));
      toast.success('Comentário encerrado');
    } catch (error) {
      console.error('Error closing comment:', error);
      toast.error('Erro ao encerrar comentário');
    }
  }, []);

  const reopenComment = useCallback(async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('client_comments')
        .update({ is_closed: false, closed_by: null, closed_at: null })
        .eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, isClosed: false, closedBy: undefined, closedAt: undefined } : c
      ));
      toast.success('Comentário reaberto');
    } catch (error) {
      console.error('Error reopening comment:', error);
      toast.error('Erro ao reabrir comentário');
    }
  }, []);

  const updateRequiredReaders = useCallback(async (commentId: string, readers: string[]) => {
    try {
      const { error } = await supabase
        .from('client_comments')
        .update({ required_readers: readers })
        .eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, requiredReaders: readers } : c
      ));
      toast.success('Leitores obrigatórios atualizados');
    } catch (error) {
      console.error('Error updating required readers:', error);
      toast.error('Erro ao atualizar leitores');
    }
  }, []);

  return {
    comments,
    isLoading,
    addComment,
    editComment,
    deleteComment,
    togglePinned,
    toggleReadStatus,
    confirmReading,
    closeComment,
    reopenComment,
    updateRequiredReaders,
    refetch: fetchComments,
  };
}

// Map collaborator name → database column
const USER_COLUMN_MAP: Record<string, string> = {
  'celine':  'read_celine',
  'gabi':    'read_gabi',
  'darley':  'read_darley',
  'vanessa': 'read_vanessa',
  'patrick': 'read_patrick',
};

// A comment is "pending" for a specific user (or globally if no user)
function hasPendingForUser(row: any, userColumn: string | null): boolean {
  if (!userColumn) {
    // Global view: pending if any collaborator hasn't read
    return !(row.read_celine && row.read_darley && row.read_gabi && row.read_vanessa && row.read_patrick);
  }
  return !row[userColumn];
}

// Hook to get PENDING comment counts for all clients (legacy, kept for compatibility)
export function useAllClientsCommentCounts(): Map<string, number> {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('client_comments')
        .select('client_id, read_celine, read_darley, read_gabi, read_vanessa, read_patrick');
      if (error) throw error;
      const countMap = new Map<string, number>();
      (data || []).forEach(row => {
        if (hasPendingForUser(row, null)) {
          countMap.set(row.client_id, (countMap.get(row.client_id) || 0) + 1);
        }
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
    const commentsChannel = supabase
      .channel('client_comments_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_comments' }, () => {
        setTimeout(() => { setRefreshTrigger(prev => prev + 1); }, 100);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, []);

  return counts;
}


export function useAllClientsCommentCountsWithRefresh(currentUserName?: string): [Map<string, number>, () => void] {
  const [counts, setCounts] = useState<Map<string, number>>(new Map());

  // Resolve which DB column to filter by based on the logged-in user
  const userColumn = currentUserName
    ? (USER_COLUMN_MAP[currentUserName.toLowerCase()] ?? null)
    : null;

  const fetchCounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('client_comments')
        .select('client_id, read_celine, read_darley, read_gabi, read_vanessa, read_patrick');
      if (error) throw error;
      const countMap = new Map<string, number>();
      (data || []).forEach(row => {
        if (hasPendingForUser(row, userColumn)) {
          countMap.set(row.client_id, (countMap.get(row.client_id) || 0) + 1);
        }
      });
      setCounts(countMap);
    } catch (error) {
      console.error('Error fetching comment counts:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userColumn]);

  useEffect(() => {
    fetchCounts();
    globalRefreshCallback = fetchCounts;

    const channel = supabase
      .channel('comment_counts_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_comments' }, () => {
        setTimeout(fetchCounts, 150);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      globalRefreshCallback = null;
    };
  }, [fetchCounts]);

  return [counts, fetchCounts];
}
