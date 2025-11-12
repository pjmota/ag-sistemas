import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersTable from '../UsersTable';

jest.mock('../../../../lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

describe('UsersTable (loading e erro no recarregar)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mostra "Enviando..." no botão enquanto reloading está pendente', async () => {
    const api = require('../../../../lib/api');
    const initialUsers = [
      { id: 1, email: 'alice@example.com', role: 'membro', nome: 'Alice' },
      { id: 2, email: 'bruno@example.com', role: 'membro', nome: 'Bruno' },
    ];
    const reloadedUsers = [
      { id: 3, email: 'carla@example.com', role: 'admin', nome: 'Carla' },
    ];

    // Primeira carga resolve; segunda fica pendente até resolvermos manualmente
    let resolveDeferred: (value: any) => void = () => {};
    const deferred = new Promise((resolve) => { resolveDeferred = resolve; });
    (api.default.get as jest.Mock)
      .mockResolvedValueOnce({ data: initialUsers })
      .mockImplementationOnce(() => deferred);

    const user = userEvent.setup();
    render(<UsersTable />);

    // Lista inicial carregada
    expect(await screen.findByText('bruno@example.com')).toBeInTheDocument();

    // Clica em Recarregar para buscar novamente, fica em loading
    const reloadBtn = screen.getByRole('button', { name: /recarregar/i });
    await user.click(reloadBtn);
    expect(screen.getByRole('button', { name: /enviando/i })).toBeDisabled();

    // Conclui a requisição e verifica nova lista
    resolveDeferred({ data: reloadedUsers });
    expect(await screen.findByText('carla@example.com')).toBeInTheDocument();
    // Botão volta ao estado normal
    expect(screen.getByRole('button', { name: /recarregar/i })).not.toBeDisabled();
  });

  it('exibe erro quando recarregar falha', async () => {
    const api = require('../../../../lib/api');
    const initialUsers = [
      { id: 1, email: 'alice@example.com', role: 'membro', nome: 'Alice' },
    ];
    (api.default.get as jest.Mock)
      .mockResolvedValueOnce({ data: initialUsers })
      .mockRejectedValueOnce(new Error('Falha de rede'));

    const user = userEvent.setup();
    render(<UsersTable />);

    // Inicial carrega
    expect(await screen.findByText('alice@example.com')).toBeInTheDocument();

    // Recarregar falha
    await user.click(screen.getByRole('button', { name: /recarregar/i }));
    expect(await screen.findByText(/Erro ao carregar usuários/i)).toBeInTheDocument();
  });
});