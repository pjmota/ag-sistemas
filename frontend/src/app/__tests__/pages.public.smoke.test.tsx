import React from 'react';
import { render, screen } from '@testing-library/react';

// Login
import LoginPage from '@/app/login/page';

// Register
import RegisterPage from '@/app/register/page';

// Intentions
import IntentionsPage from '@/app/intentions/page';

// Env
import EnvPage from '@/app/env/page';

// Mocks de componentes filhos para evitar dependências desnecessárias
jest.mock('@/components/forms/CompleteRegistrationForm', () => () => <div data-testid="CompleteRegistrationForm">Form</div>);
jest.mock('@/components/forms/IntentionForm', () => () => <div data-testid="IntentionForm">Form</div>);
// Mock do AuthProvider/useAuth para LoginPage
jest.mock('@/components/providers/AuthProvider', () => ({
  useAuth: () => ({ login: jest.fn() }),
}));

// Mock de useSearchParams para RegisterPage
jest.mock('next/navigation', () => {
  const actual = jest.requireActual('next/navigation');
  return {
    ...actual,
    useSearchParams: () => ({ get: (key: string) => (key === 'token' ? 'fake-token' : null) }),
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  };
});

describe('Smoke · Páginas Públicas', () => {
  test('LoginPage renderiza título e botão', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  test('RegisterPage renderiza título e formulário (mockado)', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('heading', { name: 'Cadastro Completo' })).toBeInTheDocument();
    expect(screen.getByTestId('CompleteRegistrationForm')).toBeInTheDocument();
  });

  test('IntentionsPage renderiza título e formulário (mockado)', () => {
    render(<IntentionsPage />);
    // A página não renderiza heading, valida subtítulo e formulário
    expect(screen.getByText('Preencha o formulário abaixo para participar.')).toBeInTheDocument();
    expect(screen.getByTestId('IntentionForm')).toBeInTheDocument();
  });

  test('EnvPage renderiza título e dica de .env', () => {
    render(<EnvPage />);
    expect(screen.getByRole('heading', { name: 'Ambiente' })).toBeInTheDocument();
    // O texto está quebrado entre elementos (p + code): validar presença do código .env.local
    expect(screen.getByText('.env.local')).toBeInTheDocument();
  });
});