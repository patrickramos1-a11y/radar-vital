import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  ArrowRight, 
  Paperclip, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  Check, 
  Rocket, 
  Wrench, 
  Edit 
} from 'lucide-react';
import type { BacklogHistory as BacklogHistoryType, BacklogEventType } from '@/types/backlog';
import { BACKLOG_EVENT_LABELS } from '@/types/backlog';

interface BacklogHistoryProps {
  history: BacklogHistoryType[];
}

const EVENT_ICONS: Record<BacklogEventType, React.ComponentType<{ className?: string }>> = {
  CREATED: Plus,
  STATUS_CHANGED: ArrowRight,
  ATTACHMENT_ADDED: Paperclip,
  ATTACHMENT_REMOVED: Trash2,
  PRIORITY_CHANGED: AlertTriangle,
  DATE_CHANGED: Calendar,
  MARKED_IMPLEMENTED: Check,
  MARKED_LAUNCHED: Rocket,
  IMPLEMENTATION_ADDED: Wrench,
  IMPLEMENTATION_REMOVED: Trash2,
  FIELD_UPDATED: Edit
};

const EVENT_COLORS: Record<BacklogEventType, string> = {
  CREATED: 'bg-green-500',
  STATUS_CHANGED: 'bg-blue-500',
  ATTACHMENT_ADDED: 'bg-purple-500',
  ATTACHMENT_REMOVED: 'bg-red-400',
  PRIORITY_CHANGED: 'bg-amber-500',
  DATE_CHANGED: 'bg-cyan-500',
  MARKED_IMPLEMENTED: 'bg-green-600',
  MARKED_LAUNCHED: 'bg-emerald-600',
  IMPLEMENTATION_ADDED: 'bg-indigo-500',
  IMPLEMENTATION_REMOVED: 'bg-red-400',
  FIELD_UPDATED: 'bg-gray-500'
};

export function BacklogHistory({ history }: BacklogHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum histórico disponível</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-4">
        {history.map((event) => {
          const Icon = EVENT_ICONS[event.event_type as BacklogEventType] || Edit;
          const color = EVENT_COLORS[event.event_type as BacklogEventType] || 'bg-gray-500';

          return (
            <div key={event.id} className="relative flex gap-4 pl-2">
              {/* Icon */}
              <div className={`relative z-10 w-6 h-6 rounded-full ${color} flex items-center justify-center shrink-0`}>
                <Icon className="w-3 h-3 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {BACKLOG_EVENT_LABELS[event.event_type as BacklogEventType] || event.event_type}
                    </p>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    {(event.old_value || event.new_value) && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {event.old_value && (
                          <span className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded">
                            {event.old_value}
                          </span>
                        )}
                        {event.old_value && event.new_value && <ArrowRight className="w-3 h-3" />}
                        {event.new_value && (
                          <span className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded">
                            {event.new_value}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-muted-foreground">{event.user_name}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
