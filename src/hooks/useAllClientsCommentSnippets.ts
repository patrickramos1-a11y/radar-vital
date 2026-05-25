import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CommentSnippet {
  id: string;
  text: string;
  authorName: string;
  createdAt: string;
}

export function useAllClientsCommentSnippets(): Map<string, CommentSnippet[]> {
  const [snippets, setSnippets] = useState<Map<string, CommentSnippet[]>>(new Map());

  const fetchSnippets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('client_comments')
        .select('id, client_id, comment_text, author_name, created_at, is_archived')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const map = new Map<string, CommentSnippet[]>();
      (data || []).forEach((row: any) => {
        if (row.is_archived) return;
        const arr = map.get(row.client_id) || [];
        arr.push({
          id: row.id,
          text: row.comment_text,
          authorName: row.author_name,
          createdAt: row.created_at,
        });
        map.set(row.client_id, arr);
      });
      setSnippets(map);
    } catch (e) {
      console.error('Error fetching comment snippets:', e);
    }
  }, []);

  useEffect(() => {
    fetchSnippets();
    const channel = supabase
      .channel('comment_snippets_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_comments' }, () => {
        setTimeout(fetchSnippets, 150);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSnippets]);

  return snippets;
}
