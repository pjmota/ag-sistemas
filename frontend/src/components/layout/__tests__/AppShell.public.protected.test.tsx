import React from 'react';
import { render, screen, within } from '@testing-library/react';
// Mocks devem vir antes do import do AppShell
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));
jest.mock('@/components/layout/Header', () => () => <div data-testid="Header">Header</div>);
import AppShell from '@/components/layout/AppShell';
// Mock de autenticação: usuário admin para exibir link de Admin na Sidebar
jest.mock('../../providers/AuthProvider', () => ({
  __esModule: true,
  useAuth: () => ({ usuario: { id: 1, email: 'a@b.com', role: 'admin' } })
}));

describe('AppShell layout behavior', () => {
  const { usePathname } = jest.requireMock('next/navigation') as { usePathname: jest.Mock };

  afterEach(() => {
    usePathname.mockReset();
  });

  test('does not render Sidebar/Header/Breadcrumb on public routes', () => {
    const routes = ['/login', '/intentions', '/register'] as const;
    // Render inicial
    usePathname.mockReturnValue(routes[0]);
    const { rerender } = render(
      <AppShell>
        <div>ChildContent</div>
      </AppShell>
    );
    expect(screen.getByText('ChildContent')).toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'breadcrumb' })).not.toBeInTheDocument();

    // Rerenders para as demais rotas públicas
    for (const route of routes.slice(1)) {
      usePathname.mockReturnValue(route);
      rerender(
        <AppShell>
          <div>ChildContent</div>
        </AppShell>
      );
      expect(screen.getByText('ChildContent')).toBeInTheDocument();
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
      expect(screen.queryByRole('navigation', { name: 'breadcrumb' })).not.toBeInTheDocument();
    }
  });

  test('renders full layout on protected routes', () => {
    usePathname.mockReturnValue('/admin/users');
    render(
      <AppShell>
        <div>ProtectedContent</div>
      </AppShell>
    );
    // Sidebar rendered (escopar dentro do aside)
    const aside = screen.getByRole('complementary');
    expect(within(aside).getByRole('link', { name: 'Área do Administrador' })).toBeInTheDocument();
    // Breadcrumb present
    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument();
    // Children present
    expect(screen.getByText('ProtectedContent')).toBeInTheDocument();
  });
});
