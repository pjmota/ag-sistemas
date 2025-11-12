import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../login/page';

const loginMock = jest.fn(() => Promise.resolve());
const pushMock = jest.fn();

jest.mock('@/components/providers/AuthProvider', () => ({
  useAuth: () => ({ login: loginMock }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe('LoginPage integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('admin: preenche credenciais, chama login e redireciona para /admin', async () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const senhaInput = screen.getByLabelText('Senha');
    fireEvent.change(emailInput, { target: { value: 'admin@exemplo.com' } });
    fireEvent.change(senhaInput, { target: { value: '123456' } });

    // Simula usuário admin gravado no localStorage pelo AuthProvider
    window.localStorage.setItem('usuario', JSON.stringify({ id: 1, email: 'admin@exemplo.com', role: 'admin' }));

    const submitButton = screen.getByRole('button', { name: 'Entrar' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('admin@exemplo.com', '123456');
      expect(pushMock).toHaveBeenCalledWith('/admin');
    });
  });

  it('membro: preenche credenciais, chama login e redireciona para /indicacoes', async () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email');
    const senhaInput = screen.getByLabelText('Senha');
    fireEvent.change(emailInput, { target: { value: 'membro@exemplo.com' } });
    fireEvent.change(senhaInput, { target: { value: '123456' } });

    // Simula usuário membro gravado no localStorage
    window.localStorage.setItem('usuario', JSON.stringify({ id: 2, email: 'membro@exemplo.com', role: 'membro' }));

    const submitButton = screen.getByRole('button', { name: 'Entrar' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('membro@exemplo.com', '123456');
      expect(pushMock).toHaveBeenCalledWith('/indicacoes');
    });
  });
});