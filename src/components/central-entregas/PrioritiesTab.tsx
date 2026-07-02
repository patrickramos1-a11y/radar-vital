import { useState, useMemo } from 'react';
import { Priority, PriorityFormData, PRIORITY_STATUS_CONFIG, PriorityStatus } from '@/types/priority';
import { Client } from '@/types/client';
import { Plus, Trash2, Pencil, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PriorityModal } from './PriorityModal';
import { assigneeMatches } from '@/lib/taskAssignee';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface RespOption { name: string; color: string; initials: string; }

interface Props {
  collaborator: string;
  color: string;
  priorities: Priority[];
  clients: Client[];
  responsibleList: RespOption[];
  onCreate: (data: PriorityFormData, clientName?: string) => Promise<any>;
  onUpdate: (id: string, data: Partial<PriorityFormData>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const STATUS_FILTERS: (PriorityStatus | 'all')[] = ['all', 'aberta', 'em_andamento', 'concluida', 'cancelada'];

export function PrioritiesTab({ collaborator, color, priorities, clients, responsibleList, onCreate, onUpdate, onDelete }: Props) {
  const [statusFilter, setStatusFilter] = useState<PriorityStatus | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Priority | null>(null);

  const filtered = useMemo(() => {
    return priorities
      .filter(p => assigneeMatches(p.assigned_to, collaborator))
      .filter(p => statusFilter === 'all' ? true : p.status === statusFilter)
      .sort((a, b) => b.weight - a.weight || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [priorities, collaborator, statusFilter]);

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                statusFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
              )}
            >
              {s === 'all' ? 'Todas' : PRIORITY_STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} size="sm" style={{ backgroundColor: color }}>
          <Plus className="w-4 h-4 mr-1" /> Nova prioridade
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card/60 backdrop-blur-sm p-8 text-center text-sm text-muted-foreground">
          Nenhuma prioridade encontrada para {collaborator}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(p => {
            const cfg = PRIORITY_STATUS_CONFIG[p.status];
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const overdue = p.due_date && new Date(p.due_date) < today && p.status !== 'concluida' && p.status !== 'cancelada';
            return (
              <div key={p.id} className={cn('rounded-xl border-l-4 border-t border-r border-b bg-card p-3 flex flex-col gap-2 hover:shadow-md transition-shadow', cfg.borderClass)} style={{ borderLeftColor: cfg.color }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm break-words">{p.title}</h4>
                    {p.client_id && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{clientMap.get(p.client_id) || '—'}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button className="p-1 rounded hover:bg-muted" onClick={() => { setEditing(p); setModalOpen(true); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 rounded hover:bg-muted text-destructive" onClick={() => { if (confirm('Excluir prioridade?')) onDelete(p.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {p.description && <p className="text-xs text-muted-foreground break-words line-clamp-3">{p.description}</p>}

                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded font-medium', cfg.bgClass, cfg.textClass)}>{cfg.label}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-muted text-muted-foreground">Peso {p.weight}</span>
                  {p.category && <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-muted text-muted-foreground">{p.category}</span>}
                  {p.due_date && (
                    <span className={cn('text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1', overdue ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground')}>
                      <CalendarIcon className="w-3 h-3" />
                      {format(new Date(p.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t">
                  <select
                    value={p.status}
                    onChange={(e) => onUpdate(p.id, { status: e.target.value as PriorityStatus })}
                    className="text-xs px-2 py-1 border rounded bg-background flex-1"
                  >
                    {(Object.keys(PRIORITY_STATUS_CONFIG) as PriorityStatus[]).map(s => (
                      <option key={s} value={s}>{PRIORITY_STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PriorityModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        defaultAssignee={collaborator}
        clients={clients}
        responsibleList={responsibleList}
        onSubmit={async (data) => {
          const clientName = data.client_id ? clientMap.get(data.client_id) : undefined;
          if (editing) await onUpdate(editing.id, data);
          else await onCreate(data, clientName);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
