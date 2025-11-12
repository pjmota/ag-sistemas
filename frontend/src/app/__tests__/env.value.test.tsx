import React from 'react';
import { render, screen } from '@testing-library/react';
import EnvPage from '@/app/env/page';

describe('EnvPage valor não definido', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.NEXT_PUBLIC_API_URL;
  });
  afterEach(() => {
    process.env = OLD_ENV;
  });

  test('exibe (não definido) quando NEXT_PUBLIC_API_URL está ausente', () => {
    render(<EnvPage />);
    expect(screen.getByRole('heading', { name: 'Ambiente' })).toBeInTheDocument();
    expect(screen.getByText('(não definido)')).toBeInTheDocument();
  });
});