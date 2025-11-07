import { MembersController } from '../modules/members/members.controller';
import { MembersService } from '../modules/members/members.service';
import { InvitesService } from '../modules/invites/invites.service';

describe('MembersController', () => {
  const membersService: jest.Mocked<MembersService> = {
    create: jest.fn(),
    listActive: jest.fn(),
    updateStatus: jest.fn(),
  } as any;
  const invitesService: jest.Mocked<InvitesService> = {
    generate: jest.fn(),
    validate: jest.fn(),
    markUsed: jest.fn(),
    listActive: jest.fn(),
  } as any;

  let controller: MembersController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new MembersController(membersService, invitesService);
  });

  it('listActive retorna membros ativos via serviço', async () => {
    const rows = [{ id: 1, status: 'ativo' }];
    membersService.listActive.mockResolvedValue(rows as any);
    const res = await controller.listActive();
    expect(membersService.listActive).toHaveBeenCalled();
    expect(res).toBe(rows);
  });
});