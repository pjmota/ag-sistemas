import { ReferralsService } from '../modules/referrals/referrals.service';

describe('ReferralsService - branches adicionais', () => {
  let referralModel: any;
  let thanksModel: any;
  let service: ReferralsService;

  beforeEach(() => {
    jest.clearAllMocks();
    referralModel = {
      create: jest.fn(),
      findByPk: jest.fn(),
      findAll: jest.fn(),
      sync: jest.fn(async () => undefined),
    };
    thanksModel = { create: jest.fn() };
    service = new ReferralsService(referralModel, thanksModel);
  });

  it('updateStatus(fechar) com texto registra obrigado via thanksModel', async () => {
    const entity: any = { id: 1, usuario_destino_id: 10, status: 'nova', save: jest.fn(async () => undefined) };
    referralModel.findByPk.mockResolvedValue(entity);
    thanksModel.create.mockResolvedValue({ id: 99 });

    const r = await service.updateStatus(1, 'fechada', ' Valeu! ');
    expect(r.status).toBe('fechada');
    expect(r.agradecimentos_publicos).toBe(' Valeu! ');
    expect(thanksModel.create).toHaveBeenCalledWith({ usuario_id: 10, descricao: 'Valeu!' });
  });

  it('updateStatus(fechar) sem texto não registra obrigado', async () => {
    const entity: any = { id: 2, usuario_destino_id: 11, status: 'nova', save: jest.fn(async () => undefined) };
    referralModel.findByPk.mockResolvedValue(entity);

    const r = await service.updateStatus(2, 'fechada', '   ');
    expect(r.status).toBe('fechada');
    expect(thanksModel.create).not.toHaveBeenCalled();
  });

  it('updateStatus(fechar) falha ao criar obrigado mas não quebra e registra warn', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const entity: any = { id: 3, usuario_destino_id: 12, status: 'nova', save: jest.fn(async () => undefined) };
    referralModel.findByPk.mockResolvedValue(entity);
    thanksModel.create.mockRejectedValue(new Error('falhou obrigado'));

    const r = await service.updateStatus(3, 'fechada', 'obrigado a todos');
    expect(r.status).toBe('fechada');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[ReferralsService] Falha ao registrar obrigado:'), expect.anything());
    warn.mockRestore();
  });

  it('withRetry: primeiro SQLITE_BUSY em listByUserSent e depois sucesso', async () => {
    const rows = [{ id: 1 }];
    const seqCalls: any[] = [
      () => { throw { message: 'SQLITE_BUSY' }; },
      async () => rows,
    ];
    referralModel.findAll.mockImplementation(async (opts: any) => seqCalls.shift()!.call(null));
    const res = await service.listByUserSent(10);
    expect(referralModel.findAll).toHaveBeenCalledTimes(2);
    expect(res).toBe(rows);
  });

  it('withRetry: primeiro no such table em getById sincroniza e depois sucesso', async () => {
    const entity = { id: 77 };
    const seqCalls: any[] = [
      () => { throw { parent: { message: 'no such table: indicacoes' } }; },
      async () => entity,
    ];
    referralModel.findByPk.mockImplementation(async (id: number) => seqCalls.shift()!.call(null));
    const res = await service.getById(77);
    expect(referralModel.sync).toHaveBeenCalledTimes(1);
    expect(res).toBe(entity);
  });
});