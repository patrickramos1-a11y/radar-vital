import { useState, useEffect, useCallback, useMemo } from "react";
import { MessageSquare, User, Clock, Check, CheckCheck, Eye, EyeOff, Pin, Trash2, Filter, Info, AlertTriangle, ShieldAlert, Lock, Unlock, CheckCircle2, Send, Loader2, ChevronDown, Search, Users, Plus, Pencil, X, Archive, Reply } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualPanelHeader, KPICard } from "@/components/visual-panels/VisualPanelHeader";
import { VisualGrid } from "@/components/visual-panels/VisualGrid";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  isEdited: boolean;
  isArchived: boolean;
  archivedBy?: string;
  archivedAt?: string;
  replyToId?: string;
}

// Helper: is a comment fully read by all 5 collaborators?
function isCommentFullyRead(comment: CommentWithClient): boolean {
  return READ_STATUS_NAMES.every(n => comment.readStatus[n]);
}

// Helper: is Patrick blocked from marking as read?
function isPatrickBlocked(comment: CommentWithClient): boolean {
  const othersNames = READ_STATUS_NAMES.filter(n => n !== 'patrick');
  return !othersNames.every(n => comment.readStatus[n]);
}

type ViewFilter = 'pendentes' | 'lidos' | 'arquivados' | 'todos';

