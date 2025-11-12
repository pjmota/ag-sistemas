import React from 'react';
import { render, screen } from '@testing-library/react';
import UsersTable from '../UsersTable';

jest.mock('../../../../lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

describe('UsersTable (loading e vazio)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe "Carregando..." enquanto a busca está pendente', async () => {
    const api = require('../../../../lib/api').default;
    let resolve: (v: any) => void;
    const pending = new Promise((res) => { resolve = res as any; });
    (api.get as jest.Mock).mockReturnValueOnce(pending);

    render(<UsersTable />);
    // Enquanto items está vazio e loading=true, mostra Carregando...
    expect(screen.getByText('Carregando...')).toBeInTheDocument();

    // Finaliza requisição
    resolve!({ data: [] });
    // Após resolver, estado vazio deve aparecer
    expect(await screen.findByText('Nenhum usuário encontrado')).toBeInTheDocument();
  });

  it('exibe "Nenhum usuário encontrado" quando API retorna lista vazia', async () => {
    const api = require('../../../../lib/api').default;
    (api.get as jest.Mock).mockResolvedValueOnce({ data: [] });

    render(<UsersTable />);
    expect(await screen.findByText('Nenhum usuário encontrado')).toBeInTheDocument();
  });
});