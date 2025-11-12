import React from 'react';
import { render, screen } from '@testing-library/react';
import EnvPage from '@/app/env/page';

describe('EnvPage valor definido', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.NEXT_PUBLIC_API_URL = 'https://api.exemplo.com';
  });
  afterEach(() => {
    process.env = OLD_ENV;
  });

  test('exibe valor de NEXT_PUBLIC_API_URL quando definido', () => {
    render(<EnvPage />);
    expect(screen.getByRole('heading', { name: 'Ambiente' })).toBeInTheDocument();
    expect(screen.getByText('https://api.exemplo.com')).toBeInTheDocument();
    // ainda mostra a dica de .env (elemento <code> presente)
    expect(screen.getByText('.env.local')).toBeInTheDocument();
  });
});