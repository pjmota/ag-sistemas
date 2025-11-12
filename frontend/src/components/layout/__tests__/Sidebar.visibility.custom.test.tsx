import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from '@/components/layout/Sidebar';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/admin'),
}));

// Mock de autenticação: usuário admin para exibir link de Admin
jest.mock('../../providers/AuthProvider', () => ({
  __esModule: true,
  useAuth: () => ({ usuario: { id: 1, email: 'a@b.com', role: 'admin' } })
}));

describe('Sidebar visibilidade customizada', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.NEXT_PUBLIC_VISIBLE_MODULES = 'docs,admin_area';
  });
  afterEach(() => {
    process.env = OLD_ENV;
  });

  test('mostra apenas Docs e Área do Administrador', () => {
    render(<Sidebar />);

    const adminLink = screen.getByRole('link', { name: 'Área do Administrador' });
    const docsLink = screen.getByRole('link', { name: 'Docs API' });

    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute('href', '/admin');
    expect(docsLink).toHaveAttribute('href', 'http://localhost:3001/docs');

    // Demais itens não devem aparecer
    expect(screen.queryByRole('link', { name: 'Sistema de Indicações' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Financeiro' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Dashboard de Performance' })).toBeNull();
  });
});