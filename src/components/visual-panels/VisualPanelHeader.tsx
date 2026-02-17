import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KPICardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function KPICard({ label, value, icon, variant = 'default' }: KPICardProps) {
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

interface VisualPanelHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  detailRoute?: string;
  children?: React.ReactNode;
}

export function VisualPanelHeader({ title, subtitle, icon, detailRoute, children }: VisualPanelHeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-border bg-card shrink-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon && <div className="text-primary">{icon}</div>}
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {detailRoute && (
          <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
            <Link to={detailRoute}>
              Detalhado <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-wrap mt-2">
          {children}
        </div>
      )}
    </div>
  );
}
