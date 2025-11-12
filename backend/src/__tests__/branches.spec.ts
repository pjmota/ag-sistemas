import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { AppModule } from '../app.module';
import { FinanceService } from '../modules/finance/finance.service';
import { ReferralsService } from '../modules/referrals/referrals.service';
import { User } from '../database/models/user.model';
import { Plan } from '../database/models/plan.model';
import { MemberPlan } from '../database/models/member-plan.model';
import { SchemaInitService } from '../bootstrap/schema-init.service';

// Aumenta o timeout global deste arquivo para evitar falhas intermitentes no setup
jest.setTimeout(30000);

describe('Cobertura de Branches', () => {
  let app: INestApplication;
  let sequelize: Sequelize;
  let finance: FinanceService;
  let referrals: ReferralsService;
  let u1: User;
  let u2: User;
  let planoBasico: Plan;

  // sem helpers extras: usaremos mensalidades existentes e atualizaremos vencimentos nos próprios registros

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    sequelize = app.get(Sequelize);
    // Garante schema sincronizado e migrações internas antes dos inserts
    await sequelize.sync({ force: true });
    // Garantia adicional: sincroniza explicitamente tabelas usadas neste teste
    await Plan.sync();
    await MemberPlan.sync();
    // Sincroniza também a tabela de indicações para evitar erros de INSERT
    const { Referral } = require('../database/models/referral.model');
    await Referral.sync();
    await app.get(SchemaInitService).onModuleInit();

    finance = app.get(FinanceService);
    referrals = app.get(ReferralsService);

    const createUserWithRetry = async (data: { nome: string; email: string; senha_hash: string; role: string }) => {
      for (let i = 0; i < 5; i++) {
        try {
          return await User.create(data as any);
        } catch (e: any) {
          const msg = String(e?.parent?.message || e?.message || '');
          if (msg.includes('no such table')) {
            try { await User.sync(); } catch {}
          }
          if (msg.includes('SQLITE_BUSY') || msg.includes('SQLITE_LOCKED') || e?.name === 'SequelizeTimeoutError' || msg.includes('no such table')) {
            await new Promise(res => setTimeout(res, 100));
            continue;
          }
          throw e;
        }
      }
      throw new Error('Falha ao criar usuário após retries');
    };
    u1 = await createUserWithRetry({ nome: 'Ana Branch', email: 'ana.branch@example.com', senha_hash: 'hash', role: 'membro' } as any);
    u2 = await createUserWithRetry({ nome: 'Beto Branch', email: 'beto.branch@example.com', senha_hash: 'hash', role: 'membro' } as any);
    const createPlanWithRetry = async (data: { nome: string; valor: number; dia_vencimento_padrao?: number }) => {
      for (let i = 0; i < 5; i++) {
        try {
          return await Plan.create(data as any);
        } catch (e: any) {
          const msg = String(e?.parent?.message || e?.message || '');
          if (msg.includes('no such table')) {
            try { await Plan.sync(); } catch {}
          }
          if (msg.includes('SQLITE_BUSY') || msg.includes('SQLITE_LOCKED') || e?.name === 'SequelizeTimeoutError' || msg.includes('no such table')) {
            await new Promise(res => setTimeout(res, 100));
            continue;
          }
          throw e;
        }
      }
      throw new Error('Falha ao criar plano após retries');
    };
    planoBasico = await createPlanWithRetry({ nome: 'Basico', valor: 123.45 });
    const createMemberPlanWithRetry = async (data: { usuario_id: number; plano_id: number; data_inicio: Date }) => {
      for (let i = 0; i < 5; i++) {
        try {
          return await MemberPlan.create(data as any);
        } catch (e: any) {
          const msg = String(e?.parent?.message || e?.message || '');
          if (msg.includes('no such table')) {
            try { await MemberPlan.sync(); } catch {}
          }
          if (msg.includes('SQLITE_BUSY') || msg.includes('SQLITE_LOCKED') || e?.name === 'SequelizeTimeoutError' || msg.includes('no such table')) {
            await new Promise(res => setTimeout(res, 100));
            continue;
          }
          throw e;
        }
      }
      throw new Error('Falha ao criar associação de plano após retries');
    };
    await createMemberPlanWithRetry({ usuario_id: u1.id, plano_id: planoBasico.id, data_inicio: new Date(2031, 10, 1) });
    await createMemberPlanWithRetry({ usuario_id: u2.id, plano_id: planoBasico.id, data_inicio: new Date(2031, 10, 1) });

    await finance.generateMonthlyFees({ month: 12, year: 2031 } as any);
  });

  afterAll(async () => {
    await app.close();
  });

  it('listFees cobre branches de filtros: none, por mês/ano, por usuário, por status', async () => {
    const todos = await finance.listFees({});
    expect(Array.isArray(todos)).toBe(true);

    const porMesAno = await finance.listFees({ month: 12, year: 2031 });
    expect(porMesAno.length).toBeGreaterThan(0);

    const porUsuario = await finance.listFees({ usuario_id: u1.id });
    expect(porUsuario.every(f => f.usuario_id === u1.id)).toBe(true);

    const pendentes = await finance.listFees({ status: 'pendente', month: 12, year: 2031 });
    expect(pendentes.length).toBeGreaterThan(0);
  });

  it('listFees cobre branch de enriquecimento com erro silencioso', async () => {
    const spy = jest.spyOn(User, 'findAll').mockImplementation(async () => {
      throw new Error('falha simulada');
    });
    const res = await finance.listFees({ usuario_id: u1.id });
    expect(Array.isArray(res)).toBe(true);
    spy.mockRestore();
  });

  it('updateStatus cobre branch com e sem observacao', async () => {
    const fee = (await finance.listFees({ usuario_id: u1.id }))[0];
    const atualizado = await finance.updateStatus(fee.id, 'pago');
    expect(atualizado.status).toBe('pago');

    const fee2 = (await finance.listFees({ usuario_id: u2.id }))[0];
    const atualizado2 = await finance.updateStatus(fee2.id, 'cancelado', 'motivo teste');
    expect(atualizado2.status).toBe('cancelado');
    expect(atualizado2.observacao).toContain('motivo');
  });

  it('notifyLate cobre branches: atraso e sem atraso', async () => {
    // sem atraso: pegue uma mensalidade e ajuste vencimento para futuro
    const feeFuturo = (await finance.listFees({ usuario_id: u1.id }))[0];
    await (feeFuturo as any).update({ vencimento: new Date(Date.now() + 30 * 24 * 3600 * 1000), status: 'pendente' });
    const r1 = await finance.notifyLate(feeFuturo.id);
    expect(r1.observacao || '').toContain('notificado atraso');
    expect(r1.status).toBe('pendente');

    // com atraso: pegue outra mensalidade e ajuste vencimento para passado
    const feePassado = (await finance.listFees({ usuario_id: u2.id }))[0];
    await (feePassado as any).update({ vencimento: new Date(Date.now() - 30 * 24 * 3600 * 1000), status: 'pendente' });
    const r2 = await finance.notifyLate(feePassado.id);
    expect(r2.status).toBe('atrasado');
  });

  it('sendReminder cobre branch de anotação', async () => {
    const any = await finance.listFees({});
    const fee = any[0];
    expect(fee).toBeTruthy();
    const r = await finance.sendReminder(fee.id);
    expect(r.observacao || '').toContain('lembrete enviado');
  });

  it('ReferralsService.updateStatus cobre com e sem agradecimentos_publicos', async () => {
    const indicacao = await referrals.create({ usuario_origem_id: u1.id, usuario_destino_id: u2.id, descricao: 'Teste branch' } as any);
    const s1 = await referrals.updateStatus(indicacao.id, 'em contato');
    expect(s1.status).toBe('em contato');
    expect(s1.agradecimentos_publicos).toBeNull();

    const s2 = await referrals.updateStatus(indicacao.id, 'fechada', 'Obrigado a todos!');
    expect(s2.status).toBe('fechada');
    expect(s2.agradecimentos_publicos).toContain('Obrigado');
  });
});