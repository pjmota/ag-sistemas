import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorMessage from '@/components/ui/ErrorMessage';

describe('ErrorMessage', () => {
  it('não renderiza sem children ou message', () => {
    const { container } = render(<ErrorMessage />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza com message', () => {
    render(<ErrorMessage message="Falha no envio" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Falha no envio');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('prioriza children sobre message', () => {
    render(<ErrorMessage message="MSG" >Texto direto</ErrorMessage>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Texto direto');
  });
});