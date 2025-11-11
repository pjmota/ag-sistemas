import { ReferralsController } from '../modules/referrals/referrals.controller';
import { ReferralsService } from '../modules/referrals/referrals.service';

describe('ReferralsController', () => {
  const service: any = {
    create: jest.fn(),
    getById: jest.fn(),
    listByUserSent: jest.fn(),
    listByUserReceived: jest.fn(),
    updateStatus: jest.fn(),
  };

  let controller: ReferralsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ReferralsController(service);
  });

  it('sent retorna indicações enviadas pelo membro', async () => {
    service.listByUserSent.mockResolvedValue([{ id: 1 }] as any);
    const res = await controller.sent('10');
    expect(service.listByUserSent).toHaveBeenCalledWith(10);
    expect(res).toEqual([{ id: 1 }]);
  });

  it('received retorna indicações recebidas pelo membro', async () => {
    service.listByUserReceived.mockResolvedValue([{ id: 2 }] as any);
    const res = await controller.received('22');
    expect(service.listByUserReceived).toHaveBeenCalledWith(22);
    expect(res).toEqual([{ id: 2 }]);
  });

  it('create com usuario_* ids chama service.create com usuario ids', async () => {
    service.create.mockResolvedValue({ id: 10 } as any);
    const body = { usuario_origem_id: 1, usuario_destino_id: 2, descricao: 'Teste' };
    const res = await controller.create(body as any);
    expect(service.create).toHaveBeenCalledWith({ usuario_origem_id: 1, usuario_destino_id: 2, descricao: 'Teste' });
    expect(res).toEqual({ id: 10 });
  });

  it('create com membro_* ids converte para usuario_* ids', async () => {
    service.create.mockResolvedValue({ id: 11 } as any);
    const body = { membro_origem_id: '3', membro_destino_id: '4', descricao: 'Via membro' } as any;
    const res = await controller.create(body);
    expect(service.create).toHaveBeenCalledWith({ usuario_origem_id: 3, usuario_destino_id: 4, descricao: 'Via membro' });
    expect(res).toEqual({ id: 11 });
  });

  it('create sem ids mantém undefined e envia apenas descricao', async () => {
    service.create.mockResolvedValue({ id: 12 } as any);
    const body = { descricao: 'Sem IDs' } as any;
    const res = await controller.create(body);
    expect(service.create).toHaveBeenCalledWith({ usuario_origem_id: undefined, usuario_destino_id: undefined, descricao: 'Sem IDs' });
    expect(res).toEqual({ id: 12 });
  });

  it('create apenas origem com usuario_origem_id string converte e destino undefined', async () => {
    service.create.mockResolvedValue({ id: 13 } as any);
    const body = { usuario_origem_id: '7', descricao: 'Origem apenas' } as any;
    const res = await controller.create(body);
    expect(service.create).toHaveBeenCalledWith({ usuario_origem_id: 7, usuario_destino_id: undefined, descricao: 'Origem apenas' });
    expect(res).toEqual({ id: 13 });
  });

  it('create apenas destino com membro_destino_id número converte e origem undefined', async () => {
    service.create.mockResolvedValue({ id: 14 } as any);
    const body = { membro_destino_id: 8, descricao: 'Destino apenas' } as any;
    const res = await controller.create(body);
    expect(service.create).toHaveBeenCalledWith({ usuario_origem_id: undefined, usuario_destino_id: 8, descricao: 'Destino apenas' });
    expect(res).toEqual({ id: 14 });
  });

  it('create sem descricao mantém descricao undefined', async () => {
    service.create.mockResolvedValue({ id: 15 } as any);
    const body = {} as any;
    const res = await controller.create(body);
    expect(service.create).toHaveBeenCalledWith({ usuario_origem_id: undefined, usuario_destino_id: undefined, descricao: undefined });
    expect(res).toEqual({ id: 15 });
  });

  it('create apenas destino com usuario_destino_id string converte corretamente', async () => {
    service.create.mockResolvedValue({ id: 16 } as any);
    const body = { usuario_destino_id: '12', descricao: 'Destino como string' } as any;
    const res = await controller.create(body);
    expect(service.create).toHaveBeenCalledWith({ usuario_origem_id: undefined, usuario_destino_id: 12, descricao: 'Destino como string' });
    expect(res).toEqual({ id: 16 });
  });

  it('getById retorna registro do service', async () => {
    service.getById.mockResolvedValue({ id: 99 } as any);
    const res = await controller.getById('99');
    expect(service.getById).toHaveBeenCalledWith(99);
    expect(res).toEqual({ id: 99 });
  });

  it('updateStatus com agradecimentos_publicos repassa ambos os campos', async () => {
    service.updateStatus.mockResolvedValue({ id: 5, status: 'fechada', agradecimentos_publicos: 'Obrigado!' } as any);
    const res = await controller.updateStatus('5', { status: 'fechada', agradecimentos_publicos: 'Obrigado!' });
    expect(service.updateStatus).toHaveBeenCalledWith(5, 'fechada', 'Obrigado!');
    expect(res).toEqual({ id: 5, status: 'fechada', agradecimentos_publicos: 'Obrigado!' });
  });

  it('updateStatus sem agradecimentos_publicos repassa undefined', async () => {
    service.updateStatus.mockResolvedValue({ id: 6, status: 'em contato' } as any);
    const res = await controller.updateStatus('6', { status: 'em contato' } as any);
    expect(service.updateStatus).toHaveBeenCalledWith(6, 'em contato', undefined);
    expect(res).toEqual({ id: 6, status: 'em contato' });
  });
});