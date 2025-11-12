import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Logo from '@/components/branding/Logo';
import { logoSrcList } from '@/lib/branding';

describe('Logo fallback', () => {
  test('avança para próxima fonte ao onError', () => {
    render(<Logo alt="Logo" />);
    const img = screen.getByAltText('Logo') as HTMLImageElement;
    expect(img).toHaveAttribute('src', logoSrcList[0]);
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', logoSrcList[1]);
  });

  test('para no último item após múltiplos erros', () => {
    render(<Logo alt="Logo" />);
    const img = screen.getByAltText('Logo') as HTMLImageElement;
    // dispare erros mais do que o tamanho da lista
    for (let i = 0; i < logoSrcList.length + 2; i++) {
      fireEvent.error(img);
    }
    expect(img).toHaveAttribute('src', logoSrcList[logoSrcList.length - 1]);
  });
});