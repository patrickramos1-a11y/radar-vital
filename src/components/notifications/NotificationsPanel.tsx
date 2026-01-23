import { useState } from 'react';
import { 
  Bell, Filter, X, Clock, FileText, RefreshCw, RotateCcw, 
  Star, Sparkles, MessageCircle, Upload, ListChecks, Users, LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActivityLogs, ActionType, QUICK_FILTER_CATEGORIES, CollaboratorFilterName } from '@/hooks/useActivityLogs';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCollaborators } from '@/hooks/useCollaborators';

// Action type labels and colors
const ACTION_LABELS: Record<string, { label: string; color: string; icon?: React.ReactNode }> = {
  LOGIN: { label: 'Login', color: 'bg-green-500/10 text-green-600 border-green-200' },
  LOGOUT: { label: 'Logout', color: 'bg-gray-500/10 text-gray-600 border-gray-200' },
  IMPORT_DEMANDS: { label: 'Importação', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  IMPORT_LICENSES: { label: 'Importação', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  IMPORT_PROCESSES: { label: 'Importação', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  IMPORT_DATA: { label: 'Importação', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  CREATE_COMMENT: { label: 'Comentário', color: 'bg-sky-500/10 text-sky-600 border-sky-200' },
  DELETE_COMMENT: { label: 'Comentário', color: 'bg-sky-500/10 text-sky-600 border-sky-200' },
  PIN_COMMENT: { label: 'Comentário', color: 'bg-sky-500/10 text-sky-600 border-sky-200' },
  CREATE_TASK: { label: 'Tarefa', color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  COMPLETE_TASK: { label: 'Tarefa', color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  DELETE_TASK: { label: 'Tarefa', color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  UPDATE_TASK: { label: 'Tarefa', color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  TOGGLE_PRIORITY: { label: 'Prioridade', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' },
  TOGGLE_HIGHLIGHT: { label: 'Destaque', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  TOGGLE_ACTIVE: { label: 'Ativação', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200' },
  TOGGLE_CHECKED: { label: 'Seleção', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' },
  TOGGLE_COLLABORATOR: { label: 'Colaborador', color: 'bg-pink-500/10 text-pink-600 border-pink-200' },
  TOGGLE_CLIENT_TYPE: { label: 'Tipo', color: 'bg-teal-500/10 text-teal-600 border-teal-200' },
  UPDATE_DEMAND_STATUS: { label: 'Status', color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  CREATE_DEMAND: { label: 'Demanda', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
  UPDATE_DEMAND: { label: 'Demanda', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
  CHANGE_RESPONSIBLE: { label: 'Responsável', color: 'bg-pink-500/10 text-pink-600 border-pink-200' },
  MOVE_CLIENT: { label: 'Ordenação', color: 'bg-slate-500/10 text-slate-600 border-slate-200' },
};

// Entity type labels
const ENTITY_LABELS: Record<string, string> = {
  session: 'Sessão',
  client: 'Cliente',
  demand: 'Demanda',
  license: 'Licença',
  process: 'Processo',
  task: 'Tarefa',
  comment: 'Comentário',
  import: 'Importação',
};

// Quick filter config
const QUICK_FILTERS: { key: keyof typeof QUICK_FILTER_CATEGORIES; label: string; icon: React.ReactNode }[] = [
  { key: 'priority', label: 'Prioridades', icon: <Star className="w-3 h-3" /> },
  { key: 'highlight', label: 'Destaques', icon: <Sparkles className="w-3 h-3" /> },
  { key: 'comments', label: 'Comentários', icon: <MessageCircle className="w-3 h-3" /> },
  { key: 'imports', label: 'Importações', icon: <Upload className="w-3 h-3" /> },
  { key: 'demands', label: 'Demandas', icon: <FileText className="w-3 h-3" /> },
  { key: 'tasks', label: 'Tarefas', icon: <ListChecks className="w-3 h-3" /> },
  { key: 'collaborators', label: 'Colaboradores', icon: <Users className="w-3 h-3" /> },
  { key: 'session', label: 'Sessões', icon: <LogIn className="w-3 h-3" /> },
];

export function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const { collaborators } = useCollaborators();
  
  // Helper to get user color from collaborators
  const getUserColor = (userName: string): string => {
    const collab = collaborators.find(c => c.name.toLowerCase() === userName.toLowerCase());
    return collab?.color || '#6b7280';
  };
  
  const {
    logs,
    isLoading,
    filters,
    filterOptions,
    updateFilters,
    clearFilters,
    markAsSeen,
    unreadCount,
    isAdmin,
    refetch,
    quickFilter,
    applyQuickFilter,
  } = useActivityLogs();

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      markAsSeen();
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'all' | 'mine');
    updateFilters({ onlyMine: value === 'mine' });
  };

  const hasActiveFilters = 
    filters.userName !== 'all' || 
    filters.actionType !== 'all' || 
    filters.entityType !== 'all' ||
    filters.clientId !== 'all' ||
    quickFilter !== null;

  return (
    <Sheet open={isOpen} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Bell className="w-4 h-4" />
          <span className="hidden sm:inline">Histórico</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Histórico de Ações
            </SheetTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                className="h-8 w-8"
                title="Atualizar"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant={showFilters ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="h-8 w-8"
                title="Filtros"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Tabs for admin - All vs Mine */}
        {isAdmin && (
          <div className="px-4 pt-3">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">Histórico Geral</TabsTrigger>
                <TabsTrigger value="mine">Minhas Ações</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Quick Filters */}
        <div className="px-4 py-2 border-b">
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_FILTERS.map(filter => (
              <Button
                key={filter.key}
                variant={quickFilter === filter.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => applyQuickFilter(quickFilter === filter.key ? null : filter.key)}
                className="h-7 text-xs gap-1 px-2"
              >
                {filter.icon}
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="px-4 py-3 border-b bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Filtros Avançados</span>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 text-xs gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Limpar
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {/* User filter */}
              {isAdmin && (
                <Select
                  value={filters.userName}
                  onValueChange={(value) => updateFilters({ userName: value as CollaboratorFilterName | 'all' })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    {filterOptions.users.map(user => (
                      <SelectItem key={user} value={user}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: getUserColor(user) }}
                          />
                          {user}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Action type filter */}
              <Select
                value={filters.actionType}
                onValueChange={(value) => updateFilters({ actionType: value as ActionType | 'all' })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tipo de ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  {filterOptions.actionTypes.map(action => (
                    <SelectItem key={action} value={action}>
                      {ACTION_LABELS[action]?.label || action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Entity type filter */}
              <Select
                value={filters.entityType}
                onValueChange={(value) => updateFilters({ entityType: value })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tipo de entidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as entidades</SelectItem>
                  {filterOptions.entityTypes.map(entity => (
                    <SelectItem key={entity} value={entity}>
                      {ENTITY_LABELS[entity] || entity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Client filter */}
              <Select
                value={filters.clientId}
                onValueChange={(value) => updateFilters({ clientId: value })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {filterOptions.clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Stats bar */}
        <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>{logs.length} registro{logs.length !== 1 ? 's' : ''}</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-[10px] h-5">
              Filtrado
            </Badge>
          )}
        </div>

        {/* Logs list */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Carregando...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <FileText className="w-8 h-8 mb-2 opacity-50" />
              <span>Nenhum registro encontrado</span>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => (
                <LogEntry key={log.id} log={log} getUserColor={getUserColor} />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface LogEntryProps {
  log: {
    id: string;
    user_name: string;
    action_type: string;
    entity_type: string;
    entity_name: string | null;
    client_name: string | null;
    description: string;
    old_value: string | null;
    new_value: string | null;
    created_at: string;
  };
  getUserColor: (userName: string) => string;
}

function LogEntry({ log, getUserColor }: LogEntryProps) {
  const actionConfig = ACTION_LABELS[log.action_type] || { 
    label: log.action_type, 
    color: 'bg-gray-500/10 text-gray-600 border-gray-200' 
  };
  const userColor = getUserColor(log.user_name);

  return (
    <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        {/* User avatar */}
        <div 
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: userColor }}
        >
          {log.user_name.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm" style={{ color: userColor }}>
              {log.user_name}
            </span>
            <Badge 
              variant="outline" 
              className={`text-[10px] px-1.5 py-0 h-4 ${actionConfig.color}`}
            >
              {actionConfig.label}
            </Badge>
            {(log.entity_name || log.client_name) && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {log.client_name || log.entity_name}
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-foreground mt-0.5 line-clamp-2">
            {log.description}
          </p>

          {/* Old -> New value if present */}
          {log.old_value && log.new_value && log.old_value !== log.new_value && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px]">
              <span className="text-muted-foreground line-through">{log.old_value}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-foreground font-medium">{log.new_value}</span>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span title={format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}>
              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
            </span>
            <span className="opacity-50">•</span>
            <span>{format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