export default function CommentsPanel() {
  const { activeClients } = useClients();
  const { currentUser, collaborators } = useAuth();
  const [comments, setComments] = useState<CommentWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<CommentType | 'all'>('all');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showMyCiencia, setShowMyCiencia] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newCommentType, setNewCommentType] = useState<CommentType>('informativo');
  const [newClientId, setNewClientId] = useState<string>('');
  const [newSelectedReaders, setNewSelectedReaders] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewFilter, setViewFilter] = useState<ViewFilter>('todos');
  const [replyingTo, setReplyingTo] = useState<CommentWithClient | null>(null);

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
          isEdited: row.is_edited ?? false,
          isArchived: row.is_archived ?? false,
          archivedBy: row.archived_by || undefined,
          archivedAt: row.archived_at || undefined,
          replyToId: row.reply_to_id || undefined,
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

  const confirmReading = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    const userName = currentUserName;
    const newTimestamps = { ...comment.readTimestamps, [userName]: new Date().toISOString() };
    try {
      const { error } = await supabase
        .from('client_comments')
        .update({ read_timestamps: newTimestamps as any })
        .eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, readTimestamps: newTimestamps } : c
      ));
      toast.success('Ciência confirmada');
    } catch (error) {
      console.error('Error confirming reading:', error);
      toast.error('Erro ao confirmar ciência');
    }
  };

  const closeComment = async (commentId: string) => {
    const userName = currentUserName;
    try {
      const { error } = await supabase
        .from('client_comments')
        .update({ is_closed: true, closed_by: userName, closed_at: new Date().toISOString() })
        .eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, isClosed: true, closedBy: userName, closedAt: new Date().toISOString() } : c
      ));
      toast.success('Comentário encerrado');
    } catch (error) {
      console.error('Error closing comment:', error);
      toast.error('Erro ao encerrar comentário');
    }
  };

  const reopenComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('client_comments')
        .update({ is_closed: false, closed_by: null, closed_at: null })
        .eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, isClosed: false, closedBy: undefined, closedAt: undefined } : c
      ));
      toast.success('Comentário reaberto');
    } catch (error) {
      console.error('Error reopening comment:', error);
      toast.error('Erro ao reabrir comentário');
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

  const editComment = async (commentId: string, newText: string) => {
    try {
      const { error } = await supabase
        .from('client_comments')
        .update({ comment_text: newText, is_edited: true })
        .eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, commentText: newText, isEdited: true } : c
      ));
      toast.success('Comentário editado');
    } catch (error) {
      console.error('Error editing comment:', error);
      toast.error('Erro ao editar comentário');
    }
  };

  const archiveComment = async (commentId: string) => {
    const userName = currentUserName;
    try {
      const { error } = await supabase.from('client_comments').update({ is_archived: true, archived_by: userName, archived_at: new Date().toISOString() }).eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, isArchived: true, archivedBy: userName, archivedAt: new Date().toISOString() } : c));
      toast.success('Comentário arquivado');
    } catch (error) { console.error('Error archiving:', error); toast.error('Erro ao arquivar'); }
  };

  const unarchiveComment = async (commentId: string) => {
    try {
      const { error } = await supabase.from('client_comments').update({ is_archived: false, archived_by: null, archived_at: null }).eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, isArchived: false, archivedBy: undefined, archivedAt: undefined } : c));
      toast.success('Comentário desarquivado');
    } catch (error) { console.error('Error unarchiving:', error); toast.error('Erro ao desarquivar'); }
  };

  const addComment = async () => {
    if (!newComment.trim() || !newClientId) return;
    setIsSubmitting(true);
    try {
      const insertData: any = {
        client_id: newClientId,
        author_name: currentUserName,
        comment_text: newComment.trim(),
        comment_type: newCommentType,
        required_readers: newCommentType === 'ciencia' ? newSelectedReaders : [],
        read_timestamps: {},
        ...(replyingTo ? { reply_to_id: replyingTo.id } : {}),
      };
      const { error } = await supabase.from('client_comments').insert(insertData);
      if (error) throw error;
      setNewComment('');
      setNewCommentType('informativo');
      setNewClientId('');
      setNewSelectedReaders([]);
      setReplyingTo(null);
      setShowNewForm(false);
      toast.success('Comentário adicionado');
      await fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erro ao adicionar comentário');
    } finally {
      setIsSubmitting(false);
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

  const currentReadStatusName = currentUserName.toLowerCase() as ReadStatus;
  const canReadSelf = READ_STATUS_NAMES.includes(currentReadStatusName);

  // Global: active (non-archived) comments
  const activeComments = useMemo(() => comments.filter(c => !c.isArchived), [comments]);
  const archivedComments = useMemo(() => comments.filter(c => c.isArchived), [comments]);
  // Per-user: pending = active + not read by me; read = active + read by me
  const pendingComments = useMemo(() => activeComments.filter(c => !canReadSelf || !c.readStatus[currentReadStatusName]), [activeComments, canReadSelf, currentReadStatusName]);
  const readComments = useMemo(() => activeComments.filter(c => canReadSelf && c.readStatus[currentReadStatusName]), [activeComments, canReadSelf, currentReadStatusName]);

  // Build replies map from ALL comments
  const repliesMap = useMemo(() => {
    const map = new Map<string, CommentWithClient[]>();
    comments.forEach(c => {
      if (c.replyToId) {
        const list = map.get(c.replyToId) || [];
        list.push(c);
        map.set(c.replyToId, list);
      }
    });
    map.forEach((replies) => replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    return map;
  }, [comments]);

  const filteredComments = useMemo(() => {
    let result = viewFilter === 'pendentes' ? pendingComments : viewFilter === 'lidos' ? readComments : viewFilter === 'arquivados' ? archivedComments : activeComments;

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

    // Show all comments flat (no threading)
    return result;
  }, [comments, pendingComments, readComments, archivedComments, viewFilter, searchQuery, authorFilter, clientFilter, typeFilter, showPinnedOnly, showMyCiencia, currentUserName]);

  const kpis = useMemo(() => {
    const totalActive = activeComments.length;
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
    // Pending per collaborator: count of NON-ARCHIVED comments where that person hasn't read
    const pendingByCollaborator: Record<ReadStatus, number> = { patrick: 0, celine: 0, gabi: 0, darley: 0, vanessa: 0 };
    activeComments.forEach(c => {
      READ_STATUS_NAMES.forEach(name => { if (!c.readStatus[name]) pendingByCollaborator[name]++; });
    });
    return { totalActive, pinned, pendingCiencia, myCiencia, pendingByCollaborator };
  }, [comments, activeComments, currentUserName]);

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
          <KPICard icon={<MessageSquare className="w-4 h-4" />} value={kpis.totalActive} label="Ativos" variant="danger" />
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
            const pending = kpis.pendingByCollaborator[name];
            return (
              <div
                key={name}
                className="flex items-center gap-1.5 px-2 py-1 rounded border transition-all"
                style={{ borderColor: color, backgroundColor: `${color}15` }}
              >
                <EyeOff className="w-3 h-3" style={{ color }} />
                <span className="text-sm font-bold" style={{ color }}>{pending}</span>
                <span className="text-[9px] text-muted-foreground uppercase">{name}</span>
              </div>
            );
          })}
        </VisualPanelHeader>

        {/* View filter tabs + Filters */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-muted/30 border-b">
          {/* View filter tabs */}
          <div className="flex gap-1 mr-2">
            <button
              onClick={() => setViewFilter('todos')}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', viewFilter === 'todos' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
            >
              Todos ({activeComments.length})
            </button>
            <button
              onClick={() => setViewFilter('pendentes')}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', viewFilter === 'pendentes' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
            >
              Pendentes ({pendingComments.length})
            </button>
            <button
              onClick={() => setViewFilter('lidos')}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', viewFilter === 'lidos' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
            >
              Lidos ({readComments.length})
            </button>
            <button
              onClick={() => setViewFilter('arquivados')}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all', viewFilter === 'arquivados' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80')}
            >
              Arquivados ({archivedComments.length})
            </button>
          </div>

          <div className="w-px h-6 bg-border" />

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

          {(searchQuery || authorFilter !== 'all' || clientFilter !== 'all' || typeFilter !== 'all' || showPinnedOnly || showMyCiencia) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setAuthorFilter('all'); setClientFilter('all'); setTypeFilter('all'); setShowPinnedOnly(false); setShowMyCiencia(false); }}>
              Limpar filtros
            </Button>
          )}

          <div className="flex-1" />
          <Button size="sm" className="gap-1.5" onClick={() => setShowNewForm(!showNewForm)}>
            <Plus className="w-4 h-4" />
            Novo comentário
          </Button>
          <Badge variant="secondary">{filteredComments.length} comentários</Badge>
        </div>

        {/* New Comment Form */}
        {showNewForm && (
          <div className="px-6 py-4 bg-card border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Novo Comentário</h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setShowNewForm(false); setReplyingTo(null); }}>Fechar</Button>
            </div>

            {/* Reply indicator */}
            {replyingTo && (
              <div className="flex items-stretch gap-0 rounded-md overflow-hidden border border-primary/30 bg-primary/5">
                <div className="w-1 bg-primary shrink-0" />
                <div className="flex-1 px-3 py-2 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-primary">Respondendo a {replyingTo.authorName} ({replyingTo.clientName})</span>
                    <button onClick={() => setReplyingTo(null)} className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{replyingTo.commentText.slice(0, 80)}{replyingTo.commentText.length > 80 ? '...' : ''}</p>
                </div>
              </div>
            )}
            {/* Client selector */}
            <Select value={newClientId} onValueChange={setNewClientId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Selecione a empresa..." />
              </SelectTrigger>
              <SelectContent>
                {activeClients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                    onClick={() => setNewCommentType(type)}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all',
                      newCommentType === type ? colors[type] + ' ring-2 ring-offset-1 ring-primary/30' : 'bg-background text-muted-foreground border-border hover:bg-muted/50'
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
              {{
                informativo: 'Registro simples sem exigência de confirmação. Ideal para anotações, observações e registros gerais do dia a dia.',
                relevante: 'Destaque visual para informações importantes. Não exige confirmação, mas chama atenção na listagem.',
                ciencia: 'Comunicação formal que exige confirmação de leitura dos colaboradores selecionados.',
              }[newCommentType]}
            </p>

            {/* Required readers for ciencia */}
            {newCommentType === 'ciencia' && (
              <PanelReadersSelector
                collaborators={collaborators}
                selectedReaders={newSelectedReaders}
                onToggleReader={(name) => setNewSelectedReaders(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])}
                onSelectAll={() => setNewSelectedReaders(collaborators.map(c => c.name))}
                onDeselectAll={() => setNewSelectedReaders([])}
              />
            )}

            <Textarea
              placeholder="Adicionar comentário... (Ctrl+Enter para enviar)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) addComment(); }}
              className="min-h-[80px] resize-none"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={addComment}
                disabled={!newComment.trim() || !newClientId || isSubmitting || (newCommentType === 'ciencia' && newSelectedReaders.length === 0)}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                Enviar
              </Button>
            </div>
          </div>
        )}

        {/* Comments Grid */}
        <VisualGrid itemCount={filteredComments.length}>
          {filteredComments.map((comment) => (
            <div key={comment.id}>
              <CommentCard
                comment={comment}
                currentUserName={currentUserName}
                collaborators={collaborators}
                allComments={comments}
                onToggleRead={toggleReadStatus}
                onTogglePinned={togglePinned}
                onDelete={deleteComment}
                onEdit={editComment}
                onConfirmReading={confirmReading}
                onClose={closeComment}
                onReopen={reopenComment}
                onArchive={archiveComment}
                onUnarchive={unarchiveComment}
                onReply={(c) => { setReplyingTo(c); setNewClientId(c.clientId); setShowNewForm(true); }}
              />
            </div>
          ))}
        </VisualGrid>

        {filteredComments.length === 0 && !isLoading && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{viewFilter === 'pendentes' ? 'Nenhum comentário pendente' : viewFilter === 'lidos' ? 'Nenhum comentário lido' : viewFilter === 'arquivados' ? 'Nenhum comentário arquivado' : 'Nenhum comentário encontrado'}</p>
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
  allComments: CommentWithClient[];
  onToggleRead: (id: string, collaborator: ReadStatus) => void;
  onTogglePinned: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
  onConfirmReading: (id: string) => void;
  onClose: (id: string) => void;
  onReopen: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
  onReply: (comment: CommentWithClient) => void;
}

function CommentCard({ comment, currentUserName, collaborators, allComments, onToggleRead, onTogglePinned, onDelete, onEdit, onConfirmReading, onClose, onReopen, onArchive, onUnarchive, onReply }: CommentCardProps) {
  const isAdmin = currentUserName === 'Patrick';
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.commentText);
  const isCiencia = comment.commentType === 'ciencia';
  const confirmedCount = isCiencia ? comment.requiredReaders.filter(r => comment.readTimestamps[r]).length : 0;
  const totalRequired = isCiencia ? comment.requiredReaders.length : 0;
  const isFullyReadCiencia = isCiencia && totalRequired > 0 && confirmedCount === totalRequired;
  const isPending = isCiencia && confirmedCount === 0 && totalRequired > 0;
  const isPartial = isCiencia && confirmedCount > 0 && confirmedCount < totalRequired;
  const userNeedsToConfirm = isCiencia && !comment.isClosed && comment.requiredReaders.includes(currentUserName) && !comment.readTimestamps[currentUserName];
  const fullyRead = isCommentFullyRead(comment);

  const typeBadgeStyles: Record<CommentType, string> = {
    informativo: 'bg-muted text-muted-foreground',
    relevante: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    ciencia: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const cienciaBorderClass = comment.isClosed ? 'border-muted' : isPending ? 'border-red-300 dark:border-red-700' : isFullyReadCiencia ? 'border-green-300 dark:border-green-700' : 'border-amber-300 dark:border-amber-700';

  const isOwnComment = comment.authorName.toLowerCase() === currentUserName.toLowerCase();
  const authorCollab = collaborators.find(c => c.name.toLowerCase() === comment.authorName.toLowerCase());
  const authorColor = (authorCollab as any)?.color || '#6B7280';

  return (
    <div
      className={cn(
        "group relative rounded-xl bg-card p-3 transition-all duration-200 h-full flex flex-col",
        isOwnComment
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/30'
          : 'border border-border',
        "hover:shadow-lg",
        fullyRead && "opacity-60",
        comment.isPinned && "ring-1 ring-amber-400/60",
        isCiencia && !comment.isPinned && cienciaBorderClass && 'border-2',
      )}
    >
      {/* Hover actions */}
      <div className="absolute -top-3 right-2 flex items-center gap-0.5 bg-card border border-border rounded-lg shadow-md px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button className={cn("p-1 rounded hover:bg-muted transition-colors", comment.isPinned && "text-amber-500")} onClick={() => onTogglePinned(comment.id)} title={comment.isPinned ? 'Desafixar' : 'Fixar'}>
          <Pin className={cn("w-3 h-3", comment.isPinned && "fill-current")} />
        </button>
        <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors" onClick={() => { setEditText(comment.commentText); setIsEditing(true); }} title="Editar">
          <Pencil className="w-3 h-3" />
        </button>
        {isAdmin && isCiencia && (
          !comment.isClosed ? (
            <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-orange-500 transition-colors" onClick={() => onClose(comment.id)} title="Encerrar">
              <Lock className="w-3 h-3" />
            </button>
          ) : (
            <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-green-500 transition-colors" onClick={() => onReopen(comment.id)} title="Reabrir">
              <Unlock className="w-3 h-3" />
            </button>
          )
        )}
        {!comment.isArchived ? (
          <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors" onClick={() => onArchive(comment.id)} title="Arquivar">
            <Archive className="w-3 h-3" />
          </button>
        ) : (
          <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-green-500 transition-colors" onClick={() => onUnarchive(comment.id)} title="Desarquivar">
            <Archive className="w-3 h-3" />
          </button>
        )}
        <button className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" onClick={() => onDelete(comment.id)} title="Excluir">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Client + Author header */}
      <div className="flex items-center gap-2 mb-2">
        {comment.clientLogoUrl ? (
          <img src={comment.clientLogoUrl} alt={comment.clientName} className="w-7 h-7 object-contain rounded-lg bg-white p-0.5" />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary">{comment.clientInitials}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-foreground truncate text-xs">{comment.clientName}</h3>
            <Badge variant="secondary" className={cn('text-[8px] px-1 py-0 h-3.5 shrink-0', typeBadgeStyles[comment.commentType])}>
              {COMMENT_TYPE_LABELS[comment.commentType]}
            </Badge>
            {comment.isArchived && (
              <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 shrink-0 bg-muted text-muted-foreground">
                <Archive className="w-2 h-2 mr-0.5" />Arq.
              </Badge>
            )}
            {comment.isClosed && (
              <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 shrink-0 bg-muted text-muted-foreground">
                <Lock className="w-2 h-2 mr-0.5" />Enc.
              </Badge>
            )}
          </div>
          <span className="text-[10px] font-semibold" style={{ color: authorColor }}>{comment.authorName}</span>
        </div>
      </div>

      {/* Reply quote */}
      {comment.replyToId && (() => {
        const parentComment = allComments.find(c => c.id === comment.replyToId);
        const parentCollab = parentComment ? collaborators.find(c => c.name.toLowerCase() === parentComment.authorName.toLowerCase()) : null;
        const parentColor = (parentCollab as any)?.color || '#6B7280';
        return parentComment ? (
          <div className="flex items-stretch gap-0 rounded-lg overflow-hidden mb-2 bg-muted/50">
            <div className="w-1 shrink-0" style={{ backgroundColor: parentColor }} />
            <div className="px-2 py-1 min-w-0">
              <span className="text-[10px] font-semibold" style={{ color: parentColor }}>{parentComment.authorName}</span>
              <p className="text-[10px] text-muted-foreground truncate">{parentComment.commentText.slice(0, 80)}{parentComment.commentText.length > 80 ? '...' : ''}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1 mb-2 text-[10px] text-muted-foreground italic">
            <Reply className="w-3 h-3" /> Resposta a comentário removido
          </div>
        );
      })()}

      {/* Text */}
      {isEditing ? (
        <div className="space-y-2 mb-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                if (editText.trim() && editText.trim() !== comment.commentText) onEdit(comment.id, editText.trim());
                setIsEditing(false);
              }
              if (e.key === 'Escape') { setEditText(comment.commentText); setIsEditing(false); }
            }}
            className="min-h-[60px] resize-none text-sm"
            autoFocus
          />
          <div className="flex gap-1 justify-end">
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => { setEditText(comment.commentText); setIsEditing(false); }}>
              <X className="w-3 h-3 mr-1" /> Cancelar
            </Button>
            <Button size="sm" className="h-6 text-xs" onClick={() => { if (editText.trim() && editText.trim() !== comment.commentText) onEdit(comment.id, editText.trim()); setIsEditing(false); }} disabled={!editText.trim()}>
              <Check className="w-3 h-3 mr-1" /> Salvar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 max-h-[180px] overflow-y-auto mb-2">
          <p className="text-sm text-foreground whitespace-pre-wrap">{comment.commentText}</p>
        </div>
      )}

      {/* Ciência status */}
      {isCiencia && totalRequired > 0 && (
        <div className="space-y-2 mb-2 p-2 rounded-lg bg-muted/40 border border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Ciência</span>
            {comment.isClosed ? (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-muted-foreground/30 text-muted-foreground gap-1">
                <Lock className="w-2 h-2" /> Encerrado
              </Badge>
            ) : isFullyReadCiencia ? (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-green-400 text-green-600 dark:text-green-400 gap-1">
                <CheckCircle2 className="w-2 h-2" /> {confirmedCount}/{totalRequired}
              </Badge>
            ) : isPartial ? (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-400 text-amber-600 dark:text-amber-400 gap-1">
                <Clock className="w-2 h-2" /> {confirmedCount}/{totalRequired}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-red-400 text-red-600 dark:text-red-400 gap-1">
                <Clock className="w-2 h-2" /> 0/{totalRequired}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {comment.requiredReaders.map((reader) => {
              const confirmed = !!comment.readTimestamps[reader];
              return (
                <div
                  key={reader}
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium border transition-colors',
                    confirmed
                      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                      : 'bg-background text-muted-foreground border-border'
                  )}
                >
                  {confirmed ? <CheckCircle2 className="w-2.5 h-2.5 text-green-500" /> : <Clock className="w-2.5 h-2.5 opacity-50" />}
                  <span>{reader}</span>
                </div>
              );
            })}
          </div>
          {userNeedsToConfirm && (
            <Button size="sm" className="h-7 text-xs w-full gap-1.5" onClick={() => onConfirmReading(comment.id)}>
              <CheckCircle2 className="w-3 h-3" /> Confirmar ciência
            </Button>
          )}
        </div>
      )}

      {/* Timestamp + read status footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50 mt-auto">
        <span className="text-[10px] text-muted-foreground">
          {format(new Date(comment.createdAt), "dd/MM HH:mm", { locale: ptBR })}
          {comment.isEdited && <span className="italic ml-1">(editada)</span>}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors text-xs"
            onClick={() => onReply(comment)}
            title="Responder"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
          <PanelReadStatusBar
            comment={comment}
            currentUserName={currentUserName}
            isAdmin={currentUserName === 'Patrick'}
            collaborators={collaborators}
            onToggleRead={(name) => onToggleRead(comment.id, name)}
          />
        </div>
      </div>
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

  // Patrick lock rule
  const isPatrick = currentReadStatusName === 'patrick';
  const patrickLocked = isPatrick && !selfIsRead && isPatrickBlocked(comment);

  const currentCollaborator = collaborators.find(c => c.name.toLowerCase() === currentReadStatusName);
  const selfColor = currentCollaborator?.color || '#6B7280';

  const readCount = READ_STATUS_NAMES.filter(n => comment.readStatus[n]).length;
  const allRead = readCount === READ_STATUS_NAMES.length;

  const readNames = READ_STATUS_NAMES.filter(n => comment.readStatus[n]);
  const pendingNames = READ_STATUS_NAMES.filter(n => !comment.readStatus[n]);

  return (
    <div className="flex items-center gap-1.5">
      {canMarkSelf && (
        <button
          onClick={() => !patrickLocked && onToggleRead(currentReadStatusName)}
          disabled={patrickLocked}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
            patrickLocked && 'opacity-50 cursor-not-allowed',
            selfIsRead ? 'text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/80 border border-border'
          )}
          style={selfIsRead ? { backgroundColor: selfColor } : {}}
          title={patrickLocked ? 'Aguardando equipe ler primeiro' : selfIsRead ? 'Desmarcar como lido' : 'Marcar como lido'}
        >
          {selfIsRead ? <CheckCheck className="w-4 h-4" /> : <Check className="w-4 h-4" />}
        </button>
      )}
      <span className="text-[10px] text-muted-foreground font-medium">
        {allRead ? (
          <span className="text-green-600 dark:text-green-400">✓✓</span>
        ) : (
          `${readCount}/${READ_STATUS_NAMES.length}`
        )}
      </span>
      <Popover open={showInfo} onOpenChange={setShowInfo}>
        <PopoverTrigger asChild>
          <button className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-muted text-muted-foreground transition-colors" title="Ver quem leu">
            <Info className="w-3.5 h-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-0" align="end">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">Leitura: {readCount}/{READ_STATUS_NAMES.length}</p>
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
          {/* Read list */}
          {readNames.length > 0 && (
            <div className="px-3 py-1.5">
              <p className="text-[9px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">✅ Lido</p>
              <div className="space-y-1">
                {readNames.map((name) => {
                  const collab = collaborators.find(c => c.name.toLowerCase() === name);
                  const color = collab?.color || '#6B7280';
                  return (
                    <div key={name} className="flex items-center justify-between gap-2 px-1.5 py-0.5 rounded hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-xs capitalize">{name}</span>
                      </div>
                      {isAdmin && (
                        <button onClick={() => onToggleRead(name)} className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title={`Desmarcar ${name}`}>
                          <EyeOff className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* Pending list */}
          {pendingNames.length > 0 && (
            <div className="px-3 py-1.5 border-t border-border">
              <p className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">⏳ Pendente</p>
              <div className="space-y-1">
                {pendingNames.map((name) => {
                  const collab = collaborators.find(c => c.name.toLowerCase() === name);
                  const color = collab?.color || '#6B7280';
                  return (
                    <div key={name} className="flex items-center justify-between gap-2 px-1.5 py-0.5 rounded hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-xs capitalize">{name}</span>
                      </div>
                      {isAdmin && (
                        <button onClick={() => onToggleRead(name)} className="p-0.5 rounded hover:bg-primary/10 text-primary transition-colors" title={`Marcar ${name} como lido`}>
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

// --- PanelReadersSelector ---
interface PanelReadersSelectorProps {
  collaborators: { id: string; name: string }[];
  selectedReaders: string[];
  onToggleReader: (name: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

function PanelReadersSelector({ collaborators, selectedReaders, onToggleReader, onSelectAll, onDeselectAll }: PanelReadersSelectorProps) {
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
          <div className="px-2 py-1.5 border-b border-border">
            <button
              type="button"
              onClick={allSelected ? onDeselectAll : onSelectAll}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
          </div>
          <ScrollArea className="max-h-[180px]">
            <div className="p-1.5 space-y-0.5">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhum resultado</p>
              ) : (
                filtered.map((collab) => (
                  <label key={collab.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer transition-colors">
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
