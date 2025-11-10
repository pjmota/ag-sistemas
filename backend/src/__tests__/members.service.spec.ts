import { NotFoundException } from '@nestjs/common';
import { MembersService } from '../modules/members/members.service';

describe('MembersService', () => {
  const memberModel: any = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  };
  let service: MembersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MembersService(memberModel);
  });

  it('create cria membro com status ativo', async () => {
    memberModel.create.mockResolvedValue({ id: 1, status: 'ativo' });
    const res = await service.create({ nome: 'A', email: 'a@a.com', empresa: 'ACME' });
    expect(memberModel.create).toHaveBeenCalled();
    expect(res).toEqual({ id: 1, status: 'ativo' });
  });

  it('listActive retorna apenas membros ativos', async () => {
    memberModel.findAll.mockResolvedValue([{ id: 1, status: 'ativo' }]);
    const res = await service.listActive();
    expect(memberModel.findAll).toHaveBeenCalled();
    expect(res).toEqual([{ id: 1, status: 'ativo' }]);
  });

  describe('updateStatus', () => {
    it('lança NotFound quando membro inexiste', async () => {
      memberModel.findByPk.mockResolvedValue(null);
      await expect(service.updateStatus(999, 'pendente')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('atualiza status com sucesso', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const member = { id: 1, status: 'pendente', save };
      memberModel.findByPk.mockResolvedValue(member);
      const res = await service.updateStatus(1, 'ativo');
      expect(member.status).toBe('ativo');
      expect(save).toHaveBeenCalled();
      expect(res).toBe(member);
    });
  });
});