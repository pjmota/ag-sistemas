import React from 'react';
import { render, screen } from '@testing-library/react';
// Mock de fontes do Next para evitar erro em ambiente de teste
jest.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
}));
import RootLayout from '@/app/layout';

// Mock AppProviders e AppShell para wrappers mínimos
jest.mock('@/components/providers/AppProviders', () => ({ children }: any) => <div data-testid="AppProviders">{children}</div>);
jest.mock('@/components/layout/AppShell', () => ({ children }: any) => <div data-testid="AppShell">{children}</div>);

describe('RootLayout smoke', () => {
  test('envolve conteúdo com AppProviders e AppShell', () => {
    // Renderiza apenas o conteúdo do <body> para evitar <html> dentro de um <div> em JSDOM
    const element = (RootLayout as any)({ children: <div>Conteúdo</div> });
    const bodyEl = (React.Children.toArray(element.props.children) as any[]).find(
      (child) => child?.type === 'body'
    );
    render(bodyEl.props.children as React.ReactNode);
    expect(screen.getByTestId('AppProviders')).toBeInTheDocument();
    expect(screen.getByTestId('AppShell')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo')).toBeInTheDocument();
  });
});