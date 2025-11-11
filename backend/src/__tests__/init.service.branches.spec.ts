import { InitService } from '../bootstrap/init.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(async () => 'hashpadrao'),
}));

describe('InitService - branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeService(findOrCreateImpl: () => Promise<any>) {
    const userModel: any = { findOrCreate: jest.fn(findOrCreateImpl) };
    const service = new InitService(userModel);
    return { service, userModel };
  }

  it('cria usuário admin quando inexistente', async () => {
    const createdUser = { id: 1, email: 'admin@exemplo.com' };
    const { service, userModel } = makeService(async () => [createdUser, true]);
    await service.onModuleInit();
    expect(userModel.findOrCreate).toHaveBeenCalledWith({
      where: { email: 'admin@exemplo.com' },
      defaults: expect.objectContaining({ email: 'admin@exemplo.com', senha_hash: 'hashpadrao', role: 'admin' }),
    });
  });

  it('atualiza usuário admin existente com senha padrão', async () => {
    const save = jest.fn(async () => undefined);
    const existing = { id: 2, email: 'admin@exemplo.com', save } as any;
    const { service } = makeService(async () => [existing, false]);
    await service.onModuleInit();
    expect(existing.role).toBe('admin');
    expect(typeof existing.senha_hash).toBe('string');
    expect(save).toHaveBeenCalled();
  });

  it('ignora erros esperados: tabela ausente ou unicidade', async () => {
    const { service, userModel } = makeService(async () => {
      throw { parent: { message: 'no such table: usuarios' } };
    });
    await service.onModuleInit();
    expect(userModel.findOrCreate).toHaveBeenCalled();
  });

  it('tenta novamente em SQLITE_BUSY e conclui criação', async () => {
    const createdUser = { id: 3, email: 'admin@exemplo.com' };
    const seqCalls: any[] = [
      () => { throw { parent: { message: 'SQLITE_BUSY' } }; },
      async () => [createdUser, true],
    ];
    const { service, userModel } = makeService(async () => seqCalls.shift()!.call(null));
    await service.onModuleInit();
    expect(userModel.findOrCreate).toHaveBeenCalledTimes(2);
  });

  it('tenta novamente em SequelizeTimeoutError e conclui', async () => {
    const createdUser = { id: 4, email: 'admin@exemplo.com' };
    const seqCalls: any[] = [
      () => { throw { name: 'SequelizeTimeoutError' }; },
      async () => [createdUser, true],
    ];
    const { service, userModel } = makeService(async () => seqCalls.shift()!.call(null));
    await service.onModuleInit();
    expect(userModel.findOrCreate).toHaveBeenCalledTimes(2);
  });

  it('ignora SequelizeUniqueConstraintError e retorna', async () => {
    const { service, userModel } = makeService(async () => { throw { name: 'SequelizeUniqueConstraintError' }; });
    await service.onModuleInit();
    expect(userModel.findOrCreate).toHaveBeenCalled();
  });

  it('erro não esperado registra console.error e retorna', async () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { service } = makeService(async () => { throw { name: 'OutraFalha', message: 'falhou geral' }; });
    await service.onModuleInit();
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('[InitService] Falha ao inicializar usuário admin:'), expect.anything());
    errSpy.mockRestore();
  });
});