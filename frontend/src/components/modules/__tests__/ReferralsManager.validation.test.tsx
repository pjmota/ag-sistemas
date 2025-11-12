import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('ReferralsManager (validações do modal)', () => {
  beforeEach(() => {
    usuarioMock = { id: 10, email: 'tester@example.com' };
    getMock.mockReset();
  });

  it('abre modal com status atual e restringe opções válidas', async () => {
    // Seed: uma indicação recebida com status "nova"
    getMock.mockImplementation(async (url: string) => {
      if (url.includes('/indicacoes/usuario/10/enviadas')) {
        return { data: [] };
      }
      if (url.includes('/indicacoes/usuario/10/recebidas')) {
        return { data: [
          { id: 1, usuario_destino_id: 10, usuario_origem_id: 3, descricao: 'Desc recebida', status: 'nova', agradecimentos_publicos: undefined },
        ] };
      }
      if (url.includes('/usuarios')) {
        return { data: [
          { id: 3, email: 'carlos@example.com', role: 'membro', nome: 'Carlos' },
        ] };
      }
      return { data: {} };
    });

    render(<ReferralsManager />);

    const receivedDesc = await screen.findByText('Desc recebida');
    const receivedRow = receivedDesc.closest('tr')!;
    const editBtn = within(receivedRow).getByRole('button', { name: /editar status/i });
    await userEvent.click(editBtn);

    const select = screen.getByLabelText('Status');
    // Valor inicial deve refletir status atual (nova -> "Recebida")
    const selectedOption = within(select).getByRole('option', { selected: true });
    expect(selectedOption).toHaveTextContent('Recebida');

    // Opções válidas presentes
    expect(within(select).getByRole('option', { name: 'Recebida' })).toBeInTheDocument();
    expect(within(select).getByRole('option', { name: 'Em negociação' })).toBeInTheDocument();
    expect(within(select).getByRole('option', { name: 'Fechada' })).toBeInTheDocument();
    // Opção inválida não deve existir
    expect(within(select).queryByRole('option', { name: 'Recusada' })).not.toBeInTheDocument();
  });
});