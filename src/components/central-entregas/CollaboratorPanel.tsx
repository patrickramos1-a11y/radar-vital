import { CollaboratorAvatar } from './CollaboratorAvatar';
import { Users, CheckSquare, Star, CheckCircle2, Package, MessageSquare, AlertTriangle, Trophy } from 'lucide-react';

interface MiniKpi { label: string; value: number | string; icon: any; danger?: boolean; success?: boolean; }

interface Props {
  name: string;
  color: string;
  clients: number;
  openTasks: number;
  openPriorities: number;
  doneTasks: number;
  deliverables: number;
  pendingComments: number;
  overdue: number;
  score: number;
}

export function CollaboratorPanel({ name, color, clients, openTasks, openPriorities, doneTasks, deliverables, pendingComments, overdue, score }: Props) {
  const kpis: MiniKpi[] = [
    { label: 'Clientes', value: clients, icon: Users },
    { label: 'Tarefas abertas', value: openTasks, icon: CheckSquare },
    { label: 'Prioridades', value: openPriorities, icon: Star },
    { label: 'Tarefas ✓', value: doneTasks, icon: CheckCircle2, success: true },
    { label: 'Entregáveis', value: deliverables, icon: Package },
    { label: 'Coment. pend.', value: pendingComments, icon: MessageSquare, danger: pendingComments > 0 },
    { label: 'Atrasados', value: overdue, icon: AlertTriangle, danger: overdue > 0 },
    { label: 'Pontuação', value: score, icon: Trophy, success: true },
  ];

  return (
    <div
      className="rounded-2xl border p-4 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${color}0d 0%, transparent 60%)` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <CollaboratorAvatar name={name} size={48} ring />
        <div className="min-w-0">
          <h2 className="text-lg font-bold truncate" style={{ color }}>{name}</h2>
          <p className="text-xs text-muted-foreground">Visão de ação — o que precisa ser feito agora</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className={`rounded-lg border bg-card px-2.5 py-2 flex flex-col gap-0.5 ${k.danger ? 'border-red-200 bg-red-50/40' : ''} ${k.success ? 'border-emerald-200/60' : ''}`}
            >
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide">
                <Icon className={`w-3 h-3 ${k.danger ? 'text-red-500' : k.success ? 'text-emerald-500' : ''}`} />
                {k.label}
              </div>
              <div className={`text-xl font-bold ${k.danger ? 'text-red-600' : k.success ? 'text-emerald-700' : 'text-foreground'}`}>
                {k.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
