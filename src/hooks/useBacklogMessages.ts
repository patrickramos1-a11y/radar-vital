import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserName } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BacklogMessage {
  id: string;
  backlog_item_id: string;
  author_name: string;
  message: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export function useBacklogMessages(backlogItemId: string | undefined) {
  const [messages, setMessages] = useState<BacklogMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!backlogItemId) return;
    const { data, error } = await supabase
      .from('backlog_messages')
      .select('*')
      .eq('backlog_item_id', backlogItemId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages((data as BacklogMessage[]) || []);
    }
    setIsLoading(false);
  }, [backlogItemId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async (text: string) => {
    if (!backlogItemId || !text.trim()) return;
    const authorName = getCurrentUserName();
    const { error } = await supabase
      .from('backlog_messages')
      .insert({
        backlog_item_id: backlogItemId,
        author_name: authorName,
        message: text.trim(),
      });

    if (error) {
      toast.error('Erro ao enviar mensagem');
      console.error(error);
    } else {
      await fetchMessages();
    }
  };

  const editMessage = async (messageId: string, newText: string) => {
    if (!newText.trim()) return;
    const { error } = await supabase
      .from('backlog_messages')
      .update({
        message: newText.trim(),
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (error) {
      toast.error('Erro ao editar mensagem');
      console.error(error);
    } else {
      await fetchMessages();
    }
  };

  const deleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('backlog_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      toast.error('Erro ao excluir mensagem');
      console.error(error);
    } else {
      await fetchMessages();
    }
  };

  return { messages, isLoading, sendMessage, editMessage, deleteMessage };
}
