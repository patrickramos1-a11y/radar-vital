import { Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface MobileStatsBarProps {
  totalClients: number;
  collaboratorStats: Record<string, number>;
}

export function MobileStatsBar({
  totalClients,
  collaboratorStats,
}: MobileStatsBarProps) {
  const { collaborators } = useAuth();

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-card border-b border-border overflow-x-auto">
      <div className="flex items-center gap-1.5">
        <MiniStat icon={<Users className="w-3.5 h-3.5" />} value={totalClients} />
      </div>

      <div className="w-px h-5 bg-border shrink-0" />

      <div className="flex items-center gap-1.5">
        {collaborators.map(collab => (
          <div
            key={collab.id}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${collab.color}20` }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: collab.color }}
            />
            <span 
              className="text-xs font-bold"
              style={{ color: collab.color }}
            >
              {collaboratorStats[collab.name] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MiniStatProps {
  icon: React.ReactNode;
  value: number;
}

function MiniStat({ icon, value }: MiniStatProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border bg-background">
      {icon}
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  );
}
