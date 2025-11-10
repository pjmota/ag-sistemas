import { NotFoundException } from '@nestjs/common';
import { IntentionsService } from '../modules/intentions/intentions.service';

describe('IntentionsService', () => {
  const intentionModel: any = {
    findByPk: jest.fn(),
    findOne: jest.fn(),
  };
  const memberModel: any = {
    findOne: jest.fn(),
    create: jest.fn(),
  };
  let service: IntentionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IntentionsService(intentionModel, memberModel);
  });

  describe('updateStatus', () => {
    it('lança NotFound quando intenção inexiste', async () => {
      intentionModel.findByPk.mockResolvedValue(null);
      await expect(service.updateStatus(123, 'aprovada')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('aprova intenção e cria membro quando não existe', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const intention = { id: 1, status: 'pendente', nome: 'A', email: 'a@a.com', empresa: 'ACME', save };
      intentionModel.findByPk.mockResolvedValue(intention);
      memberModel.findOne.mockResolvedValue(null);
      memberModel.create.mockResolvedValue({ id: 7, status: 'pendente' });
      const res = await service.updateStatus(1, 'aprovada');
      expect(intention.status).toBe('aprovada');
      expect(save).toHaveBeenCalled();
      expect(memberModel.create).toHaveBeenCalled();
      expect(res).toBe(intention);
    });

    it('aprova intenção mas não cria membro quando já existe', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const intention = { id: 2, status: 'pendente', nome: 'B', email: 'b@b.com', empresa: 'BETA', save };
      intentionModel.findByPk.mockResolvedValue(intention);
      memberModel.findOne.mockResolvedValue({ id: 99 });
      const res = await service.updateStatus(2, 'aprovada');
      expect(memberModel.create).not.toHaveBeenCalled();
      expect(res).toBe(intention);
    });

    it('recusa intenção e não cria membro', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const intention = { id: 3, status: 'pendente', save };
      intentionModel.findByPk.mockResolvedValue(intention);
      const res = await service.updateStatus(3, 'recusada');
      expect(intention.status).toBe('recusada');
      expect(memberModel.create).not.toHaveBeenCalled();
      expect(res).toBe(intention);
    });
  });
});