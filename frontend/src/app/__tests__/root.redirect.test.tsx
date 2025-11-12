import React from 'react';
import Home from '@/app/page';

// Mock de next/navigation.redirect para não lançar e permitir verificação
const mockRedirect = jest.fn();
jest.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}));

describe('Root page redirect', () => {
  test('Home redireciona para /intentions', () => {
    // Chamando diretamente o componente, pois ele apenas executa redirect
    // e não retorna JSX
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    Home();
    expect(mockRedirect).toHaveBeenCalledWith('/intentions');
  });
});