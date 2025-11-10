import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvitesService } from '../modules/invites/invites.service';

describe('InvitesService', () => {
  const inviteModel: any = {
    create: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const intentionModel: any = {
    findByPk: jest.fn(),
  };
  let service: InvitesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InvitesService(inviteModel, intentionModel);
  });

  describe('generateForIntention', () => {
    it('lança NotFoundException quando intenção não existe', async () => {
      intentionModel.findByPk.mockResolvedValue(null);
      await expect(service.generateForIntention(123)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lança BadRequest quando intenção não está aprovada', async () => {
      intentionModel.findByPk.mockResolvedValue({ id: 1, status: 'pendente' });
      await expect(service.generateForIntention(1)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lança BadRequest quando convite já gerado', async () => {
      const intention = { id: 1, status: 'aprovada', convite_gerado: true };
      intentionModel.findByPk.mockResolvedValue(intention);
      await expect(service.generateForIntention(1)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('gera convite com sucesso e marca intenção', async () => {
      const saved = { save: jest.fn().mockResolvedValue(undefined) };
      const intention = { id: 1, status: 'aprovada', convite_gerado: false, ...saved };
      intentionModel.findByPk.mockResolvedValue(intention);
      inviteModel.create.mockResolvedValue({ id: 10, token: 't' });
      const res = await service.generateForIntention(1);
      expect(inviteModel.create).toHaveBeenCalled();
      expect(intention.convite_gerado).toBe(true);
      expect(saved.save).toHaveBeenCalled();
      expect(res).toEqual({ id: 10, token: 't' });
    });
  });

  describe('validate', () => {
    it('lança BadRequest quando convite inexistente', async () => {
      inviteModel.findOne.mockResolvedValue(null);
      await expect(service.validate('x')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lança BadRequest quando convite já utilizado', async () => {
      inviteModel.findOne.mockResolvedValue({ token: 'x', used: true });
      await expect(service.validate('x')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('retorna convite válido', async () => {
      const invite = { token: 'ok', used: false };
      inviteModel.findOne.mockResolvedValue(invite);
      const res = await service.validate('ok');
      expect(res).toBe(invite);
    });
  });

  describe('markUsed', () => {
    it('lança NotFound quando convite não encontrado', async () => {
      inviteModel.findOne.mockResolvedValue(null);
      await expect(service.markUsed('x')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('marca como usado e salva', async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const invite = { token: 'x', used: false, save };
      inviteModel.findOne.mockResolvedValue(invite);
      const res = await service.markUsed('x');
      expect(invite.used).toBe(true);
      expect(save).toHaveBeenCalled();
      expect(res).toBe(invite);
    });
  });

  describe('getPrefillByToken', () => {
    it('lança BadRequest quando convite inválido/used', async () => {
      inviteModel.findOne.mockResolvedValue({ used: true });
      await expect(service.getPrefillByToken('t')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lança NotFound quando intenção vinculada não encontrada', async () => {
      inviteModel.findOne.mockResolvedValue({ used: false, intention_id: 1 });
      intentionModel.findByPk.mockResolvedValue(null);
      await expect(service.getPrefillByToken('t')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('retorna dados de prefill quando válido', async () => {
      inviteModel.findOne.mockResolvedValue({ used: false, intention_id: 2 });
      intentionModel.findByPk.mockResolvedValue({ nome: 'A', email: 'a@example.com', empresa: 'ACME' });
      const res = await service.getPrefillByToken('t');
      expect(res).toEqual({ nome: 'A', email: 'a@example.com', empresa: 'ACME' });
    });
  });
});