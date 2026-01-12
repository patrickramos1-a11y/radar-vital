import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface VisualPanelHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
  detailRoute?: string;
}

export function VisualPanelHeader({ 
  title, 
  subtitle, 
  icon,
  children,
  detailRoute,
}: VisualPanelHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-4 px-6 py-4 bg-card border-b border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        {detailRoute && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(detailRoute)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Ver Detalhado
          </Button>
        )}
      </div>

      {/* KPI Stats Row */}
      {children && (
        <div className="flex items-center gap-3 flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}

interface KPICardProps {
  icon?: ReactNode;
  value: number | string;
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function KPICard({ icon, value, label, variant = "default" }: KPICardProps) {
  const variantStyles = {
    default: "bg-muted/50 border-border",
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-600",
    danger: "bg-red-500/10 border-red-500/30 text-red-600",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-600",
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${variantStyles[variant]}`}>
      {icon}
      <div className="flex flex-col">
        <span className="text-lg font-bold leading-none">{value}</span>
        <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
      </div>
    </div>
  );
}
