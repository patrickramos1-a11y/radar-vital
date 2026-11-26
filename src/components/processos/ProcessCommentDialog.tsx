import { useEffect, useState } from 'react';
import { MessageSquareText } from '@/components/icones';
import type { ProcessComment } from '@/lib/processFollowUp';
import { formatCommentDate } from '@/lib/processDisplay';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/** Lista curta de comentários de acompanhamento, do mais novo ao mais antigo. */
export function ProcessCommentList({ comments, limit = 3 }: { comments: ProcessComment[]; limit?: number }) {
  if (!comments.length) return <p className="text-[11px] text-muted-foreground">Ainda sem comentários de acompanhamento.</p>;
  return <ul className="space-y-1.5">
    {comments.slice(0, limit).map(comment => <li key={comment.id} className="border-l-2 border-sky-300 bg-sky-50/50 px-2 py-1 text-[11px]">
      <p className="whitespace-pre-line text-slate-800">{comment.text}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{comment.authorName} · {formatCommentDate(comment.createdAt)}</p>
    </li>)}
    {comments.length > limit && <li className="text-[10px] text-muted-foreground">+ {comments.length - limit} {comments.length - limit === 1 ? 'comentário anterior' : 'comentários anteriores'}</li>}
  </ul>;
}

export function ProcessCommentDialog({ open, onOpenChange, processTitle, clientName, comments, onSubmit }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processTitle: string;
  clientName?: string;
  comments: ProcessComment[];
  onSubmit: (text: string) => Promise<boolean>;
}) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setText(''); }, [open]);

  const submit = async () => {
    if (!text.trim() || saving) return;
    setSaving(true);
    const ok = await onSubmit(text);
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-sky-700" />Comentar processo</DialogTitle>
        <DialogDescription>{processTitle}{clientName ? ` · ${clientName}` : ''}. O comentário também aparece nos Comentários do cliente.</DialogDescription>
      </DialogHeader>
      <form className="space-y-3" onSubmit={event => { event.preventDefault(); void submit(); }}>
        <div>
          <Label htmlFor="process-comment">Acompanhamento</Label>
          <Textarea id="process-comment" autoFocus rows={4} value={text} onChange={event => setText(event.target.value)} placeholder="O que andou neste processo?" />
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-700">Últimos comentários</p>
          <ProcessCommentList comments={comments} limit={5} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" disabled={!text.trim() || saving}>Registrar comentário</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
