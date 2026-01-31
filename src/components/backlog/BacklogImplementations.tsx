import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Wrench } from 'lucide-react';
import type { BacklogImplementation } from '@/types/backlog';
import { getCurrentUserName } from '@/contexts/AuthContext';

interface BacklogImplementationsProps {
  implementations: BacklogImplementation[];
  onAdd: (descricao: string, responsavel: string) => Promise<void>;
  onUpdate: (id: string, data: { status?: 'EXECUTADO' | 'NAO_EXECUTADO'; data_execucao?: string | null }) => Promise<void>;
  onDelete: (id: string, descricao: string) => Promise<void>;
}

export function BacklogImplementations({ 
  implementations, 
  onAdd, 
  onUpdate, 
  onDelete 
}: BacklogImplementationsProps) {
  const currentUserName = getCurrentUserName();
  const [newDescricao, setNewDescricao] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newDescricao.trim()) return;
    setIsAdding(true);
    await onAdd(newDescricao.trim(), currentUserName);
    setNewDescricao('');
    setIsAdding(false);
  };

  const handleToggleStatus = async (impl: BacklogImplementation) => {
    const newStatus = impl.status === 'EXECUTADO' ? 'NAO_EXECUTADO' : 'EXECUTADO';
    const dataExecucao = newStatus === 'EXECUTADO' ? new Date().toISOString().split('T')[0] : null;
    await onUpdate(impl.id, { status: newStatus, data_execucao: dataExecucao });
  };

  return (
    <div className="space-y-4">
      {/* Add new implementation */}
      <div className="flex gap-2">
        <Input
          value={newDescricao}
          onChange={(e) => setNewDescricao(e.target.value)}
          placeholder="Descreva o ajuste técnico..."
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={!newDescricao.trim() || isAdding}>
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
        </Button>
      </div>

      {/* Implementations list */}
      {implementations.length > 0 ? (
        <div className="space-y-2">
          {implementations.map((impl) => (
            <div
              key={impl.id}
              className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                impl.status === 'EXECUTADO' 
                  ? 'border-green-500/30 bg-green-500/5' 
                  : 'border-border bg-muted/30'
              }`}
            >
              {/* Checkbox */}
              <Checkbox
                checked={impl.status === 'EXECUTADO'}
                onCheckedChange={() => handleToggleStatus(impl)}
                className="mt-0.5"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${impl.status === 'EXECUTADO' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {impl.descricao}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{impl.responsavel}</span>
                  {impl.data_execucao && (
                    <>
                      <span>•</span>
                      <span>Executado em {format(new Date(impl.data_execucao), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Delete button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(impl.id, impl.descricao)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Nenhum registro de implementação</p>
          <p className="text-xs">Adicione ajustes técnicos relacionados a este item</p>
        </div>
      )}
    </div>
  );
}
