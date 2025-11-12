import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from '@/components/layout/Sidebar';

// Mock usePathname para simular rota atual
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/admin/users'),
}));

// Mock de autenticação: usuário admin para exibir link de Admin
jest.mock('../../providers/AuthProvider', () => ({
  __esModule: true,
  useAuth: () => ({ usuario: { id: 1, email: 'a@b.com', role: 'admin' } })
}));

describe('Sidebar smoke', () => {
  beforeEach(() => {
    jest.resetModules();
    // Não definir NEXT_PUBLIC_VISIBLE_MODULES para usar padrão (sem Docs)
    delete process.env.NEXT_PUBLIC_VISIBLE_MODULES;
  });

  test('renderiza logo e itens padrão com ativo em /admin', () => {
    render(<Sidebar />);

    // Logo
    expect(screen.getByAltText('Logo')).toBeInTheDocument();

    // Itens visíveis padrão (Docs não incluso)
    const adminLink = screen.getByRole('link', { name: 'Área do Administrador' });
    const indicacoesLink = screen.getByRole('link', { name: 'Sistema de Indicações' });
    const financeiroLink = screen.getByRole('link', { name: 'Financeiro' });
    const dashboardLink = screen.getByRole('link', { name: 'Dashboard de Performance' });

    expect(adminLink).toHaveAttribute('href', '/admin');
    expect(indicacoesLink).toHaveAttribute('href', '/indications');
    expect(financeiroLink).toHaveAttribute('href', '/financeiro');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');

    // Docs não deve aparecer por padrão
    expect(screen.queryByRole('link', { name: 'Docs API' })).toBeNull();

    // Ativo em /admin/users deve marcar /admin como ativo
    expect(adminLink).toHaveClass('navLinkActive');
  });
});