import { ListChecks, Clock, Zap, Check, Rocket } from 'lucide-react';
import type { BacklogKPIs } from '@/types/backlog';

interface BacklogHeaderProps {
  kpis: BacklogKPIs;
}

export function BacklogHeader({ kpis }: BacklogHeaderProps) {
  const kpiCards = [
    { label: 'Total', value: kpis.total, icon: ListChecks, color: 'text-blue-500' },
    { label: 'Aguardando Créditos', value: kpis.aguardandoCreditos, icon: Clock, color: 'text-amber-500' },
    { label: 'Em Implementação', value: kpis.emImplementacao, icon: Zap, color: 'text-purple-500' },
    { label: 'Implementados', value: kpis.implementados, icon: Check, color: 'text-green-500' },
    { label: 'Lançados', value: kpis.lancados, icon: Rocket, color: 'text-emerald-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {kpiCards.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.label}
            className="bg-card border border-border rounded-lg p-4 flex items-center gap-3"
          >
            <div className={`p-2 rounded-lg bg-muted ${kpi.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
