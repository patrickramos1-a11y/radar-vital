import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProcessesTab } from './ProcessesTab';
import type { Client } from '@/types/client';
import type { Task } from '@/types/task';

const client = {
  id: 'client-1',
  name: 'Cliente Alfa',
  initials: 'CA',
  logoUrl: '',
  isPriority: false,
  isActive: true,
  isChecked: false,
  isHighlighted: false,
  clientType: 'AC',
  order: 1,
  processes: 0,
  processBreakdown: { total: 0, deferido: 0, emAnaliseOrgao: 0, emAnaliseRamos: 0, notificado: 0, reprovado: 0 },
  licenses: 0,
  licenseBreakdown: { validas: 0, proximoVencimento: 0, foraValidade: 0, proximaDataVencimento: null },
  demands: { completed: 0, inProgress: 0, notStarted: 0, cancelled: 0 },
  demandsByCollaborator: { celine: 0, gabi: 0, darley: 0, vanessa: 0 },
  collaborators: { celine: false, gabi: false, darley: false, vanessa: false },
  municipios: [],
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
} satisfies Client;

const task = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  client_id: client.id,
  title: id,
  description: null,
  completed: false,
  status: 'pendente',
  assigned_to: ['Celine'],
  created_at: '2026-10-01T12:00:00.000Z',
  completed_at: null,
  due_date: null,
  scheduled_for: null,
  priority: 'normal',
  weight: 2,
  modality: 'levantamento',
  priority_id: null,
  parent_task_id: null,
  sort_order: 0,
  source_comment_id: null,
  recurrence: 'none',
  recurrence_origin_id: null,
  updated_at: '2026-10-01T12:00:00.000Z',
  ...overrides,
});

const people = [
  { name: 'Celine', color: '#0f766e', initials: 'CE' },
  { name: 'Gabi', color: '#a855f7', initials: 'GA' },
];

function renderTab(overrides: Partial<React.ComponentProps<typeof ProcessesTab>> = {}) {
  const props: React.ComponentProps<typeof ProcessesTab> = {
    collaborator: 'Celine',
    color: '#0f766e',
    isTeamView: false,
    tasks: [task('Entregar relatório', { weight: 5 })],
    clients: [client],
    responsibleList: people,
    onCreate: vi.fn(async () => true),
    onToggleTask: vi.fn(async () => true),
    onUpdateTask: vi.fn(async () => true),
    onDeleteTask: vi.fn(async () => true),
    ...overrides,
  };
  return { ...render(<ProcessesTab {...props} />), props };
}

