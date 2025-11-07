import { NotFoundException } from '@nestjs/common';
import { ReferralsService } from '../modules/referrals/referrals.service';

describe('ReferralsService', () => {
  const referralModel: any = {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
  };
  let service: ReferralsService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ReferralsService(referralModel);
  });

  it('getById lança NotFoundException quando não encontra', async () => {
    referralModel.findByPk.mockResolvedValue(null);
    await expect(service.getById(123)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updateStatus lança NotFoundException quando não encontra', async () => {
    referralModel.findByPk.mockResolvedValue(null);
    await expect(service.updateStatus(9999, 'fechada')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updateStatus atualiza e salva quando encontra', async () => {
    const entity = { id: 1, status: 'nova', save: jest.fn().mockResolvedValue(undefined) };
    referralModel.findByPk.mockResolvedValue(entity);
    const r = await service.updateStatus(1, 'em contato');
    expect(entity.status).toBe('em contato');
    expect(entity.save).toHaveBeenCalled();
    expect(r).toBe(entity);
  });

  it('listByMemberSent retorna lista para membro de origem', async () => {
    const rows = [{ id: 1 }, { id: 2 }];
    referralModel.findAll.mockResolvedValue(rows);
    const result = await service.listByMemberSent(10);
    expect(referralModel.findAll).toHaveBeenCalledWith({ where: { membro_origem_id: 10 } });
    expect(result).toBe(rows);
  });

  it('listByMemberReceived retorna lista para membro de destino', async () => {
    const rows = [{ id: 3 }];
    referralModel.findAll.mockResolvedValue(rows);
    const result = await service.listByMemberReceived(20);
    expect(referralModel.findAll).toHaveBeenCalledWith({ where: { membro_destino_id: 20 } });
    expect(result).toBe(rows);
  });
});