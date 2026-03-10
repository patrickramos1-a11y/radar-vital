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
    success: 'bg-emerald-500/10 border-emerald-500/25',
    warning: 'bg-amber-500/10 border-amber-500/25',
    danger: 'bg-red-500/10 border-red-500/25',
    info: 'bg-blue-500/10 border-blue-500/25',
  };

  const textColors = {
    default: 'text-foreground',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
    info: 'text-blue-400',
  };

  return (
    <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border backdrop-blur-sm ${colors[variant]}`}>
      {icon && <span className={`shrink-0 ${textColors[variant]}`}>{icon}</span>}
      <div className="flex flex-col">
        <span className={`text-lg font-bold leading-none ${textColors[variant]}`}>{value}</span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
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
    <div className="px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground/70">{subtitle}</p>}
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
