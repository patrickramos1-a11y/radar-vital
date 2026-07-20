import { Client } from '@/types/client';
import { cn } from '@/lib/utils';

interface Props {
  client?: Client | null;
  fallbackName?: string;
  size?: number;
  className?: string;
  compact?: boolean;
}

/** Renders a client logo (or initials fallback) + name inline — reusable across tables. */
export function ClientCell({ client, fallbackName, size = 24, className, compact }: Props) {
  if (!client && !fallbackName) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const name = client?.name || fallbackName || '—';
  const initials = client?.initials || name.slice(0, 2).toUpperCase();
  const logo = client?.logoUrl;
  return (
    <div className={cn('flex items-center gap-2 min-w-0', className)}>
      {logo ? (
        <img
          src={logo}
          alt={name}
          style={{ width: size, height: size }}
          className="rounded-md object-contain bg-white border shrink-0"
        />
      ) : (
        <div
          style={{ width: size, height: size, fontSize: Math.max(9, Math.floor(size * 0.4)) }}
          className="rounded-md flex items-center justify-center font-bold text-white shrink-0 bg-gradient-to-br from-primary/70 to-primary"
        >
          {initials}
        </div>
      )}
      {!compact && <span className="text-sm truncate">{name}</span>}
    </div>
  );
}
