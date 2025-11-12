import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IntentionForm from '../IntentionForm';

let resolvePost: ((value: any) => void) | null = null;
const postMock = jest.fn((url?: string, data?: any) => new Promise((res) => { resolvePost = res; }));

jest.mock('../../../lib/api', () => ({
  __esModule: true,
  default: {
    post: (url: string, data?: any) => postMock(url, data),
  },
}));

describe('IntentionForm (loading)', () => {
  beforeEach(() => {
    resolvePost = null;
    postMock.mockClear();
  });

  it('desabilita botão e mostra "Enviando..." durante o envio', async () => {
    const user = userEvent.setup();
    render(<IntentionForm />);

    await user.type(screen.getByLabelText('Nome'), 'João Silva');
    await user.type(screen.getByLabelText('Email'), 'joao@example.com');
    await user.type(screen.getByLabelText('Empresa'), 'ACME');
    await user.type(screen.getByLabelText('Por que você quer participar?'), 'Quero contribuir com o grupo.');

    await user.click(screen.getByRole('button', { name: /enviar intenção/i }));

    // enquanto a promise não resolve, deve mostrar estado de loading
    const loadingBtn = screen.getByRole('button', { name: /enviando/i });
    expect(loadingBtn).toBeDisabled();

    // conclui a promise
    resolvePost?.({ data: { id: 123 } });
    // após concluir, aparece mensagem de sucesso
    expect(await screen.findByText(/Intenção enviada com sucesso/i)).toBeInTheDocument();
  });
});