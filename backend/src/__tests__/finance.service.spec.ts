import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { AppModule } from '../app.module';
import { Op } from 'sequelize';
import { FinanceService } from '../modules/finance/finance.service';
import { Member } from '../database/models/member.model';
import { User } from '../database/models/user.model';
import { Fee } from '../database/models/fee.model';

describe('FinanceService', () => {
  let app: INestApplication;
  let sequelize: Sequelize;
  let service: FinanceService;

  beforeAll(async () => {
    process.env.DB_PATH = ':memory:';
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    // Sincroniza o schema ANTES de inicializar a aplicação para evitar falhas em onModuleInit
    sequelize = app.get(Sequelize);
    await sequelize.sync({ force: true });
    await app.init();

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
    expect(res.created).toBe(2);

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
    expect(totals.totalRecebido).toBe(100);
    expect(totals.totalPendente).toBe(100);
  });

  it('atualiza automaticamente para atrasado quando vencido e pendente', async () => {
    // cria uma mensalidade pendente vencida
    const joao = await Member.findOne({ where: { email: 'joao.finance@exemplo.com' } });
    const uJoao = await User.findOne({ where: { email: 'joao.finance@exemplo.com' } });
    expect(joao).toBeTruthy();
    const vencida = await Fee.create({
      usuario_id: uJoao!.id,
      valor: 100,
      vencimento: new Date(2025, 9, 10), // 10/10/2025
      status: 'pendente',
    } as any);

    const res = await service.autoUpdateOverdue();
    expect(res.updated).toBeGreaterThanOrEqual(1);

    const updated = await Fee.findByPk(vencida.id);
    expect(updated!.status).toBe('atrasado');
  });

  it('filtra por membro e por status', async () => {
    const maria = await Member.findOne({ where: { email: 'maria.finance@exemplo.com' } });
    const uMaria = await User.findOne({ where: { email: 'maria.finance@exemplo.com' } });
    expect(maria).toBeTruthy();
    const pendentesMaria = await service.listFees({ usuario_id: uMaria!.id, status: 'pendente' });
    expect(pendentesMaria.every(f => (f as any).usuario_id === uMaria!.id && f.status === 'pendente')).toBe(true);
  });

  it('não gera mensalidade para membro sem plano e evita duplicidade', async () => {
    const semPlano = await Member.create({ nome: 'Sem Plano', email: 'semplano@exemplo.com', status: 'ativo' } as any);
    const before = await service.listFees({ month: 11, year: 2025 });
    const res = await service.generateMonthlyFees({ month: 11, year: 2025 });
    expect(res.created).toBe(0); // já geradas anteriormente; sem plano é ignorado
    const after = await service.listFees({ month: 11, year: 2025 });
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
        // Como último recurso, regenera e lista novamente
        await service.generateMonthlyFees({ month: 11, year: 2025 });
        fees = await service.listFees({ month: 11, year: 2025 });
      }
    }
    const alvo = fees[0];
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
    const futura = await Fee.create({
      usuario_id: uMaria2!.id,
      valor: 100,
      vencimento: new Date(2025, 11, 10), // 10/12/2025
      status: 'pendente',
    } as any);
    const res = await service.notifyLate(futura.id);
    expect(res.status).toBe('pendente');
    expect(res.observacao).toContain('notificado atraso');
  });

  it('cancelar mensalidade define status cancelado', async () => {
    let joao = await Member.findOne({ where: { email: 'joao.finance@exemplo.com' } });
    if (!joao) {
      joao = await Member.create({ nome: 'João Silva', email: 'joao.finance@exemplo.com', status: 'ativo' } as any);
    }
    let uJoao2 = await User.findOne({ where: { email: 'joao.finance@exemplo.com' } });
    if (!uJoao2) {
      uJoao2 = await User.create({ email: joao.email, senha_hash: 'hash', role: 'membro', nome: joao.nome } as any);
    }
    const fee = await Fee.create({
      usuario_id: uJoao2!.id,
      valor: 100,
      vencimento: new Date(2025, 10, 5),
      status: 'pendente',
    } as any);
    const res = await service.cancel(fee.id, 'cancelada por teste');
    expect(res.status).toBe('cancelado');
    expect(res.observacao).toContain('cancelada');
  });
});