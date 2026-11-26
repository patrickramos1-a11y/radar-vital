import { useEffect, useMemo, useState } from 'react';
import { ArrowDownWideNarrow, Check, Clock3, LayoutGrid, List, ListChecks, MessageSquarePlus, MessageSquareText, MoreHorizontal, Pencil, Plus, Search, Trash2, X } from '@/components/icones';
import type { Client } from '@/types/client';
import type { Task } from '@/types/task';
import { buildProcesses, compareProcesses, isProcessOpen, maximumWeightProcesses, processesForAssignee, type Process } from '@/lib/processModel';
import { DEFAULT_PROCESS_WEIGHT, MAXIMUM_PROCESS_WEIGHT, isMaximumWeight, type ProcessWeight } from '@/lib/processWeight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ProcessModal, type CreateProcess } from './ProcessModal';
import type { CreateFollowUp } from './FollowUpModal';
import { colorWithAlpha, daysOpen, formatCommentDate, formatDay, today, weightVisual } from '@/lib/processDisplay';
import { commentsByProcess, type ProcessComment } from '@/lib/processFollowUp';
import type { AddProcessComment } from '@/hooks/useProcessComments';
import { ProcessCommentDialog, ProcessCommentList } from './ProcessCommentDialog';
import {
  AssigneePicker, ClientSideRail, EditableTitle, ProcessWeightPicker, RecurrenceBadge, StepList, TaskLinkAction, WorkSchedule,
  type RespOption, type ToggleTask, type UpdateTask,
} from './processParts';

export type ProcessView = 'processes' | 'panel';
/** Recorte fixo usado na Gestão de processos. 'all' mantém as duas visões. */
export type ProcessSection = 'all' | 'planned' | 'recurring';
type SortMode = 'weight' | 'oldest';

interface Props {
  collaborator: string;
  color: string;
  isTeamView: boolean;
  tasks: Task[];
  clients: Client[];
  responsibleList: RespOption[];
  allowCollaboratorFilter?: boolean;
  /** Planejar processos de peso Máxima. Os demais pesos qualquer pessoa planeja. */
  canPlanMaximum?: boolean;
  initialClientId?: string | null;
  initialView?: ProcessView;
  section?: ProcessSection;
  /** Acompanhamento: comentários ligados aos processos. Sem `onComment`, a aba não mostra comentários. */
  comments?: ProcessComment[];
  onComment?: AddProcessComment;
  onCreate: CreateProcess;
  /** Repetição: cadastra o processo como acompanhamento recorrente. */
  onCreateFollowUp?: CreateFollowUp;
  onToggleTask: ToggleTask;
  onUpdateTask: UpdateTask;
  onDeleteTask: (taskId: string, clientName?: string) => Promise<boolean>;
}

