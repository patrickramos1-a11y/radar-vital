import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ClientComment, ReadStatusName, READ_STATUS_NAMES, CommentType, COMMENT_TYPE_LABELS } from '@/types/comment';
import { useClientComments, triggerCommentCountRefresh } from '@/hooks/useClientComments';
import { useAuth } from '@/contexts/AuthContext';
import { Pin, Trash2, Send, Loader2, Check, CheckCheck, EyeOff, Info, AlertTriangle, ShieldAlert, Lock, Unlock, UserPlus, CheckCircle2, Clock, ChevronDown, Search, Users, Pencil, X } from 'lucide-react';
import { COLLABORATOR_COLORS, CollaboratorName } from '@/types/client';
import { cn } from '@/lib/utils';

const COMMENT_TYPE_DESCRIPTIONS: Record<CommentType, string> = {
  informativo: 'Registro simples sem exigência de confirmação. Ideal para anotações, observações e registros gerais do dia a dia.',
  relevante: 'Destaque visual para informações importantes. Não exige confirmação, mas chama atenção na listagem.',
  ciencia: 'Comunicação formal que exige confirmação de leitura dos colaboradores selecionados. Use para decisões, alertas críticos ou informações que precisam de rastreabilidade.',
};

interface CommentsModalProps {
  clientId: string;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentsModal({ clientId, clientName, isOpen, onClose }: CommentsModalProps) {
  const { comments, isLoading, addComment, editComment, deleteComment, togglePinned, toggleReadStatus, confirmReading, closeComment, reopenComment, updateRequiredReaders } = useClientComments(clientId);
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

          {/* Type description */}
          <p className="text-[11px] text-muted-foreground italic px-1">
            {COMMENT_TYPE_DESCRIPTIONS[commentType]}
          </p>

          {/* Required readers dropdown for ciencia */}
          {commentType === 'ciencia' && (
            <ReadersDropdown
              collaborators={collaborators}
              selectedReaders={selectedReaders}
              onToggleReader={toggleReader}
              onSelectAll={() => setSelectedReaders(collaborators.map(c => c.name))}
              onDeselectAll={() => setSelectedReaders([])}
            />
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
                  onEdit={(newText) => editComment(comment.id, newText)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// --- ReadersDropdown ---
interface ReadersDropdownProps {
  collaborators: { id: string; name: string }[];
  selectedReaders: string[];
  onToggleReader: (name: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

function ReadersDropdown({ collaborators, selectedReaders, onToggleReader, onSelectAll, onDeselectAll }: ReadersDropdownProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return collaborators;
    const q = search.toLowerCase();
    return collaborators.filter(c => c.name.toLowerCase().includes(q));
  }, [collaborators, search]);

  const allSelected = collaborators.length > 0 && selectedReaders.length === collaborators.length;

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-md border text-xs transition-all',
              'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-600',
              selectedReaders.length === 0 && 'text-red-500',
              selectedReaders.length > 0 && 'text-red-700 dark:text-red-400'
            )}
          >
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {selectedReaders.length === 0
                ? 'Selecione quem deve confirmar ciência'
                : `${selectedReaders.length} colaborador${selectedReaders.length > 1 ? 'es' : ''} selecionado${selectedReaders.length > 1 ? 's' : ''}`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar colaborador..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 pl-7 text-xs"
              />
            </div>
          </div>
          {/* Select all / deselect all */}
          <div className="px-2 py-1.5 border-b border-border">
            <button
              type="button"
              onClick={allSelected ? onDeselectAll : onSelectAll}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
          </div>
          {/* List */}
          <ScrollArea className="max-h-[180px]">
            <div className="p-1.5 space-y-0.5">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhum resultado</p>
              ) : (
                filtered.map((collab) => (
                  <label
                    key={collab.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selectedReaders.includes(collab.name)}
                      onCheckedChange={() => onToggleReader(collab.name)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs">{collab.name}</span>
                  </label>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      {selectedReaders.length === 0 && (
        <p className="text-[10px] text-red-500 px-1">Selecione pelo menos um colaborador</p>
      )}
      {selectedReaders.length > 0 && (
        <div className="flex flex-wrap gap-1 px-1">
          {selectedReaders.map(name => (
            <Badge key={name} variant="secondary" className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// --- CommentItem ---
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
  onEdit: (newText: string) => void;
}

function CommentItem({ comment, currentUserName, isAdmin, collaborators, onDelete, onTogglePin, onToggleRead, onConfirmReading, onClose, onReopen, onUpdateReaders, onEdit }: CommentItemProps) {
  const [showEditReaders, setShowEditReaders] = useState(false);
  const [editReaders, setEditReaders] = useState<string[]>(comment.requiredReaders);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.commentText);

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

  const handleSaveEdit = () => {
    if (editText.trim() && editText.trim() !== comment.commentText) {
      onEdit(editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(comment.commentText);
    setIsEditing(false);
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
          {comment.isEdited && (
            <span className="text-[9px] text-muted-foreground italic">(editada)</span>
          )}
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
          <button onClick={() => { setEditText(comment.commentText); setIsEditing(true); }} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Editar">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Excluir">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Comment Text */}
      {isEditing ? (
        <div className="space-y-2 mb-3">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
            className="min-h-[60px] resize-none text-sm"
            autoFocus
          />
          <div className="flex gap-1 justify-end">
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={handleCancelEdit}>
              <X className="w-3 h-3 mr-1" /> Cancelar
            </Button>
            <Button size="sm" className="h-6 text-xs" onClick={handleSaveEdit} disabled={!editText.trim()}>
              <Check className="w-3 h-3 mr-1" /> Salvar
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-foreground whitespace-pre-wrap mb-3">{comment.commentText}</p>
      )}

      {/* Ciência status */}
      {isCiencia && totalRequired > 0 && (
        <div className="space-y-2.5 mb-3 p-3 rounded-md bg-muted/40 border border-border/60">
          {/* Status header */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Confirmações de ciência</span>
            {comment.isClosed ? (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-muted-foreground/30 text-muted-foreground gap-1">
                <Lock className="w-2.5 h-2.5" /> Encerrado por {comment.closedBy}
              </Badge>
            ) : isFullyRead ? (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-green-400 text-green-600 dark:text-green-400 gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> {confirmedCount}/{totalRequired}
              </Badge>
            ) : isPartial ? (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-amber-400 text-amber-600 dark:text-amber-400 gap-1">
                <Clock className="w-2.5 h-2.5" /> {confirmedCount}/{totalRequired}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-red-400 text-red-600 dark:text-red-400 gap-1">
                <Clock className="w-2.5 h-2.5" /> 0/{totalRequired}
              </Badge>
            )}
          </div>
          {/* Readers list */}
          <div className="flex flex-wrap gap-1.5">
            {comment.requiredReaders.map((reader) => {
              const confirmed = !!comment.readTimestamps[reader];
              return (
                <div
                  key={reader}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors',
                    confirmed
                      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                      : 'bg-background text-muted-foreground border-border'
                  )}
                >
                  {confirmed ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Clock className="w-3 h-3 opacity-50" />}
                  <span>{reader}</span>
                  {confirmed && (
                    <span className="text-[8px] opacity-60 ml-0.5">
                      {format(new Date(comment.readTimestamps[reader]), 'dd/MM HH:mm', { locale: ptBR })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Confirm button */}
          {userNeedsToConfirm && (
            <Button size="sm" className="h-8 text-xs w-full mt-1 gap-1.5" onClick={onConfirmReading}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar minha ciência
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

      {/* WhatsApp-style read status */}
      <ReadStatusBar
        comment={comment}
        currentUserName={currentUserName}
        isAdmin={isAdmin}
        collaborators={collaborators}
        onToggleRead={onToggleRead}
      />
    </div>
  );
}

// --- ReadStatusBar (WhatsApp-style) ---
interface ReadStatusBarProps {
  comment: ClientComment;
  currentUserName: string;
  isAdmin: boolean;
  collaborators: { id: string; name: string; color?: string }[];
  onToggleRead: (collaborator: ReadStatusName) => void;
}

function ReadStatusBar({ comment, currentUserName, isAdmin, collaborators, onToggleRead }: ReadStatusBarProps) {
  const [showInfo, setShowInfo] = useState(false);

  const currentReadStatusName = currentUserName.toLowerCase() as ReadStatusName;
  const canMarkSelf = READ_STATUS_NAMES.includes(currentReadStatusName);
  const selfIsRead = canMarkSelf && comment.readStatus[currentReadStatusName];

  const currentCollaborator = collaborators.find(c => c.name.toLowerCase() === currentReadStatusName);
  const selfColor = currentCollaborator?.color || '#6B7280';

  const readCount = READ_STATUS_NAMES.filter(n => comment.readStatus[n]).length;
  const allRead = readCount === READ_STATUS_NAMES.length;

  return (
    <div className="flex items-center justify-between pt-2 border-t border-border">
      {/* Left: self check button */}
      <div className="flex items-center gap-1.5">
        {canMarkSelf && (
          <button
            onClick={() => onToggleRead(currentReadStatusName)}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all',
              selfIsRead ? 'text-white' : 'text-muted-foreground bg-muted hover:bg-muted/80'
            )}
            style={selfIsRead ? { backgroundColor: selfColor } : {}}
            title={selfIsRead ? 'Desmarcar como lido' : 'Marcar como lido'}
          >
            {selfIsRead ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
            {selfIsRead ? 'Lido' : 'Marcar lido'}
          </button>
        )}
        <span className="text-[9px] text-muted-foreground">
          {allRead ? (
            <span className="text-green-600 dark:text-green-400">Todos leram</span>
          ) : (
            `${readCount}/${READ_STATUS_NAMES.length}`
          )}
        </span>
      </div>

      {/* Right: info popover */}
      <Popover open={showInfo} onOpenChange={setShowInfo}>
        <PopoverTrigger asChild>
          <button
            className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            title="Ver quem leu"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="end">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">Lida por</p>
            {isAdmin && (
              <div className="flex gap-1">
                <button
                  onClick={() => READ_STATUS_NAMES.forEach(n => { if (!comment.readStatus[n]) onToggleRead(n); })}
                  className="text-[9px] font-medium text-primary hover:underline"
                  title="Marcar todos como lido"
                >
                  Todos
                </button>
                <span className="text-[9px] text-muted-foreground">|</span>
                <button
                  onClick={() => READ_STATUS_NAMES.forEach(n => { if (comment.readStatus[n]) onToggleRead(n); })}
                  className="text-[9px] font-medium text-destructive hover:underline"
                  title="Desmarcar todos"
                >
                  Nenhum
                </button>
              </div>
            )}
          </div>
          <div className="p-2 space-y-1">
            {READ_STATUS_NAMES.map((name) => {
              const collab = collaborators.find(c => c.name.toLowerCase() === name);
              const color = collab?.color || '#6B7280';
              const isRead = comment.readStatus[name];
              return (
                <div key={name} className="flex items-center justify-between gap-2 px-1.5 py-1 rounded hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs capitalize">{name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isRead ? (
                      <span className="flex items-center gap-0.5 text-[9px] text-green-600 dark:text-green-400">
                        <CheckCheck className="w-3 h-3" />
                        {isAdmin && (
                          <button
                            onClick={() => onToggleRead(name)}
                            className="ml-0.5 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title={`Desmarcar ${name}`}
                          >
                            <EyeOff className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ) : (
                      <>
                        <span className="text-[9px] text-muted-foreground">Pendente</span>
                        {isAdmin && (
                          <button
                            onClick={() => onToggleRead(name)}
                            className="ml-1 p-0.5 rounded hover:bg-primary/10 text-primary transition-colors"
                            title={`Marcar ${name} como lido`}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
