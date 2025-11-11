import { MembersController } from '../modules/members/members.controller';
import { MembersService } from '../modules/members/members.service';
import { InvitesService } from '../modules/invites/invites.service';
import { UsersService } from '../modules/users/users.service';

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
  const usersService: jest.Mocked<UsersService> = {
    listAll: jest.fn(),
    create: jest.fn(),
  } as any;

  let controller: MembersController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new MembersController(membersService, invitesService, usersService);
  });

  it('listActive retorna membros ativos via serviço', async () => {
    const rows = [{ id: 1, status: 'ativo' }];
    membersService.listActive.mockResolvedValue(rows as any);
    const res = await controller.listActive();
    expect(membersService.listActive).toHaveBeenCalled();
    expect(res).toBe(rows);
  });

  it('listAll (admin) retorna todos os membros via memberModel.findAll', async () => {
    const all = [{ id: 1 }, { id: 2 }];
    (membersService as any).memberModel = { findAll: jest.fn().mockResolvedValue(all) };
    const res = await controller.listAll();
    expect((membersService as any).memberModel.findAll).toHaveBeenCalled();
    expect(res).toBe(all);
  });

  it('updateStatus converte id para número e delega ao serviço', async () => {
    const updated = { id: 7, status: 'ativo' };
    membersService.updateStatus.mockResolvedValue(updated as any);
    const res = await controller.updateStatus('42', { status: 'ativo' });
    expect(membersService.updateStatus).toHaveBeenCalledWith(42, 'ativo');
    expect(res).toBe(updated);
  });

  it('register valida token, cria usuário e marca convite usado', async () => {
    invitesService.validate.mockResolvedValue({} as any);
    usersService.create.mockResolvedValue({ id: 10, email: 'a@a.com' } as any);
    invitesService.markUsed.mockResolvedValue({} as any);

    const body = {
      nome: 'Alice',
      email: 'a@a.com',
      senha: '123456',
      telefone: '11999999999',
      empresa: 'ACME',
      cargo: 'Dev',
      bio_area_atuacao: 'TI',
    } as any;
    const res = await controller.register('TOKEN123', body);
    expect(invitesService.validate).toHaveBeenCalledWith('TOKEN123');
    expect(usersService.create).toHaveBeenCalledWith('a@a.com', '123456', 'membro', {
      nome: 'Alice',
      empresa: 'ACME',
      telefone: '11999999999',
      cargo: 'Dev',
      bio_area_atuacao: 'TI',
    });
    expect(invitesService.markUsed).toHaveBeenCalledWith('TOKEN123');
    expect(res).toEqual({ id: 10, email: 'a@a.com' });
  });
});