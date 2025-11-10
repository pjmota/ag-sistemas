import { ConflictException } from '@nestjs/common';
import { UsersService } from '../modules/users/users.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(async () => 'hashed-password'),
}));

describe('UsersService', () => {
  const userModel: any = {
    findOne: jest.fn(),
    create: jest.fn(),
  };
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(userModel);
  });

  it('lança ConflictException quando usuário já existe', async () => {
    userModel.findOne.mockResolvedValue({ id: 1, email: 'a@a.com' });
    await expect(service.create('a@a.com', '123', 'membro')).rejects.toBeInstanceOf(ConflictException);
  });

  it('cria usuário novo com campos extras e senha hash', async () => {
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue({ id: 99, email: 'b@b.com', role: 'membro' });
    const res = await service.create('b@b.com', '123', 'membro', {
      telefone: '9999-9999',
      cargo: 'Dev',
      bio_area_atuacao: 'Tecnologia',
    });
    expect(userModel.create).toHaveBeenCalled();
    const call = userModel.create.mock.calls[0][0];
    expect(call.senha_hash).toBe('hashed-password');
    expect(call.telefone).toBe('9999-9999');
    expect(call.cargo).toBe('Dev');
    expect(call.bio_area_atuacao).toBe('Tecnologia');
    expect(res).toEqual({ id: 99, email: 'b@b.com', role: 'membro' });
  });

  it('cria usuário novo sem campos extras', async () => {
    userModel.findOne.mockResolvedValue(null);
    userModel.create.mockResolvedValue({ id: 100, email: 'c@c.com', role: 'membro' });
    const res = await service.create('c@c.com', '321', 'membro');
    const call = userModel.create.mock.calls[0][0];
    expect(call.telefone).toBeUndefined();
    expect(call.cargo).toBeUndefined();
    expect(call.bio_area_atuacao).toBeUndefined();
    expect(res).toEqual({ id: 100, email: 'c@c.com', role: 'membro' });
  });

  it('listAll retorna id, email e role', async () => {
    const rows = [{ id: 1, email: 'a@a.com', role: 'admin' }];
    userModel.findAll = jest.fn().mockResolvedValue(rows);
    const res = await service.listAll();
    expect(userModel.findAll).toHaveBeenCalledWith({ attributes: ['id', 'email', 'role'] });
    expect(res).toBe(rows);
  });
});