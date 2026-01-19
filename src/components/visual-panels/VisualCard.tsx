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
        "group relative rounded-xl border-2 bg-card p-5 transition-all duration-200 cursor-pointer",
        "hover:shadow-lg hover:scale-[1.02]",
        variantStyles[variant],
        // Highlighted preserved exactly as per requirements - red priority marker
        isHighlighted && "border-4 border-red-500 ring-2 ring-red-500/30",
        className
      )}
    >
      {/* Client Header - Improved spacing and typography */}
      <div className="flex items-center gap-4 mb-4">
        {/* Logo */}
        <div className="relative flex-shrink-0">
          {client.logoUrl ? (
            <img
              src={client.logoUrl}
              alt={client.name}
              className="w-14 h-14 object-contain rounded-lg bg-white p-1.5 shadow-sm"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{client.initials}</span>
            </div>
          )}
          {client.isPriority && (
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-[10px] text-white">★</span>
            </div>
          )}
        </div>
        
        {/* Name - Improved typography hierarchy */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-base md:text-lg leading-tight">
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
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-medium">{label}</span>
          {showPercentage && (
            <span className="font-semibold">{percentage}%</span>
          )}
        </div>
      )}
      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
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
    <div className="h-3.5 w-full rounded-full overflow-hidden flex shadow-inner">
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
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
  };

  return (
    <div className={cn("rounded-lg flex items-center gap-2", variantStyles[variant], sizeStyles[size])}>
      <span className="font-bold">{value}</span>
      <span className="text-muted-foreground font-medium">{label}</span>
    </div>
  );
}
