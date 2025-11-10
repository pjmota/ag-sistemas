import { InvitesController } from '../modules/invites/invites.controller';
import { InvitesService } from '../modules/invites/invites.service';

describe('InvitesController', () => {
  const service: jest.Mocked<InvitesService> = {
    generateForIntention: jest.fn(),
    validate: jest.fn(),
    markUsed: jest.fn(),
    getPrefillByToken: jest.fn(),
  } as any;

  let controller: InvitesController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new InvitesController(service);
  });

  it('generate chama serviço para intenção', async () => {
    service.generateForIntention.mockResolvedValue({ id: 1 } as any);
    const res = await controller.generate('10');
    expect(service.generateForIntention).toHaveBeenCalledWith(10);
    expect(res).toEqual({ id: 1 });
  });

  it('prefill retorna dados do token', async () => {
    service.getPrefillByToken.mockResolvedValue({ nome: 'A' } as any);
    const res = await controller.prefill('tok');
    expect(service.getPrefillByToken).toHaveBeenCalledWith('tok');
    expect(res).toEqual({ nome: 'A' });
  });
});