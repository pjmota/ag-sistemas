import { ReferralsController } from '../modules/referrals/referrals.controller';
import { ReferralsService } from '../modules/referrals/referrals.service';

describe('ReferralsController', () => {
  const service: any = {
    create: jest.fn(),
    getById: jest.fn(),
    listByMemberSent: jest.fn(),
    listByMemberReceived: jest.fn(),
    updateStatus: jest.fn(),
  };

  let controller: ReferralsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ReferralsController(service);
  });

  it('sent retorna indicações enviadas pelo membro', async () => {
    service.listByMemberSent.mockResolvedValue([{ id: 1 }] as any);
    const res = await controller.sent('10');
    expect(service.listByMemberSent).toHaveBeenCalledWith(10);
    expect(res).toEqual([{ id: 1 }]);
  });

  it('received retorna indicações recebidas pelo membro', async () => {
    service.listByMemberReceived.mockResolvedValue([{ id: 2 }] as any);
    const res = await controller.received('22');
    expect(service.listByMemberReceived).toHaveBeenCalledWith(22);
    expect(res).toEqual([{ id: 2 }]);
  });
});