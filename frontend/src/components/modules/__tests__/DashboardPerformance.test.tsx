import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardPerformance from '../DashboardPerformance';

// Mock dinâmico para AuthProvider
let usuarioMock: any = null;
jest.mock('../../providers/AuthProvider', () => ({
  __esModule: true,
  useAuth: () => ({ usuario: usuarioMock })
}));

// Mock dinâmico para api.get
let getImpl: jest.Mock<any, any> = jest.fn();
jest.mock('../../../lib/api', () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => getImpl(...args),
  },
}));

describe('DashboardPerformance', () => {
  beforeEach(() => {
    usuarioMock = null;
    getImpl = jest.fn();
    jest.clearAllMocks();
  });

  it('mostra aviso de login quando não autenticado', async () => {
    usuarioMock = null;
    render(<DashboardPerformance />);
    // Aguarda processamento de efeitos assíncronos para evitar warn de act
    expect(
      await screen.findByText(/Faça login para acessar o dashboard de performance/i)
    ).toBeInTheDocument();
  });

  it('carrega e exibe KPIs quando autenticado', async () => {
    usuarioMock = { id: 1, email: 'a@b.com' };
    getImpl.mockResolvedValueOnce({ data: {
      totalMembrosAtivos: 10,
      totalIndicacoesMes: 5,
      totalObrigadosMes: 2,
    }});
    render(<DashboardPerformance />);
    // valores e títulos aparecem após carregar
    expect(await screen.findByText('Membros ativos')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('mostra mensagem de erro quando API falha', async () => {
    usuarioMock = { id: 1, email: 'a@b.com' };
    getImpl.mockRejectedValueOnce(new Error('Falha no servidor KPIs'));
    render(<DashboardPerformance />);
    expect(await screen.findByText('Falha no servidor KPIs')).toBeInTheDocument();
  });
});