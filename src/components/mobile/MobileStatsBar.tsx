import { Users } from "lucide-react";
import { COLLABORATOR_COLORS, CollaboratorName } from "@/types/client";

interface MobileStatsBarProps {
  totalClients: number;
  collaboratorStats: Record<CollaboratorName, number>;
}

export function MobileStatsBar({
  totalClients,
  collaboratorStats,
}: MobileStatsBarProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-card border-b border-border overflow-x-auto">
      <div className="flex items-center gap-1.5">
        <MiniStat icon={<Users className="w-3.5 h-3.5" />} value={totalClients} />
      </div>

      <div className="w-px h-5 bg-border shrink-0" />

      <div className="flex items-center gap-1.5">
        {(Object.keys(collaboratorStats) as CollaboratorName[]).map(name => (
          <div
            key={name}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${COLLABORATOR_COLORS[name]}20` }}
          >
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: COLLABORATOR_COLORS[name] }}
            />
            <span 
              className="text-xs font-bold"
              style={{ color: COLLABORATOR_COLORS[name] }}
            >
              {collaboratorStats[name]}
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
