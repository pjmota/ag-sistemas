import React from 'react';
import { render, screen } from '@testing-library/react';
import ReferralsManager from '../ReferralsManager';

// Mock de auth
let usuarioMock: any = null;
jest.mock('../../providers/AuthProvider', () => ({
  __esModule: true,
  useAuth: () => ({ usuario: usuarioMock })
}));

// Mocks de API
const getMock = jest.fn();
jest.mock('../../../lib/api', () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => getMock(...args),
  },
}));

describe('ReferralsManager (falha de carregamento inicial)', () => {
  beforeEach(() => {
    usuarioMock = null;
    getMock.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    (console.error as any).mockRestore?.();
  });

  it('exibe mensagem de erro quando a carga inicial falha', async () => {
    usuarioMock = { id: 10, email: 'tester@example.com' };
    getMock.mockImplementation(async () => {
      throw new Error('Falha ao carregar indicações');
    });

    render(<ReferralsManager />);

    // Mensagem de erro exibida após falha
    expect(await screen.findByText('Falha ao carregar indicações')).toBeInTheDocument();
  });

  it('mostra Carregando... inicialmente e some após erro; sem tabelas renderizadas', async () => {
    usuarioMock = { id: 10, email: 'tester@example.com' };
    // Primeira chamada: todas as gets falham imediatamente
    getMock.mockImplementation(async () => { throw new Error('Falha ao carregar indicações'); });

    render(<ReferralsManager />);

    // Carregando aparece imediatamente
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    // Após erro, mensagem aparece e Carregando some
    expect(await screen.findByText('Falha ao carregar indicações')).toBeInTheDocument();
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    // Nenhuma tabela renderizada
    expect(screen.queryAllByRole('table')).toHaveLength(0);
  });
});