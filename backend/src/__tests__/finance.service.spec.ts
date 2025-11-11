import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { AppModule } from '../app.module';
import { Op } from 'sequelize';
import { FinanceService } from '../modules/finance/finance.service';
import { Member } from '../database/models/member.model';
import { User } from '../database/models/user.model';
import { Fee } from '../database/models/fee.model';
import { SchemaInitService } from '../bootstrap/schema-init.service';

describe('FinanceService', () => {
  async function withRetry<T>(action: () => Promise<T>, attempts = 5, delayMs = 100): Promise<T> {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
      try {
        return await action();
      } catch (err: any) {
        const msg = String(err?.parent?.message || err?.message || '');
        const isBusy = msg.includes('SQLITE_BUSY') || msg.includes('SQLITE_LOCKED') || err?.name === 'SequelizeTimeoutError';
        const noTable = msg.includes('no such table');
        if (noTable) {
          // Tenta sincronizar tabelas que podem estar ausentes em ambientes in-memory
          try { await Member.sync(); } catch {}
          try { await User.sync(); } catch {}
          try { await Fee.sync(); } catch {}
        }
        if (!isBusy && !noTable || i === attempts - 1) {
          throw err;
        }
        await new Promise(r => setTimeout(r, delayMs));
        lastErr = err;
      }
    }
    throw lastErr;
  }

  async function findOrCreateMember(email: string, data: { nome: string; email: string; status: 'ativo' | 'pendente' | 'recusado' }) {
    const found = await withRetry(() => Member.findOne({ where: { email } }));
    if (found) return found;
    return withRetry(() => Member.create(data as any));
  }

  async function findOrCreateUserByEmail(email: string, defaults: { nome?: string; role: 'membro' | 'admin'; senha_hash: string }) {
    const found = await withRetry(() => User.findOne({ where: { email } }));
    if (found) return found;
    return withRetry(() => User.create({ email, ...defaults } as any));
  }
  let app: INestApplication;
  let sequelize: Sequelize;
  let service: FinanceService;

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    // Inicializa a aplicação primeiro para registrar modelos
    await app.init();
    // Em seguida sincroniza o schema para garantir as tabelas antes do uso
    sequelize = app.get(Sequelize);
    await sequelize.sync({ force: true });
    // Garantia adicional: sincroniza explicitamente modelos usados e aplica migrações internas
    await Member.sync();
    await User.sync();
    await Fee.sync();
    await app.get(SchemaInitService).onModuleInit();

    service = app.get(FinanceService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('cria plano, associa membros e gera mensalidades do mês', async () => {
    // cria membros ativos
    const m1 = await Member.create({ nome: 'João Silva', email: 'joao.finance@exemplo.com', status: 'ativo' } as any);
    const m2 = await Member.create({ nome: 'Maria Lima', email: 'maria.finance@exemplo.com', status: 'ativo' } as any);
    const u1 = await User.create({ email: m1.email, senha_hash: 'hash', role: 'membro', nome: m1.nome } as any);
    const u2 = await User.create({ email: m2.email, senha_hash: 'hash', role: 'membro', nome: m2.nome } as any);

    // cria plano e associa
    const plano = await service.createPlan({ nome: 'Plano Mensal - Service', valor: 100.0, dia_vencimento_padrao: 10 });
    await service.assignPlan({ usuario_id: u1.id, plano_id: plano.id });
    await service.assignPlan({ usuario_id: u2.id, plano_id: plano.id });

    const res = await service.generateMonthlyFees({ month: 11, year: 2025 });
    expect(res.created).toBeGreaterThanOrEqual(2);

    const list = await service.listFees({ month: 11, year: 2025 });
    const own = list.filter(f => [u1.id, u2.id].includes((f as any).usuario_id));
    expect(own.length).toBe(2);
    expect(own[0].status).toBe('pendente');
    expect(Number(own[0].valor)).toBe(100);
  });

  it('marca como pago e calcula totais do mês', async () => {
    // Garantir ambiente limpo para o mês/ano alvo
    const start = new Date(2030, 1, 1); // 01/02/2030
    const end = new Date(2030, 2, 0);   // último dia de 02/2030
    await Fee.destroy({ where: { vencimento: { [Op.between]: [start, end] } } });

    // usa um mês/ano isolados para evitar interferência de outras suítes
    await service.generateMonthlyFees({ month: 2, year: 2030 });
    const fees = await service.listFees({ month: 2, year: 2030 });
    expect(fees.length).toBeGreaterThanOrEqual(2);

    await service.markPaid(fees[0].id);
    const totals = await service.totals(2, 2030);
    const recebidoEsperado = Number(fees[0].valor);
    const pendenteEsperado = fees.slice(1).reduce((sum, f) => sum + Number(f.valor), 0);
    expect(totals.totalRecebido).toBe(recebidoEsperado);
    expect(totals.totalPendente).toBe(pendenteEsperado);
  });

  it('atualiza automaticamente para atrasado quando vencido e pendente', async () => {
    // cria uma mensalidade pendente vencida
    let joao = await Member.findOne({ where: { email: 'joao.finance@exemplo.com' } });
    if (!joao) {
      joao = await Member.create({ nome: 'João Silva', email: 'joao.finance@exemplo.com', status: 'ativo' } as any);
    }
    let uJoao = await User.findOne({ where: { email: 'joao.finance@exemplo.com' } });
    if (!uJoao) {
      uJoao = await User.create({ email: joao.email, senha_hash: 'hash', role: 'membro', nome: joao.nome } as any);
    }
    const vencida = await (async () => {
      // helper com retry para contornar SQLITE_BUSY em ambientes in-memory
      for (let i = 0; i < 5; i++) {
        try {
          return await Fee.create({
            usuario_id: uJoao!.id,
            valor: 100,
            vencimento: new Date(2025, 9, 10), // 10/10/2025
            status: 'pendente',
          } as any);
        } catch (e: any) {
          const msg = String(e?.parent?.message || e?.message || '');
          if (msg.includes('SQLITE_BUSY') || e?.name === 'SequelizeTimeoutError') {
            await new Promise(res => setTimeout(res, 100));
            continue;
          }
          throw e;
        }
      }
      throw new Error('Falha ao criar mensalidade vencida após retries');
    })();

    const res = await service.autoUpdateOverdue();
    expect(res.updated).toBeGreaterThanOrEqual(1);

    const updated = await Fee.findByPk(vencida.id);
    expect(updated!.status).toBe('atrasado');
  });

  it('filtra por membro e por status', async () => {
    let maria = await Member.findOne({ where: { email: 'maria.finance@exemplo.com' } });
    if (!maria) {
      maria = await Member.create({ nome: 'Maria Lima', email: 'maria.finance@exemplo.com', status: 'ativo' } as any);
    }
    let uMaria = await User.findOne({ where: { email: 'maria.finance@exemplo.com' } });
    if (!uMaria) {
      uMaria = await User.create({ email: maria.email, senha_hash: 'hash', role: 'membro', nome: maria.nome } as any);
    }
    // Garante pelo menos uma mensalidade pendente para Maria de forma determinística
    const targetMonth = 12;
    const targetYear = 2033;
    let pendentesMaria = await service.listFees({ usuario_id: uMaria.id, status: 'pendente', month: targetMonth, year: targetYear });
    if (pendentesMaria.length === 0) {
      const plano = await service.createPlan({ nome: `Plano-Maria-${Date.now()}`, valor: 100.0, dia_vencimento_padrao: 10 });
      await service.assignPlan({ usuario_id: uMaria.id, plano_id: plano.id });
      await service.generateMonthlyFees({ month: targetMonth, year: targetYear });
      pendentesMaria = await service.listFees({ usuario_id: uMaria.id, status: 'pendente', month: targetMonth, year: targetYear });
    }
    expect(pendentesMaria.length).toBeGreaterThan(0);
    expect(pendentesMaria.every(f => (f as any).usuario_id === uMaria!.id && f.status === 'pendente')).toBe(true);
  });

  it('não gera mensalidade para membro sem plano e evita duplicidade', async () => {
    const semPlano = await (async () => {
      for (let i = 0; i < 5; i++) {
        try {
          return await Member.create({ nome: 'Sem Plano', email: 'semplano@exemplo.com', status: 'ativo' } as any);
        } catch (e: any) {
          const msg = String(e?.parent?.message || e?.message || '');
          if (msg.includes('no such table')) {
            try { await Member.sync(); } catch {}
          }
          if (msg.includes('SQLITE_BUSY') || msg.includes('SQLITE_LOCKED') || e?.name === 'SequelizeTimeoutError' || msg.includes('no such table')) {
            await new Promise(res => setTimeout(res, 100));
            continue;
          }
          throw e;
        }
      }
      throw new Error('Falha ao criar membro sem plano após retries');
    })();
    // Usa mês/ano isolados para evitar interferência de associações criadas em outros testes
    const month = 7;
    const year = 2045;
    // Primeira geração cria para todas associações atuais
    await service.generateMonthlyFees({ month, year });
    const before = await service.listFees({ month, year });
    // Segunda geração não deve criar duplicatas
    const res = await service.generateMonthlyFees({ month, year });
    expect(res.created).toBe(0); // sem plano é ignorado e duplicidade evitada
    const after = await service.listFees({ month, year });
    expect(after.length).toBe(before.length);
    // garantir que nenhum registro foi criado para semPlano
    const uSemPlano = await User.findOne({ where: { email: 'semplano@exemplo.com' } });
    const doSemPlano = after.filter(f => (f as any).usuario_id === uSemPlano?.id);
    expect(doSemPlano.length).toBe(0);
  });

  it('updateStatus com observação e pagar ajusta data_pagamento', async () => {
    let fees = await service.listFees({ month: 11, year: 2025, status: 'pendente' });
    if (fees.length === 0) {
      // Caso todas tenham virado 'atrasado' por depender da data atual, pega quaisquer do mês
      fees = await service.listFees({ month: 11, year: 2025 });
      if (fees.length === 0) {
        // Como último recurso, garante pelo menos um usuário com plano e gera mensalidades
        let joao = await Member.findOne({ where: { email: 'joao.finance@exemplo.com' } });
        if (!joao) {
          joao = await Member.create({ nome: 'João Silva', email: 'joao.finance@exemplo.com', status: 'ativo' } as any);
        }
        let uJoao = await User.findOne({ where: { email: 'joao.finance@exemplo.com' } });
        if (!uJoao) {
          uJoao = await User.create({ email: joao.email, senha_hash: 'hash', role: 'membro', nome: joao.nome } as any);
        }
        const plano = await service.createPlan({ nome: `Plano-Update-${Date.now()}`, valor: 100.0, dia_vencimento_padrao: 10 });
        await service.assignPlan({ usuario_id: uJoao!.id, plano_id: plano.id });
        await service.generateMonthlyFees({ month: 11, year: 2025 });
        fees = await service.listFees({ month: 11, year: 2025 });
      }
    }
    const alvo = fees[0]!;
    const updated = await service.updateStatus(alvo.id, 'pago', 'confirmado manualmente');
    expect(updated.status).toBe('pago');
    expect(updated.data_pagamento).toBeTruthy();
    expect(updated.observacao).toContain('confirmado');
  });

  it('notifyLate sem atraso apenas registra observação', async () => {
    let maria = await Member.findOne({ where: { email: 'maria.finance@exemplo.com' } });
    if (!maria) {
      maria = await Member.create({ nome: 'Maria Lima', email: 'maria.finance@exemplo.com', status: 'ativo' } as any);
    }
    let uMaria2 = await User.findOne({ where: { email: 'maria.finance@exemplo.com' } });
    if (!uMaria2) {
      uMaria2 = await User.create({ email: maria.email, senha_hash: 'hash', role: 'membro', nome: maria.nome } as any);
    }
    const futura = await (async () => {
      for (let i = 0; i < 5; i++) {
        try {
          return await Fee.create({
            usuario_id: uMaria2!.id,
            valor: 100,
            vencimento: new Date(2025, 11, 10), // 10/12/2025
            status: 'pendente',
          } as any);
        } catch (e: any) {
          const msg = String(e?.parent?.message || e?.message || '');
          if (msg.includes('SQLITE_BUSY') || e?.name === 'SequelizeTimeoutError') {
            await new Promise(res => setTimeout(res, 100));
            continue;
          }
          throw e;
        }
      }
      throw new Error('Falha ao criar mensalidade futura após retries');
    })();
    const res = await service.notifyLate(futura.id);
    expect(res.status).toBe('pendente');
    expect(res.observacao).toContain('notificado atraso');
  });

  it('updateUsuario aceita null e mantém consistência', async () => {
    const anyFee = (await service.listFees({}))[0];
    const updated = await service.updateUsuario(anyFee.id, null);
    expect(updated.usuario_id).toBeNull();
  });

  it('autoUpdateOverdue não altera mensalidade futura pendente', async () => {
    const uCarlos = await User.create({ email: 'carlos.branch@example.com', senha_hash: 'hash', role: 'membro', nome: 'Carlos Branch' } as any);
    const futura = await (async () => {
      for (let i = 0; i < 5; i++) {
        try {
          return await Fee.create({
            usuario_id: uCarlos.id,
            valor: 99.9,
            vencimento: new Date(Date.now() + 30 * 24 * 3600 * 1000),
            status: 'pendente',
          } as any);
        } catch (e: any) {
          const msg = String(e?.parent?.message || e?.message || '');
          if (msg.includes('SQLITE_BUSY') || e?.name === 'SequelizeTimeoutError') {
            await new Promise(res => setTimeout(res, 100));
            continue;
          }
          throw e;
        }
      }
      throw new Error('Falha ao criar mensalidade futura após retries');
    })();
    await service.autoUpdateOverdue();
    const reload = await Fee.findByPk(futura.id);
    expect(reload!.status).toBe('pendente');
  });

  it('cancel altera status e opcionalmente adiciona observação', async () => {
    const fee = (await service.listFees({}))[0];
    const canceladoComObs = await service.cancel(fee.id, 'cancelado por teste');
    expect(canceladoComObs.status).toBe('cancelado');
    expect(canceladoComObs.observacao || '').toContain('teste');

    const fee2 = (await service.listFees({}))[1] || (await service.listFees({}))[0];
    const canceladoSemObs = await service.cancel(fee2.id);
    expect(canceladoSemObs.status).toBe('cancelado');
  });

  it('cancelar mensalidade define status cancelado', async () => {
    const joao = await findOrCreateMember('joao.finance@exemplo.com', { nome: 'João Silva', email: 'joao.finance@exemplo.com', status: 'ativo' });
    const uJoao2 = await findOrCreateUserByEmail(joao.email, { senha_hash: 'hash', role: 'membro', nome: joao.nome });
    const fee = await (async () => {
      // Retry para contornar travas SQLITE_BUSY/LOCKED em inserts
      for (let i = 0; i < 5; i++) {
        try {
          return await Fee.create({
            usuario_id: uJoao2!.id,
            valor: 100,
            vencimento: new Date(2025, 10, 5),
            status: 'pendente',
          } as any);
        } catch (e: any) {
          const msg = String(e?.parent?.message || e?.message || '');
          if (msg.includes('SQLITE_BUSY') || msg.includes('SQLITE_LOCKED') || e?.name === 'SequelizeTimeoutError') {
            await new Promise(res => setTimeout(res, 100));
            continue;
          }
          throw e;
        }
      }
      throw new Error('Falha ao criar mensalidade após retries');
    })();
    const res = await service.cancel(fee.id, 'cancelada por teste');
    expect(res.status).toBe('cancelado');
    expect(res.observacao).toContain('cancelada');
  });
});