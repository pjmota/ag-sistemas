import { generateInviteAction } from '../generateInvite';

jest.mock('../../lib/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(async () => ({ data: { token: 'tok-123' } })),
  },
}));

describe('generateInviteAction', () => {
  it('gera convite, chama callbacks e atualiza items', async () => {
    let items = [{ id: 1, convite_gerado: false }, { id: 2, convite_gerado: false }];
    const setItems = (updater: any) => {
      items = typeof updater === 'function' ? updater(items) : updater;
    };
    const onInviteGenerated = jest.fn();
    const alertFn = jest.fn();
    const windowObj = { location: { origin: 'http://localhost:3005' } } as any;

    await generateInviteAction(1, { setItems, onInviteGenerated, alertFn, windowObj });

    expect(onInviteGenerated).toHaveBeenCalledWith('tok-123');
    expect(alertFn).toHaveBeenCalledWith(expect.stringContaining('http://localhost:3005/register?token=tok-123'));
    expect(items[0].convite_gerado).toBe(true);
  });

  it('usa baseUrl quando windowObj não é fornecido', async () => {
    let items = [{ id: 1 }];
    const setItems = (updater: any) => { items = typeof updater === 'function' ? updater(items) : updater; };
    const alertFn = jest.fn();
    await generateInviteAction(1, { setItems, alertFn, baseUrl: 'https://app.exemplo.com' });
    expect(alertFn).toHaveBeenCalledWith(expect.stringContaining('https://app.exemplo.com/register?token='));
  });
});