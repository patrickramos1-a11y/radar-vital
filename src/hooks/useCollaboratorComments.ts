import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CollaboratorComment, CollaboratorCommentFormData } from '@/types/collaboratorComment';
import { toast } from 'sonner';

const currentUser = () => localStorage.getItem('painel_ac_user') || 'Sistema';

export function useCollaboratorComments() {
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
      author_name: currentUser(),
      comment_text: data.comment_text,
      context: data.context,
    });
    if (error) { toast.error('Erro ao criar anotação'); return false; }
    toast.success('Anotação registrada');
    await fetchAll();
    return true;
  }, [fetchAll]);

  const markRead = useCallback(async (id: string, isRead: boolean) => {
    const patch: any = {
      is_read: isRead,
      read_at: isRead ? new Date().toISOString() : null,
      read_by: isRead ? currentUser() : null,
    };
    const { error } = await supabase.from('collaborator_comments' as any).update(patch).eq('id', id);
    if (error) toast.error('Erro ao atualizar');
    else await fetchAll();
  }, [fetchAll]);

  const archive = useCallback(async (id: string) => {
    const { error } = await supabase.from('collaborator_comments' as any).update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: currentUser(),
    }).eq('id', id);
    if (error) toast.error('Erro ao arquivar');
    else { toast.success('Arquivado'); await fetchAll(); }
  }, [fetchAll]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('collaborator_comments' as any).delete().eq('id', id);
    if (error) toast.error('Erro ao excluir');
    else await fetchAll();
  }, [fetchAll]);

  return { comments, isLoading, create, markRead, archive, remove, refetch: fetchAll };
}
