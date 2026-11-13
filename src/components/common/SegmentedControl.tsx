import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
}

interface Props<T extends string> {
  value: T;
  onChange: (value: NoInfer<T>) => void;
  options: SegmentedOption<NoInfer<T>>[];
  ariaLabel: string;
  className?: string;
}

/** One-of-many switch used for scope, view and period choices across the app. */
export function SegmentedControl<T extends string>({ value, onChange, options, ariaLabel, className }: Props<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('inline-flex max-w-full shrink-0 items-center gap-0.5 overflow-x-auto rounded-lg border bg-muted/40 p-0.5', className)}
    >
      {options.map(option => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            title={option.title}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-7 shrink-0 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition-colors',
              selected
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
