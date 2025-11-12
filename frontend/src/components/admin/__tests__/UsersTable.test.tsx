import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersTable from '../users/UsersTable';

jest.mock('../../../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(async (url) => {
      if (url === '/usuarios') {
        return {
          data: [
            { id: 1, email: 'ana@example.com', role: 'membro', nome: 'Ana', empresa: 'ACME', ativo: true },
            { id: 2, email: 'bruno@example.com', role: 'admin', nome: 'Bruno', empresa: '', ativo: false },
          ],
        };
      }
      return { data: [] };
    }),
    patch: jest.fn(async () => ({ data: {} })),
  },
  updateUser: jest.fn(async () => ({ id: 1 })),
  setUserActive: jest.fn(async () => ({ id: 1 })),
  // Mocks necessários para EditUserModal
  listPlans: jest.fn(async () => ([
    { id: 10, nome: 'Básico', valor: 100, dia_vencimento_padrao: 10, ativo: true },
    { id: 11, nome: 'Premium', valor: 200, dia_vencimento_padrao: 10, ativo: true },
  ])),
  assignPlan: jest.fn(async () => ({ ok: true })),
}));

describe('UsersTable', () => {
  it('lista usuários e abre modal de edição', async () => {
    const user = userEvent.setup();
    render(<UsersTable />);
    expect(await screen.findByText('Ana')).toBeInTheDocument();
    const anaRow = screen.getByText('ana@example.com').closest('tr')!;
    const editBtn = within(anaRow).getByRole('button', { name: /editar/i });
    await user.click(editBtn);
    // Modal deve abrir com título contendo ID da Ana
    expect(screen.getByRole('heading', { name: /Editar usuário #1/i })).toBeInTheDocument();
    // alterar nome e salvar
    const nomeInput = screen.getByPlaceholderText('Nome');
    await user.clear(nomeInput);
    await user.type(nomeInput, 'Ana Maria');
    await user.click(screen.getByRole('button', { name: /salvar/i }));
    // updateUser é chamado via ação de salvar
    const api = await import('../../../lib/api');
    expect(api.updateUser).toHaveBeenCalledWith(1, expect.objectContaining({ nome: 'Ana Maria' }));
  });

  it('permite ativar/inativar usuário', async () => {
    const user = userEvent.setup();
    render(<UsersTable />);
    const brunoRow = await screen.findByText('bruno@example.com');
    const tr = brunoRow.closest('tr')!;
    const toggleBtn = within(tr).getByRole('button', { name: /ativar/i });
    await user.click(toggleBtn);
    const api = await import('../../../lib/api');
    expect(api.setUserActive).toHaveBeenCalledWith(2, true);
  });
});