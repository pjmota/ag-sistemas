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

  it('listByUserSent retorna lista para usuário de origem', async () => {
    const rows = [{ id: 1 }, { id: 2 }];
    referralModel.findAll.mockResolvedValue(rows);
    const result = await service.listByUserSent(10);
    expect(referralModel.findAll).toHaveBeenCalledWith({ where: { usuario_origem_id: 10 } });
    expect(result).toBe(rows);
  });

  it('listByUserReceived retorna lista para usuário de destino', async () => {
    const rows = [{ id: 3 }];
    referralModel.findAll.mockResolvedValue(rows);
    const result = await service.listByUserReceived(20);
    expect(referralModel.findAll).toHaveBeenCalledWith({ where: { usuario_destino_id: 20 } });
    expect(result).toBe(rows);
  });

  it('create cria indicação com status nova normalizando membro_* para usuario_*', async () => {
    const created = { id: 10, status: 'nova' };
    referralModel.create.mockResolvedValue(created);
    const res = await service.create({ membro_origem_id: 1, membro_destino_id: 2, descricao: 'Teste' });
    expect(referralModel.create).toHaveBeenCalledWith({ usuario_origem_id: 1, usuario_destino_id: 2, descricao: 'Teste', status: 'nova' });
    expect(res).toBe(created);
  });

  it('getById retorna entidade quando encontra', async () => {
    const entity = { id: 5 };
    referralModel.findByPk.mockResolvedValue(entity);
    const res = await service.getById(5);
    expect(referralModel.findByPk).toHaveBeenCalledWith(5);
    expect(res).toBe(entity);
  });

  it('updateStatus define agradecimentos quando fornecido', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const entity: any = { id: 3, status: 'nova', save };
    referralModel.findByPk.mockResolvedValue(entity);
    const res = await service.updateStatus(3, 'fechada', 'Obrigado!');
    expect(entity.status).toBe('fechada');
    expect(entity.agradecimentos_publicos).toBe('Obrigado!');
    expect(save).toHaveBeenCalled();
    expect(res).toBe(entity);
  });
});