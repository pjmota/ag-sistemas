import { UsersController } from '../modules/users/users.controller';
import { UsersService } from '../modules/users/users.service';
import { InvitesService } from '../modules/invites/invites.service';

describe('UsersController', () => {
  const usersService: jest.Mocked<UsersService> = {
    listAll: jest.fn(),
    create: jest.fn(),
  } as any;
  const invitesService: jest.Mocked<InvitesService> = {
    validate: jest.fn(),
    markUsed: jest.fn(),
    generateForIntention: jest.fn(),
    getPrefillByToken: jest.fn(),
  } as any;

  let controller: UsersController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UsersController(usersService, invitesService);
  });

  it('listAll retorna usuários via serviço', async () => {
    const rows = [{ id: 1, email: 'a@a.com', role: 'membro', nome: 'A', empresa: 'ACME' }];
    usersService.listAll.mockResolvedValue(rows as any);
    const res = await controller.listAll();
    expect(usersService.listAll).toHaveBeenCalled();
    expect(res).toBe(rows);
  });

  it('register valida token, cria usuário com extras e marca como usado', async () => {
    invitesService.validate.mockResolvedValue({} as any);
    usersService.create.mockResolvedValue({ id: 10, email: 'new@exemplo.com', role: 'membro', nome: 'Novo', empresa: 'Empresa' } as any);
    invitesService.markUsed.mockResolvedValue({} as any);

    const body = {
      email: 'new@exemplo.com',
      senha: '123456',
      nome: 'Novo',
      empresa: 'Empresa',
      telefone: '9999-9999',
      cargo: 'Dev',
      bio_area_atuacao: 'Tecnologia',
    };
    const res = await controller.register('tok123', body);
    expect(invitesService.validate).toHaveBeenCalledWith('tok123');
    expect(usersService.create).toHaveBeenCalledWith('new@exemplo.com', '123456', 'membro', expect.objectContaining({
      nome: 'Novo',
      empresa: 'Empresa',
      telefone: '9999-9999',
      cargo: 'Dev',
      bio_area_atuacao: 'Tecnologia',
    }));
    expect(invitesService.markUsed).toHaveBeenCalledWith('tok123');
    expect(res).toEqual({ id: 10, email: 'new@exemplo.com', role: 'membro', nome: 'Novo', empresa: 'Empresa' });
  });

  it('register funciona sem campos extras, passando indefinidos para o serviço', async () => {
    invitesService.validate.mockResolvedValue({} as any);
    usersService.create.mockResolvedValue({ id: 11, email: 'noextras@exemplo.com', role: 'membro' } as any);
    invitesService.markUsed.mockResolvedValue({} as any);

    const res = await controller.register('tok456', { email: 'noextras@exemplo.com', senha: 'abc123' } as any);
    const call = usersService.create.mock.calls[0];
    expect(call[0]).toBe('noextras@exemplo.com');
    expect(call[1]).toBe('abc123');
    expect(call[2]).toBe('membro');
    expect(call[3]).toEqual({ nome: undefined, empresa: undefined, telefone: undefined, cargo: undefined, bio_area_atuacao: undefined });
    expect(invitesService.markUsed).toHaveBeenCalledWith('tok456');
    expect(res).toEqual({ id: 11, email: 'noextras@exemplo.com', role: 'membro' });
  });
});