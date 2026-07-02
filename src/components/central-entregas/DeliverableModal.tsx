import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Deliverable, DeliverableFormData, DeliverableStatus, DELIVERABLE_STATUS_CONFIG } from '@/types/deliverable';
import { Priority } from '@/types/priority';
import { Task } from '@/types/task';
import { Client } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { assigneeMatches, normalizeAssignee } from '@/lib/taskAssignee';
import { Star, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RespOption { name: string; color: string; initials: string; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Deliverable | null;
  defaultAssignee?: string;
  priorities: Priority[];
  tasks: Task[];
  clients: Client[];
  responsibleList: RespOption[];
  onSubmit: (data: DeliverableFormData) => Promise<void>;
}

export function DeliverableModal({ open, onOpenChange, editing, defaultAssignee, priorities, tasks, clients, responsibleList, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<DeliverableStatus>('aberto');
  const [selectedItems, setSelectedItems] = useState<{ type: 'priority' | 'task'; id: string }[]>([]);
  const [filterAssignee, setFilterAssignee] = useState(true);

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name);
        setDescription(editing.description || '');
        setAssignedTo(editing.assigned_to);
        setDueDate(editing.due_date || '');
        setStatus(editing.status);
        setSelectedItems(editing.items.map(i => ({ type: i.item_type, id: i.item_id })));
      } else {
        setName('');
        setDescription('');
        setAssignedTo(defaultAssignee ? [defaultAssignee] : []);
        setDueDate('');
        setStatus('aberto');
        setSelectedItems([]);
      }
    }
  }, [open, editing, defaultAssignee]);

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.name])), [clients]);

  const availablePriorities = useMemo(() => {
    return priorities.filter(p => {
      if (p.status === 'concluida' || p.status === 'cancelada') return false;
      if (filterAssignee && defaultAssignee) return assigneeMatches(p.assigned_to, defaultAssignee);
      return true;
    });
  }, [priorities, filterAssignee, defaultAssignee]);

  const availableTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.completed) return false;
      if (filterAssignee && defaultAssignee) return assigneeMatches(t.assigned_to, defaultAssignee);
      return true;
    });
  }, [tasks, filterAssignee, defaultAssignee]);

  const toggleItem = (type: 'priority' | 'task', id: string) => {
    setSelectedItems(prev => prev.some(x => x.type === type && x.id === id)
      ? prev.filter(x => !(x.type === type && x.id === id))
      : [...prev, { type, id }]);
  };

  const isSelected = (type: 'priority' | 'task', id: string) => selectedItems.some(x => x.type === type && x.id === id);

  const toggleAssignee = (nm: string) => {
    setAssignedTo(prev => prev.some(a => normalizeAssignee(a) === normalizeAssignee(nm))
      ? prev.filter(a => normalizeAssignee(a) !== normalizeAssignee(nm))
      : [...prev, nm]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      assigned_to: assignedTo,
      due_date: dueDate || null,
      status,
      items: selectedItems.map(x => ({ item_type: x.type, item_id: x.id })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar entregável' : 'Novo entregável'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Entregas até a próxima PT" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Prazo</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label>Status</Label>
              <select value={status} onChange={e => setStatus(e.target.value as DeliverableStatus)} className="w-full px-2 py-2 border rounded-md bg-background text-sm">
                {(Object.keys(DELIVERABLE_STATUS_CONFIG) as DeliverableStatus[]).map(s => (
                  <option key={s} value={s}>{DELIVERABLE_STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Responsáveis</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {responsibleList.map(r => {
                const selected = assignedTo.some(a => normalizeAssignee(a) === normalizeAssignee(r.name));
                return (
                  <button key={r.name} type="button" onClick={() => toggleAssignee(r.name)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${selected ? 'text-white' : 'bg-background hover:bg-muted'}`}
                    style={selected ? { backgroundColor: r.color, borderColor: r.color } : {}}>
                    {r.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Itens vinculados</Label>
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                <input type="checkbox" checked={filterAssignee} onChange={e => setFilterAssignee(e.target.checked)} />
                Só do responsável
              </label>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-md p-2 space-y-1">
              {availablePriorities.length > 0 && (
                <>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold pt-1">Prioridades</div>
                  {availablePriorities.map(p => (
                    <label key={p.id} className={cn('flex items-center gap-2 p-1.5 rounded cursor-pointer text-sm hover:bg-muted', isSelected('priority', p.id) && 'bg-red-50')}>
                      <input type="checkbox" checked={isSelected('priority', p.id)} onChange={() => toggleItem('priority', p.id)} />
                      <Star className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span className="flex-1 break-words">{p.title}</span>
                      {p.client_id && <span className="text-xs text-muted-foreground">{clientMap.get(p.client_id)}</span>}
                    </label>
                  ))}
                </>
              )}
              {availableTasks.length > 0 && (
                <>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold pt-2">Tarefas</div>
                  {availableTasks.map(t => (
                    <label key={t.id} className={cn('flex items-center gap-2 p-1.5 rounded cursor-pointer text-sm hover:bg-muted', isSelected('task', t.id) && 'bg-sky-50')}>
                      <input type="checkbox" checked={isSelected('task', t.id)} onChange={() => toggleItem('task', t.id)} />
                      <CheckSquare className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="flex-1 break-words">{t.title}</span>
                      <span className="text-xs text-muted-foreground">{clientMap.get(t.client_id)}</span>
                    </label>
                  ))}
                </>
              )}
              {availablePriorities.length === 0 && availableTasks.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4">Nenhum item disponível.</div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editing ? 'Salvar' : 'Criar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
