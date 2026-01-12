import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClientComment } from '@/types/comment';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pin } from 'lucide-react';

interface CommentPreviewProps {
  comments: ClientComment[];
  isLoading: boolean;
  onViewAll: () => void;
}

export function CommentPreview({ comments, isLoading, onViewAll }: CommentPreviewProps) {
  if (isLoading) {
    return (
      <div className="p-3 text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="p-3 text-sm text-muted-foreground">
        Nenhum comentário ainda.
        <button
          onClick={onViewAll}
          className="block mt-2 text-primary hover:underline text-xs"
        >
          Adicionar comentário
        </button>
      </div>
    );
  }

  // Show only first 3 comments
  const previewComments = comments.slice(0, 3);

  return (
    <div className="w-72">
      <ScrollArea className="max-h-64">
        <div className="p-2 space-y-2">
          {previewComments.map((comment) => (
            <div
              key={comment.id}
              className="p-2 rounded-md bg-muted/50 border border-border/50"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-medium text-primary">
                  {comment.authorName}
                </span>
                <div className="flex items-center gap-1">
                  {comment.isPinned && (
                    <Pin className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                  )}
                  <span className="text-[9px] text-muted-foreground">
                    {format(new Date(comment.createdAt), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
              <p className="text-xs text-foreground line-clamp-3 whitespace-pre-wrap">
                {comment.commentText}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>

      {comments.length > 3 && (
        <div className="px-3 pb-2">
          <button
            onClick={onViewAll}
            className="text-xs text-primary hover:underline"
          >
            Ver todos ({comments.length} comentários)
          </button>
        </div>
      )}

      {comments.length <= 3 && (
        <div className="px-3 pb-2">
          <button
            onClick={onViewAll}
            className="text-xs text-primary hover:underline"
          >
            Ver todos / Adicionar
          </button>
        </div>
      )}
    </div>
  );
}
