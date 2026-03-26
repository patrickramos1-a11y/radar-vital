import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTasks } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

interface CreateTaskFromCommentProps {
  commentText: string;
  clientId: string;
  clientName: string;
  collaborators: { id: string; name: string; color?: string }[];
}

export function CreateTaskFromComment({ commentText, clientId, clientName, collaborators }: CreateTaskFromCommentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { addTask } = useTasks();

  const handleOpen = (open: boolean) => {
    if (open) {
      setTitle(commentText.substring(0, 100));
      setAssignedTo('');
    }
    setIsOpen(open);
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setIsCreating(true);
    try {
      const success = await addTask(clientId, {
        title: title.trim(),
        assigned_to: assignedTo ? [assignedTo] : [],
      }, clientName);
      if (success) setIsOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
          title="Criar tarefa a partir deste comentário"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-3 space-y-3" align="end">
        <p className="text-xs font-semibold text-foreground">Nova Tarefa</p>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da tarefa"
          className="h-8 text-xs"
        />
        <Select value={assignedTo} onValueChange={setAssignedTo}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Responsável (opcional)" />
          </SelectTrigger>
          <SelectContent>
            {collaborators.map((c) => (
              <SelectItem key={c.id} value={c.name}>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color || '#6B7280' }} />
                  {c.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="w-full h-8 text-xs"
          onClick={handleCreate}
          disabled={!title.trim() || isCreating}
        >
          {isCreating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
          Criar Tarefa
        </Button>
      </PopoverContent>
    </Popover>
  );
}
