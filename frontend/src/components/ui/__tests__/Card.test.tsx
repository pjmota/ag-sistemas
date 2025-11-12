import React from 'react';
import { render, screen } from '@testing-library/react';
import Card from '@/components/ui/Card';

describe('Card', () => {
  it('renderiza conteúdo interno', () => {
    render(<Card>Conteúdo do Card</Card>);
    expect(screen.getByText('Conteúdo do Card')).toBeInTheDocument();
  });
});