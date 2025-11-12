import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IndicationForm from '../IndicationForm';

jest.mock('../../providers/AuthProvider', () => ({
  __esModule: true,
  useAuth: () => ({ usuario: { id: 10, email: 'tester@example.com', role: 'membro' }, token: 't', loading: false }),
}));

jest.mock('../../../lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(async (url) => {
      if (url === '/usuarios') {
        return { data: [
          { id: 1, email: 'maria@example.com', role: 'membro', nome: 'Maria' },
          { id: 2, email: 'carlos@example.com', role: 'membro', nome: 'Carlos' },
        ] };
      }
      return { data: {} };
    }),
    post: jest.fn(async () => ({ data: { id: 99 } })),
  },
}));

describe('IndicationForm', () => {
  it('valida campos obrigatórios e envia indicação', async () => {
    const user = userEvent.setup();
    render(<IndicationForm />);

    // espera carregar lista de usuários para selecionar destino
    const selectUser = await screen.findByLabelText(/Usuário indicado/i);
    // aguarda opções carregarem
    await screen.findByRole('option', { name: /Maria/i });
    await user.selectOptions(selectUser, '1');

    const empresaContato = screen.getByLabelText(/Empresa\/contato indicado/i);
    const descricao = screen.getByLabelText(/Descrição da oportunidade/i);

    await user.type(empresaContato, 'Empresa XYZ');
    await user.type(descricao, 'Descrição da oportunidade interessante.');

    await user.click(screen.getByRole('button', { name: /criar indicação/i }));

    // sucesso mostrado
    expect(await screen.findByText(/Indicação criada com sucesso/i)).toBeInTheDocument();
  });

  it('mostra erros de validação quando campos faltam', async () => {
    const user = userEvent.setup();
    render(<IndicationForm />);
    await user.click(screen.getByRole('button', { name: /criar indicação/i }));
    expect(await screen.findByText(/Selecione o usuário indicado/i)).toBeInTheDocument();
    expect(await screen.findByText(/Informe a empresa\/contato/i)).toBeInTheDocument();
    expect(await screen.findByText(/Descreva a oportunidade/i)).toBeInTheDocument();
  });
});