import { useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { Client } from '@/types/client';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ClientMultiPickerProps {
  clients: Client[];
  selectedClientIds: string[];
  onChange: (clientIds: string[]) => void;
  allowMultiple?: boolean;
  includeUniverseRamos?: boolean;
  disabled?: boolean;
}

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR');

export function ClientMultiPicker({
  clients,
  selectedClientIds,
  onChange,
  allowMultiple = true,
  includeUniverseRamos = false,
  disabled = false,
}: ClientMultiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const activeClients = useMemo(
    () => clients.filter(client => client.isActive).sort((left, right) => left.name.localeCompare(right.name, 'pt-BR')),
    [clients],
  );
  const universeClient = useMemo(
    () => activeClients.find(client => normalize(client.name) === 'ramos engenharia') ?? null,
    [activeClients],
  );
  const options = useMemo(() => {
    const regularClients = activeClients.filter(client => client.id !== universeClient?.id);
    const all = includeUniverseRamos && universeClient
      ? [{ client: universeClient, label: 'Universo Ramos', detail: 'Ramos Engenharia' }, ...regularClients.map(client => ({ client, label: client.name }))]
      : activeClients.map(client => ({ client, label: client.name }));
    const normalizedQuery = normalize(query.trim());
    return normalizedQuery
      ? all.filter(option => normalize(`${option.label} ${option.detail ?? ''}`).includes(normalizedQuery))
      : all;
  }, [activeClients, includeUniverseRamos, query, universeClient]);
  const selectedClients = activeClients.filter(client => selectedClientIds.includes(client.id));
  const selectedLabel = selectedClients.length === 0
    ? 'Pesquisar cliente'
    : selectedClients.length === 1
      ? (includeUniverseRamos && selectedClients[0].id === universeClient?.id ? 'Universo Ramos' : selectedClients[0].name)
      : `${selectedClients.length} empresas selecionadas`;

  const toggle = (clientId: string) => {
    const selected = selectedClientIds.includes(clientId);
    if (!allowMultiple) {
      onChange(selected ? [] : [clientId]);
      setIsOpen(false);
      return;
    }
    onChange(selected ? selectedClientIds.filter(id => id !== clientId) : [...selectedClientIds, clientId]);
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(open => !open)}
        className="flex h-10 w-full items-center justify-between gap-2 border bg-background px-3 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="truncate">{selectedLabel}</span>
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full border bg-background p-2 shadow-lg">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Digite para pesquisar..." className="h-9 pl-8 pr-8" />
            {query && <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="h-4 w-4" /></button>}
          </div>
          <div className="mt-2 max-h-52 overflow-y-auto">
            {options.map(({ client, label, detail }) => {
              const selected = selectedClientIds.includes(client.id);
              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => toggle(client.id)}
                  className="flex w-full items-center gap-2 border-b px-2 py-2 text-left text-sm last:border-b-0 hover:bg-muted"
                >
                  <span className={cn('grid h-4 w-4 shrink-0 place-items-center border', selected && 'border-primary bg-primary text-primary-foreground')}>
                    {selected && <Check className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {detail && <span className="shrink-0 text-[10px] text-muted-foreground">{detail}</span>}
                </button>
              );
            })}
            {options.length === 0 && <p className="px-2 py-3 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
