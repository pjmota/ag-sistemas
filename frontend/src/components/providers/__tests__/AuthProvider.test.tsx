import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthProvider';

jest.mock('../../../lib/api', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const api = require('../../../lib/api').default as { post: jest.Mock };

function Probe() {
  const { token, usuario, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="token">{token ?? 'null'}</span>
      <span data-testid="usuario">{usuario ? usuario.email : 'null'}</span>
      <span data-testid="loading">{String(loading)}</span>
      <button data-testid="loginBtn" onClick={() => login('admin@exemplo.com', '123').catch(() => {})}>Login</button>
      <button data-testid="logoutBtn" onClick={() => logout()}>Logout</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
}

function clearAuthArtifacts() {
  // Remove localStorage
  if (globalThis.window !== undefined) {
    window.localStorage.clear();
  }
  // Expira o cookie de token
  if (globalThis.document !== undefined) {
    document.cookie = 'token=; Path=/; Max-Age=0; SameSite=Lax';
  }
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAuthArtifacts();
  });

  it('hidrata estado inicial a partir de cookie e localStorage', async () => {
    // Simula cookie e localStorage antes de renderizar
    document.cookie = 'token=abc123; Path=/; Max-Age=600; SameSite=Lax';
    window.localStorage.setItem('usuario', JSON.stringify({ id: 1, email: 'user@exemplo.com', role: 'admin' }));

    renderWithProvider();

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('token').textContent).toBe('abc123');
    expect(screen.getByTestId('usuario').textContent).toBe('user@exemplo.com');
  });

  it('login sucesso grava cookie, localStorage e atualiza estado', async () => {
    api.post.mockResolvedValue({
      data: {
        token: 'jwt-token',
        usuario: { id: 7, email: 'admin@exemplo.com', role: 'admin' },
      },
    });

    renderWithProvider();
    fireEvent.click(screen.getByTestId('loginBtn'));

    await waitFor(() => expect(screen.getByTestId('token').textContent).toBe('jwt-token'));
    expect(screen.getByTestId('usuario').textContent).toBe('admin@exemplo.com');
    expect(window.localStorage.getItem('usuario')).toContain('admin@exemplo.com');
    expect(document.cookie).toMatch(/token=jwt-token/);
  });

  it('login falha não altera estado nem cria artefatos', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'Falha' } } });

    renderWithProvider();
    fireEvent.click(screen.getByTestId('loginBtn'));

    // Aguarda microtasks da promise rejeitada
    await waitFor(() => {
      expect(screen.getByTestId('token').textContent).toBe('null');
      expect(screen.getByTestId('usuario').textContent).toBe('null');
    });
    expect(window.localStorage.getItem('usuario')).toBeNull();
    // Cookie de token não deve estar presente
    expect(document.cookie).not.toMatch(/token=/);
  });

  it('logout remove cookie/localStorage e reseta estado', async () => {
    // Primeiro, simula estado autenticado
    document.cookie = 'token=abc123; Path=/; Max-Age=600; SameSite=Lax';
    window.localStorage.setItem('usuario', JSON.stringify({ id: 1, email: 'user@exemplo.com', role: 'admin' }));

    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    fireEvent.click(screen.getByTestId('logoutBtn'));

    await waitFor(() => {
      expect(screen.getByTestId('token').textContent).toBe('null');
      expect(screen.getByTestId('usuario').textContent).toBe('null');
    });
    expect(window.localStorage.getItem('usuario')).toBeNull();
    // Cookie de token deve ter sido removido
    expect(document.cookie).not.toMatch(/token=/);
  });
});