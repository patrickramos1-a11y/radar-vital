import { useState, useMemo } from 'react';
import { Task } from '@/types/task';
import { Priority, PriorityFormData } from '@/types/priority';
import { Client } from '@/types/client';
import { assigneeMatches } from '@/lib/taskAssignee';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star, ArrowUpDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PriorityModal } from './PriorityModal';
import { PRIORITY_CONFIG } from '@/types/task';

interface RespOption { name: string; color: string; initials: string; }

interface Props {
  collaborator: string;
  color: string;
  tasks: Task[];
  priorities: Priority[];
  clients: Client[];
  responsibleList: RespOption[];
  onPromote: (taskId: string, taskTitle: string, data: PriorityFormData, clientName?: string) => Promise<any>;
  getDaysOpen: (t: Task) => number;
}

type SortKey = 'title' | 'client' | 'days' | 'status';

export function TasksTab({ collaborator, color, tasks, priorities, clients, responsibleList, onPromote, getDaysOpen }: Props) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'done'>('open');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('days');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [promotingTask, setPromotingTask] = useState<Task | null>(null);

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);
  const priorityMap = useMemo(() => new Map(priorities.map(p => [p.id, p])), [priorities]);

  const filtered = useMemo(() => {
    let list = tasks.filter(t => assigneeMatches(t.assigned_to, collaborator));
    if (statusFilter === 'open') list = list.filter(t => !t.completed);
    else if (statusFilter === 'done') list = list.filter(t => t.completed);
    if (clientFilter !== 'all') list = list.filter(t => t.client_id === clientFilter);
    const m = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      switch (sortKey) {
        case 'title': return a.title.localeCompare(b.title) * m;
        case 'client': return (clientMap.get(a.client_id) || '').localeCompare(clientMap.get(b.client_id) || '') * m;
        case 'days': return (getDaysOpen(a) - getDaysOpen(b)) * m;
        case 'status': return (Number(a.completed) - Number(b.completed)) * m;
      }
    });
    return list;
  }, [tasks, collaborator, statusFilter, clientFilter, sortKey, sortDir, clientMap, getDaysOpen]);

  const linkedClients = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach(t => { if (assigneeMatches(t.assigned_to, collaborator)) ids.add(t.client_id); });
    return clients.filter(c => ids.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks, clients, collaborator]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const SortH = ({ label, k }: { label: string; k: SortKey }) => (
    <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort(k)}>
      {label}
      <ArrowUpDown className={cn('w-3 h-3', sortKey === k ? 'text-primary' : 'text-muted-foreground/50')} />
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1">
          {(['all', 'open', 'done'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('px-3 py-1 rounded-full text-xs font-medium border', statusFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted')}>
              {s === 'all' ? 'Todas' : s === 'open' ? 'Abertas' : 'Concluídas'}
            </button>
          ))}
        </div>
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="px-2 py-1 border rounded-md text-xs bg-background">
          <option value="all">Todos os clientes</option>
          {linkedClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="ml-auto text-xs text-muted-foreground">{filtered.length} tarefa(s)</div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="max-h-[600px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead><SortH label="Tarefa" k="title" /></TableHead>
                <TableHead><SortH label="Cliente" k="client" /></TableHead>
                <TableHead>Prioridade vinculada</TableHead>
                <TableHead><SortH label="Dias" k="days" /></TableHead>
                <TableHead><SortH label="Status" k="status" /></TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma tarefa para {collaborator}</TableCell></TableRow>
              ) : filtered.map(t => {
                const days = getDaysOpen(t);
                const linkedPriority = (t as any).priority_id ? priorityMap.get((t as any).priority_id) : null;
                const pcfg = PRIORITY_CONFIG[t.priority];
                return (
                  <TableRow key={t.id}>
                    <TableCell className="max-w-[280px]">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-1.5 h-6 rounded-full')} style={{ backgroundColor: pcfg.color }} />
                        <span className={cn('font-medium text-sm break-words whitespace-normal', t.completed && 'line-through text-muted-foreground')}>{t.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{clientMap.get(t.client_id) || '—'}</TableCell>
                    <TableCell>
                      {linkedPriority ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                          <Star className="w-3 h-3" /> {linkedPriority.title.slice(0, 30)}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <span className={cn('font-bold text-sm', !t.completed && days > 30 ? 'text-red-600' : !t.completed && days > 14 ? 'text-amber-600' : 'text-muted-foreground')}>{days}d</span>
                    </TableCell>
                    <TableCell>
                      {t.completed ? (
                        <div className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /><span className="text-xs">Concluída</span></div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-600"><AlertCircle className="w-3.5 h-3.5" /><span className="text-xs">Pendente</span></div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!linkedPriority && !t.completed && (
                        <button
                          onClick={() => setPromotingTask(t)}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border bg-red-50 text-red-700 hover:bg-red-100 border-red-200 font-medium"
                        >
                          <Star className="w-3 h-3" /> Promover
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <PriorityModal
        open={!!promotingTask}
        onOpenChange={(v) => { if (!v) setPromotingTask(null); }}
        editing={null}
        defaultAssignee={collaborator}
        presetTitle={promotingTask?.title}
        presetClientId={promotingTask?.client_id}
        clients={clients}
        responsibleList={responsibleList}
        submitLabel="Promover para prioridade"
        onSubmit={async (data) => {
          if (!promotingTask) return;
          const clientName = data.client_id ? clientMap.get(data.client_id) : undefined;
          await onPromote(promotingTask.id, promotingTask.title, data, clientName);
          setPromotingTask(null);
        }}
      />
    </div>
  );
}
