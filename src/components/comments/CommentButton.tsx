import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { CommentsModal } from './CommentsModal';

interface CommentButtonProps {
  clientId: string;
  clientName: string;
  commentCount: number;
}

export function CommentButton({ clientId, clientName, commentCount }: CommentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
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

      <CommentsModal
        clientId={clientId}
        clientName={clientName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
