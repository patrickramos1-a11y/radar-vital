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

    expect(screen.getByRole('heading', { name: /Cliente Alfa/ })).toBeInTheDocument();
    expect(screen.getByText('Entregar relatório')).toBeInTheDocument();
    expect(screen.queryByText('Outra pessoa')).not.toBeInTheDocument();
    expect(screen.getByText('1 prioridades em 1 clientes')).toBeInTheDocument();
  });

  it('adds a subtask to the task linked to the priority', async () => {
    const onCreateSubtask = vi.fn(async () => true);
    renderTab({ onCreateSubtask });

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar subtarefas' }));
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
});
