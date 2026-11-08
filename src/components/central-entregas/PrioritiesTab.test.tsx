import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PrioritiesTab } from './PrioritiesTab';
import type { Client } from '@/types/client';
import type { Priority } from '@/types/priority';
import type { Task } from '@/types/task';

const client = {
  id: 'client-1',
  name: 'Cliente Alfa',
  initials: 'CA',
  logoUrl: '/cliente-alfa.png',
  isPriority: true,
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

const priority = {
  id: 'priority-1',
  title: 'Entregar relatório',
  description: 'Revisar e protocolar.',
  client_id: client.id,
  assigned_to: ['Celine'],
  due_date: null,
  status: 'aberta',
  weight: 4,
  category: 'Fiscal',
  created_by: 'Patrick',
  created_at: '2026-10-01T12:00:00.000Z',
  updated_at: '2026-10-01T12:00:00.000Z',
  completed_at: null,
  source_task_id: 'task-root',
} satisfies Priority;

const rootTask = {
  id: 'task-root',
  client_id: client.id,
  title: priority.title,
  description: priority.description,
  completed: false,
  status: 'pendente',
  assigned_to: ['Celine'],
  created_at: priority.created_at,
  completed_at: null,
  due_date: null,
  scheduled_for: null,
  priority: 'alta',
  modality: 'levantamento',
  priority_id: priority.id,
  parent_task_id: null,
  sort_order: 0,
  source_comment_id: null,
  recurrence: 'none',
  recurrence_origin_id: null,
  updated_at: priority.updated_at,
} satisfies Task;

const ordinaryTask = {
  ...rootTask,
  id: 'task-ordinary',
  title: 'Conferir protocolo comum',
  priority_id: null,
  source_comment_id: null,
} satisfies Task;

function renderTab(overrides: Partial<React.ComponentProps<typeof PrioritiesTab>> = {}) {
  const props: React.ComponentProps<typeof PrioritiesTab> = {
    collaborator: 'Celine',
    color: '#0f766e',
    isTeamView: false,
    priorities: [priority],
    tasks: [rootTask],
    clients: [client],
    responsibleList: [{ name: 'Celine', color: '#0f766e', initials: 'CE' }],
    onCreate: vi.fn(async () => null),
    onCreateMany: vi.fn(async () => []),
    onUpdate: vi.fn(async () => true),
    onDelete: vi.fn(async () => true),
    onDemote: vi.fn(async () => true),
    onPromote: vi.fn(async () => null),
    onCreateSubtask: vi.fn(async () => true),
    onToggleTask: vi.fn(async () => true),
    onUpdateTask: vi.fn(async () => true),
    onDeleteTask: vi.fn(async () => true),
    onRefreshTasks: vi.fn(async () => undefined),
    ...overrides,
  };
  return { ...render(<PrioritiesTab {...props} />), props };
}

describe('PrioritiesTab', () => {
  it('groups active priorities by client and filters them by collaborator', () => {
    renderTab({
      priorities: [priority, { ...priority, id: 'priority-2', title: 'Outra pessoa', assigned_to: ['Gabi'] }],
    });

    expect(screen.getByRole('button', { name: 'Adicionar prioridade para Cliente Alfa' })).toBeInTheDocument();
    expect(screen.getByText('Entregar relatório')).toBeInTheDocument();
    expect(screen.queryByText('Outra pessoa')).not.toBeInTheDocument();
    expect(screen.getByText('1 prioridades em 1 clientes')).toBeInTheDocument();
  });

  it('adds a subtask to the task linked to the priority', async () => {
    const onCreateSubtask = vi.fn(async () => true);
    renderTab({ onCreateSubtask });

    fireEvent.click(screen.getByRole('button', { name: 'Expandir prioridade Entregar relatório' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nova subtarefa' }), { target: { value: 'Conferir anexos' } });
    fireEvent.click(screen.getByTitle('Adicionar subtarefa'));

    await waitFor(() => expect(onCreateSubtask).toHaveBeenCalledWith(
      client.id,
      expect.objectContaining({ title: 'Conferir anexos', parent_task_id: rootTask.id, assigned_to: ['Celine'] }),
      client.name,
    ));
  });

  it('can focus one client directly from its star link', () => {
    renderTab({
      initialClientId: client.id,
      priorities: [priority, { ...priority, id: 'priority-2', client_id: 'client-2', title: 'Outro cliente' }],
    });

    expect(screen.getByRole('combobox', { name: 'Filtrar cliente' })).toHaveValue(client.id);
    expect(screen.queryByText('Outro cliente')).not.toBeInTheDocument();
  });

  it('shows the client logo and changes weight from the compact action', async () => {
    const onUpdate = vi.fn(async () => true);
    renderTab({
      onUpdate,
      priorities: [{ ...priority, weight_changed_at: new Date().toISOString() }],
    });

    expect(screen.getByAltText('Logo Cliente Alfa')).toHaveAttribute('src', client.logoUrl);
    expect(screen.queryByTestId('priority-star')).not.toBeInTheDocument();
    expect(screen.queryByText(/Aberta há/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/\d+ dias desde a criação/)).not.toHaveTextContent(/^0d$/);
    fireEvent.click(screen.getByRole('button', { name: 'Peso 4: Urgente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Definir peso 5: Extremamente urgente' }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(priority.id, { weight: 5 }));
  });

  it('plans the linked task and hides future scheduled priorities by default', async () => {
    const onUpdateTask = vi.fn(async () => true);
    const { rerender, props } = renderTab({ onUpdateTask });

    fireEvent.click(screen.getByRole('button', { name: 'Planejar prioridade' }));
    fireEvent.change(screen.getByLabelText('Data de retorno da prioridade'), { target: { value: '2099-12-31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Planejar' }));
    await waitFor(() => expect(onUpdateTask).toHaveBeenCalledWith(rootTask.id, { scheduled_for: '2099-12-31' }));

    rerender(<PrioritiesTab {...props} tasks={[{ ...rootTask, scheduled_for: '2099-12-31' }]} />);
    expect(screen.queryByText(priority.title)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Planejadas' }));
    expect(screen.getByText(priority.title)).toBeInTheDocument();
  });

  it('lets an administrator inspect another collaborator priorities', () => {
    renderTab({
      allowCollaboratorFilter: true,
      responsibleList: [
        { name: 'Celine', color: '#0f766e', initials: 'CE' },
        { name: 'Gabi', color: '#7c3aed', initials: 'GA' },
      ],
      priorities: [priority, { ...priority, id: 'priority-2', title: 'Prioridade da Gabi', assigned_to: ['Gabi'] }],
    });

    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar colaborador' }), { target: { value: 'Gabi' } });
    expect(screen.getByText('Prioridade da Gabi')).toBeInTheDocument();
    expect(screen.queryByText(priority.title)).not.toBeInTheDocument();
  });

  it('switches to the panel view and keeps client creation on the logo', () => {
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: 'Painel' }));

    expect(screen.getByRole('button', { name: 'Painel' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Adicionar prioridade para Cliente Alfa' })).toBeInTheDocument();
    expect(screen.getByAltText('Logo Cliente Alfa')).toHaveClass('h-8');
  });

  it('opens the collaborator task dashboard grouped by client', () => {
    renderTab({
      tasks: [rootTask, ordinaryTask, { ...ordinaryTask, id: 'task-other', title: 'Tarefa da Gabi', assigned_to: ['Gabi'] }],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Tarefas' }));

    expect(screen.getByRole('button', { name: 'Tarefas' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 tarefas em 1 clientes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar tarefa para Cliente Alfa' })).toBeInTheDocument();
    expect(screen.getByText(ordinaryTask.title)).toBeInTheDocument();
    expect(screen.queryByText(rootTask.title)).not.toBeInTheDocument();
    expect(screen.queryByText('Tarefa da Gabi')).not.toBeInTheDocument();
  });

  it('shows priorities and ordinary tasks together in the Tudo view', () => {
    renderTab({ tasks: [rootTask, ordinaryTask] });

    fireEvent.click(screen.getByRole('button', { name: 'Tudo' }));

    expect(screen.getByRole('button', { name: 'Tudo' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('1 prioridade e 1 tarefa em 1 cliente')).toBeInTheDocument();
    expect(screen.queryByText('Prioridades', { selector: 'div' })).not.toBeInTheDocument();
    expect(screen.queryByText('Tarefas', { selector: 'div' })).not.toBeInTheDocument();
    expect(screen.getByText(priority.title)).toBeInTheDocument();
    expect(screen.getByText(ordinaryTask.title)).toBeInTheDocument();
  });

  it('creates a task inline from the client header', async () => {
    const onCreateSubtask = vi.fn(async () => true);
    renderTab({ onCreateSubtask, tasks: [rootTask, ordinaryTask] });
    fireEvent.click(screen.getByRole('button', { name: 'Tarefas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar tarefa para Cliente Alfa' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nova tarefa para Cliente Alfa' }), { target: { value: 'Conferir protocolo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar tarefa' }));

    await waitFor(() => expect(onCreateSubtask).toHaveBeenCalledWith(
      client.id,
      expect.objectContaining({ title: 'Conferir protocolo', assigned_to: ['Celine'] }),
      client.name,
    ));
  });

  it('plans and transfers a task from the task dashboard', async () => {
    const onUpdateTask = vi.fn(async () => true);
    renderTab({
      onUpdateTask,
      tasks: [rootTask, ordinaryTask],
      responsibleList: [
        { name: 'Celine', color: '#0f766e', initials: 'CE' },
        { name: 'Gabi', color: '#7c3aed', initials: 'GA' },
      ],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Tarefas' }));

    fireEvent.click(screen.getByRole('button', { name: 'Responsável Celine' }));
    fireEvent.click(screen.getByRole('button', { name: /Gabi/ }));
    await waitFor(() => expect(onUpdateTask).toHaveBeenCalledWith(ordinaryTask.id, { assigned_to: ['Gabi'] }));

    fireEvent.click(screen.getByRole('button', { name: 'Planejar tarefa' }));
    fireEvent.change(screen.getByLabelText('Data de retorno da prioridade'), { target: { value: '2099-12-31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Planejar' }));
    await waitFor(() => expect(onUpdateTask).toHaveBeenCalledWith(ordinaryTask.id, { scheduled_for: '2099-12-31' }));
  });

  it('promotes an ordinary task and keeps linked priority tasks out of the task list', async () => {
    const onPromote = vi.fn(async () => priority);
    renderTab({ tasks: [rootTask, ordinaryTask], onPromote });
    fireEvent.click(screen.getByRole('button', { name: 'Tarefas' }));

    expect(screen.queryByText(rootTask.title)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: `Promover ${ordinaryTask.title} para prioridade` }));

    await waitFor(() => expect(onPromote).toHaveBeenCalledWith(
      ordinaryTask.id,
      ordinaryTask.title,
      expect.objectContaining({
        title: ordinaryTask.title,
        client_id: client.id,
        assigned_to: ordinaryTask.assigned_to,
        weight: 1,
        category: ordinaryTask.modality,
      }),
      client.name,
    ));
    expect(screen.getByRole('button', { name: `${ordinaryTask.title} promovida para prioridade` })).toBeDisabled();
  });

  it('keeps task completion as a circle before the task content', async () => {
    const onToggleTask = vi.fn(async () => true);
    renderTab({ tasks: [rootTask, ordinaryTask], onToggleTask });
    fireEvent.click(screen.getByRole('button', { name: 'Tarefas' }));

    const completion = screen.getByRole('button', { name: 'Concluir tarefa' });
    expect(completion).toHaveClass('rounded-full');
    fireEvent.click(completion);

    await waitFor(() => expect(onToggleTask).toHaveBeenCalledWith(ordinaryTask.id, client.name));
  });

  it('deletes an ordinary task from its desktop action', async () => {
    const onDeleteTask = vi.fn(async () => true);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderTab({ tasks: [rootTask, ordinaryTask], onDeleteTask });
    fireEvent.click(screen.getByRole('button', { name: 'Tarefas' }));

    fireEvent.click(screen.getByRole('button', { name: `Excluir tarefa ${ordinaryTask.title}` }));

    await waitFor(() => expect(onDeleteTask).toHaveBeenCalledWith(ordinaryTask.id, client.name));
    confirm.mockRestore();
  });

  it('adds an external link to an ordinary task', async () => {
    const onUpdateTask = vi.fn(async () => true);
    renderTab({ tasks: [rootTask, ordinaryTask], onUpdateTask });
    fireEvent.click(screen.getByRole('button', { name: 'Tarefas' }));
    fireEvent.click(screen.getByRole('button', { name: `Adicionar link à tarefa ${ordinaryTask.title}` }));
    fireEvent.change(screen.getByRole('textbox', { name: `URL da tarefa ${ordinaryTask.title}` }), { target: { value: 'example.com/documento' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(onUpdateTask).toHaveBeenCalledWith(ordinaryTask.id, { external_url: 'https://example.com/documento' }));
  });

  it('prevents duplicate promotion submissions while the request is running', async () => {
    let finishPromotion: (value: Priority | null) => void = () => undefined;
    const onPromote = vi.fn(() => new Promise<Priority | null>(resolve => { finishPromotion = resolve; }));
    renderTab({ tasks: [rootTask, ordinaryTask], onPromote });
    fireEvent.click(screen.getByRole('button', { name: 'Tarefas' }));
    fireEvent.click(screen.getByRole('button', { name: `Promover ${ordinaryTask.title} para prioridade` }));

    await waitFor(() => expect(onPromote).toHaveBeenCalledTimes(1));
    const promoting = screen.getByRole('button', { name: `Promovendo ${ordinaryTask.title} para prioridade` });
    expect(promoting).toBeDisabled();
    fireEvent.click(promoting);
    expect(onPromote).toHaveBeenCalledTimes(1);
    finishPromotion(priority);
    await waitFor(() => expect(screen.getByRole('button', { name: `${ordinaryTask.title} promovida para prioridade` })).toBeDisabled());
  });

  it('shows a linked Universo Ramos target instead of Sem cliente', () => {
    const institutionalPriority = {
      ...priority,
      id: 'priority-universe',
      title: 'Organizar rotina do setor',
      client_id: null,
      universe_item_id: 'SET-01',
    } satisfies Priority;

    renderTab({ priorities: [institutionalPriority], tasks: [] });

    expect(screen.getByRole('button', { name: 'Setor · Setor Projetos' })).toBeInTheDocument();
    expect(screen.queryByText('Sem cliente')).not.toBeInTheDocument();
  });

  it('starts collapsed when the priority has subtasks and expands from the counter', () => {
    const child = {
      ...rootTask,
      id: 'task-child',
      title: 'Conferir anexos',
      parent_task_id: rootTask.id,
      priority_id: null,
      sort_order: 1,
    } satisfies Task;

    renderTab({ tasks: [rootTask, child] });
    expect(screen.queryByText('Conferir anexos')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Nova subtarefa' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar 1 subtarefa de Entregar relatório' }));
    expect(screen.getByText('Conferir anexos')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Nova subtarefa' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Recolher 1 subtarefa de Entregar relatório' }));
    expect(screen.queryByText('Conferir anexos')).not.toBeInTheDocument();
  });

  it('places edit and delete inside the overflow menu', async () => {
    renderTab();
    expect(screen.queryByRole('button', { name: 'Editar prioridade' })).not.toBeInTheDocument();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Mais ações da prioridade' }), {
      button: 0,
      ctrlKey: false,
    });
    expect(await screen.findByRole('menuitem', { name: 'Editar prioridade' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Excluir prioridade' })).toBeInTheDocument();
  });

  it('creates a priority inline from the client header', async () => {
    const onCreate = vi.fn(async () => priority);
    const onRefreshTasks = vi.fn(async () => undefined);
    renderTab({ onCreate, onRefreshTasks });

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar prioridade para Cliente Alfa' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nova prioridade para Cliente Alfa' }), { target: { value: 'Nova entrega' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar prioridade' }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Nova entrega', client_id: client.id, assigned_to: ['Celine'], weight: 1 }),
      client.name,
    ));
    expect(onRefreshTasks).toHaveBeenCalled();
  });

  it('orders priorities by weight and then by longest open duration', () => {
    const newestHeavy = { ...priority, id: 'priority-heavy-new', title: 'Peso cinco recente', weight: 5, created_at: '2026-10-20T12:00:00.000Z' };
    const oldestHeavy = { ...priority, id: 'priority-heavy-old', title: 'Peso cinco antiga', weight: 5, created_at: '2026-09-20T12:00:00.000Z' };
    const olderLight = { ...priority, id: 'priority-light', title: 'Peso dois antiga', weight: 2, created_at: '2026-08-20T12:00:00.000Z' };
    renderTab({ priorities: [olderLight, newestHeavy, oldestHeavy] });

    const titles = screen.getAllByRole('button', { name: /^(Expandir|Recolher) prioridade (Peso cinco antiga|Peso cinco recente|Peso dois antiga)$/ });
    expect(titles.map(item => item.textContent)).toEqual(['Peso cinco antiga', 'Peso cinco recente', 'Peso dois antiga']);
  });

  it('transfers the priority and its linked task to another collaborator', async () => {
    const onUpdate = vi.fn(async () => true);
    const onUpdateTask = vi.fn(async () => true);
    renderTab({
      onUpdate,
      onUpdateTask,
      responsibleList: [
        { name: 'Celine', color: '#0f766e', initials: 'CE' },
        { name: 'Gabi', color: '#7c3aed', initials: 'GA' },
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Responsável Celine' }));
    fireEvent.click(screen.getByRole('button', { name: /Gabi/ }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(priority.id, { assigned_to: ['Gabi'] }));
    expect(onUpdateTask).toHaveBeenCalledWith(rootTask.id, { assigned_to: ['Gabi'] });
  });

  it('edits a priority title inline with a double click', async () => {
    const onUpdate = vi.fn(async () => true);
    renderTab({ onUpdate });

    fireEvent.doubleClick(screen.getByRole('button', { name: 'Expandir prioridade Entregar relatório' }));
    const input = screen.getByRole('textbox', { name: 'Editar Expandir prioridade Entregar relatório' });
    fireEvent.change(input, { target: { value: 'Entregar relatório revisado' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(priority.id, { title: 'Entregar relatório revisado' }));
  });

  it('edits a task title inline with a double click', async () => {
    const onUpdateTask = vi.fn(async () => true);
    renderTab({ tasks: [rootTask, ordinaryTask], onUpdateTask });
    fireEvent.click(screen.getByRole('button', { name: 'Tarefas' }));

    fireEvent.doubleClick(screen.getByRole('button', { name: `Expandir tarefa ${ordinaryTask.title}` }));
    const input = screen.getByRole('textbox', { name: `Editar Expandir tarefa ${ordinaryTask.title}` });
    fireEvent.change(input, { target: { value: 'Conferir protocolo atualizado' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(onUpdateTask).toHaveBeenCalledWith(ordinaryTask.id, { title: 'Conferir protocolo atualizado' }));
  });

  it('shows a compact assignee control on subtasks and transfers ownership', async () => {
    const onUpdateTask = vi.fn(async () => true);
    const child = {
      ...rootTask,
      id: 'task-child-owner',
      title: 'Providenciar lista de frequência',
      assigned_to: ['Gabi'],
      parent_task_id: rootTask.id,
      priority_id: null,
      sort_order: 1,
    } satisfies Task;
    renderTab({
      tasks: [rootTask, child],
      onUpdateTask,
      responsibleList: [
        { name: 'Celine', color: '#0f766e', initials: 'CE' },
        { name: 'Gabi', color: '#7c3aed', initials: 'GA' },
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar 1 subtarefa de Entregar relatório' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Responsável Gabi' }));
    const celineOptions = screen.getAllByRole('button', { name: /Celine/ });
    fireEvent.click(celineOptions[celineOptions.length - 1]);

    await waitFor(() => expect(onUpdateTask).toHaveBeenCalledWith(child.id, { assigned_to: ['Celine'] }));
  });

  it('reveals the mobile edit and delete actions with a left swipe', () => {
    renderTab();
    const row = screen.getByRole('button', { name: 'Expandir prioridade Entregar relatório' }).closest('.relative.flex');
    expect(row).toBeTruthy();
    fireEvent.touchStart(row!, { touches: [{ clientX: 220 }] });
    fireEvent.touchEnd(row!, { changedTouches: [{ clientX: 120 }] });
    expect(row).toHaveClass('-translate-x-48');
  });
});
