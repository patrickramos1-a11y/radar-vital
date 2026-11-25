import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClientWorkList } from './ClientWorkList';
import type { WorkItem } from '@/types/workItem';

const process: WorkItem = {
  id: 'task:process-1',
  sourceId: 'process-1',
  kind: 'task',
  clientId: 'client-1',
  title: 'Entregar programa de treinamento',
  description: null,
  status: 'open',
  createdAt: '2026-10-29T12:00:00.000Z',
  dueDate: null,
  completedAt: null,
  assignees: ['Patrick'],
  sourcePath: '/processos',
};

describe('ClientWorkList', () => {
  it('shows available processes while unrelated sources are still loading', () => {
    render(<ClientWorkList items={[process]} isLoading error={null} emptyMessage="Sem processos" onOpenSource={vi.fn()} />);

    expect(screen.getByText(process.title)).toBeInTheDocument();
    expect(screen.getByText('Processo')).toBeInTheDocument();
    expect(screen.queryByText('Carregando visão do cliente...')).not.toBeInTheDocument();
  });

  it('keeps the loading state when no item is available yet', () => {
    render(<ClientWorkList items={[]} isLoading error={null} emptyMessage="Sem processos" onOpenSource={vi.fn()} />);

    expect(screen.getByText('Carregando visão do cliente...')).toBeInTheDocument();
  });
});
