import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersTable from '../UsersTable';

jest.mock('../../../../lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
  updateUser: jest.fn(),
  setUserActive: jest.fn(),
}));

describe('UsersTable (recarregar)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('recarrega a lista ao clicar em "Recarregar"', async () => {
    const api = require('../../../../lib/api');
    const initialUsers = [
      { id: 1, email: 'alice@example.com', role: 'membro', nome: 'Alice' },
      { id: 2, email: 'bruno@example.com', role: 'membro', nome: 'Bruno' },
    ];
    const reloadedUsers = [
      { id: 3, email: 'carla@example.com', role: 'admin', nome: 'Carla' },
    ];

    (api.default.get as jest.Mock)
      .mockResolvedValueOnce({ data: initialUsers })
      .mockResolvedValueOnce({ data: reloadedUsers });

    const user = userEvent.setup();
    render(<UsersTable />);

    // Lista inicial carregada
    expect(await screen.findByText('bruno@example.com')).toBeInTheDocument();

    // Clica em Recarregar para buscar novamente
    await user.click(screen.getByRole('button', { name: /recarregar/i }));

    // Nova lista exibida
    expect(await screen.findByText('carla@example.com')).toBeInTheDocument();
    // get foi chamado duas vezes: inicial + recarregar
    expect((api.default.get as jest.Mock)).toHaveBeenCalledTimes(2);
  });
});