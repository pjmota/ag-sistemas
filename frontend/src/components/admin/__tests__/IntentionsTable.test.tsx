import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IntentionsTable from '../intentions/IntentionsTable';

jest.mock('../../../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(async () => ({ data: [
      { id: 1, nome: 'Alice', email: 'alice@example.com', empresa: 'ACME', motivo: 'Contribuir', status: 'pendente', data: new Date().toISOString() },
      { id: 2, nome: 'Bob', email: 'bob@example.com', empresa: '', motivo: 'Aprender', status: 'aprovada', data: new Date().toISOString() },
    ] })),
    patch: jest.fn(async () => ({ data: {} })),
    post: jest.fn(async () => ({ data: { token: 'tok-123' } })),
  },
}));

describe('IntentionsTable', () => {
  it('lista intenções e permite aprovar/recusar', async () => {
    render(<IntentionsTable />);
    expect(await screen.findByText('Alice')).toBeInTheDocument();

    const getAliceRow = () => screen.getByText('Alice').closest('tr')!;
    const approveAlice = within(getAliceRow()).getByRole('button', { name: /aprovar/i });
    await userEvent.click(approveAlice);
    // Após aprovar, o botão de Aprovar deve ficar desabilitado
    await screen.findByText('Alice');
    expect(within(getAliceRow()).getByRole('button', { name: /aprovar/i })).toBeDisabled();

    const rejectAlice = within(getAliceRow()).getByRole('button', { name: /recusar/i });
    await userEvent.click(rejectAlice);
    // Após recusar, o botão de Recusar deve ficar desabilitado
    await screen.findByText('Alice');
    expect(within(getAliceRow()).getByRole('button', { name: /recusar/i })).toBeDisabled();
  });

  it('gera convite para intenção aprovada', async () => {
    const onInvite = jest.fn();
    render(<IntentionsTable onInviteGenerated={onInvite} />);
    const bob = await screen.findByText('Bob');
    const bobRow = bob.closest('tr')!;
    const inviteBtn = within(bobRow).getByRole('button', { name: /gerar convite/i });
    await userEvent.click(inviteBtn);
    expect(onInvite).toHaveBeenCalledWith('tok-123');
  });
});