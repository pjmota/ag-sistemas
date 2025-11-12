import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IntentionForm from '../IntentionForm';

jest.mock('../../../lib/api', () => ({
  __esModule: true,
  default: { post: jest.fn(async () => ({ data: { id: 1 } })) },
}));

describe('IntentionForm', () => {
  it('valida campos e envia intenção', async () => {
    render(<IntentionForm />);

    const nome = screen.getByLabelText('Nome');
    const email = screen.getByLabelText('Email');
    const empresa = screen.getByLabelText('Empresa');
    const motivo = screen.getByLabelText('Por que você quer participar?');

    await userEvent.type(nome, 'João Silva');
    await userEvent.type(email, 'joao@example.com');
    await userEvent.type(empresa, 'ACME');
    await userEvent.type(motivo, 'Quero contribuir e aprender com o grupo.');

    await userEvent.click(screen.getByRole('button', { name: /enviar intenção/i }));

    expect(await screen.findByText(/Intenção enviada com sucesso/i)).toBeInTheDocument();
  });

  it('mostra erro de email inválido', async () => {
    render(<IntentionForm />);
    const email = screen.getByLabelText('Email');
    await userEvent.type(email, 'email-invalido');
    await userEvent.click(screen.getByRole('button', { name: /enviar intenção/i }));
    expect(await screen.findByText(/Email inválido/i)).toBeInTheDocument();
  });
});