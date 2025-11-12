import React from 'react';
import { render, screen } from '@testing-library/react';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('renderiza conteúdo padrão e está habilitado', () => {
    render(<Button>Salvar</Button>);
    const btn = screen.getByRole('button', { name: 'Salvar' });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it('mostra texto de loading e desabilita quando loading=true', () => {
    render(<Button loading>Salvar</Button>);
    const btn = screen.getByRole('button', { name: 'Enviando...' });
    expect(btn).toBeDisabled();
  });
});