import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CollaboratorComment, CollaboratorCommentFormData } from '@/types/collaboratorComment';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { actorName } from '@/lib/auth';

export function useCollaboratorComments() {
  const { currentUser } = useAuth();
  const currentUserName = actorName(currentUser);
  const [comments, setComments] = useState<CollaboratorComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase
      .from('collaborator_comments' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
    } else {
      setComments((data || []) as unknown as CollaboratorComment[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel('collab_comments_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'collaborator_comments' }, () => {
        setTimeout(fetchAll, 100);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAll]);

  const create = useCallback(async (data: CollaboratorCommentFormData) => {
    const { error } = await supabase.from('collaborator_comments' as any).insert({
      collaborator_name: data.collaborator_name,
      author_name: currentUserName,
      comment_text: data.comment_text,
      context: data.context,
    });
    if (error) { toast.error('Erro ao criar anotação'); return false; }
    toast.success('Anotação registrada');
    await fetchAll();
    return true;
  }, [currentUserName, fetchAll]);

  const markRead = useCallback(async (id: string, isRead: boolean) => {
    const patch: any = {
      is_read: isRead,
      read_at: isRead ? new Date().toISOString() : null,
      read_by: isRead ? currentUserName : null,
    };
    const { error } = await supabase.from('collaborator_comments' as any).update(patch).eq('id', id);
    if (error) toast.error('Erro ao atualizar');
    else await fetchAll();
  }, [currentUserName, fetchAll]);

  const archive = useCallback(async (id: string) => {
    const { error } = await supabase.from('collaborator_comments' as any).update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: currentUserName,
    }).eq('id', id);
    if (error) toast.error('Erro ao arquivar');
    else { toast.success('Arquivado'); await fetchAll(); }
  }, [currentUserName, fetchAll]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('collaborator_comments' as any).delete().eq('id', id);
    if (error) toast.error('Erro ao excluir');
    else await fetchAll();
  }, [fetchAll]);

  return { comments, isLoading, create, markRead, archive, remove, refetch: fetchAll };
}
