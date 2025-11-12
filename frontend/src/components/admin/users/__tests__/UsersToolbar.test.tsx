import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersToolbar from '../UsersToolbar';

describe('UsersToolbar', () => {
  it('exibe título padrão e dispara onReload ao clicar', async () => {
    const onReload = jest.fn();
    const user = userEvent.setup();
    render(<UsersToolbar onReload={onReload} />);
    expect(screen.getByText('Usuários existentes')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /recarregar/i }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it('aceita título customizado', () => {
    const onReload = jest.fn();
    render(<UsersToolbar title="Lista de Usuários" onReload={onReload} />);
    expect(screen.getByText('Lista de Usuários')).toBeInTheDocument();
  });
});