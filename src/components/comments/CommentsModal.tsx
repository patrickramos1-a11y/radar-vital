import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ClientComment, ReadStatusName, READ_STATUS_NAMES, CommentType, COMMENT_TYPE_LABELS } from '@/types/comment';
import { useClientComments, triggerCommentCountRefresh } from '@/hooks/useClientComments';
import { useAuth } from '@/contexts/AuthContext';
import { Pin, Trash2, Send, Loader2, Check, EyeOff, Info, AlertTriangle, ShieldAlert, Lock, Unlock, UserPlus, CheckCircle2, Clock } from 'lucide-react';
import { COLLABORATOR_COLORS, CollaboratorName } from '@/types/client';
import { cn } from '@/lib/utils';

interface CommentsModalProps {
  clientId: string;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentsModal({ clientId, clientName, isOpen, onClose }: CommentsModalProps) {
  const { comments, isLoading, addComment, deleteComment, togglePinned, toggleReadStatus, confirmReading, closeComment, reopenComment, updateRequiredReaders } = useClientComments(clientId);
  const { currentUser, collaborators } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<CommentType>('informativo');
  const [selectedReaders, setSelectedReaders] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserName = currentUser?.name || 'Sistema';
  const isAdmin = currentUserName === 'Patrick';

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await addComment({
        commentText: newComment.trim(),
        commentType,
        requiredReaders: commentType === 'ciencia' ? selectedReaders : [],
      });
      setNewComment('');
      setCommentType('informativo');
      setSelectedReaders([]);
      setTimeout(() => triggerCommentCountRefresh(), 200);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteComment(id);
    setTimeout(() => triggerCommentCountRefresh(), 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
  };

  const toggleReader = (name: string) => {
    setSelectedReaders(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col" aria-describedby="comments-dialog-description">
        <DialogHeader>
          <DialogTitle className="text-lg">Comentários - {clientName}</DialogTitle>
          <DialogDescription id="comments-dialog-description" className="sr-only">
            Visualize e adicione comentários para este cliente
          </DialogDescription>
        </DialogHeader>

        {/* New comment input */}
        <div className="space-y-3 pb-3 border-b border-border">
          {/* Comment type selector */}
          <div className="flex gap-1.5">
            {(['informativo', 'relevante', 'ciencia'] as CommentType[]).map((type) => {
              const icons = { informativo: Info, relevante: AlertTriangle, ciencia: ShieldAlert };
              const colors = {
                informativo: 'bg-muted text-muted-foreground border-border',
                relevante: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700',
                ciencia: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
              };
              const Icon = icons[type];
              return (
                <button
                  key={type}
                  onClick={() => setCommentType(type)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all',
                    commentType === type ? colors[type] + ' ring-2 ring-offset-1 ring-primary/30' : 'bg-background text-muted-foreground border-border hover:bg-muted/50'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {COMMENT_TYPE_LABELS[type]}
                </button>
              );
            })}
          </div>

          {/* Required readers selector for ciencia */}
          {commentType === 'ciencia' && (
            <div className="space-y-1.5 p-2.5 rounded-md bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
              <p className="text-[10px] font-medium text-red-700 dark:text-red-400">Selecione quem deve confirmar ciência:</p>
              <div className="flex flex-wrap gap-1.5">
                {collaborators.map((collab) => (
                  <label key={collab.id} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={selectedReaders.includes(collab.name)}
                      onCheckedChange={() => toggleReader(collab.name)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs">{collab.name}</span>
                  </label>
                ))}
              </div>
              {selectedReaders.length === 0 && (
                <p className="text-[10px] text-red-500">Selecione pelo menos um colaborador</p>
              )}
            </div>
          )}

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
              disabled={!newComment.trim() || isSubmitting || (commentType === 'ciencia' && selectedReaders.length === 0)}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
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
            <div className="text-center py-8 text-muted-foreground">Nenhum comentário ainda</div>
          ) : (
            <div className="space-y-3 py-2">
              {sortedComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserName={currentUserName}
                  isAdmin={isAdmin}
                  collaborators={collaborators}
                  onDelete={() => handleDelete(comment.id)}
                  onTogglePin={() => togglePinned(comment.id)}
                  onToggleRead={(collaborator) => toggleReadStatus(comment.id, collaborator)}
                  onConfirmReading={() => confirmReading(comment.id)}
                  onClose={() => closeComment(comment.id)}
                  onReopen={() => reopenComment(comment.id)}
                  onUpdateReaders={(readers) => updateRequiredReaders(comment.id, readers)}
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
  currentUserName: string;
  isAdmin: boolean;
  collaborators: { id: string; name: string }[];
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleRead: (collaborator: ReadStatusName) => void;
  onConfirmReading: () => void;
  onClose: () => void;
  onReopen: () => void;
  onUpdateReaders: (readers: string[]) => void;
}

function CommentItem({ comment, currentUserName, isAdmin, collaborators, onDelete, onTogglePin, onToggleRead, onConfirmReading, onClose, onReopen, onUpdateReaders }: CommentItemProps) {
  const [showEditReaders, setShowEditReaders] = useState(false);
  const [editReaders, setEditReaders] = useState<string[]>(comment.requiredReaders);

  const typeBadgeStyles: Record<CommentType, string> = {
    informativo: 'bg-muted text-muted-foreground',
    relevante: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    ciencia: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const isCiencia = comment.commentType === 'ciencia';
  const confirmedCount = isCiencia ? comment.requiredReaders.filter(r => comment.readTimestamps[r]).length : 0;
  const totalRequired = isCiencia ? comment.requiredReaders.length : 0;
  const isFullyRead = isCiencia && totalRequired > 0 && confirmedCount === totalRequired;
  const isPending = isCiencia && confirmedCount === 0 && totalRequired > 0;
  const isPartial = isCiencia && confirmedCount > 0 && confirmedCount < totalRequired;
  const userNeedsToConfirm = isCiencia && !comment.isClosed && comment.requiredReaders.includes(currentUserName) && !comment.readTimestamps[currentUserName];

  const cienciaBorderClass = comment.isClosed
    ? 'border-muted'
    : isPending
      ? 'border-red-300 dark:border-red-700'
      : isPartial
        ? 'border-amber-300 dark:border-amber-700'
        : isFullyRead
          ? 'border-green-300 dark:border-green-700'
          : 'border-border';

  const saveEditReaders = () => {
    onUpdateReaders(editReaders);
    setShowEditReaders(false);
  };

  return (
    <div
      className={cn(
        'p-3 rounded-lg border',
        comment.isPinned ? 'bg-amber-500/5 border-amber-500/30' : 'bg-muted/30',
        isCiencia && !comment.isPinned && cienciaBorderClass,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className={cn('text-[9px] px-1.5 py-0', typeBadgeStyles[comment.commentType])}>
            {COMMENT_TYPE_LABELS[comment.commentType]}
          </Badge>
          <span className="text-sm font-medium text-primary">{comment.authorName}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(comment.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
          {comment.isClosed && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-muted text-muted-foreground">
              <Lock className="w-2.5 h-2.5 mr-0.5" /> Encerrado
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onTogglePin} className={cn('p-1 rounded hover:bg-muted transition-colors', comment.isPinned ? 'text-amber-500' : 'text-muted-foreground')} title={comment.isPinned ? 'Desafixar' : 'Fixar'}>
            <Pin className={cn('w-3.5 h-3.5', comment.isPinned && 'fill-current')} />
          </button>
          {isAdmin && isCiencia && (
            <>
              {!comment.isClosed ? (
                <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-orange-500 transition-colors" title="Encerrar">
                  <Lock className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button onClick={onReopen} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-green-500 transition-colors" title="Reabrir">
                  <Unlock className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => { setEditReaders(comment.requiredReaders); setShowEditReaders(!showEditReaders); }} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Editar leitores">
                <UserPlus className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button onClick={onDelete} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Excluir">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Comment Text */}
      <p className="text-sm text-foreground whitespace-pre-wrap mb-3">{comment.commentText}</p>

      {/* Ciência status */}
      {isCiencia && totalRequired > 0 && (
        <div className="space-y-2 mb-3 p-2 rounded bg-background/50 border border-border">
          <div className="flex items-center gap-2">
            {comment.isClosed ? (
              <Badge variant="secondary" className="text-[10px]"><Lock className="w-2.5 h-2.5 mr-0.5" />Encerrado por {comment.closedBy}</Badge>
            ) : isFullyRead ? (
              <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />Completo ({confirmedCount}/{totalRequired})</Badge>
            ) : isPartial ? (
              <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-2.5 h-2.5 mr-0.5" />Parcial ({confirmedCount}/{totalRequired})</Badge>
            ) : (
              <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><Clock className="w-2.5 h-2.5 mr-0.5" />Pendente (0/{totalRequired})</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {comment.requiredReaders.map((reader) => {
              const confirmed = !!comment.readTimestamps[reader];
              return (
                <div key={reader} className={cn('flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium', confirmed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400')}>
                  {confirmed ? <Check className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                  <span>{reader}</span>
                  {confirmed && (
                    <span className="text-[8px] ml-1 opacity-70">
                      {format(new Date(comment.readTimestamps[reader]), 'dd/MM HH:mm', { locale: ptBR })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {userNeedsToConfirm && (
            <Button size="sm" variant="default" className="h-7 text-xs mt-1" onClick={onConfirmReading}>
              <Check className="w-3 h-3 mr-1" /> Confirmar minha ciência
            </Button>
          )}
        </div>
      )}

      {/* Edit readers (admin) */}
      {showEditReaders && (
        <div className="space-y-2 mb-3 p-2 rounded bg-primary/5 border border-primary/20">
          <p className="text-[10px] font-medium text-primary">Editar leitores obrigatórios:</p>
          <div className="flex flex-wrap gap-1.5">
            {collaborators.map((collab) => (
              <label key={collab.id} className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={editReaders.includes(collab.name)}
                  onCheckedChange={() => setEditReaders(prev => prev.includes(collab.name) ? prev.filter(n => n !== collab.name) : [...prev, collab.name])}
                  className="h-3.5 w-3.5"
                />
                <span className="text-xs">{collab.name}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="default" className="h-6 text-[10px]" onClick={saveEditReaders}>Salvar</Button>
            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setShowEditReaders(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Legacy read status row */}
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
                'flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium transition-all',
                isRead ? 'text-white' : 'text-muted-foreground bg-muted hover:bg-muted/80'
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
