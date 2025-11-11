import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { AppModule } from '../app.module';
import { FinanceController } from '../modules/finance/finance.controller';
import { Member } from '../database/models/member.model';
import { User } from '../database/models/user.model';
import { Fee } from '../database/models/fee.model';

describe('FinanceController', () => {
  let app: INestApplication;
  let sequelize: Sequelize;
  let controller: FinanceController;
  let joaoUserId: number;
  let mariaUserId: number;
  let planoId: number;

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    sequelize = app.get(Sequelize);
    await sequelize.sync({ force: true });

    controller = app.get(FinanceController);

    const joao = await Member.create({ nome: 'João Silva', email: 'joao.controller@exemplo.com', status: 'ativo' } as any);
    const maria = await Member.create({ nome: 'Maria Lima', email: 'maria.controller@exemplo.com', status: 'ativo' } as any);
    const joaoUser = await User.create({ email: joao.email, senha_hash: 'hash', role: 'membro', nome: joao.nome } as any);
    const mariaUser = await User.create({ email: maria.email, senha_hash: 'hash', role: 'membro', nome: maria.nome } as any);
    joaoUserId = joaoUser.id;
    mariaUserId = mariaUser.id;

    const plano = await controller.createPlan({ nome: 'Plano Mensal', valor: 100, dia_vencimento_padrao: 10 });
    planoId = (plano as any).id;

    await controller.assignPlan({ usuario_id: joaoUserId, plano_id: planoId });
    await controller.assignPlan({ usuario_id: mariaUserId, plano_id: planoId });
  });

  afterAll(async () => {
    await app.close();
  });

  it('gera mensalidades e lista com filtros por mês/ano', async () => {
    const gen = await controller.generate({ month: 11, year: 2025 });
    expect((gen as any).created).toBeGreaterThanOrEqual(2);

    const list = await controller.list(undefined, '11', '2025', undefined);
    expect(Array.isArray(list)).toBe(true);
    expect((list as any[]).length).toBeGreaterThanOrEqual(2);
  });

  it('lista com status e com usuario_id exercita ramos de parsing', async () => {
    const pendentes = await controller.list('pendente', undefined, undefined, undefined);
    expect(Array.isArray(pendentes)).toBe(true);
    expect((pendentes as any[]).every(f => f.status === 'pendente')).toBe(true);

    const doJoao = await controller.list(undefined, undefined, undefined, String(joaoUserId));
    expect(Array.isArray(doJoao)).toBe(true);
    expect((doJoao as any[]).every(f => f.usuario_id === joaoUserId)).toBe(true);
  });

  it('atualiza status via controller e marca como pago', async () => {
    let pendentes = await controller.list('pendente', '11', '2025', String(joaoUserId));
    if ((pendentes as any[]).length === 0) {
      // garante um alvo pendente caso outros testes tenham alterado estado
      const novo = await (async () => {
        for (let i = 0; i < 5; i++) {
          try {
            return await Fee.create({ usuario_id: joaoUserId, valor: 100, vencimento: new Date(2025, 10, 10), status: 'pendente' } as any);
          } catch (e: any) {
            const msg = String(e?.parent?.message || e?.message || '');
            if (msg.includes('no such table')) {
              await Fee.sync();
              await new Promise(res => setTimeout(res, 50));
              continue;
            }
            if (msg.includes('SQLITE_BUSY') || msg.includes('SQLITE_LOCKED') || e?.name === 'SequelizeTimeoutError') {
              await new Promise(res => setTimeout(res, 100));
              continue;
            }
            throw e;
          }
        }
        throw new Error('Falha ao criar mensalidade pendente para updateStatus após retries');
      })();
      pendentes = [novo];
    }
    const alvo = (pendentes as any[])[0];
    const atualizado = await controller.updateStatus(String(alvo.id), { status: 'pago', observacao: 'via controller' });
    expect((atualizado as any).status).toBe('pago');
    expect((atualizado as any).data_pagamento).toBeTruthy();

    // marca pago novamente com data explícita
    const outra = await controller.markPaid(String(alvo.id), { data_pagamento: new Date(2025, 10, 11) });
    expect((outra as any).status).toBe('pago');
  });

  it('cancela mensalidade e calcula totais', async () => {
    // cria uma mensalidade adicional pendente para cancelar
    const extra = await (async () => {
      for (let i = 0; i < 5; i++) {
        try {
          return await Fee.create({ usuario_id: joaoUserId, valor: 100, vencimento: new Date(2025, 10, 15), status: 'pendente' } as any);
        } catch (e: any) {
          const msg = String(e?.parent?.message || e?.message || '');
          if (msg.includes('no such table')) {
            await Fee.sync();
            await new Promise(res => setTimeout(res, 50));
            continue;
          }
          if (msg.includes('SQLITE_BUSY') || msg.includes('SQLITE_LOCKED') || e?.name === 'SequelizeTimeoutError') {
            await new Promise(res => setTimeout(res, 100));
            continue;
          }
          throw e;
        }
      }
      throw new Error('Falha ao criar mensalidade extra para cancelamento após retries');
    })();
    const cancelada = await controller.cancel(String(extra.id), { observacao: 'cancelada controller' });
    expect((cancelada as any).status).toBe('cancelado');

    const totais = await controller.totals('11', '2025');
    expect((totais as any).totalRecebido).toBeGreaterThanOrEqual(100);
    expect((totais as any).totalPendente).toBeGreaterThanOrEqual(0);
  });
});