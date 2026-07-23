import { useState } from 'react';
import {
  Bell,
  Clock,
  FileText,
  Filter,
  ListChecks,
  LogIn,
  MessageCircle,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActivityLogs, ActionType, QUICK_FILTER_CATEGORIES, CollaboratorFilterName } from '@/hooks/useActivityLogs';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCollaborators } from '@/hooks/useCollaborators';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  LOGIN: { label: 'Login', color: 'bg-green-500/10 text-green-600 border-green-200' },
  LOGOUT: { label: 'Logout', color: 'bg-gray-500/10 text-gray-600 border-gray-200' },
  CREATE_COMMENT: { label: 'Comentario', color: 'bg-sky-500/10 text-sky-600 border-sky-200' },
  CREATE_TASK: { label: 'Tarefa', color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
};

const ENTITY_LABELS: Record<string, string> = {
  session: 'Sessao',
  client: 'Cliente',
  demand: 'Demanda',
  license: 'Licenca',
  process: 'Processo',
  task: 'Tarefa',
  comment: 'Comentario',
  import: 'Importacao',
};

const QUICK_FILTERS: { key: keyof typeof QUICK_FILTER_CATEGORIES; label: string; icon: React.ReactNode }[] = [
  { key: 'comments', label: 'Comentarios', icon: <MessageCircle className="w-3 h-3" /> },
  { key: 'tasks', label: 'Tarefas', icon: <ListChecks className="w-3 h-3" /> },
  { key: 'session', label: 'Sessoes', icon: <LogIn className="w-3 h-3" /> },
];

export function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const { collaborators } = useCollaborators();

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
          <span className="hidden sm:inline">Historico</span>
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
              Historico de Acoes
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

        {isAdmin && (
          <div className="px-4 pt-3">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">Historico Geral</TabsTrigger>
                <TabsTrigger value="mine">Minhas Acoes</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

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

        {showFilters && (
          <div className="px-4 py-3 border-b bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Filtros Avancados</span>
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
              {isAdmin && (
                <Select
                  value={filters.userName}
                  onValueChange={(value) => updateFilters({ userName: value as CollaboratorFilterName | 'all' })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuarios</SelectItem>
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

              <Select
                value={filters.actionType}
                onValueChange={(value) => updateFilters({ actionType: value as ActionType | 'all' })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tipo de acao" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as acoes</SelectItem>
                  {filterOptions.actionTypes.map(action => (
                    <SelectItem key={action} value={action}>
                      {ACTION_LABELS[action]?.label || action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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

        <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>{logs.length} registro{logs.length !== 1 ? 's' : ''}</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-[10px] h-5">
              Filtrado
            </Badge>
          )}
        </div>

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
    color: 'bg-gray-500/10 text-gray-600 border-gray-200',
  };
  const userColor = getUserColor(log.user_name);

  return (
    <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: userColor }}
        >
          {log.user_name.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
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

          <p className="text-sm text-foreground mt-0.5 line-clamp-2">
            {log.description}
          </p>

          {log.old_value && log.new_value && log.old_value !== log.new_value && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px]">
              <span className="text-muted-foreground line-through">{log.old_value}</span>
              <span className="text-muted-foreground">-&gt;</span>
              <span className="text-foreground font-medium">{log.new_value}</span>
            </div>
          )}

          <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span title={format(new Date(log.created_at), "dd/MM/yyyy 'as' HH:mm:ss", { locale: ptBR })}>
              {(() => {
                const days = differenceInDays(new Date(), new Date(log.created_at));
                if (days === 0) return 'hoje';
                if (days === 1) return 'ha 1 dia';
                return `ha ${days} dias`;
              })()}
            </span>
            <span className="opacity-50">-</span>
            <span>{format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
