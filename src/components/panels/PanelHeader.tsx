import { ReactNode } from "react";

interface StatCardProps {
  icon?: ReactNode;
  value: number;
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function StatCard({ icon, value, label, variant = 'default' }: StatCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-600';
      case 'danger':
        return 'bg-red-500/10 border-red-500/30 text-red-600';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-600';
      default:
        return 'bg-card border-border';
    }
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getVariantClasses()}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      <div className="flex flex-col">
        <span className="text-lg font-bold leading-none">{value}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
    </div>
  );
}

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PanelHeader({ title, subtitle, children }: PanelHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-card border-b border-border">
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {children}
      </div>
    </div>
  );
}
