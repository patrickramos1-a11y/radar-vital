import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClientComment, COMMENT_TYPE_LABELS, CommentType } from '@/types/comment';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Pin, Info, AlertTriangle, ShieldAlert, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentPreviewProps {
  comments: ClientComment[];
  isLoading: boolean;
  onViewAll: () => void;
}

export function CommentPreview({ comments, isLoading, onViewAll }: CommentPreviewProps) {
  if (isLoading) {
    return <div className="p-3 text-sm text-muted-foreground">Carregando...</div>;
  }

  if (comments.length === 0) {
    return (
      <div className="p-3 text-sm text-muted-foreground">
        Nenhum comentário ainda.
        <button onClick={onViewAll} className="block mt-2 text-primary hover:underline text-xs">Adicionar comentário</button>
      </div>
    );
  }

  const previewComments = comments.slice(0, 8);

  const typeBadgeStyles: Record<CommentType, string> = {
    informativo: 'bg-muted text-muted-foreground',
    relevante: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    ciencia: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const typeIcons: Record<CommentType, typeof Info> = {
    informativo: Info,
    relevante: AlertTriangle,
    ciencia: ShieldAlert,
  };

  return (
    <div className="w-72">
      <ScrollArea className="max-h-80">
        <div className="p-2 space-y-2">
          {previewComments.map((comment) => {
            const Icon = typeIcons[comment.commentType];
            const isCiencia = comment.commentType === 'ciencia';
            const confirmedCount = isCiencia ? comment.requiredReaders.filter(r => comment.readTimestamps[r]).length : 0;
            const totalRequired = isCiencia ? comment.requiredReaders.length : 0;

            return (
              <div key={comment.id} className="p-2 rounded-md bg-muted/50 border border-border/50">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className={cn('text-[8px] px-1 py-0 h-4', typeBadgeStyles[comment.commentType])}>
                      <Icon className="w-2 h-2 mr-0.5" />
                      {COMMENT_TYPE_LABELS[comment.commentType]}
                    </Badge>
                    <span className="text-[10px] font-medium text-primary">{comment.authorName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {comment.isPinned && <Pin className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
                    {isCiencia && totalRequired > 0 && (
                      <span className={cn('text-[8px] font-medium', confirmedCount === totalRequired ? 'text-green-600' : 'text-red-600')}>
                        {confirmedCount}/{totalRequired}
                      </span>
                    )}
                    <span className="text-[9px] text-muted-foreground">
                      {format(new Date(comment.createdAt), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-foreground line-clamp-3 whitespace-pre-wrap">{comment.commentText}</p>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="px-3 pb-2">
        <button onClick={onViewAll} className="text-xs text-primary hover:underline">
          {comments.length > 3 ? `Ver todos (${comments.length} comentários)` : 'Ver todos / Adicionar'}
        </button>
      </div>
    </div>
  );
}
