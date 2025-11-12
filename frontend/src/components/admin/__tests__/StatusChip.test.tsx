import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusChip from '../intentions/StatusChip';

describe('StatusChip', () => {
  it('renderiza status pendente com classes corretas', () => {
    render(<StatusChip status="pendente" />);
    const chip = screen.getByText('pendente');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass('statusChip');
    expect(chip).toHaveClass('statusPending');
  });

  it('renderiza status aprovada com classes corretas', () => {
    render(<StatusChip status="aprovada" />);
    const chip = screen.getByText('aprovada');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass('statusChip');
    expect(chip).toHaveClass('statusApproved');
  });

  it('renderiza status recusada com classes corretas', () => {
    render(<StatusChip status="recusada" />);
    const chip = screen.getByText('recusada');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass('statusChip');
    expect(chip).toHaveClass('statusRejected');
  });
});