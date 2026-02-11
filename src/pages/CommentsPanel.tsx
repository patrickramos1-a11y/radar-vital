import { useState, useEffect, useCallback, useMemo } from "react";
import { MessageSquare, User, Clock, Check, CheckCheck, Eye, EyeOff, Pin, Trash2, Filter, Info, AlertTriangle, ShieldAlert, Lock, Unlock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualPanelHeader, KPICard } from "@/components/visual-panels/VisualPanelHeader";
import { VisualGrid } from "@/components/visual-panels/VisualGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useClients } from "@/contexts/ClientContext";
import { useAuth } from "@/contexts/AuthContext";
import { COLLABORATOR_COLORS, CollaboratorName, COLLABORATOR_NAMES } from "@/types/client";
import { CommentType, COMMENT_TYPE_LABELS } from "@/types/comment";
import { toast } from "sonner";

type ReadStatus = 'celine' | 'gabi' | 'darley' | 'vanessa' | 'patrick';
const READ_STATUS_NAMES: ReadStatus[] = ['patrick', 'celine', 'gabi', 'darley', 'vanessa'];

interface CommentWithClient {
  id: string;
  clientId: string;
  clientName: string;
  clientInitials: string;
  clientLogoUrl?: string;
  authorName: string;
  commentText: string;
  createdAt: string;
  isPinned: boolean;
  readStatus: Record<ReadStatus, boolean>;
  commentType: CommentType;
  requiredReaders: string[];
  readTimestamps: Record<string, string>;
  isClosed: boolean;
  closedBy?: string;
  closedAt?: string;
}

