import { useState } from 'react';
import { Bell, Filter, X, User, Clock, FileText, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useActivityLogs, ActionType, LogFilters } from '@/hooks/useActivityLogs';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppUserName, APP_USERS } from '@/contexts/UserContext';

// Action type labels and colors
const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  LOGIN: { label: 'Login', color: 'bg-green-500/10 text-green-600 border-green-200' },
  LOGOUT: { label: 'Logout', color: 'bg-gray-500/10 text-gray-600 border-gray-200' },
  IMPORT: { label: 'Importação', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  CREATE: { label: 'Criação', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
  UPDATE: { label: 'Atualização', color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  DELETE: { label: 'Exclusão', color: 'bg-red-500/10 text-red-600 border-red-200' },
  TOGGLE_PRIORITY: { label: 'Prioridade', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' },
  TOGGLE_HIGHLIGHT: { label: 'Destaque', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  TOGGLE_ACTIVE: { label: 'Ativação', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200' },
  TOGGLE_CHECKED: { label: 'Seleção', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' },
  STATUS_CHANGE: { label: 'Status', color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  ASSIGN: { label: 'Atribuição', color: 'bg-pink-500/10 text-pink-600 border-pink-200' },
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

function getUserColor(userName: string): string {
  const user = APP_USERS.find(u => u.name === userName);
  return user?.color || '#6b7280';
}

export function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
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
  } = useActivityLogs();

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      markAsSeen();
    }
  };

  const hasActiveFilters = 
    filters.userName !== 'all' || 
    filters.actionType !== 'all' || 
    filters.entityType !== 'all' ||
    filters.clientId !== 'all';

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
      
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
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
              {isAdmin && (
                <Button
                  variant={showFilters ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-8 w-8"
                  title="Filtros"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Filters (Admin only) */}
        {isAdmin && showFilters && (
          <div className="px-4 py-3 border-b bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Filtros</span>
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
              <Select
                value={filters.userName}
                onValueChange={(value) => updateFilters({ userName: value as AppUserName | 'all' })}
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
                <LogEntry key={log.id} log={log} />
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
    description: string;
    created_at: string;
  };
}

function LogEntry({ log }: LogEntryProps) {
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
            {log.entity_name && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {log.entity_name}
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-foreground mt-0.5 line-clamp-2">
            {log.description}
          </p>

          {/* Timestamp */}
          <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span title={format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}>
              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
            </span>
            <span className="opacity-50">•</span>
            <span>{ENTITY_LABELS[log.entity_type] || log.entity_type}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
