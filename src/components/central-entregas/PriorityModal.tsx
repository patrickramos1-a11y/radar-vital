import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Priority, PriorityFormData, PriorityStatus, PRIORITY_STATUS_CONFIG } from '@/types/priority';
import { Client } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { normalizeAssignee } from '@/lib/taskAssignee';

interface RespOption { name: string; color: string; initials: string; }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Priority | null;
  defaultAssignee?: string;
  presetTitle?: string;
  presetClientId?: string | null;
  presetDescription?: string;
  clients: Client[];
  responsibleList: RespOption[];
  onSubmit: (data: PriorityFormData) => Promise<void>;
  submitLabel?: string;
}

export function PriorityModal({ open, onOpenChange, editing, defaultAssignee, presetTitle, presetClientId, presetDescription, clients, responsibleList, onSubmit, submitLabel }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [weight, setWeight] = useState(3);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<PriorityStatus>('aberta');

  useEffect(() => {
    if (open) {
      if (editing) {
        setTitle(editing.title);
        setDescription(editing.description || '');
        setClientId(editing.client_id);
        setAssignedTo(editing.assigned_to);
        setDueDate(editing.due_date || '');
        setWeight(editing.weight);
        setCategory(editing.category || '');
        setStatus(editing.status);
      } else {
        setTitle(presetTitle || '');
        setDescription(presetDescription || '');
        setClientId(presetClientId || null);
        setAssignedTo(defaultAssignee ? [defaultAssignee] : []);
        setDueDate('');
        setWeight(3);
        setCategory('');
        setStatus('aberta');
      }
    }
  }, [open, editing, defaultAssignee, presetTitle, presetClientId, presetDescription]);

  const toggleAssignee = (name: string) => {
    setAssignedTo(prev => prev.some(a => normalizeAssignee(a) === normalizeAssignee(name))
      ? prev.filter(a => normalizeAssignee(a) !== normalizeAssignee(name))
      : [...prev, name]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      client_id: clientId,
      assigned_to: assignedTo,
      due_date: dueDate || null,
      weight,
      category: category.trim() || null,
      status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar prioridade' : (submitLabel || 'Nova prioridade')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Enviar relatório..." />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cliente</Label>
              <select value={clientId || ''} onChange={e => setClientId(e.target.value || null)} className="w-full px-2 py-2 border rounded-md bg-background text-sm">
                <option value="">— Sem cliente —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label>Prazo</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Responsáveis</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {responsibleList.map(r => {
                const selected = assignedTo.some(a => normalizeAssignee(a) === normalizeAssignee(r.name));
                return (
                  <button
                    key={r.name}
                    type="button"
                    onClick={() => toggleAssignee(r.name)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${selected ? 'text-white' : 'bg-background hover:bg-muted'}`}
                    style={selected ? { backgroundColor: r.color, borderColor: r.color } : {}}
                  >
                    {r.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Peso (1–5)</Label>
              <Input type="number" min={1} max={5} value={weight} onChange={e => setWeight(Number(e.target.value))} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex: Fiscal" />
            </div>
            <div>
              <Label>Status</Label>
              <select value={status} onChange={e => setStatus(e.target.value as PriorityStatus)} className="w-full px-2 py-2 border rounded-md bg-background text-sm">
                {(Object.keys(PRIORITY_STATUS_CONFIG) as PriorityStatus[]).map(s => (
                  <option key={s} value={s}>{PRIORITY_STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>{editing ? 'Salvar' : (submitLabel || 'Criar')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
