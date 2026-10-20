import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Circle,
  Link2,
  MessageSquareText,
  Plus,
  Repeat2,
  Shapes,
  Trash2,
  UserRound,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  PRIORITY_CONFIG,
  TASK_MODALITY_CONFIG,
  TASK_RECURRENCE_LABELS,
  TASK_STATUS_CONFIG,
  type Task,
  type TaskDependency,
  type TaskFormData,
  type TaskModality,
  type TaskPriority,
  type TaskRecurrence,
  type TaskStatus,
} from '@/types/task';
import { getTaskProgress } from '@/lib/taskOperations';

interface CollaboratorOption {
  id: string;
  name: string;
  color?: string;
}

interface TaskDetailSheetProps {
  task: Task | null;
  tasks: Task[];
  dependencies: TaskDependency[];
  collaborators: CollaboratorOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateTask: (taskId: string, data: Partial<Task>) => Promise<boolean>;
  onAddTask: (clientId: string, data: TaskFormData) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
  onSetDependencies: (taskId: string, dependsOnIds: string[]) => Promise<boolean>;
}

export function TaskDetailSheet({
  task,
  tasks,
  dependencies,
  collaborators,
  open,
  onOpenChange,
  onUpdateTask,
  onAddTask,
  onDeleteTask,
  onSetDependencies,
}: TaskDetailSheetProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setNewSubtask('');
  }, [task]);

  const subtasks = useMemo(
    () => tasks.filter((item) => item.parent_task_id === task?.id)
      .sort((left, right) => left.sort_order - right.sort_order || left.created_at.localeCompare(right.created_at)),
    [task?.id, tasks],
  );
  const progress = task ? getTaskProgress(task.id, tasks) : { completed: 0, total: 0 };
  const progressValue = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;
  const dependencyIds = useMemo(
    () => dependencies.filter((item) => item.task_id === task?.id).map((item) => item.depends_on_task_id),
    [dependencies, task?.id],
  );
  const dependencyTasks = dependencyIds.map((id) => tasks.find((item) => item.id === id)).filter(Boolean) as Task[];
  const hasOpenDependency = dependencyTasks.some((item) => !item.completed && item.status !== 'cancelada');
  const dependencyCandidates = tasks.filter((item) => (
    item.client_id === task?.client_id
    && item.id !== task?.id
    && !item.parent_task_id
    && !item.completed
  ));

  if (!task) return null;

  const saveField = async (data: Partial<Task>) => {
    setSaving(true);
    try {
      await onUpdateTask(task.id, data);
    } finally {
      setSaving(false);
    }
  };

  const saveTextFields = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setTitle(task.title);
      return;
    }
    if (trimmedTitle === task.title && description.trim() === (task.description ?? '')) return;
    await saveField({ title: trimmedTitle, description: description.trim() || null });
  };

  const addSubtask = async () => {
    const value = newSubtask.trim();
    if (!value) return;
    const created = await onAddTask(task.client_id, {
      title: value,
      assigned_to: task.assigned_to,
      priority: task.priority,
      modality: task.modality,
      parent_task_id: task.id,
      sort_order: subtasks.length,
    });
    if (created) setNewSubtask('');
  };

  const toggleDependency = async (candidateId: string) => {
    const next = dependencyIds.includes(candidateId)
      ? dependencyIds.filter((id) => id !== candidateId)
      : [...dependencyIds, candidateId];
    await onSetDependencies(task.id, next);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-5 py-4 pr-12">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {task.parent_task_id ? 'Subtarefa' : 'Tarefa'}
            {task.source_comment_id && (
              <span className="inline-flex items-center gap-1 text-indigo-700">
                <MessageSquareText className="h-3 w-3" /> Originada de comentário
              </span>
            )}
          </div>
          <SheetTitle className="sr-only">Detalhes da tarefa</SheetTitle>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={saveTextFields}
            className="h-auto border-0 px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
            aria-label="Título da tarefa"
          />
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <section className="border-b px-5 py-4">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Contexto</label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              onBlur={saveTextFields}
              placeholder="Descreva o que precisa ser feito, o resultado esperado e as informações importantes."
              className="mt-2 min-h-24 resize-y"
            />
          </section>

          <section className="grid gap-4 border-b px-5 py-4 sm:grid-cols-2">
            <Field label="Situação">
              <select
                value={task.status}
                onChange={(event) => saveField({ status: event.target.value as TaskStatus })}
                className={cn('h-9 w-full rounded-md border px-2 text-sm', TASK_STATUS_CONFIG[task.status].className)}
              >
                {(Object.keys(TASK_STATUS_CONFIG) as TaskStatus[]).map((status) => (
                  <option key={status} value={status}>{TASK_STATUS_CONFIG[status].label}</option>
                ))}
              </select>
            </Field>
            <Field label="Urgência">
              <select
                value={task.priority}
                onChange={(event) => saveField({ priority: event.target.value as TaskPriority })}
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              >
                {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((priority) => (
                  <option key={priority} value={priority}>{PRIORITY_CONFIG[priority].label}</option>
                ))}
              </select>
            </Field>
            <Field label="Modalidade" icon={<Shapes className="h-3.5 w-3.5" />}>
              <select
                value={task.modality}
                onChange={(event) => saveField({ modality: event.target.value as TaskModality })}
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              >
                {(Object.keys(TASK_MODALITY_CONFIG) as TaskModality[]).map((modality) => (
                  <option key={modality} value={modality}>{TASK_MODALITY_CONFIG[modality].label}</option>
                ))}
              </select>
            </Field>
            <Field label="Prazo" icon={<CalendarDays className="h-3.5 w-3.5" />}>
              <Input
                type="date"
                value={task.due_date ?? ''}
                onChange={(event) => saveField({ due_date: event.target.value || null })}
                className="h-9"
              />
            </Field>
            <Field label="Recorrência" icon={<Repeat2 className="h-3.5 w-3.5" />}>
              <select
                value={task.recurrence}
                onChange={(event) => saveField({ recurrence: event.target.value as TaskRecurrence })}
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
              >
                {(Object.keys(TASK_RECURRENCE_LABELS) as TaskRecurrence[]).map((recurrence) => (
                  <option key={recurrence} value={recurrence}>{TASK_RECURRENCE_LABELS[recurrence]}</option>
                ))}
              </select>
            </Field>
          </section>

          <section className="border-b px-5 py-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <UserRound className="h-4 w-4 text-muted-foreground" /> Responsáveis
            </div>
            <div className="flex flex-wrap gap-2">
              {collaborators.map((collaborator) => {
                const selected = task.assigned_to.some((name) => name.toLowerCase() === collaborator.name.toLowerCase());
                return (
                  <button
                    key={collaborator.id}
                    type="button"
                    onClick={() => saveField({
                      assigned_to: selected
                        ? task.assigned_to.filter((name) => name.toLowerCase() !== collaborator.name.toLowerCase())
                        : [...task.assigned_to, collaborator.name],
                    })}
                    className={cn(
                      'inline-flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs font-medium transition-colors',
                      selected ? 'border-primary bg-primary/10 text-primary' : 'bg-background text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: collaborator.color || '#64748B' }} />
                    {collaborator.name}
                  </button>
                );
              })}
            </div>
          </section>

          {!task.parent_task_id && (
            <section className="border-b px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Etapas da tarefa</h3>
                  <p className="text-xs text-muted-foreground">
                    {progress.total ? `${progress.completed} de ${progress.total} concluídas` : 'Nenhuma subtarefa adicionada'}
                  </p>
                </div>
                {progress.total > 0 && <span className="text-sm font-semibold">{progressValue}%</span>}
              </div>
              {progress.total > 0 && <Progress value={progressValue} className="mt-3 h-2" />}

              <div className="mt-3 divide-y rounded-md border">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onUpdateTask(subtask.id, { completed: !subtask.completed })}
                      className="text-muted-foreground hover:text-emerald-600"
                      title={subtask.completed ? 'Reabrir subtarefa' : 'Concluir subtarefa'}
                    >
                      {subtask.completed
                        ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        : <Circle className="h-5 w-5" />}
                    </button>
                    <span className={cn('min-w-0 flex-1 text-sm', subtask.completed && 'text-muted-foreground line-through')}>
                      {subtask.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{TASK_STATUS_CONFIG[subtask.status].label}</span>
                    <button
                      type="button"
                      onClick={() => onDeleteTask(subtask.id)}
                      className="p-1 text-muted-foreground hover:text-destructive"
                      title="Excluir subtarefa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2 p-2">
                  <Input
                    value={newSubtask}
                    onChange={(event) => setNewSubtask(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && addSubtask()}
                    placeholder="Adicionar uma etapa..."
                    className="h-8 border-0 shadow-none focus-visible:ring-0"
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={addSubtask} disabled={!newSubtask.trim()} title="Adicionar subtarefa">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </section>
          )}

          {!task.parent_task_id && (
            <section className="border-b px-5 py-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Link2 className="h-4 w-4 text-muted-foreground" /> Dependências
              </div>
              {hasOpenDependency && (
                <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" /> Esta tarefa depende de trabalho ainda não concluído.
                </div>
              )}
              {dependencyCandidates.length === 0 ? (
                <p className="text-xs text-muted-foreground">Não há outras tarefas abertas deste cliente.</p>
              ) : (
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {dependencyCandidates.map((candidate) => (
                    <label key={candidate.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
                      <input
                        type="checkbox"
                        checked={dependencyIds.includes(candidate.id)}
                        onChange={() => toggleDependency(candidate.id)}
                      />
                      <span className="line-clamp-1 text-xs">{candidate.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="px-5 py-4 text-xs text-muted-foreground">
            <p>Criada em {new Date(task.created_at).toLocaleString('pt-BR')}</p>
            <p>Última atualização em {new Date(task.updated_at).toLocaleString('pt-BR')}</p>
          </section>
        </div>

        <div className="flex items-center justify-between border-t px-5 py-3">
          <span className="text-xs text-muted-foreground">{saving ? 'Salvando...' : 'Alterações salvas automaticamente'}</span>
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={async () => {
              if (!window.confirm('Excluir esta tarefa e suas subtarefas?')) return;
              const deleted = await onDeleteTask(task.id);
              if (deleted) onOpenChange(false);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">{icon}{label}</span>
      {children}
    </label>
  );
}
