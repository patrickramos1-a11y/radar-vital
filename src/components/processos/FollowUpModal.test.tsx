import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Client } from '@/types/client';
import { FollowUpModal } from './FollowUpModal';

const client = { id: 'client-1', name: 'FASANO', isActive: true } as Client;
const people = [{ name: 'Patrick', color: '#2563eb', initials: 'PA' }];

function renderModal() {
  const onCreate = vi.fn(async () => true);
  render(<FollowUpModal
    open
    onOpenChange={vi.fn()}
    editing={null}
    clients={[client]}
    responsibleList={people}
    defaultAssignee="Patrick"
    prefill={{ clientId: client.id }}
    onCreate={onCreate}
    onUpdateTask={vi.fn(async () => true)}
  />);
  return { onCreate, dialog: screen.getByRole('dialog') };
}

describe('Novo acompanhamento', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-26T12:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  it('counts a lab report every 180 days from the license date', async () => {
    const { onCreate, dialog } = renderModal();
    fireEvent.click(within(dialog).getByRole('button', { name: /A partir de um marco/ }));
    fireEvent.change(within(dialog).getByLabelText('O que se repete'), { target: { value: 'Laudo da caixa SAO' } });
    fireEvent.change(within(dialog).getByLabelText('Data do marco'), { target: { value: '2026-09-15' } });
    fireEvent.change(within(dialog).getByLabelText('O que é o marco'), { target: { value: 'Emissão da LO' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '180 dias' }));

    expect(within(dialog).getByText('Começa em 14/03/2027 e repete a cada 180 dias.')).toBeInTheDocument();
    expect(within(dialog).queryByText(/Já passaram/)).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Criar acompanhamento' }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith('client-1', expect.objectContaining({
      title: 'Laudo da caixa SAO', recurrence: 'custom', recurrence_interval: 180, recurrence_unit: 'days',
      recurrence_anchor_date: '2026-09-15', recurrence_anchor_label: 'Emissão da LO', recurrence_first: 'after_interval',
    }), expect.arrayContaining(['2027-03-14']), 'FASANO'));
  });

  it('lets the past dates count or not', async () => {
    const { onCreate, dialog } = renderModal();
    fireEvent.click(within(dialog).getByRole('button', { name: /A partir de um marco/ }));
    fireEvent.change(within(dialog).getByLabelText('O que se repete'), { target: { value: 'Visita' } });
    fireEvent.change(within(dialog).getByLabelText('Data do marco'), { target: { value: '2026-08-01' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Mensal' }));

    expect(within(dialog).getByText('Já passaram (3) · 3 entram atrasadas')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Criar etapa de 01/09/2026' }));
    expect(within(dialog).getByText('Já passaram (3) · 2 entram atrasadas')).toBeInTheDocument();
    expect(within(dialog).getByRole('checkbox', { name: 'Criar etapa de 01/12/2026' })).toBeDisabled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Só a próxima' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Criar acompanhamento' }));
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith('client-1', expect.anything(), ['2026-12-01'], 'FASANO'));
  });
});
