import React from 'react';
import { render } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

jest.mock('../../providers/AuthProvider', () => ({
  __esModule: true,
  useAuth: () => ({ token: null, loading: false }),
}));

describe('RequireAuth (unauthenticated)', () => {
  it('não renderiza conteúdo e tenta redirecionar quando sem token', async () => {
    const RequireAuth = (await import('../RequireAuth')).default;
    const { container } = render(<RequireAuth><div>Protegido</div></RequireAuth>);
    expect(container).toBeEmptyDOMElement();
  });
});