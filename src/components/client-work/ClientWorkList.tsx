import {
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  ExternalLink,
  Flag,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  WORK_ITEM_LABELS,
  type WorkItem,
  type WorkItemKind,
} from "@/types/workItem";

const kindConfig: Record<
  WorkItemKind,
  { icon: typeof Circle; className: string }
> = {
  task: { icon: ClipboardCheck, className: "text-sky-700 bg-sky-50" },
  priority: { icon: Flag, className: "text-amber-700 bg-amber-50" },
  deliverable: {
    icon: PackageCheck,
    className: "text-emerald-700 bg-emerald-50",
  },
  audit: { icon: ShieldCheck, className: "text-violet-700 bg-violet-50" },
  challenge: { icon: Sparkles, className: "text-rose-700 bg-rose-50" },
};

const statusLabel: Record<WorkItem["status"], string> = {
  open: "Aberto",
  in_progress: "Em andamento",
  pending_validation: "Aguardando validação",
  completed: "Concluído",
  cancelled: "Cancelado",
};

interface ClientWorkListProps {
  items: WorkItem[];
  isLoading: boolean;
  error?: string | null;
  emptyMessage: string;
  onOpenSource: (item: WorkItem) => void;
  onRetry?: () => void;
}

export function ClientWorkList({
  items,
  isLoading,
  error,
  emptyMessage,
  onOpenSource,
  onRetry,
}: ClientWorkListProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Carregando visão do cliente...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-32 flex-col items-center justify-center gap-3 border border-destructive/30 bg-destructive/5 px-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
        {onRetry && (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-32 items-center justify-center border border-dashed bg-muted/20 px-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="divide-y border bg-background">
      {items.map((item) => {
        const config = kindConfig[item.kind];
        const Icon = config.icon;
        const isDone =
          item.status === "completed" || item.status === "cancelled";

        return (
          <div
            key={item.id}
            className={cn(
              "grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3",
              isDone && "opacity-65",
            )}
          >
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center",
                config.className,
              )}
              title={WORK_ITEM_LABELS[item.kind]}
            >
              <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                  {WORK_ITEM_LABELS[item.kind]}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  {isDone ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                  {statusLabel[item.status]}
                </span>
              </div>
              <p
                className={cn(
                  "break-words text-sm font-medium",
                  isDone && "line-through",
                )}
              >
                {item.title}
              </p>
              {item.description && (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {item.description}
                </p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                {item.dueDate && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(`${item.dueDate}T00:00:00`).toLocaleDateString(
                      "pt-BR",
                    )}
                  </span>
                )}
                {item.assignees.length > 0 && (
                  <span>{item.assignees.join(", ")}</span>
                )}
              </div>
            </div>

            {item.sourcePath && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title={`Abrir ${WORK_ITEM_LABELS[item.kind].toLowerCase()}`}
                onClick={() => onOpenSource(item)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
