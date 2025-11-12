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
const patchMock = jest.fn();
jest.mock('../../../lib/api', () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => getMock(...args),
    patch: (...args: any[]) => patchMock(...args),
  },
}));

describe('ReferralsManager', () => {
  beforeEach(() => {
    usuarioMock = null;
    getMock.mockReset();
    patchMock.mockReset();
    // Silencia erros esperados durante testes de falha
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    (console.error as any).mockRestore?.();
  });

  it('mostra aviso de login quando não autenticado', () => {
    usuarioMock = null;
    render(<ReferralsManager />);
    expect(screen.getByText(/Faça login para ver e gerenciar suas indicações/i)).toBeInTheDocument();
  });

  it('carrega listas e permite editar status com sucesso', async () => {
    usuarioMock = { id: 10, email: 'tester@example.com' };
    // Respostas da API conforme URLs
    getMock.mockImplementation(async (url: string) => {
      if (url.includes('/indicacoes/usuario/10/enviadas')) {
        return { data: [
          { id: 1, usuario_destino_id: 2, usuario_origem_id: 10, descricao: 'Desc enviada', status: 'nova', agradecimentos_publicos: undefined },
        ] };
      }
      if (url.includes('/indicacoes/usuario/10/recebidas')) {
        return { data: [
          { id: 1, usuario_destino_id: 10, usuario_origem_id: 3, descricao: 'Desc recebida', status: 'nova', agradecimentos_publicos: undefined },
        ] };
      }
      if (url.includes('/usuarios')) {
        return { data: [
          { id: 2, email: 'maria@example.com', role: 'membro', nome: 'Maria' },
          { id: 3, email: 'carlos@example.com', role: 'membro', nome: 'Carlos' },
        ] };
      }
      return { data: {} };
    });
    patchMock.mockResolvedValueOnce({ data: {} });

    render(<ReferralsManager />);

    // Recebidas: linha aparece
    const receivedDesc = await screen.findByText('Desc recebida');
    const receivedRow = receivedDesc.closest('tr')!;
    // abre modal
    const editBtn = within(receivedRow).getByRole('button', { name: /editar status/i });
    await userEvent.click(editBtn);
    // altera status para Fechada e adiciona agradecimento
    const select = screen.getByLabelText('Status');
    await userEvent.selectOptions(select, 'fechada');
    const textarea = screen.getByLabelText(/Agradecimentos públicos/i);
    await userEvent.type(textarea, 'Obrigado X');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    // Verifica chamada de patch e atualização nas tabelas
    expect(patchMock).toHaveBeenCalledWith('/indicacoes/1/status', { status: 'fechada', agradecimentos_publicos: 'Obrigado X' });
    // Recebidas: status atualizado na mesma linha
    expect(await within(receivedRow).findByText('Fechada')).toBeInTheDocument();
    // Enviadas: agradecer visível após fechar
    const sentDesc = screen.getByText('Desc enviada');
    const sentRow = sentDesc.closest('tr')!;
    expect(within(sentRow).getByText('Obrigado X')).toBeInTheDocument();
  });

  it('exibe erro quando API falha ao atualizar status', async () => {
    usuarioMock = { id: 10 };
    getMock.mockImplementation(async (url: string) => {
      if (url.includes('/indicacoes/usuario/10/enviadas')) {
        return { data: [{ id: 1, usuario_destino_id: 2, usuario_origem_id: 10, descricao: 'Desc enviada', status: 'nova' }] };
      }
      if (url.includes('/indicacoes/usuario/10/recebidas')) {
        return { data: [{ id: 1, usuario_destino_id: 10, usuario_origem_id: 3, descricao: 'Desc recebida', status: 'nova' }] };
      }
      if (url.includes('/usuarios')) {
        return { data: [{ id: 2, email: 'maria@example.com', role: 'membro', nome: 'Maria' }, { id: 3, email: 'carlos@example.com', role: 'membro', nome: 'Carlos' }] };
      }
      return { data: {} };
    });
    patchMock.mockRejectedValueOnce(new Error('Erro de atualização'));

    render(<ReferralsManager />);
    const receivedDesc = await screen.findByText('Desc recebida');
    const receivedRow = receivedDesc.closest('tr')!;
    const editBtn = within(receivedRow).getByRole('button', { name: /editar status/i });
    await userEvent.click(editBtn);
    const select = screen.getByLabelText('Status');
    await userEvent.selectOptions(select, 'fechada');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    // Mensagem de erro exibida
    expect(await screen.findByText('Erro de atualização')).toBeInTheDocument();
  });
});