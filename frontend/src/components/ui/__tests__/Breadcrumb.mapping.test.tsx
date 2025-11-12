import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('Breadcrumb mapping (numeric and hyphenated segments)', () => {
  const mockedUsePathname = usePathname as unknown as jest.Mock;

  afterEach(() => {
    mockedUsePathname.mockReset();
  });

  test('maps numeric segment to #<id> for /admin/users/123', () => {
    mockedUsePathname.mockReturnValue('/admin/users/123');
    render(<Breadcrumb />);

    // Links for previous segments
    const homeLink = screen.getByRole('link', { name: 'Início' });
    const adminLink = screen.getByRole('link', { name: 'Área do Administrador' });
    const usersLink = screen.getByRole('link', { name: 'Users' });

    expect(homeLink).toHaveAttribute('href', '/');
    expect(adminLink).toHaveAttribute('href', '/admin');
    expect(usersLink).toHaveAttribute('href', '/admin/users');

    // Last segment not a link, numeric label with #
    expect(screen.getByText('#123')).toBeInTheDocument();

    // Dividers present
    const dividers = screen.getAllByText('/', { selector: 'span' });
    expect(dividers).toHaveLength(3); // Início / Admin / Users / #123
  });

  test('humanizes hyphenated segment for /admin/user-groups', () => {
    mockedUsePathname.mockReturnValue('/admin/user-groups');
    render(<Breadcrumb />);

    const homeLink = screen.getByRole('link', { name: 'Início' });
    const adminLink = screen.getByRole('link', { name: 'Área do Administrador' });

    expect(homeLink).toHaveAttribute('href', '/');
    expect(adminLink).toHaveAttribute('href', '/admin');

    // Last segment is "User Groups" without link
    expect(screen.getByText('User Groups')).toBeInTheDocument();

    const dividers = screen.getAllByText('/', { selector: 'span' });
    expect(dividers).toHaveLength(2); // Início / Admin / User Groups
  });
});