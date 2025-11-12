import React from 'react';
import { render, screen } from '@testing-library/react';
import UsersTable from '../UsersTable';

jest.mock('../../../../lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

describe('UsersTable (erros)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mostra erro de permissão quando API retorna 401/403', async () => {
    const api = require('../../../../lib/api').default;
    (api.get as jest.Mock).mockRejectedValueOnce({ response: { status: 401 } });
    render(<UsersTable />);
    expect(await screen.findByText(/Seu usuário não tem permissão/i)).toBeInTheDocument();
  });

  it('mostra erro genérico quando API falha', async () => {
    const api = require('../../../../lib/api').default;
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('Falha de rede'));
    render(<UsersTable />);
    expect(await screen.findByText(/Erro ao carregar usuários/i)).toBeInTheDocument();
  });
});