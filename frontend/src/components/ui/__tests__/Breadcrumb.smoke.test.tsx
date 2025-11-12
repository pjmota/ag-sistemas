import React from 'react';
import { render, screen } from '@testing-library/react';

const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

import Breadcrumb from '@/components/ui/Breadcrumb';

describe('Breadcrumb smoke', () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
  });

  test('renderiza nav e segmentos para /dashboard', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<Breadcrumb />);
    const nav = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(nav).toBeInTheDocument();

    const homeLink = screen.getByRole('link', { name: 'Início' });
    expect(homeLink).toHaveAttribute('href', '/');
    expect(screen.getByText('Dashboard de Performance')).toBeInTheDocument();

    const dividers = screen.getAllByText('/', { selector: 'span' });
    expect(dividers).toHaveLength(1);
  });

  test('renderiza corretamente para /indicacoes', () => {
    mockUsePathname.mockReturnValue('/indicacoes');
    render(<Breadcrumb />);

    const homeLink = screen.getByRole('link', { name: 'Início' });
    expect(homeLink).toHaveAttribute('href', '/');
    expect(screen.getByText('Sistema de Indicações')).toBeInTheDocument();

    const dividers = screen.getAllByText('/', { selector: 'span' });
    expect(dividers).toHaveLength(1);
  });
  test('renderiza aninhado /admin/users com link e rótulo atual', () => {
    mockUsePathname.mockReturnValue('/admin/users');
    render(<Breadcrumb />);
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Área do Administrador' })).toHaveAttribute('href', '/admin');
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
    expect(screen.getAllByText('/').length).toBeGreaterThanOrEqual(1);
  });
});