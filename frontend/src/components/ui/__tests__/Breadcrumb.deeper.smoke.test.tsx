import React from 'react';
import { render, screen } from '@testing-library/react';
import Breadcrumb from '@/components/ui/Breadcrumb';

// Mock controlável de usePathname
const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('Breadcrumb rota profunda', () => {
  test('renderiza Início, Admin, Users e New com último sem link', () => {
    mockUsePathname.mockReturnValue('/admin/users/new');
    render(<Breadcrumb />);

    // Links para início e admin
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Área do Administrador' })).toHaveAttribute('href', '/admin');
    // Segmento intermediário humanizado 'Users' com link
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/admin/users');
    // Último segmento humanizado 'New' sem link
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'New' })).not.toBeInTheDocument();
    // Separadores presentes entre itens
    expect(screen.getAllByText('/').length).toBeGreaterThanOrEqual(2);
  });
});