describe('ProcessesTab', () => {
  it('lists the open processes of the collaborator grouped by client', () => {
    renderTab({ tasks: [task('Entregar relatório'), task('Outra pessoa', { assigned_to: ['Gabi'] })] });

    expect(screen.getByRole('button', { name: 'Novo processo para Cliente Alfa' })).toBeInTheDocument();
    expect(screen.getByText('Entregar relatório')).toBeInTheDocument();
    expect(screen.queryByText('Outra pessoa')).not.toBeInTheDocument();
    expect(screen.getByText('1 processo em 1 cliente')).toBeInTheDocument();
  });

  it('has no promote or demote actions', () => {
    renderTab();
    expect(screen.queryByRole('button', { name: /promover|voltar .*tarefa/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/prioridade/i)).not.toBeInTheDocument();
  });

  it('shows a process to the owner of an open nested step', () => {
    const tasks = [
      task('Entregar relatório'),
      task('Conferir anexos', { parent_task_id: 'Entregar relatório', assigned_to: ['Gabi'] }),
    ];
    renderTab({ collaborator: 'Gabi', tasks });

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar 1 etapa de Entregar relatório' }));
    expect(screen.getByText('Conferir anexos')).toBeInTheDocument();
  });

  it('keeps completed and planned processes behind their filters', () => {
    renderTab({
      tasks: [
        task('Aberto'),
        task('Concluído', { completed: true, status: 'concluida', completed_at: '2026-10-05T12:00:00.000Z' }),
        task('Planejado', { scheduled_for: '2099-12-31' }),
      ],
    });
    expect(screen.queryByText('Concluído')).not.toBeInTheDocument();
    expect(screen.queryByText('Planejado')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Concluídos'));
    fireEvent.click(screen.getByLabelText('Planejados'));
    expect(screen.getByText('Concluído')).toBeInTheDocument();
    expect(screen.getByText('Planejado')).toBeInTheDocument();
  });

  it('shows only open Máxima processes on the panel', () => {
    renderTab({ tasks: [task('Máxima aberta', { weight: 5 }), task('Peso normal', { weight: 2 }), task('Máxima concluída', { weight: 5, completed: true, status: 'concluida' })] });

    fireEvent.click(screen.getByRole('button', { name: 'Painel' }));
    expect(screen.getByText('Máxima aberta')).toBeInTheDocument();
    expect(screen.queryByText('Peso normal')).not.toBeInTheDocument();
    expect(screen.queryByText('Máxima concluída')).not.toBeInTheDocument();
    expect(screen.getByText('1 processo de peso Máxima em 1 cliente')).toBeInTheDocument();
  });

  it('creates a Máxima process from the panel header', async () => {
    const { props } = renderTab();
    fireEvent.click(screen.getByRole('button', { name: 'Painel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Novo processo para Cliente Alfa' }));
    fireEvent.change(screen.getByLabelText('Novo processo para Cliente Alfa'), { target: { value: 'Renovar licença' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar processo' }));

    await waitFor(() => expect(props.onCreate).toHaveBeenCalledWith(client.id, { title: 'Renovar licença', assigned_to: ['Celine'], weight: 5 }, client.name));
  });

  it('changes the weight of a process', async () => {
    const { props } = renderTab({ tasks: [task('Entregar relatório', { weight: 2 })] });
    fireEvent.click(screen.getByRole('button', { name: 'Peso 2: Normal' }));
    fireEvent.click(screen.getByRole('button', { name: 'Peso 5: Máxima' }));

    await waitFor(() => expect(props.onUpdateTask).toHaveBeenCalledWith('Entregar relatório', { weight: 5 }));
  });

  it('adds a step under the process', async () => {
    const { props } = renderTab();
    fireEvent.click(screen.getByRole('button', { name: 'Expandir processo Entregar relatório' }));
    fireEvent.change(await screen.findByLabelText('Nova etapa para Entregar relatório'), { target: { value: 'Protocolar' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar etapa' }));

    await waitFor(() => expect(props.onCreate).toHaveBeenCalledWith(client.id, expect.objectContaining({ title: 'Protocolar', parent_task_id: 'Entregar relatório' }), client.name));
  });

  it('creates a process with weight, dates and repetition', async () => {
    const { props } = renderTab({ tasks: [] });
    fireEvent.change(screen.getByLabelText('Filtrar cliente'), { target: { value: client.id } });
    fireEvent.click(screen.getByRole('button', { name: 'Novo processo' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Processo'), { target: { value: 'Licença de operação' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Peso 4: Urgente' }));
    fireEvent.change(within(dialog).getByLabelText('Vencimento'), { target: { value: '2026-12-15' } });
    fireEvent.change(within(dialog).getByLabelText('Planejamento'), { target: { value: '2026-12-01' } });
    fireEvent.change(within(dialog).getByLabelText('Repetição'), { target: { value: 'monthly' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Criar processo' }));

    await waitFor(() => expect(props.onCreate).toHaveBeenCalledWith(client.id, {
      title: 'Licença de operação',
      description: undefined,
      assigned_to: ['Celine'],
      weight: 4,
      due_date: '2026-12-15',
      scheduled_for: '2026-12-01',
      recurrence: 'monthly',
      recurrence_interval: null,
      recurrence_unit: null,
    }, client.name));
  });

  it('creates a process that repeats every N days', async () => {
    const { props } = renderTab({ tasks: [] });
    fireEvent.change(screen.getByLabelText('Filtrar cliente'), { target: { value: client.id } });
    fireEvent.click(screen.getByRole('button', { name: 'Novo processo' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Processo'), { target: { value: 'Vistoria' } });
    fireEvent.change(within(dialog).getByLabelText('Repetição'), { target: { value: 'every-days' } });
    fireEvent.change(within(dialog).getByLabelText('Quantos dias'), { target: { value: '10' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Criar processo' }));

    await waitFor(() => expect(props.onCreate).toHaveBeenCalledWith(client.id, expect.objectContaining({
      title: 'Vistoria', recurrence: 'custom', recurrence_interval: 10, recurrence_unit: 'days',
    }), client.name));
  });

  it('lists only planned processes in the planned section', () => {
    renderTab({ section: 'planned', isTeamView: true, tasks: [task('Aberto'), task('Planejado', { scheduled_for: '2099-12-31' })] });
    expect(screen.getByText('Planejado')).toBeInTheDocument();
    expect(screen.queryByText('Aberto')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Painel' })).not.toBeInTheDocument();
    expect(screen.getByText('1 processo planejado em 1 cliente')).toBeInTheDocument();
  });

  it('lists repeating processes with their periods open', () => {
    renderTab({
      section: 'recurring',
      isTeamView: true,
      tasks: [
        task('Relatório', { recurrence: 'custom', recurrence_interval: 14, recurrence_unit: 'days', due_date: '2026-11-10' }),
        task('Relatório · 24/11/2026', { parent_task_id: 'Relatório', recurrence_origin_id: 'Relatório', due_date: '2026-11-24', sort_order: 20261124 }),
        task('Sem repetição'),
      ],
    });
    expect(screen.getByText('Relatório')).toBeInTheDocument();
    expect(screen.getByText('Quinzenal')).toBeInTheDocument();
    expect(screen.getByText('Relatório · 24/11/2026')).toBeInTheDocument();
    expect(screen.queryByText('Sem repetição')).not.toBeInTheDocument();
    expect(screen.getByText(/Período atrasado|Próximo período/)).toBeInTheDocument();
  });

  it('shows the follow-up comments inside the process and comments on it', async () => {
    const onComment = vi.fn(async () => true);
    renderTab({
      comments: [{ id: 'c1', taskId: 'Entregar relatório', clientId: client.id, authorName: 'Patrick', text: 'Cliente enviou os documentos', createdAt: '2026-11-24T10:00:00' }],
      onComment,
    });
    expect(screen.getByLabelText('1 comentário de acompanhamento')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Expandir processo Entregar relatório' }));
    expect(await screen.findByText('Cliente enviou os documentos')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Comentar Entregar relatório' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Acompanhamento'), { target: { value: 'Relatório revisado' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Registrar comentário' }));
    await waitFor(() => expect(onComment).toHaveBeenCalledWith({ taskId: 'Entregar relatório', clientId: client.id, clientName: client.name }, 'Relatório revisado'));
  });

  it('lets the team view filter by person', () => {
    renderTab({ isTeamView: true, allowCollaboratorFilter: true, tasks: [task('Da Celine'), task('Da Gabi', { assigned_to: ['Gabi'] })] });
    expect(screen.getByText('Da Gabi')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Filtrar responsável'), { target: { value: 'Celine' } });
    expect(screen.queryByText('Da Gabi')).not.toBeInTheDocument();
    expect(screen.getByText('Da Celine')).toBeInTheDocument();
  });

  it('edits a process from the actions menu', async () => {
    const { props } = renderTab({ tasks: [task('Entregar relatório', { weight: 3 })] });
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Mais ações do processo Entregar relatório' }), { button: 0, ctrlKey: false });
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Editar processo' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Processo'), { target: { value: 'Entregar relatório final' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar processo' }));

    await waitFor(() => expect(props.onUpdateTask).toHaveBeenCalledWith('Entregar relatório', expect.objectContaining({ title: 'Entregar relatório final', weight: 3 })));
  });
});
