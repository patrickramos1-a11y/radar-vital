import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatusItem {
  label: string;
  value: number;
  color: 'success' | 'warning' | 'danger' | 'info' | 'muted';
}

interface StatusCardProps {
  title: string;
  items: StatusItem[];
  className?: string;
}

export function StatusCard({ title, items, className }: StatusCardProps) {
  const colorStyles = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    muted: 'bg-muted-foreground',
  };

  const textStyles = {
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
    muted: 'text-muted-foreground',
  };

  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div className="h-3 rounded-full bg-muted overflow-hidden flex">
          {items.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return percentage > 0 ? (
              <div
                key={index}
                className={cn("h-full transition-all", colorStyles[item.color])}
                style={{ width: `${percentage}%` }}
              />
            ) : null;
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", colorStyles[item.color])} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                <p className={cn("text-sm font-semibold", textStyles[item.color])}>
                  {item.value.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
