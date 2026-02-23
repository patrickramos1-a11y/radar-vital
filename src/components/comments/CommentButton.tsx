import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { supabase } from '@/integrations/supabase/client';
import { ClientComment, CommentType } from '@/types/comment';
import { CommentPreview } from './CommentPreview';
import { CommentsModal } from './CommentsModal';

interface CommentButtonProps {
  clientId: string;
  clientName: string;
  commentCount: number;
}

export function CommentButton({ clientId, clientName, commentCount }: CommentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewComments, setPreviewComments] = useState<ClientComment[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isHoverOpen, setIsHoverOpen] = useState(false);

  useEffect(() => {
    if (!isHoverOpen || commentCount === 0) return;

    const fetchPreview = async () => {
      setIsLoadingPreview(true);
      try {
        const { data, error } = await supabase
          .from('client_comments')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;

        const mapped: ClientComment[] = (data || []).map(row => ({
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
          isArchived: row.is_archived ?? false,
          archivedBy: row.archived_by || undefined,
          archivedAt: row.archived_at || undefined,
        }));

        setPreviewComments(mapped);
      } catch (error) {
        console.error('Error fetching preview comments:', error);
      } finally {
        setIsLoadingPreview(false);
      }
    };

    fetchPreview();
  }, [isHoverOpen, clientId, commentCount]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
    setIsHoverOpen(false);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsHoverOpen(false);
  };

  return (
    <>
      <HoverCard open={isHoverOpen} onOpenChange={setIsHoverOpen} openDelay={300} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            onClick={handleClick}
            className="p-0.5 rounded transition-colors hover:bg-muted/50 relative"
            title={`${commentCount} comentário${commentCount !== 1 ? 's' : ''}`}
          >
            <MessageCircle
              className={`w-3.5 h-3.5 transition-colors ${
                commentCount > 0
                  ? 'text-primary fill-primary/20'
                  : 'text-muted-foreground/40 hover:text-primary/60'
              }`}
            />
            {commentCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full bg-primary text-primary-foreground text-[8px] font-bold">
                {commentCount > 99 ? '99+' : commentCount}
              </span>
            )}
          </button>
        </HoverCardTrigger>
        <HoverCardContent side="right" align="start" className="p-0 w-auto" sideOffset={8}>
          <CommentPreview
            comments={previewComments}
            isLoading={isLoadingPreview}
            onViewAll={handleOpenModal}
          />
        </HoverCardContent>
      </HoverCard>

      <CommentsModal
        clientId={clientId}
        clientName={clientName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
