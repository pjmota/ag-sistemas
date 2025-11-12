import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

jest.mock('../../providers/AuthProvider', () => ({
  __esModule: true,
  useAuth: () => ({ token: 'abc', loading: false }),
}));

describe('RequireAuth (authenticated)', () => {
  it('renderiza conteúdo quando autenticado', async () => {
    const RequireAuth = (await import('../RequireAuth')).default;
    render(<RequireAuth><div>Protegido</div></RequireAuth>);
    expect(screen.getByText('Protegido')).toBeInTheDocument();
  });
});