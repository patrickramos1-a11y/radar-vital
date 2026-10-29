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
    onCreateSubtask: vi.fn(async () => true),
    onToggleTask: vi.fn(async () => true),
    onUpdateTask: vi.fn(async () => true),
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
    renderTab({ onUpdate });

    expect(screen.getByAltText('Logo Cliente Alfa')).toHaveAttribute('src', client.logoUrl);
    expect(screen.queryByTestId('priority-star')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Peso 4' }));
    fireEvent.click(screen.getByRole('button', { name: 'Definir peso 5' }));

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

  it('starts expanded when the priority already has subtasks', () => {
    const child = {
      ...rootTask,
      id: 'task-child',
      title: 'Conferir anexos',
      parent_task_id: rootTask.id,
      priority_id: null,
      sort_order: 1,
    } satisfies Task;

    renderTab({ tasks: [rootTask, child] });
    expect(screen.getByText('Conferir anexos')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Nova subtarefa' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Recolher prioridade Entregar relatório' }));
    expect(screen.queryByRole('textbox', { name: 'Nova subtarefa' })).not.toBeInTheDocument();
  });

  it('opens automatically when subtasks arrive after the first render', async () => {
    const child = {
      ...rootTask,
      id: 'task-child-late',
      title: 'Subtarefa carregada depois',
      parent_task_id: rootTask.id,
      priority_id: null,
      sort_order: 1,
    } satisfies Task;
    const { rerender, props } = renderTab();

    rerender(<PrioritiesTab {...props} tasks={[rootTask, child]} />);

    expect(await screen.findByText('Subtarefa carregada depois')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recolher prioridade Entregar relatório' })).toBeInTheDocument();
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
      expect.objectContaining({ title: 'Nova entrega', client_id: client.id, assigned_to: ['Celine'], weight: 3 }),
      client.name,
    ));
    expect(onRefreshTasks).toHaveBeenCalled();
  });

  it('orders priorities by weight and then by longest open duration', () => {
    const newestHeavy = { ...priority, id: 'priority-heavy-new', title: 'Peso cinco recente', weight: 5, created_at: '2026-10-20T12:00:00.000Z' };
    const oldestHeavy = { ...priority, id: 'priority-heavy-old', title: 'Peso cinco antiga', weight: 5, created_at: '2026-09-20T12:00:00.000Z' };
    const olderLight = { ...priority, id: 'priority-light', title: 'Peso dois antiga', weight: 2, created_at: '2026-08-20T12:00:00.000Z' };
    renderTab({ priorities: [olderLight, newestHeavy, oldestHeavy] });

    const titles = screen.getAllByRole('button', { name: /prioridade (Peso cinco antiga|Peso cinco recente|Peso dois antiga)/ });
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

  it('reveals the mobile edit and delete actions with a left swipe', () => {
    renderTab();
    const row = screen.getByRole('button', { name: 'Expandir prioridade Entregar relatório' }).closest('.relative.flex');
    expect(row).toBeTruthy();
    fireEvent.touchStart(row!, { touches: [{ clientX: 220 }] });
    fireEvent.touchEnd(row!, { changedTouches: [{ clientX: 120 }] });
    expect(row).toHaveClass('-translate-x-24');
  });
});
