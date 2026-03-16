import { supabase } from '@/integrations/supabase/client';

/**
 * Auto-archive a comment if all active collaborators have read it.
 * Uses read_timestamps JSONB to check against the dynamic collaborators table.
 * Returns true if archived.
 */
export async function autoArchiveIfFullyRead(
  commentId: string,
  readTimestamps: Record<string, string>,
  isAlreadyArchived: boolean
): Promise<boolean> {
  if (isAlreadyArchived) return false;

  try {
    const { data: collabs, error } = await supabase
      .from('collaborators')
      .select('name')
      .eq('is_active', true);

    if (error || !collabs || collabs.length === 0) return false;

    const allRead = collabs.every(c => !!readTimestamps[c.name]);
    if (!allRead) return false;

    const { error: archiveError } = await supabase
      .from('client_comments')
      .update({
        is_archived: true,
        archived_by: 'Sistema',
        archived_at: new Date().toISOString(),
      })
      .eq('id', commentId);

    return !archiveError;
  } catch {
    return false;
  }
}
