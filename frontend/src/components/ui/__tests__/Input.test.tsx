import React from 'react';
import { render, screen } from '@testing-library/react';
import Input from '@/components/ui/Input';

describe('Input', () => {
  it('associa label ao input via htmlFor/id', () => {
    render(<Input label="Nome" name="nome" />);
    const input = screen.getByLabelText('Nome');
    expect(input).toBeInTheDocument();
    const label = screen.getByText('Nome');
    expect(label.tagName.toLowerCase()).toBe('label');
    const htmlFor = (label as HTMLLabelElement).htmlFor;
    expect(htmlFor).toBe((input as HTMLInputElement).id);
  });

  it('exibe estado de erro e aria-invalid quando error é definido', () => {
    render(<Input label="Email" error="Campo obrigatório" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
  });
});