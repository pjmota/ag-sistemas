import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersTable from '../UsersTable';
import api, { updateUser, setUserActive } from '../../../../lib/api';

jest.mock('../../../../lib/api', () => {
  const actual = jest.requireActual('../../../../lib/api');
  return {
    __esModule: true,
    ...actual,
    default: { ...actual.default, get: jest.fn() },
    updateUser: jest.fn(),
    setUserActive: jest.fn(),
  };
});

describe('UsersTable (erros em ações)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const seedUsers = [
    { id: 1, email: 'alice@example.com', role: 'membro', nome: 'Alice', empresa: 'ACME', ativo: true },
    { id: 2, email: 'bob@example.com', role: 'membro', nome: 'Bob', empresa: 'Beta', ativo: false },
  ];

  it('exibe erro ao salvar edição quando updateUser falha', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: seedUsers });
    (updateUser as jest.Mock).mockRejectedValueOnce(new Error('Falha ao salvar alterações'));

    const user = userEvent.setup();
    render(<UsersTable />);
    const aliceCell = await screen.findByText('Alice');
    const aliceRow = aliceCell.closest('tr')!;

    // Abre modal de edição
    const editBtn = within(aliceRow).getByRole('button', { name: /editar/i });
    await user.click(editBtn);
    // Tenta salvar e falha
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    // Mensagem de erro aparece
    expect(await screen.findByText(/Falha ao salvar alterações/i)).toBeInTheDocument();
  });

  it('exibe erro ao alternar ativo quando setUserActive falha', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: seedUsers });
    (setUserActive as jest.Mock).mockRejectedValueOnce(new Error('Falha ao alterar status'));

    const user = userEvent.setup();
    render(<UsersTable />);
    const aliceCell = await screen.findByText('Alice');
    const aliceRow = aliceCell.closest('tr')!;

    // Alterna ativo (Alice está ativa -> botão "Inativar")
    const toggleBtn = within(aliceRow).getByRole('button', { name: /inativar/i });
    await user.click(toggleBtn);
    expect(await screen.findByText(/Falha ao alterar status/i)).toBeInTheDocument();
  });
});