import { UsersService } from '../modules/users/users.service';

describe('UsersService - branches adicionais', () => {
  let userModel: any;
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    userModel = {
      findByPk: jest.fn(),
    };
    service = new UsersService(userModel);
  });

  it('update retorna null quando usuário não existe', async () => {
    userModel.findByPk.mockResolvedValue(null);
    const res = await service.update(123, { nome: 'X' });
    expect(res).toBeNull();
  });

  it('update aplica apenas campos fornecidos e salva', async () => {
    const entity: any = {
      id: 5,
      email: 'e@e.com',
      role: 'membro',
      nome: 'Old',
      empresa: 'OldCo',
      ativo: true,
      save: jest.fn(async () => undefined),
    };
    userModel.findByPk.mockResolvedValue(entity);
    const res = await service.update(5, { nome: 'Novo', telefone: '9999', cargo: 'Dev' });
    expect(entity.nome).toBe('Novo');
    expect(entity.telefone).toBe('9999');
    expect(entity.cargo).toBe('Dev');
    expect(entity.empresa).toBe('OldCo');
    expect(entity.save).toHaveBeenCalled();
    expect(res).toEqual({ id: 5, email: 'e@e.com', role: 'membro', nome: 'Novo', empresa: 'OldCo', ativo: true });
  });

  it('setActive retorna null quando usuário não existe', async () => {
    userModel.findByPk.mockResolvedValue(null);
    const res = await service.setActive(77, false);
    expect(res).toBeNull();
  });

  it('setActive altera ativo e salva', async () => {
    const entity: any = {
      id: 8,
      email: 'g@g.com',
      role: 'membro',
      nome: 'G',
      empresa: 'GCo',
      ativo: true,
      save: jest.fn(async () => undefined),
    };
    userModel.findByPk.mockResolvedValue(entity);
    const res = await service.setActive(8, false);
    expect(entity.ativo).toBe(false);
    expect(entity.save).toHaveBeenCalled();
    expect(res).toEqual({ id: 8, email: 'g@g.com', role: 'membro', nome: 'G', empresa: 'GCo', ativo: false });
  });
});