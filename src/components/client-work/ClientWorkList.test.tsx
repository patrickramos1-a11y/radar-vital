import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClientWorkList } from './ClientWorkList';
import type { WorkItem } from '@/types/workItem';

const priority: WorkItem = {
  id: 'priority-1',
  sourceId: 'priority-1',
  kind: 'priority',
  clientId: 'client-1',
  title: 'Entregar programa de treinamento',
  description: null,
  status: 'open',
  createdAt: '2026-10-29T12:00:00.000Z',
  dueDate: null,
  completedAt: null,
  assignees: ['Patrick'],
  sourcePath: '/minhas-prioridades',
};

describe('ClientWorkList', () => {
  it('shows available priorities while unrelated sources are still loading', () => {
    render(<ClientWorkList items={[priority]} isLoading error={null} emptyMessage="Sem prioridades" onOpenSource={vi.fn()} />);

    expect(screen.getByText(priority.title)).toBeInTheDocument();
    expect(screen.queryByText('Carregando visão do cliente...')).not.toBeInTheDocument();
  });

  it('keeps the loading state when no item is available yet', () => {
    render(<ClientWorkList items={[]} isLoading error={null} emptyMessage="Sem prioridades" onOpenSource={vi.fn()} />);

    expect(screen.getByText('Carregando visão do cliente...')).toBeInTheDocument();
  });
});
