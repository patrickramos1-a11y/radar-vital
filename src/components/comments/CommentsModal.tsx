import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClientComment, ReadStatusName, READ_STATUS_NAMES } from '@/types/comment';
import { useClientComments, triggerCommentCountRefresh } from '@/hooks/useClientComments';
import { Pin, Trash2, Send, Loader2, Check, EyeOff } from 'lucide-react';
import { COLLABORATOR_COLORS, CollaboratorName } from '@/types/client';
import { cn } from '@/lib/utils';

interface CommentsModalProps {
  clientId: string;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentsModal({ clientId, clientName, isOpen, onClose }: CommentsModalProps) {
  const { comments, isLoading, addComment, deleteComment, togglePinned, toggleReadStatus } = useClientComments(clientId);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addComment({ commentText: newComment.trim() });
      setNewComment('');
      // Trigger refresh of comment counts across the app
      setTimeout(() => triggerCommentCountRefresh(), 200);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteComment(id);
    // Trigger refresh of comment counts
    setTimeout(() => triggerCommentCountRefresh(), 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  // Sort: pinned first, then by date
  const sortedComments = [...comments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col" aria-describedby="comments-dialog-description">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Comentários - {clientName}
          </DialogTitle>
          <DialogDescription id="comments-dialog-description" className="sr-only">
            Visualize e adicione comentários para este cliente
          </DialogDescription>
        </DialogHeader>

        {/* New comment input */}
        <div className="space-y-2 pb-3 border-b border-border">
          <Textarea
            placeholder="Adicionar comentário... (Ctrl+Enter para enviar)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Enviar
            </Button>
          </div>
        </div>

        {/* Comments list */}
        <ScrollArea className="flex-1 -mr-4 pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : sortedComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum comentário ainda
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {sortedComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onDelete={() => handleDelete(comment.id)}
                  onTogglePin={() => togglePinned(comment.id)}
                  onToggleRead={(collaborator) => toggleReadStatus(comment.id, collaborator)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface CommentItemProps {
  comment: ClientComment;
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleRead: (collaborator: ReadStatusName) => void;
}

function CommentItem({ comment, onDelete, onTogglePin, onToggleRead }: CommentItemProps) {
  return (
    <div
      className={`p-3 rounded-lg border ${
        comment.isPinned
          ? 'bg-amber-500/5 border-amber-500/30'
          : 'bg-muted/30 border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary">
            {comment.authorName}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(comment.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onTogglePin}
            className={`p-1 rounded hover:bg-muted transition-colors ${
              comment.isPinned ? 'text-amber-500' : 'text-muted-foreground'
            }`}
            title={comment.isPinned ? 'Desafixar' : 'Fixar comentário'}
          >
            <Pin className={`w-3.5 h-3.5 ${comment.isPinned ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Excluir comentário"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap mb-3">
        {comment.commentText}
      </p>
      
      {/* Read Status Row */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-border">
        <span className="text-[10px] text-muted-foreground mr-1">Lido:</span>
        {READ_STATUS_NAMES.map((name) => {
          const color = name === 'patrick' ? '#10B981' : COLLABORATOR_COLORS[name as CollaboratorName];
          const isRead = comment.readStatus[name];
          return (
            <button
              key={name}
              onClick={() => onToggleRead(name)}
              className={cn(
                "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium transition-all",
                isRead 
                  ? "text-white" 
                  : "text-muted-foreground bg-muted hover:bg-muted/80"
              )}
              style={isRead ? { backgroundColor: color } : {}}
              title={`${name}: ${isRead ? 'Lido' : 'Não lido'}`}
            >
              {isRead ? <Check className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
              <span className="capitalize">{name.charAt(0).toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
