
-- Archive all comments that have been read by all active collaborators but weren't auto-archived
UPDATE client_comments 
SET is_archived = true, 
    archived_by = 'Sistema', 
    archived_at = now()
WHERE is_archived = false 
  AND read_timestamps ? 'Ana Paula'
  AND read_timestamps ? 'Celine'
  AND read_timestamps ? 'Darley'
  AND read_timestamps ? 'Gabi'
  AND read_timestamps ? 'Patrick'
  AND read_timestamps ? 'Vanessa';
