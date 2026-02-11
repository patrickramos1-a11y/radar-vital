import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send, Pencil, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCurrentUserName } from '@/contexts/AuthContext';
import type { BacklogMessage } from '@/hooks/useBacklogMessages';

interface BacklogChatProps {
  messages: BacklogMessage[];
  isLoading: boolean;
  onSend: (text: string) => Promise<void>;
  onEdit: (id: string, text: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
];

function getColorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function BacklogChat({ messages, isLoading, onSend, onEdit, onDelete }: BacklogChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentUser = getCurrentUserName();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    await onSend(newMessage);
    setNewMessage('');
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEditSave = async (id: string) => {
    if (!editText.trim()) return;
    await onEdit(id, editText);
    setEditingId(null);
    setEditText('');
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground text-center py-8">Carregando conversa...</div>;
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages area */}
      <ScrollArea className="flex-1 pr-4" ref={scrollRef as any}>
        <div className="space-y-4 py-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-12">
              Nenhuma mensagem ainda. Inicie a conversa!
            </div>
          )}
          {messages.map((msg) => {
            const isOwn = msg.author_name === currentUser;
            const isEditing = editingId === msg.id;

            return (
              <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={`${getColorForName(msg.author_name)} text-white text-xs`}>
                    {getInitials(msg.author_name)}
                  </AvatarFallback>
                </Avatar>

                <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-semibold text-foreground">{msg.author_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(msg.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      {msg.is_edited && <span className="ml-1 italic">(editada)</span>}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 w-full">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-[60px] text-sm"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="w-3 h-3 mr-1" /> Cancelar
                        </Button>
                        <Button size="sm" onClick={() => handleEditSave(msg.id)}>
                          <Check className="w-3 h-3 mr-1" /> Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}>
                      {msg.message}
                    </div>
                  )}

                  {isOwn && !isEditing && (
                    <div className={`flex gap-1 mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => { setEditingId(msg.id); setEditText(msg.message); }}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(msg.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-border pt-3 mt-2 flex gap-2 items-end">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma mensagem..."
          className="min-h-[44px] max-h-[120px] text-sm resize-none"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          size="icon"
          className="shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