export default function CommentsPanel() {
  const { activeClients } = useClients();
  const { currentUser, collaborators } = useAuth();
  const [comments, setComments] = useState<CommentWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [unreadFilter, setUnreadFilter] = useState<ReadStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CommentType | 'all'>('all');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showMyCiencia, setShowMyCiencia] = useState(false);

  const currentUserName = currentUser?.name || 'Sistema';

  const clientsMap = useMemo(() => {
    const map = new Map<string, { name: string; initials: string; logoUrl?: string }>();
    activeClients.forEach(c => {
      map.set(c.id, { name: c.name, initials: c.initials, logoUrl: c.logoUrl });
    });
    return map;
  }, [activeClients]);

  const fetchComments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('client_comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: CommentWithClient[] = (data || []).map(row => {
        const client = clientsMap.get(row.client_id);
        return {
          id: row.id,
          clientId: row.client_id,
          clientName: client?.name || 'Cliente',
          clientInitials: client?.initials || '??',
          clientLogoUrl: client?.logoUrl,
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
        };
      });

      setComments(mapped);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Erro ao carregar comentários');
    } finally {
      setIsLoading(false);
    }
  }, [clientsMap]);

  useEffect(() => {
    if (clientsMap.size > 0) fetchComments();
  }, [fetchComments, clientsMap]);

  const toggleReadStatus = async (commentId: string, collaborator: ReadStatus) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    const newValue = !comment.readStatus[collaborator];
    const updateField = `read_${collaborator}`;
    try {
      const { error } = await supabase.from('client_comments').update({ [updateField]: newValue }).eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, readStatus: { ...c.readStatus, [collaborator]: newValue } } : c));
    } catch (error) {
      console.error('Error updating read status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const togglePinned = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    const newValue = !comment.isPinned;
    try {
      const { error } = await supabase.from('client_comments').update({ is_pinned: newValue }).eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, isPinned: newValue } : c));
      toast.success(newValue ? 'Comentário fixado' : 'Comentário desafixado');
    } catch (error) {
      console.error('Error toggling pinned:', error);
      toast.error('Erro ao fixar comentário');
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase.from('client_comments').delete().eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comentário excluído');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Erro ao excluir comentário');
    }
  };

  const uniqueAuthors = useMemo(() => {
    const authors = new Set(comments.map(c => c.authorName));
    return Array.from(authors).sort();
  }, [comments]);

  const uniqueClients = useMemo(() => {
    const clients = new Map<string, string>();
    comments.forEach(c => { clients.set(c.clientId, c.clientName); });
    return Array.from(clients.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [comments]);

  const filteredComments = useMemo(() => {
    let result = comments;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.commentText.toLowerCase().includes(query) ||
        c.clientName.toLowerCase().includes(query) ||
        c.authorName.toLowerCase().includes(query)
      );
    }
    if (authorFilter !== 'all') result = result.filter(c => c.authorName === authorFilter);
    if (clientFilter !== 'all') result = result.filter(c => c.clientId === clientFilter);
    if (unreadFilter !== 'all') result = result.filter(c => !c.readStatus[unreadFilter]);
    if (typeFilter !== 'all') result = result.filter(c => c.commentType === typeFilter);
    if (showPinnedOnly) result = result.filter(c => c.isPinned);
    if (showMyCiencia) {
      result = result.filter(c =>
        c.commentType === 'ciencia' &&
        !c.isClosed &&
        c.requiredReaders.includes(currentUserName) &&
        !c.readTimestamps[currentUserName]
      );
    }

    return result;
  }, [comments, searchQuery, authorFilter, clientFilter, unreadFilter, typeFilter, showPinnedOnly, showMyCiencia, currentUserName]);

  const kpis = useMemo(() => {
    const total = comments.length;
    const pinned = comments.filter(c => c.isPinned).length;
    const pendingCiencia = comments.filter(c =>
      c.commentType === 'ciencia' && !c.isClosed &&
      c.requiredReaders.some(r => !c.readTimestamps[r])
    ).length;
    const myCiencia = comments.filter(c =>
      c.commentType === 'ciencia' && !c.isClosed &&
      c.requiredReaders.includes(currentUserName) &&
      !c.readTimestamps[currentUserName]
    ).length;
    const unreadByCollaborator: Record<ReadStatus, number> = { patrick: 0, celine: 0, gabi: 0, darley: 0, vanessa: 0 };
    comments.forEach(c => {
      READ_STATUS_NAMES.forEach(name => { if (!c.readStatus[name]) unreadByCollaborator[name]++; });
    });
    return { total, pinned, pendingCiencia, myCiencia, unreadByCollaborator };
  }, [comments, currentUserName]);

  const typeBadgeStyles: Record<CommentType, string> = {
    informativo: 'bg-muted text-muted-foreground',
    relevante: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    ciencia: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        <VisualPanelHeader
          title="Painel de Comentários"
          subtitle="Todos os comentários por cliente"
          icon={<MessageSquare className="w-5 h-5" />}
        >
          <KPICard icon={<MessageSquare className="w-4 h-4" />} value={kpis.total} label="Total" />
          <KPICard icon={<Pin className="w-4 h-4" />} value={kpis.pinned} label="Fixados" variant="info" />
          <KPICard icon={<ShieldAlert className="w-4 h-4" />} value={kpis.pendingCiencia} label="Ciência Pend." variant="danger" />
          {kpis.myCiencia > 0 && (
            <div
              className={cn("flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer transition-all border-red-400 bg-red-50 dark:bg-red-900/20", showMyCiencia && "ring-2 ring-offset-1 ring-red-400")}
              onClick={() => setShowMyCiencia(!showMyCiencia)}
            >
              <ShieldAlert className="w-3 h-3 text-red-600" />
              <span className="text-sm font-bold text-red-600">{kpis.myCiencia}</span>
              <span className="text-[9px] text-red-500">Minha ciência</span>
            </div>
          )}

          <div className="w-px h-8 bg-border" />

          {READ_STATUS_NAMES.map((name) => {
            const color = name === 'patrick' ? '#10B981' : COLLABORATOR_COLORS[name as CollaboratorName];
            const unread = kpis.unreadByCollaborator[name];
            return (
              <div
                key={name}
                className={cn("flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer transition-all", unreadFilter === name && "ring-2 ring-offset-1")}
                style={{ borderColor: color, backgroundColor: `${color}15`, ...(unreadFilter === name && { ringColor: color }) }}
                onClick={() => setUnreadFilter(unreadFilter === name ? 'all' : name)}
              >
                <EyeOff className="w-3 h-3" style={{ color }} />
                <span className="text-sm font-bold" style={{ color }}>{unread}</span>
                <span className="text-[9px] text-muted-foreground uppercase">{name}</span>
              </div>
            );
          })}
        </VisualPanelHeader>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-muted/30 border-b">
          <Input placeholder="Buscar comentários..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-64 h-9" />

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as CommentType | 'all')}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="informativo">Informativo</SelectItem>
              <SelectItem value="relevante">Relevante</SelectItem>
              <SelectItem value="ciencia">Ciência Obrigatória</SelectItem>
            </SelectContent>
          </Select>

          <Select value={authorFilter} onValueChange={setAuthorFilter}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Autor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os autores</SelectItem>
              {uniqueAuthors.map((author) => (<SelectItem key={author} value={author}>{author}</SelectItem>))}
            </SelectContent>
          </Select>

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Cliente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {uniqueClients.map(([id, name]) => (<SelectItem key={id} value={id}>{name}</SelectItem>))}
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={showPinnedOnly} onCheckedChange={(checked) => setShowPinnedOnly(!!checked)} />
            <Pin className="w-3.5 h-3.5" />
            <span>Apenas fixados</span>
          </label>

          {(searchQuery || authorFilter !== 'all' || clientFilter !== 'all' || unreadFilter !== 'all' || typeFilter !== 'all' || showPinnedOnly || showMyCiencia) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setAuthorFilter('all'); setClientFilter('all'); setUnreadFilter('all'); setTypeFilter('all'); setShowPinnedOnly(false); setShowMyCiencia(false); }}>
              Limpar filtros
            </Button>
          )}

          <div className="flex-1" />
          <Badge variant="secondary">{filteredComments.length} comentários</Badge>
        </div>

        {/* Comments Grid */}
        <VisualGrid itemCount={filteredComments.length}>
          {filteredComments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUserName={currentUserName}
              collaborators={collaborators}
              onToggleRead={toggleReadStatus}
              onTogglePinned={togglePinned}
              onDelete={deleteComment}
            />
          ))}
        </VisualGrid>

        {filteredComments.length === 0 && !isLoading && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum comentário encontrado</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

interface CommentCardProps {
  comment: CommentWithClient;
  currentUserName: string;
  collaborators: { id: string; name: string; color?: string }[];
  onToggleRead: (id: string, collaborator: ReadStatus) => void;
  onTogglePinned: (id: string) => void;
  onDelete: (id: string) => void;
}

function CommentCard({ comment, currentUserName, collaborators, onToggleRead, onTogglePinned, onDelete }: CommentCardProps) {
  const isCiencia = comment.commentType === 'ciencia';
  const confirmedCount = isCiencia ? comment.requiredReaders.filter(r => comment.readTimestamps[r]).length : 0;
  const totalRequired = isCiencia ? comment.requiredReaders.length : 0;
  const isFullyRead = isCiencia && totalRequired > 0 && confirmedCount === totalRequired;
  const isPending = isCiencia && confirmedCount === 0 && totalRequired > 0;

  const typeBadgeStyles: Record<CommentType, string> = {
    informativo: 'bg-muted text-muted-foreground',
    relevante: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    ciencia: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const cienciaBorderClass = comment.isClosed ? 'border-muted' : isPending ? 'border-red-300 dark:border-red-700' : isFullyRead ? 'border-green-300 dark:border-green-700' : 'border-amber-300 dark:border-amber-700';

  return (
    <div
      className={cn(
        "group relative rounded-xl border-2 bg-card p-3 transition-all duration-200",
        "hover:border-primary/50 hover:shadow-lg",
        comment.isPinned && "border-amber-500/50 bg-amber-500/5",
        isCiencia && !comment.isPinned ? cienciaBorderClass : !comment.isPinned && "border-border",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
        {comment.clientLogoUrl ? (
          <img src={comment.clientLogoUrl} alt={comment.clientName} className="w-8 h-8 object-contain rounded-lg bg-white p-0.5" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{comment.clientInitials}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-foreground truncate text-xs">{comment.clientName}</h3>
            <Badge variant="secondary" className={cn('text-[8px] px-1 py-0 h-4 shrink-0', typeBadgeStyles[comment.commentType])}>
              {COMMENT_TYPE_LABELS[comment.commentType]}
            </Badge>
            {comment.isClosed && (
              <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4 shrink-0 bg-muted text-muted-foreground">
                <Lock className="w-2 h-2 mr-0.5" />Encerrado
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <User className="w-2.5 h-2.5" />
            <span>{comment.authorName}</span>
            <span>•</span>
            <Clock className="w-2.5 h-2.5" />
            <span>{format(new Date(comment.createdAt), "dd/MM HH:mm", { locale: ptBR })}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className={cn("h-6 w-6", comment.isPinned && "text-amber-500")} onClick={() => onTogglePinned(comment.id)}>
            <Pin className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => onDelete(comment.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Text */}
      <p className="text-sm text-foreground mb-3 line-clamp-4">{comment.commentText}</p>

      {/* Ciência status */}
      {isCiencia && totalRequired > 0 && (
        <div className="flex flex-wrap items-center gap-1 mb-2">
          {comment.isClosed ? (
            <Badge variant="secondary" className="text-[9px]"><Lock className="w-2.5 h-2.5 mr-0.5" />Encerrado</Badge>
          ) : isFullyRead ? (
            <Badge className="text-[9px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />{confirmedCount}/{totalRequired}</Badge>
          ) : (
            <Badge className={cn("text-[9px]", isPending ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400")}>
              <Clock className="w-2.5 h-2.5 mr-0.5" />{confirmedCount}/{totalRequired}
            </Badge>
          )}
          {comment.requiredReaders.map(reader => {
            const confirmed = !!comment.readTimestamps[reader];
            return (
              <span key={reader} className={cn('text-[9px] px-1.5 py-0.5 rounded', confirmed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400')}>
                {confirmed ? '✓' : '○'} {reader}
              </span>
            );
          })}
        </div>
      )}

      {/* WhatsApp-style Read Status */}
      <PanelReadStatusBar
        comment={comment}
        currentUserName={currentUserName}
        isAdmin={currentUserName === 'Patrick'}
        collaborators={collaborators}
        onToggleRead={(name) => onToggleRead(comment.id, name)}
      />
    </div>
  );
}

// --- PanelReadStatusBar (WhatsApp-style) ---


interface PanelReadStatusBarProps {
  comment: CommentWithClient;
  currentUserName: string;
  isAdmin: boolean;
  collaborators: { id: string; name: string; color?: string }[];
  onToggleRead: (collaborator: ReadStatus) => void;
}

function PanelReadStatusBar({ comment, currentUserName, isAdmin, collaborators, onToggleRead }: PanelReadStatusBarProps) {
  const [showInfo, setShowInfo] = useState(false);

  const currentReadStatusName = currentUserName.toLowerCase() as ReadStatus;
  const canMarkSelf = READ_STATUS_NAMES.includes(currentReadStatusName);
  const selfIsRead = canMarkSelf && comment.readStatus[currentReadStatusName];

  const currentCollaborator = collaborators.find(c => c.name.toLowerCase() === currentReadStatusName);
  const selfColor = currentCollaborator?.color || '#6B7280';

  const readCount = READ_STATUS_NAMES.filter(n => comment.readStatus[n]).length;
  const allRead = readCount === READ_STATUS_NAMES.length;

  return (
    <div className="flex items-center justify-between pt-2 border-t border-border">
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

      <Popover open={showInfo} onOpenChange={setShowInfo}>
        <PopoverTrigger asChild>
          <button className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-muted text-muted-foreground transition-colors" title="Ver quem leu">
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
                >
                  Todos
                </button>
                <span className="text-[9px] text-muted-foreground">|</span>
                <button
                  onClick={() => READ_STATUS_NAMES.forEach(n => { if (comment.readStatus[n]) onToggleRead(n); })}
                  className="text-[9px] font-medium text-destructive hover:underline"
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
                          <button onClick={() => onToggleRead(name)} className="ml-0.5 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title={`Desmarcar ${name}`}>
                            <EyeOff className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ) : (
                      <>
                        <span className="text-[9px] text-muted-foreground">Pendente</span>
                        {isAdmin && (
                          <button onClick={() => onToggleRead(name)} className="ml-1 p-0.5 rounded hover:bg-primary/10 text-primary transition-colors" title={`Marcar ${name} como lido`}>
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
