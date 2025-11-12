import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from '@/components/layout/Header';

// Mock dinâmico de AuthProvider
let authState: any = { usuario: null, loading: false, logout: jest.fn() };
jest.mock('../../providers/AuthProvider', () => ({
  useAuth: () => authState,
}));

// Mock de next/navigation useRouter
const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe('Header smoke', () => {
  beforeEach(() => {
    authState = { usuario: null, loading: false, logout: jest.fn() };
    pushMock.mockReset();
  });

  test('exibe estado de carregando quando loading=true', () => {
    authState.loading = true;
    render(<Header />);
    expect(screen.getByText(/carregando\.+/i)).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Sair')).not.toBeInTheDocument();
  });

  test('exibe email e botão Sair quando autenticado e dispara logout+push', async () => {
    const user = userEvent.setup();
    // Header exibe 'usuario.nome' quando disponível; usar nome igual ao email
    authState.usuario = { email: 'admin@exemplo.com', nome: 'admin@exemplo.com' };
    render(<Header />);
    expect(screen.getByText('admin@exemplo.com')).toBeInTheDocument();
    const sairBtn = screen.getByText('Sair');
    expect(sairBtn).toBeInTheDocument();
    await user.click(sairBtn);
    expect(authState.logout).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/login');
  });

  test('exibe botão Login quando não autenticado', () => {
    authState.usuario = null;
    render(<Header />);
    expect(screen.getByText('Login')).toBeInTheDocument();
  });
});