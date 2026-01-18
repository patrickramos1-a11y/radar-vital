import { useState, useEffect, useCallback, useMemo } from "react";
import { MessageSquare, User, Clock, Check, Eye, EyeOff, Pin, Trash2, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualPanelHeader, KPICard } from "@/components/visual-panels/VisualPanelHeader";
import { VisualGrid } from "@/components/visual-panels/VisualGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useClients } from "@/contexts/ClientContext";
import { COLLABORATOR_COLORS, CollaboratorName, COLLABORATOR_NAMES } from "@/types/client";
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
}

export default function CommentsPanel() {
  const { activeClients } = useClients();
  const [comments, setComments] = useState<CommentWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [unreadFilter, setUnreadFilter] = useState<ReadStatus | 'all'>('all');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // Create client lookup map
  const clientsMap = useMemo(() => {
    const map = new Map<string, { name: string; initials: string; logoUrl?: string }>();
    activeClients.forEach(c => {
      map.set(c.id, { name: c.name, initials: c.initials, logoUrl: c.logoUrl });
    });
    return map;
  }, [activeClients]);

  // Fetch all comments
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
    if (clientsMap.size > 0) {
      fetchComments();
    }
  }, [fetchComments, clientsMap]);

  // Toggle read status for a collaborator
  const toggleReadStatus = async (commentId: string, collaborator: ReadStatus) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const newValue = !comment.readStatus[collaborator];
    const updateField = `read_${collaborator}`;

    try {
      const { error } = await supabase
        .from('client_comments')
        .update({ [updateField]: newValue })
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, readStatus: { ...c.readStatus, [collaborator]: newValue } }
          : c
      ));
    } catch (error) {
      console.error('Error updating read status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  // Toggle pinned
  const togglePinned = async (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const newValue = !comment.isPinned;

    try {
      const { error } = await supabase
        .from('client_comments')
        .update({ is_pinned: newValue })
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, isPinned: newValue } : c
      ));
      toast.success(newValue ? 'Comentário fixado' : 'Comentário desafixado');
    } catch (error) {
      console.error('Error toggling pinned:', error);
      toast.error('Erro ao fixar comentário');
    }
  };

  // Delete comment
  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('client_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comentário excluído');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Erro ao excluir comentário');
    }
  };

  // Get unique authors
  const uniqueAuthors = useMemo(() => {
    const authors = new Set(comments.map(c => c.authorName));
    return Array.from(authors).sort();
  }, [comments]);

  // Get unique clients with comments
  const uniqueClients = useMemo(() => {
    const clients = new Map<string, string>();
    comments.forEach(c => {
      clients.set(c.clientId, c.clientName);
    });
    return Array.from(clients.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [comments]);

  // Filter comments
  const filteredComments = useMemo(() => {
    let result = comments;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.commentText.toLowerCase().includes(query) ||
        c.clientName.toLowerCase().includes(query) ||
        c.authorName.toLowerCase().includes(query)
      );
    }

    // Author filter
    if (authorFilter !== 'all') {
      result = result.filter(c => c.authorName === authorFilter);
    }

    // Client filter
    if (clientFilter !== 'all') {
      result = result.filter(c => c.clientId === clientFilter);
    }

    // Unread filter
    if (unreadFilter !== 'all') {
      result = result.filter(c => !c.readStatus[unreadFilter]);
    }

    // Pinned only
    if (showPinnedOnly) {
      result = result.filter(c => c.isPinned);
    }

    return result;
  }, [comments, searchQuery, authorFilter, clientFilter, unreadFilter, showPinnedOnly]);

  // KPIs
  const kpis = useMemo(() => {
    const total = comments.length;
    const pinned = comments.filter(c => c.isPinned).length;
    const unreadByCollaborator: Record<ReadStatus, number> = {
      patrick: 0, celine: 0, gabi: 0, darley: 0, vanessa: 0
    };
    
    comments.forEach(c => {
      READ_STATUS_NAMES.forEach(name => {
        if (!c.readStatus[name]) {
          unreadByCollaborator[name]++;
        }
      });
    });

    return { total, pinned, unreadByCollaborator };
  }, [comments]);

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <VisualPanelHeader 
          title="Painel de Comentários" 
          subtitle="Todos os comentários por cliente"
          icon={<MessageSquare className="w-5 h-5" />}
        >
          <KPICard icon={<MessageSquare className="w-4 h-4" />} value={kpis.total} label="Total" />
          <KPICard icon={<Pin className="w-4 h-4" />} value={kpis.pinned} label="Fixados" variant="info" />
          
          <div className="w-px h-8 bg-border" />
          
          {/* Unread by collaborator */}
          {READ_STATUS_NAMES.map((name) => {
            const color = name === 'patrick' ? '#10B981' : COLLABORATOR_COLORS[name as CollaboratorName];
            const unread = kpis.unreadByCollaborator[name];
            return (
              <div
                key={name}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer transition-all",
                  unreadFilter === name && "ring-2 ring-offset-1"
                )}
                style={{ 
                  borderColor: color,
                  backgroundColor: `${color}15`,
                  ...(unreadFilter === name && { ringColor: color })
                }}
                onClick={() => setUnreadFilter(unreadFilter === name ? 'all' : name)}
              >
                <EyeOff className="w-3 h-3" style={{ color }} />
                <span className="text-sm font-bold" style={{ color }}>
                  {unread}
                </span>
                <span className="text-[9px] text-muted-foreground uppercase">{name}</span>
              </div>
            );
          })}
        </VisualPanelHeader>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-muted/30 border-b">
          <Input
            placeholder="Buscar comentários..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 h-9"
          />

          <Select value={authorFilter} onValueChange={setAuthorFilter}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Autor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os autores</SelectItem>
              {uniqueAuthors.map((author) => (
                <SelectItem key={author} value={author}>{author}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {uniqueClients.map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox 
              checked={showPinnedOnly} 
              onCheckedChange={(checked) => setShowPinnedOnly(!!checked)} 
            />
            <Pin className="w-3.5 h-3.5" />
            <span>Apenas fixados</span>
          </label>

          {(searchQuery || authorFilter !== 'all' || clientFilter !== 'all' || unreadFilter !== 'all' || showPinnedOnly) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setAuthorFilter('all');
                setClientFilter('all');
                setUnreadFilter('all');
                setShowPinnedOnly(false);
              }}
            >
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
              onToggleRead={toggleReadStatus}
              onTogglePinned={togglePinned}
              onDelete={deleteComment}
            />
          ))}
        </VisualGrid>

        {/* Empty State */}
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

