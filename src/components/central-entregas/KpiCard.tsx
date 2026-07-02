import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
  hint?: string;
  variant?: 'default' | 'danger' | 'warning' | 'success';
}

export function KpiCard({ label, value, icon: Icon, color, hint, variant = 'default' }: Props) {
  const variantClass = {
    default: 'text-foreground',
    danger: 'text-red-600',
    warning: 'text-amber-600',
    success: 'text-emerald-600',
  }[variant];
  return (
    <div className="rounded-xl border bg-card/60 backdrop-blur-sm p-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground/60" style={color ? { color } : {}} />
      </div>
      <div className={cn('text-2xl font-bold', variantClass)}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}
