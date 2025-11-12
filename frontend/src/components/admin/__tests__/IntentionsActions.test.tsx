import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IntentionActions from '../intentions/IntentionsActions';

describe('IntentionActions', () => {
  it('dispara callbacks ao aprovar/recusar quando pendente', async () => {
    const onApprove = jest.fn();
    const onReject = jest.fn();
    const onInvite = jest.fn();
    const user = userEvent.setup();
    render(
      <IntentionActions
        status="pendente"
        convite_gerado={false}
        onApprove={onApprove}
        onReject={onReject}
        onInvite={onInvite}
      />
    );

    await user.click(screen.getByRole('button', { name: /aprovar/i }));
    await user.click(screen.getByRole('button', { name: /recusar/i }));
    // convite desabilitado enquanto pendente
    expect(screen.getByRole('button', { name: /gerar convite/i })).toBeDisabled();
    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onInvite).not.toHaveBeenCalled();
  });

  it('desabilita ações conforme status e convite_gerado', () => {
    const noop = () => {};
    const { rerender } = render(
      <IntentionActions status="aprovada" convite_gerado={false} onApprove={noop} onReject={noop} onInvite={noop} />
    );
    expect(screen.getByRole('button', { name: /aprovar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /recusar/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /gerar convite/i })).not.toBeDisabled();

    rerender(<IntentionActions status="aprovada" convite_gerado={true} onApprove={noop} onReject={noop} onInvite={noop} />);
    expect(screen.getByRole('button', { name: /gerar convite/i })).toBeDisabled();

    rerender(<IntentionActions status="recusada" convite_gerado={false} onApprove={noop} onReject={noop} onInvite={noop} />);
    expect(screen.getByRole('button', { name: /aprovar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /recusar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /gerar convite/i })).toBeDisabled();
  });
});