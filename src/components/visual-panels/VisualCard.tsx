import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Client } from "@/types/client";

interface VisualCardProps {
  client: Client;
  isHighlighted?: boolean;
  onClick?: () => void;
  children: ReactNode;
  variant?: "default" | "warning" | "danger" | "success";
  className?: string;
}

export function VisualCard({ 
  client, 
  isHighlighted, 
  onClick, 
  children,
  variant = "default",
  className,
}: VisualCardProps) {
  const variantStyles = {
    default: "border-border hover:border-primary/50",
    warning: "border-amber-500/50 bg-amber-500/5",
    danger: "border-red-500/50 bg-red-500/5",
    success: "border-emerald-500/50 bg-emerald-500/5",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-xl border-2 bg-card p-4 transition-all duration-200 cursor-pointer",
        "hover:shadow-lg hover:scale-[1.02]",
        variantStyles[variant],
        isHighlighted && "border-4 border-red-500 ring-2 ring-red-500/30",
        className
      )}
    >
      {/* Client Header */}
      <div className="flex items-center gap-3 mb-3">
        {/* Logo */}
        <div className="relative flex-shrink-0">
          {client.logoUrl ? (
            <img
              src={client.logoUrl}
              alt={client.name}
              className="w-12 h-12 object-contain rounded-lg bg-white p-1"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{client.initials}</span>
            </div>
          )}
          {client.isPriority && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white">★</span>
            </div>
          )}
        </div>
        
        {/* Name */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-sm">
            {client.name}
          </h3>
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}

// Progress Bar Component
interface ProgressBarProps {
  value: number;
  max: number;
  variant?: "success" | "warning" | "danger" | "info";
  showPercentage?: boolean;
  label?: string;
}

export function ProgressBar({ 
  value, 
  max, 
  variant = "success", 
  showPercentage = true,
  label,
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  
  const variantColors = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    info: "bg-blue-500",
  };

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          {showPercentage && (
            <span className="font-medium">{percentage}%</span>
          )}
        </div>
      )}
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all duration-300", variantColors[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Risk Bar Component (for licenses)
interface RiskBarProps {
  valid: number;
  expiring: number;
  expired: number;
}

export function RiskBar({ valid, expiring, expired }: RiskBarProps) {
  const total = valid + expiring + expired;
  if (total === 0) return null;

  const validPct = (valid / total) * 100;
  const expiringPct = (expiring / total) * 100;
  const expiredPct = (expired / total) * 100;

  return (
    <div className="h-3 w-full rounded-full overflow-hidden flex">
      {valid > 0 && (
        <div 
          className="bg-emerald-500 h-full transition-all" 
          style={{ width: `${validPct}%` }} 
          title={`${valid} válidas`}
        />
      )}
      {expiring > 0 && (
        <div 
          className="bg-amber-500 h-full transition-all" 
          style={{ width: `${expiringPct}%` }} 
          title={`${expiring} próximo vencimento`}
        />
      )}
      {expired > 0 && (
        <div 
          className="bg-red-500 h-full transition-all" 
          style={{ width: `${expiredPct}%` }} 
          title={`${expired} vencidas`}
        />
      )}
    </div>
  );
}

// Stat Badge Component
interface StatBadgeProps {
  value: number;
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
}

export function StatBadge({ 
  value, 
  label, 
  variant = "default",
  size = "sm",
}: StatBadgeProps) {
  const variantStyles = {
    default: "bg-muted text-foreground",
    success: "bg-emerald-500/20 text-emerald-600",
    warning: "bg-amber-500/20 text-amber-600",
    danger: "bg-red-500/20 text-red-600",
    info: "bg-blue-500/20 text-blue-600",
  };

  const sizeStyles = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  return (
    <div className={cn("rounded-lg flex items-center gap-1.5", variantStyles[variant], sizeStyles[size])}>
      <span className="font-bold">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