// Comment Card Component
interface CommentCardProps {
  comment: CommentWithClient;
  onToggleRead: (id: string, collaborator: ReadStatus) => void;
  onTogglePinned: (id: string) => void;
  onDelete: (id: string) => void;
}

function CommentCard({ comment, onToggleRead, onTogglePinned, onDelete }: CommentCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border-2 bg-card p-3 transition-all duration-200",
        "border-border hover:border-primary/50 hover:shadow-lg",
        comment.isPinned && "border-amber-500/50 bg-amber-500/5"
      )}
    >
      {/* Header: Client info */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
        {comment.clientLogoUrl ? (
          <img
            src={comment.clientLogoUrl}
            alt={comment.clientName}
            className="w-8 h-8 object-contain rounded-lg bg-white p-0.5"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{comment.clientInitials}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-xs">{comment.clientName}</h3>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <User className="w-2.5 h-2.5" />
            <span>{comment.authorName}</span>
            <span>•</span>
            <Clock className="w-2.5 h-2.5" />
            <span>{format(new Date(comment.createdAt), "dd/MM HH:mm", { locale: ptBR })}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-6 w-6", comment.isPinned && "text-amber-500")}
            onClick={() => onTogglePinned(comment.id)}
          >
            <Pin className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => onDelete(comment.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Comment Text */}
      <p className="text-sm text-foreground mb-3 line-clamp-4">
        {comment.commentText}
      </p>

      {/* Read Status Row */}
      <div className="flex items-center gap-1 pt-2 border-t border-border">
        <span className="text-[10px] text-muted-foreground mr-1">Lido:</span>
        {READ_STATUS_NAMES.map((name) => {
          const color = name === 'patrick' ? '#10B981' : COLLABORATOR_COLORS[name as CollaboratorName];
          const isRead = comment.readStatus[name];
          return (
            <button
              key={name}
              onClick={() => onToggleRead(comment.id, name)}
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
