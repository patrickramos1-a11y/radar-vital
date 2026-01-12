import { useState } from 'react';
import { Bell, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useActivityLog, ActivityLog } from '@/hooks/useActivityLog';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ACTION_ICONS: Record<string, string> = {
  'create': '➕',
  'update': '✏️',
  'delete': '🗑️',
  'import': '📥',
  'complete': '✅',
  'toggle': '🔄',
  'comment': '💬',
};

const ENTITY_COLORS: Record<string, string> = {
  'client': 'bg-blue-500',
  'demand': 'bg-green-500',
  'license': 'bg-purple-500',
  'process': 'bg-orange-500',
  'task': 'bg-yellow-500',
  'comment': 'bg-pink-500',
};

function getActionIcon(actionType: string): string {
  return ACTION_ICONS[actionType.toLowerCase()] || '📌';
}

function getEntityColor(entityType: string): string {
  return ENTITY_COLORS[entityType.toLowerCase()] || 'bg-gray-500';
}

function formatTime(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true,
      locale: ptBR 
    });
  } catch {
    return 'agora';
  }
}

function ActivityItem({ activity }: { activity: ActivityLog }) {
  return (
    <div className="flex gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex-shrink-0 mt-1">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${getEntityColor(activity.entity_type)}`}>
          {getActionIcon(activity.action_type)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-semibold text-foreground">{activity.user_name}</span>
          {' '}
          <span className="text-muted-foreground">{activity.description}</span>
        </p>
        {activity.entity_name && (
          <p className="text-xs text-primary font-medium mt-0.5 truncate">
            {activity.entity_name}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatTime(activity.created_at)}
        </p>
      </div>
    </div>
  );
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const { activities, unreadCount, loading, markAsRead } = useActivityLog();

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      markAsRead();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs bg-red-500 hover:bg-red-500"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-100px)]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Nenhuma atividade recente</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
