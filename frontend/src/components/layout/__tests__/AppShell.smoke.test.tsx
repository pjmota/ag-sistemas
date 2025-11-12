import React from 'react';
import { render, screen } from '@testing-library/react';
import AppShell from '@/components/layout/AppShell';

// Mocks dos componentes de layout
jest.mock('@/components/layout/Sidebar', () => () => <div data-testid="Sidebar">Sidebar</div>);
jest.mock('@/components/layout/Header', () => () => <div data-testid="Header">Header</div>);
jest.mock('@/components/ui/Breadcrumb', () => () => <div data-testid="Breadcrumb">Breadcrumb</div>);

// Mock de usePathname controlável
const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('AppShell smoke', () => {
  test('rota protegida exibe Sidebar, Header e Breadcrumb', () => {
    mockUsePathname.mockReturnValue('/admin');
    render(<AppShell><div>Children</div></AppShell>);
    expect(screen.getByTestId('Sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('Header')).toBeInTheDocument();
    expect(screen.getByTestId('Breadcrumb')).toBeInTheDocument();
    expect(screen.getByText('Children')).toBeInTheDocument();
  });

  test('página de login não exibe layout, apenas children', () => {
    mockUsePathname.mockReturnValue('/login');
    render(<AppShell><div>Children</div></AppShell>);
    expect(screen.queryByTestId('Sidebar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('Header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('Breadcrumb')).not.toBeInTheDocument();
    expect(screen.getByText('Children')).toBeInTheDocument();
  });
});