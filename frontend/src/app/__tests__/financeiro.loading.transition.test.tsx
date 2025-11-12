import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import FinanceiroPage from '@/app/financeiro/page';

// Importa o módulo para ajustar mocks por teste
import * as api from '@/lib/api';

// Cria uma função auxiliar para Promises adiadas
function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

jest.mock('@/lib/api', () => ({
  listFees: jest.fn(),
  totals: jest.fn(),
  listUsers: jest.fn(async () => []),
  generateFees: jest.fn(async () => undefined),
  markPaid: jest.fn(async () => undefined),
  updateStatus: jest.fn(async () => undefined),
  cancelFee: jest.fn(async () => undefined),
  notifyLate: jest.fn(async () => undefined),
  sendReminder: jest.fn(async () => undefined),
}));

describe('FinanceiroPage · transição de loading', () => {
  test('exibe "Carregando…" e depois summary e vazio', async () => {
    const feesDeferred = createDeferred<any[]>();
    const totalsDeferred = createDeferred<{ totalRecebido: number; totalPendente: number }>();

    (api.listFees as jest.Mock).mockImplementation(() => feesDeferred.promise);
    (api.totals as jest.Mock).mockImplementation(() => totalsDeferred.promise);

    render(<FinanceiroPage />);

    // Deve exibir estado de loading enquanto Promises não resolvem
    expect(await screen.findByText(/Carregando/)).toBeInTheDocument();

    // Resolve Promises para finalizar loading
    totalsDeferred.resolve({ totalRecebido: 0, totalPendente: 0 });
    feesDeferred.resolve([]);

    await waitFor(() => {
      expect(screen.queryByText(/Carregando/)).not.toBeInTheDocument();
    });

    // Summary deve aparecer
    expect(screen.getByText(/Totais/i)).toBeInTheDocument();
    // Mensagem de vazio deve aparecer quando fees == [] e !loading
    expect(screen.getByText('Nenhuma mensalidade encontrada para os filtros.')).toBeInTheDocument();
  });
});