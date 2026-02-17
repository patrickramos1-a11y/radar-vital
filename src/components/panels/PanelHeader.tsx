import React from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function StatCard({ label, value, icon, variant = 'default' }: StatCardProps) {
  const colors = {
    default: 'bg-card border-border',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
    danger: 'bg-red-500/10 border-red-500/30 text-red-600',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-600',
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colors[variant]}`}>
      {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
      <div className="flex flex-col">
        <span className="text-lg font-bold text-foreground leading-none">{value}</span>
        <span className="text-[9px] text-muted-foreground uppercase">{label}</span>
      </div>
    </div>
  );
}

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PanelHeader({ title, subtitle, children }: PanelHeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-border bg-card shrink-0">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-wrap mt-2">
          {children}
        </div>
      )}
    </div>
  );
}
