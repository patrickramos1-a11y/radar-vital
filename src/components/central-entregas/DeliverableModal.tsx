import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CalendarCheck2, Link2 } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Client } from '@/types/client';
import { Deliverable, DeliverableFormData } from '@/types/deliverable';
import { normalizeAssignee } from '@/lib/taskAssignee';

interface RespOption { name: string; color: string; initials: string; }

interface Props {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  editing: Deliverable | null;
  defaultAssignee?: string;
  clients: Client[];
  responsibleList: RespOption[];
  onSubmit: (data: DeliverableFormData) => Promise<void>;
}

const today = () => format(new Date(), 'yyyy-MM-dd');

export function DeliverableModal({
  open,
  onOpenChange,
  editing,
  defaultAssignee,
  clients,
  responsibleList,
  onSubmit,
}: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [completedDate, setCompletedDate] = useState(today());
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [requester, setRequester] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (editing) {
      setName(editing.name);
      setDescription(editing.description || '');
      setClientId(editing.client_id || '');
      setCompletedDate(format(new Date(editing.completed_at || editing.created_at), 'yyyy-MM-dd'));
      setAssignedTo(editing.assigned_to);
      setRequester(editing.requester ?? null);
      return;
    }

    setName('');
    setDescription('');
    setClientId('');
    setCompletedDate(today());
    setAssignedTo(defaultAssignee ? [defaultAssignee] : []);
    setRequester(null);
  }, [open, editing, defaultAssignee]);

  const toggleAssignee = (candidate: string) => {
    setAssignedTo(current => current.some(name => normalizeAssignee(name) === normalizeAssignee(candidate))
      ? current.filter(name => normalizeAssignee(name) !== normalizeAssignee(candidate))
      : [...current, candidate]);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !completedDate) return;

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      client_id: clientId || null,
      completed_at: new Date(`${completedDate}T12:00:00`).toISOString(),
      assigned_to: assignedTo,
      requester,
      status: 'concluido',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar entrega' : 'Registrar entrega'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <div className="flex items-center gap-2 font-medium">
              <CalendarCheck2 className="h-4 w-4" />
              Entregáveis registram somente trabalhos concluídos.
            </div>
          </div>

          {editing?.source_priority_id && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link2 className="h-3.5 w-3.5" />
              Criado automaticamente a partir de uma prioridade concluída.
            </div>
          )}

          <div>
            <Label htmlFor="deliverable-name">Entrega</Label>
            <Input
              id="deliverable-name"
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="Ex: Relatório de auditoria entregue"
              autoFocus
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="deliverable-client">Cliente</Label>
              <select
                id="deliverable-client"
                value={clientId}
                onChange={event => setClientId(event.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Sem cliente vinculado</option>
                {clients
                  .filter(client => client.isActive)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="deliverable-date">Data da entrega</Label>
              <Input
                id="deliverable-date"
                type="date"
                value={completedDate}
                onChange={event => setCompletedDate(event.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deliverable-description">Observação</Label>
            <Textarea
              id="deliverable-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              rows={2}
              placeholder="Informação complementar sobre a entrega"
            />
          </div>

          <div>
            <Label>Responsáveis</Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {responsibleList.map(responsible => {
                const selected = assignedTo.some(name => normalizeAssignee(name) === normalizeAssignee(responsible.name));
                return (
                  <button
                    key={responsible.name}
                    type="button"
                    onClick={() => toggleAssignee(responsible.name)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${selected ? 'text-white' : 'bg-background hover:bg-muted'}`}
                    style={selected ? { backgroundColor: responsible.color, borderColor: responsible.color } : {}}
                  >
                    {responsible.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Solicitante <span className="font-normal text-muted-foreground">(opcional)</span></Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setRequester(null)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${!requester ? 'border-foreground/30 bg-muted' : 'bg-background text-muted-foreground hover:bg-muted'}`}
              >
                Nenhum
              </button>
              {responsibleList.map(responsible => {
                const selected = requester && normalizeAssignee(requester) === normalizeAssignee(responsible.name);
                return (
                  <button
                    key={responsible.name}
                    type="button"
                    onClick={() => setRequester(responsible.name)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${selected ? 'text-white' : 'bg-background hover:bg-muted'}`}
                    style={selected ? { backgroundColor: responsible.color, borderColor: responsible.color } : {}}
                  >
                    {responsible.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !completedDate}>
            {editing ? 'Salvar entrega' : 'Registrar entrega'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
