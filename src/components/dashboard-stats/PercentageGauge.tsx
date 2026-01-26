import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PercentageGaugeProps {
  title: string;
  value: number;
  subtitle?: string;
  className?: string;
}

export function PercentageGauge({ title, value, subtitle, className }: PercentageGaugeProps) {
  const getColor = (val: number) => {
    if (val >= 80) return { stroke: 'stroke-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-500/10' };
    if (val >= 50) return { stroke: 'stroke-amber-500', text: 'text-amber-600', bg: 'bg-amber-500/10' };
    return { stroke: 'stroke-red-500', text: 'text-red-600', bg: 'bg-red-500/10' };
  };

  const colors = getColor(value);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={cn(colors.stroke, "transition-all duration-500")}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-2xl font-bold", colors.text)}>
              {value}%
            </span>
          </div>
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground text-center mt-2">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