function ProcessRow({ process, client, tasks, rowIndex, responsibleList, canPlanMaximum, compact = false, startExpanded = false, comments, onComment, onEdit, onCreate, onToggleTask, onUpdateTask, onDeleteTask }: {
  process: Process; client?: Client; tasks: Task[]; rowIndex: number; responsibleList: RespOption[]; canPlanMaximum: boolean; compact?: boolean; startExpanded?: boolean;
  /** Comentários do processo, do mais novo ao mais antigo; `undefined` quando a tela não mostra acompanhamento. */
  comments?: ProcessComment[]; onComment?: () => void;
  onEdit: () => void; onCreate: CreateProcess; onToggleTask: ToggleTask; onUpdateTask: UpdateTask; onDeleteTask: Props['onDeleteTask'];
}) {
  const { task } = process;
  const [expanded, setExpanded] = useState(startExpanded);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const open = isProcessOpen(process);
  const age = daysOpen(task);
  const overdue = open && Boolean(process.dueDate && process.dueDate < today());
  const scheduled = Boolean(process.scheduledFor && process.scheduledFor > today());
  const visual = weightVisual(process.weight);
  const doneSteps = process.steps.filter(step => step.completed).length;
  const participants = [...new Set(process.descendants
    .filter(step => !step.completed && step.status !== 'cancelada')
    .flatMap(step => step.assigned_to)
    .filter(name => !process.assignees.includes(name)))]
    .map(name => responsibleList.find(person => person.name === name) ?? { name, color: '#64748b', initials: name.slice(0, 2).toUpperCase() });
  const clientName = client?.name || 'Cliente';

  const addStep = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    const ok = await onCreate(task.client_id, { title: draft.trim(), assigned_to: task.assigned_to, parent_task_id: task.id, priority: task.priority, modality: task.modality }, clientName);
    setSaving(false);
    if (ok) setDraft('');
  };
  const remove = async () => {
    const message = process.isRecurring && !process.completed
      ? `Excluir o processo "${task.title}" e todas as etapas, inclusive o histórico dos períodos? Para só parar a repetição, conclua o processo.`
      : process.completed
      ? `Excluir o processo "${task.title}", as etapas e o entregável gerado por ele?`
      : `Excluir o processo "${task.title}" e todas as etapas?`;
    if (window.confirm(message)) await onDeleteTask(task.id, clientName);
  };

  return <article className={cn('relative border-b border-l-2 last:border-b-0', overdue ? 'border-l-red-600' : visual.borderClass)}>
    <div className={cn('flex min-w-0 items-center gap-1.5 px-2 py-1.5', rowIndex % 2 ? 'bg-slate-50/70' : 'bg-white')}>
      <button
        type="button"
        onClick={() => void onToggleTask(task.id, clientName)}
        title={process.completed ? 'Reabrir processo' : 'Concluir processo'}
        aria-label={process.completed ? `Reabrir processo ${task.title}` : `Concluir processo ${task.title}`}
        className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors', process.completed ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-400 bg-white text-transparent hover:border-emerald-600')}
      >
        {process.completed && <Check className="h-3 w-3" />}
      </button>
      <div className="min-w-0 flex-1">
        <EditableTitle title={task.title} completed={process.completed} expanded={expanded} twoLines={compact} ariaLabel={`${expanded ? 'Recolher' : 'Expandir'} processo ${task.title}`} onToggle={() => setExpanded(value => !value)} onSave={title => onUpdateTask(task.id, { title })} />
        <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 text-slate-600" title={process.completed ? `${age} dias de duração` : `${age} dias desde a criação`} aria-label={process.completed ? `${age} dias de duração` : `${age} dias desde a criação`}><Clock3 className="h-3 w-3" />{age}d</span>
          {open ? <ProcessWeightPicker task={task} onUpdateTask={onUpdateTask} /> : <span className={cn('border px-1.5 py-0.5 font-semibold', visual.className)}>{visual.label}</span>}
          <RecurrenceBadge task={task} />
          {process.dueDate && <span className={cn('px-1.5 py-0.5', overdue ? 'bg-red-50 font-semibold text-red-700' : 'bg-sky-50 text-sky-700')}>{process.isRecurring ? (overdue ? 'Período atrasado · ' : 'Próximo período ') : (overdue ? 'Atrasado · ' : 'Vencimento ')}{formatDay(process.dueDate)}</span>}
          {scheduled && <span className="bg-violet-50 px-1.5 py-0.5 font-medium text-violet-700">Volta em {formatDay(process.scheduledFor!)}</span>}
          <AssigneePicker task={task} responsibleList={responsibleList} onUpdateTask={onUpdateTask} />
          {participants.length > 0 && <span className="flex -space-x-1" aria-label={`Também nas etapas: ${participants.map(person => person.name).join(', ')}`} title={`Também nas etapas: ${participants.map(person => person.name).join(', ')}`}>
            {participants.slice(0, 4).map(person => <span key={person.name} className="flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold text-white ring-1 ring-white" style={{ backgroundColor: person.color }}>{person.initials}</span>)}
          </span>}
          {comments && comments.length > 0 && <span className="inline-flex items-center gap-1 bg-sky-50 px-1.5 py-0.5 text-sky-700" title={`Último comentário em ${formatCommentDate(comments[0].createdAt)} por ${comments[0].authorName}`} aria-label={`${comments.length} ${comments.length === 1 ? 'comentário' : 'comentários'} de acompanhamento`}><MessageSquareText className="h-3 w-3" />{comments.length}</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        {open && (canPlanMaximum || !isMaximumWeight(process.weight)) && <WorkSchedule task={task} onUpdateTask={onUpdateTask} />}
        <span className="hidden sm:inline-flex"><TaskLinkAction task={task} onUpdateTask={onUpdateTask} /></span>
        {process.steps.length > 0 && <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          aria-label={`${expanded ? 'Recolher' : 'Mostrar'} ${process.steps.length} ${process.steps.length === 1 ? 'etapa' : 'etapas'} de ${task.title}`}
          aria-expanded={expanded}
          title={`${doneSteps}/${process.steps.length} etapas`}
          className={cn('inline-flex h-7 shrink-0 items-center gap-1 border px-1.5 text-[10px] font-bold transition-colors', expanded ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-100')}
        >
          <ListChecks className="h-3.5 w-3.5" />{doneSteps}/{process.steps.length}
        </button>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button type="button" title="Mais ações" aria-label={`Mais ações do processo ${task.title}`} className="p-1.5 text-muted-foreground hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onComment && <DropdownMenuItem onSelect={onComment}><MessageSquarePlus className="mr-2 h-4 w-4" />Comentar</DropdownMenuItem>}
            <DropdownMenuItem onSelect={onEdit}><Pencil className="mr-2 h-4 w-4" />Editar processo</DropdownMenuItem>
            <DropdownMenuItem className="text-red-700 focus:text-red-700" onSelect={() => void remove()}><Trash2 className="mr-2 h-4 w-4" />Excluir processo</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    {expanded && <div className="bg-white px-3 pb-3 sm:px-4">
      {task.description && <p className="mb-2 whitespace-pre-line text-xs text-muted-foreground">{task.description}</p>}
      <StepList parentId={task.id} tasks={tasks} clientName={clientName} responsibleList={responsibleList} onToggle={onToggleTask} onUpdateTask={onUpdateTask} />
      {open && <form className="mt-2 flex gap-2" onSubmit={event => { event.preventDefault(); void addStep(); }}>
        <Input value={draft} onChange={event => setDraft(event.target.value)} placeholder="Nova etapa" aria-label={`Nova etapa para ${task.title}`} className="h-8 text-xs" />
        <Button type="submit" size="sm" variant="outline" disabled={!draft.trim() || saving} title="Adicionar etapa" aria-label="Adicionar etapa"><Plus className="h-4 w-4" /></Button>
      </form>}
      {comments && onComment && <div className="mt-3 border-t pt-2">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-700">Acompanhamento</p>
          <Button type="button" size="sm" variant="ghost" className="h-7 text-xs text-sky-700" onClick={onComment} aria-label={`Comentar ${task.title}`}><MessageSquarePlus className="mr-1 h-3.5 w-3.5" />Comentar</Button>
        </div>
        <ProcessCommentList comments={comments} />
      </div>}
    </div>}
  </article>;
}

function QuickProcessInput({ client, assignee, weight, onCreate, onClose }: {
  client: Client; assignee: string; weight: ProcessWeight; onCreate: CreateProcess; onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  return <form className="flex min-w-0 flex-1 items-center gap-1 px-1" onSubmit={async event => {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const created = await onCreate(client.id, { title: title.trim(), assigned_to: [assignee], weight }, client.name);
    setSaving(false);
    if (created) onClose();
  }}>
    <Input autoFocus value={title} onChange={event => setTitle(event.target.value)} aria-label={`Novo processo para ${client.name}`} placeholder={weight === MAXIMUM_PROCESS_WEIGHT ? 'Novo processo de peso Máxima' : 'Descreva o novo processo'} className="h-7 min-w-0 flex-1 border-0 bg-white/90 text-[11px] shadow-none focus-visible:ring-1" />
    <button type="submit" disabled={!title.trim() || saving} title="Adicionar processo" aria-label="Adicionar processo" className="flex h-7 w-7 shrink-0 items-center justify-center bg-primary text-primary-foreground disabled:opacity-40"><Plus className="h-4 w-4" /></button>
    <button type="button" onClick={onClose} title="Cancelar" aria-label="Cancelar novo processo" className="flex h-7 w-7 shrink-0 items-center justify-center text-slate-500 hover:bg-white"><X className="h-4 w-4" /></button>
  </form>;
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * Processos v2 (D-025): duas visões. "Processos" mostra todos, agrupados por
 * cliente; "Painel" mostra só os abertos de peso Máxima, em cartões.
 */
export function ProcessesTab({ collaborator, color, isTeamView, tasks, clients, responsibleList, allowCollaboratorFilter = false, canPlanMaximum = true, initialClientId, initialView = 'processes', section = 'all', comments, onComment, onCreate, onCreateFollowUp, onToggleTask, onUpdateTask, onDeleteTask }: Props) {
  const [chosenView, setView] = useState<ProcessView>(initialView);
  const view: ProcessView = section === 'all' ? chosenView : 'processes';
  const [sortMode, setSortMode] = useState<SortMode>('weight');
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState(initialClientId || 'all');
  const defaultPerson = isTeamView ? 'all' : collaborator;
  const [collaboratorFilter, setCollaboratorFilter] = useState(defaultPerson);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showPlanned, setShowPlanned] = useState(false);
  const [quickClientId, setQuickClientId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  useEffect(() => setClientFilter(initialClientId || 'all'), [initialClientId]);
  useEffect(() => setCollaboratorFilter(defaultPerson), [defaultPerson]);

  const clientById = useMemo(() => new Map(clients.map(client => [client.id, client])), [clients]);
  const allProcesses = useMemo(() => buildProcesses(tasks), [tasks]);
  const [commenting, setCommenting] = useState<Process | null>(null);
  const byProcess = useMemo(
    () => onComment ? commentsByProcess(allProcesses, comments ?? []) : null,
    [allProcesses, comments, onComment],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    const byPerson = collaboratorFilter === 'all' || initialClientId
      ? allProcesses
      : processesForAssignee(allProcesses, collaboratorFilter);
    const isPlanned = (process: Process) => Boolean(process.scheduledFor && process.scheduledFor > today());
    const visible = byPerson.filter(process =>
      (showCompleted || isProcessOpen(process))
      && (section === 'planned' ? isPlanned(process) : section === 'recurring' ? process.isRecurring : (showPlanned || !isPlanned(process)))
      && (clientFilter === 'all' || process.clientId === clientFilter)
      && (!query || `${process.title} ${process.description || ''} ${clientById.get(process.clientId)?.name || ''}`.toLocaleLowerCase('pt-BR').includes(query)));
    const base = view === 'panel' ? maximumWeightProcesses(visible) : visible;
    return [...base].sort((a, b) => sortMode === 'oldest'
      ? a.createdAt.localeCompare(b.createdAt) || b.weight - a.weight
      : compareProcesses(a, b));
  }, [allProcesses, collaboratorFilter, initialClientId, showCompleted, showPlanned, section, clientFilter, search, clientById, view, sortMode]);
  const groups = useMemo(() => {
    const byClient = new Map<string, Process[]>();
    filtered.forEach(process => byClient.set(process.clientId || 'sem-cliente', [...(byClient.get(process.clientId || 'sem-cliente') || []), process]));
    // Os processos já vêm ordenados; o grupo segue o seu primeiro processo.
    return [...byClient];
  }, [filtered]);

  const selectedAssignee = collaboratorFilter !== 'all' ? collaboratorFilter : collaborator;
  const quickWeight: ProcessWeight = view === 'panel' ? MAXIMUM_PROCESS_WEIGHT : DEFAULT_PROCESS_WEIGHT;
  const openModal = (task: Task | null) => { setEditing(task); setModalOpen(true); };
  const one = filtered.length === 1;
  const kind = view === 'panel' ? ' de peso Máxima'
    : section === 'planned' ? (one ? ' planejado' : ' planejados')
      : section === 'recurring' ? (one ? ' que se repete' : ' que se repetem')
        : '';
  const summary = `${plural(filtered.length, 'processo', 'processos')}${kind} em ${plural(groups.length, 'cliente', 'clientes')}`;
  const emptyText = view === 'panel' ? 'Nenhum processo de peso Máxima para este filtro.'
    : section === 'planned' ? 'Nenhum processo planejado para este filtro.'
      : section === 'recurring' ? 'Nenhum processo que se repete para este filtro.'
        : 'Nenhum processo para este filtro.';

  const renderRows = (items: Process[], client?: Client) => <div className="min-w-0">
    {items.map((process, rowIndex) => <ProcessRow key={process.id} process={process} client={client} tasks={tasks} rowIndex={rowIndex} responsibleList={responsibleList} canPlanMaximum={canPlanMaximum} compact={view === 'panel'} startExpanded={section === 'recurring'} comments={byProcess ? byProcess.get(process.id) ?? [] : undefined} onComment={onComment ? () => setCommenting(process) : undefined} onEdit={() => openModal(process.task)} onCreate={onCreate} onToggleTask={onToggleTask} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} />)}
  </div>;

  return <div className="space-y-3">
    <div className="barra-filtros-r border bg-white p-2 shadow-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="grupo-r flex h-8 items-center border bg-slate-50" role="group" aria-label="Ordenar processos">
          <span className="hidden px-2 text-[10px] text-muted-foreground lg:inline">Ordenar</span>
          <button type="button" aria-pressed={sortMode === 'weight'} onClick={() => setSortMode('weight')} title="Maior peso, depois vencimento mais próximo" aria-label="Ordenar por peso" className={cn('flex h-8 w-8 items-center justify-center', sortMode === 'weight' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-white')}><ArrowDownWideNarrow className="h-4 w-4" /></button>
          <button type="button" aria-pressed={sortMode === 'oldest'} onClick={() => setSortMode('oldest')} title="Mais antigos primeiro" aria-label="Ordenar pelos mais antigos" className={cn('flex h-8 w-8 items-center justify-center', sortMode === 'oldest' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-white')}><Clock3 className="h-4 w-4" /></button>
        </div>
        <div className="busca-r luz luz--foco relative min-w-[190px] flex-1 rounded-md"><Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" /><Input className="h-8 pl-8 text-xs" placeholder="Buscar processo ou cliente" aria-label="Buscar processo ou cliente" value={search} onChange={event => setSearch(event.target.value)} /></div>
        <select aria-label="Filtrar cliente" value={clientFilter} onChange={event => setClientFilter(event.target.value)} className="filtro-r h-8 max-w-[190px] border bg-white px-2 text-xs"><option value="all">Todos os clientes</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select>
        {allowCollaboratorFilter && <select aria-label="Filtrar responsável" value={collaboratorFilter} onChange={event => setCollaboratorFilter(event.target.value)} className="filtro-r h-8 max-w-[190px] border bg-white px-2 text-xs"><option value="all">Todos os responsáveis</option>{responsibleList.map(person => <option key={person.name} value={person.name}>{person.name}</option>)}</select>}
        <label className="filtro-r flex h-8 items-center gap-1 border px-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={showCompleted} onChange={event => setShowCompleted(event.target.checked)} />Concluídos</label>
        {section === 'all' && <label className="filtro-r flex h-8 items-center gap-1 border px-2 text-[11px] text-muted-foreground"><input type="checkbox" checked={showPlanned} onChange={event => setShowPlanned(event.target.checked)} />Planejados</label>}
        <Button size="sm" className="h-8" onClick={() => openModal(null)}><Plus className="mr-1 h-4 w-4" />Novo processo</Button>
      </div>
    </div>
    <div className="flex items-center justify-between gap-3 border-b pb-2">
      <p className="text-xs text-muted-foreground">{summary}</p>
      {section === 'all' && <div className="grupo-r flex border" role="group" aria-label="Visão">
        <button type="button" aria-pressed={view === 'processes'} onClick={() => setView('processes')} className={cn('inline-flex h-8 items-center gap-1 px-2 text-xs', view === 'processes' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600')}><List className="h-3.5 w-3.5" />Processos</button>
        <button type="button" aria-pressed={view === 'panel'} onClick={() => setView('panel')} className={cn('inline-flex h-8 items-center gap-1 border-l px-2 text-xs', view === 'panel' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600')}><LayoutGrid className="h-3.5 w-3.5" />Painel</button>
      </div>}
    </div>
    {groups.length === 0 && <div className="border px-4 py-8 text-center text-sm text-muted-foreground">{emptyText}</div>}
    <div className={view === 'panel' ? 'grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4' : 'space-y-3'}>
      {groups.map(([clientId, items]) => {
        const client = clientById.get(clientId);
        const colors = [...new Set(items.flatMap(item => item.assignees).map(name => responsibleList.find(person => person.name === name)?.color).filter(Boolean))] as string[];
        const quickOpen = Boolean(client) && quickClientId === clientId;
        const quickInput = client && <QuickProcessInput client={client} assignee={selectedAssignee} weight={quickWeight} onCreate={onCreate} onClose={() => setQuickClientId(null)} />;

        if (view === 'panel') {
          const headerBackground = colors.length > 1
            ? `linear-gradient(90deg, ${colors.map((item, index) => `${colorWithAlpha(item, '22')} ${Math.round(index * 100 / Math.max(1, colors.length - 1))}%`).join(', ')})`
            : colorWithAlpha(colors[0] || color, '18');
          return <section key={clientId} className="client-card-compact holofote min-w-0 overflow-hidden border-t-2 bg-white" style={{ borderTopColor: colors[0] || color }}>
            <header className="flex h-11 min-w-0 items-center border-b px-2" style={{ background: headerBackground }}>
              {quickOpen ? quickInput : <button type="button" onClick={() => client && setQuickClientId(client.id)} disabled={!client} title={client ? `Novo processo de peso Máxima para ${client.name}` : 'Sem cliente'} aria-label={client ? `Novo processo para ${client.name}` : 'Sem cliente'} className="flex h-full min-w-0 flex-1 items-center gap-2 text-left">
                {client?.logoUrl && <img src={client.logoUrl} alt={`Logo ${client.name}`} className="h-8 w-12 shrink-0 object-contain" />}
                <span className={cn('min-w-0 flex-1 truncate font-bold text-slate-800', client?.logoUrl ? 'text-xs' : 'text-sm')}>{client?.name || 'Sem cliente'}</span>
                <span className="shrink-0 bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{items.length}</span>
                {client && <Plus className="h-3.5 w-3.5 shrink-0 text-primary" />}
              </button>}
            </header>
            {renderRows(items, client)}
          </section>;
        }

        return <section key={clientId} className="client-card-compact holofote grid min-w-0 grid-cols-[72px_minmax(0,1fr)] overflow-hidden border-t-2 bg-white sm:grid-cols-[96px_minmax(0,1fr)]" style={{ borderTopColor: colors[0] || color }}>
          <ClientSideRail client={client} count={items.length} onClick={client ? () => setQuickClientId(client.id) : undefined} />
          <div className="min-w-0">
            {quickOpen && <div className="flex h-10 items-center border-b bg-slate-50 px-1">{quickInput}</div>}
            {renderRows(items, client)}
          </div>
        </section>;
      })}
    </div>
    <ProcessModal
      open={modalOpen}
      onOpenChange={setModalOpen}
      editing={editing}
      clients={clients}
      responsibleList={responsibleList}
      defaultAssignee={selectedAssignee}
      presetClientId={clientFilter === 'all' ? null : clientFilter}
      defaultWeight={quickWeight}
      onCreate={onCreate}
      onUpdateTask={onUpdateTask}
      onCreateFollowUp={onCreateFollowUp}
    />
    {onComment && <ProcessCommentDialog
      open={Boolean(commenting)}
      onOpenChange={open => { if (!open) setCommenting(null); }}
      processTitle={commenting?.title ?? ''}
      clientName={commenting ? clientById.get(commenting.clientId)?.name : undefined}
      comments={commenting ? byProcess?.get(commenting.id) ?? [] : []}
      onSubmit={text => commenting
        ? onComment({ taskId: commenting.id, clientId: commenting.clientId, clientName: clientById.get(commenting.clientId)?.name }, text)
        : Promise.resolve(false)}
    />}
  </div>;
}
