import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FollowUpView } from './FollowUpView';
import type { Task } from '@/types/task';
import type { ProcessComment } from '@/lib/processFollowUp';

const task = (id: string, overrides: Partial<Task> = {}): Task => ({
  id, client_id: 'client-1', title: id, description: null, completed: false, status: 'pendente',
  assigned_to: ['Celine'], created_at: '2026-06-01T12:00:00.000Z', completed_at: null, due_date: null,
  scheduled_for: null, priority: 'normal', weight: 2, modality: 'levantamento', priority_id: null,
  parent_task_id: null, sort_order: 0, source_comment_id: null, recurrence: 'none',
  recurrence_origin_id: null, updated_at: '2026-06-01T12:00:00.000Z', ...overrides,
});

const comments: ProcessComment[] = [
  { id: 'c1', taskId: 'Licença de operação', clientId: 'client-1', authorName: 'Patrick', text: 'Protocolo feito no órgão', createdAt: '2026-11-24T10:00:00' },
];

function renderView(onComment = vi.fn(async () => true)) {
  render(<FollowUpView
    collaborator="Celine"
    isTeamView={false}
    tasks={[task('Licença de operação'), task('Outorga esquecida', { weight: 5 }), task('Da Gabi', { assigned_to: ['Gabi'] })]}
    clients={[]}
    responsibleList={[{ name: 'Celine', color: '#0f766e', initials: 'CE' }, { name: 'Gabi', color: '#a855f7', initials: 'GA' }]}
    comments={comments}
    onComment={onComment}
    now={new Date('2026-11-25T15:00:00')}
  />);
  return onComment;
}

describe('FollowUpView', () => {
  it('shows this week’s commented processes with the last comment', () => {
    renderView();
    expect(screen.getByText(/Semana atual · 23\/11 a 29\/11/)).toBeInTheDocument();
    expect(screen.getByText('Licença de operação')).toBeInTheDocument();
    expect(screen.getByText(/Protocolo feito no órgão/)).toBeInTheDocument();
    expect(screen.queryByText('Da Gabi')).not.toBeInTheDocument();
  });

  it('lists processes without follow-up, never commented in “more than 90 days”', () => {
    renderView();
    fireEvent.click(screen.getByRole('button', { name: /Sem acompanhamento/ }));
    fireEvent.click(screen.getByRole('button', { name: /Mais de 90 dias/ }));
    expect(screen.getByText('Outorga esquecida')).toBeInTheDocument();
    expect(screen.getByText('Nunca comentado')).toBeInTheDocument();
    expect(screen.queryByText('Licença de operação')).not.toBeInTheDocument();
  });

  it('filters by person', () => {
    renderView();
    fireEvent.change(screen.getByLabelText('Filtrar acompanhamento por responsável'), { target: { value: 'Gabi' } });
    fireEvent.click(screen.getByRole('button', { name: /Sem acompanhamento/ }));
    fireEvent.click(screen.getByRole('button', { name: /Mais de 90 dias/ }));
    expect(screen.getByText('Da Gabi')).toBeInTheDocument();
    expect(screen.queryByText('Outorga esquecida')).not.toBeInTheDocument();
  });

  it('comments on a process from the list', async () => {
    const onComment = renderView();
    fireEvent.click(screen.getByRole('button', { name: 'Comentar Licença de operação' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Acompanhamento'), { target: { value: 'Aguardando vistoria' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Registrar comentário' }));
    await waitFor(() => expect(onComment).toHaveBeenCalledWith({ taskId: 'Licença de operação', clientId: 'client-1', clientName: undefined }, 'Aguardando vistoria'));
  });
});
