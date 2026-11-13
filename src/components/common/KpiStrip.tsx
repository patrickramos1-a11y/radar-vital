import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type KpiTone = 'default' | 'danger' | 'warning' | 'success';

export interface KpiItem {
  key: string;
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  tone?: KpiTone;
  /** Small text under the value (e.g. who leads the month). */
  detail?: ReactNode;
  /** Tooltip explaining how the number is computed. */
  hint?: string;
  active?: boolean;
  onClick?: () => void;
}

const VALUE_TONE: Record<KpiTone, string> = {
  default: 'text-foreground',
  danger: 'text-red-600',
  warning: 'text-amber-600',
  success: 'text-emerald-700',
};

/**
 * One compact row of key numbers. It stays a single line on every screen:
 * cells share the width on desktop and scroll sideways on narrow screens.
 */
export function KpiStrip({ items, className }: { items: KpiItem[]; className?: string }) {
  return (
    <div className={cn('flex snap-x overflow-x-auto rounded-xl border bg-card', className)}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const tone = item.tone ?? 'default';
        const content = (
          <>
            <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {Icon && <Icon className={cn('h-3.5 w-3.5', tone === 'danger' && 'text-red-500')} aria-hidden />}
              <span className="whitespace-nowrap">{item.label}</span>
            </span>
            <span className={cn('text-xl font-bold leading-tight tabular-nums', VALUE_TONE[tone])}>{item.value}</span>
            {item.detail && <span className="truncate text-[11px] text-muted-foreground">{item.detail}</span>}
          </>
        );
        const cellClass = cn(
          'flex min-w-[112px] flex-1 shrink-0 snap-start flex-col justify-center gap-0.5 px-3 py-2 text-left',
          index > 0 && 'border-l',
          item.active && 'bg-primary/[0.06] shadow-[inset_0_-2px_0_hsl(var(--primary))]',
        );
        return item.onClick ? (
          <button
            key={item.key}
            type="button"
            title={item.hint}
            aria-pressed={item.active}
            onClick={item.onClick}
            className={cn(cellClass, 'transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring')}
          >
            {content}
          </button>
        ) : (
          <div key={item.key} title={item.hint} className={cellClass}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
