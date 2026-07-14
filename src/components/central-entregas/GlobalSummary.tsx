import { CheckSquare, Star, Package, MessageSquare, Trophy, Sparkles } from 'lucide-react';
import { CollaboratorAvatar } from './CollaboratorAvatar';

interface Stat {
  label: string;
  value: number | string;
  icon: any;
  tone?: 'default' | 'amber' | 'red' | 'emerald' | 'sky';
}

interface HighlightPerson {
  name: string;
  value: number | string;
  sublabel: string;
}

interface Props {
  totalOpenTasks: number;
  totalOpenPriorities: number;
  deliverablesDoneMonth: number;
  pendingComments: number;
  topPerformer?: HighlightPerson;
  topStars?: HighlightPerson;
}

const TONES: Record<NonNullable<Stat['tone']>, { bg: string; iconBg: string; text: string }> = {
  default: { bg: 'bg-card', iconBg: 'bg-muted', text: 'text-foreground' },
  amber: { bg: 'bg-amber-50/60', iconBg: 'bg-amber-100', text: 'text-amber-700' },
  red: { bg: 'bg-red-50/60', iconBg: 'bg-red-100', text: 'text-red-700' },
  emerald: { bg: 'bg-emerald-50/60', iconBg: 'bg-emerald-100', text: 'text-emerald-700' },
  sky: { bg: 'bg-sky-50/60', iconBg: 'bg-sky-100', text: 'text-sky-700' },
};

function StatCard({ label, value, icon: Icon, tone = 'default' }: Stat) {
  const t = TONES[tone];
  return (
    <div className={`rounded-xl border p-3 flex items-center gap-3 ${t.bg}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.iconBg}`}>
        <Icon className={`w-4 h-4 ${t.text}`} />
      </div>
      <div className="min-w-0">
        <div className={`text-xl font-bold leading-tight ${t.text}`}>{value}</div>
        <div className="text-[11px] text-muted-foreground truncate">{label}</div>
      </div>
    </div>
  );
}

function HighlightCard({ icon: Icon, label, person, tint }: { icon: any; label: string; person?: HighlightPerson; tint: string }) {
  return (
    <div className="rounded-xl border p-3 flex items-center gap-3 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ background: tint }} />
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${tint}22` }}>
        <Icon className="w-4 h-4" style={{ color: tint }} />
      </div>
      {person ? (
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <CollaboratorAvatar name={person.name} size={28} />
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">{person.name}</div>
            <div className="text-[10px] text-muted-foreground truncate">
              {label} · <span className="font-semibold" style={{ color: tint }}>{person.value}</span> {person.sublabel}
            </div>
          </div>
        </div>
      ) : (
        <div className="min-w-0">
          <div className="text-sm font-semibold text-muted-foreground">—</div>
          <div className="text-[11px] text-muted-foreground">{label}</div>
        </div>
      )}
    </div>
  );
}

export function GlobalSummary({
  totalOpenTasks, totalOpenPriorities, deliverablesDoneMonth,
  pendingComments, topPerformer, topStars
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      <StatCard label="Tarefas abertas" value={totalOpenTasks} icon={CheckSquare} tone="sky" />
      <StatCard label="Prioridades abertas" value={totalOpenPriorities} icon={Star} tone="red" />
      <StatCard label="Entregáveis / mês" value={deliverablesDoneMonth} icon={Package} tone="emerald" />
      <StatCard label="Comentários pendentes" value={pendingComments} icon={MessageSquare} tone="amber" />
      <HighlightCard icon={Trophy} label="Melhor do mês" person={topPerformer} tint="#F59E0B" />
      <HighlightCard icon={Sparkles} label="Mais estrelas" person={topStars} tint="#EA580C" />
    </div>
  );
}
