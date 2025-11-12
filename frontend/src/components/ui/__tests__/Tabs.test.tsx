import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tabs from '@/components/ui/Tabs';

describe('Tabs', () => {
  const items = [
    { key: 'a', label: 'Aba A', content: <div>Conteúdo A</div> },
    { key: 'b', label: 'Aba B', content: <div>Conteúdo B</div> },
  ];

  it('renderiza conteúdo inicial corretamente', () => {
    render(<Tabs items={items} initialKey="b" />);
    expect(screen.getByText('Conteúdo B')).toBeInTheDocument();
  });

  it('alterna para outra aba ao clicar', async () => {
    const user = userEvent.setup();
    render(<Tabs items={items} />);
    expect(screen.getByText('Conteúdo A')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Aba B' }));
    expect(screen.getByText('Conteúdo B')).toBeInTheDocument();
  });
});