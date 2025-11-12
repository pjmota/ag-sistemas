import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Plan } from '../../database/models/plan.model';
import { MemberPlan } from '../../database/models/member-plan.model';
import { Fee, FeeStatus } from '../../database/models/fee.model';
import { Member } from '../../database/models/member.model';
import { User } from '../../database/models/user.model';
import { Op } from 'sequelize';

type GenerateParams = { month: number; year: number; usuario_id?: number };

@Injectable()
export class FinanceService {
  constructor(
    @InjectModel(Plan) private planModel: typeof Plan,
    @InjectModel(MemberPlan) private memberPlanModel: typeof MemberPlan,
    @InjectModel(Fee) private feeModel: typeof Fee,
    @InjectModel(Member) private memberModel: typeof Member,
    @InjectModel(User) private userModel: typeof User,
  ) {}

  private async withRetry<T>(action: () => Promise<T>, attempts = 5, delayMs = 100): Promise<T> {
    let lastErr: any;
    for (let i = 0; i < attempts; i++) {
      try {
        return await action();
      } catch (err: any) {
        const msg = String(err?.parent?.message || err?.message || '');
        const isBusy = msg.includes('SQLITE_BUSY') || msg.includes('SQLITE_LOCKED') || msg.includes('SequelizeTimeoutError');
        const isReadonly = msg.includes('SQLITE_READONLY') || msg.includes('readonly database');
        const noTable = msg.includes('no such table');
        // Em ambientes in-memory, tente sincronizar tabelas ausentes
        if (noTable) {
          try { await this.feeModel.sync(); } catch {}
          try { await this.userModel.sync(); } catch {}
          try { await this.planModel.sync(); } catch {}
          try { await this.memberPlanModel.sync(); } catch {}
        }
        if ((!isBusy && !noTable && !isReadonly) || i === attempts - 1) {
          throw err;
        }
        await new Promise(r => setTimeout(r, delayMs));
        lastErr = err;
      }
    }
    throw lastErr;
  }

  async createPlan(data: { nome: string; valor: number; dia_vencimento_padrao?: number }) {
    const dia = typeof data.dia_vencimento_padrao === 'number' ? data.dia_vencimento_padrao : 10;
    return this.planModel.create({ nome: data.nome, valor: data.valor, dia_vencimento_padrao: dia, periodicidade: 'mensal', ativo: true } as any);
  }

  async listPlans() {
    return this.withRetry(() => this.planModel.findAll());
  }

  async updatePlanActive(id: number, ativo: boolean) {
    const p = await this.withRetry(() => this.planModel.findByPk(id));
    if (!p) throw new NotFoundException('Plano não encontrado');
    p.ativo = !!ativo;
    await this.withRetry(() => p.save());
    return p;
  }

  async assignPlan(data: { usuario_id: number; plano_id: number; data_inicio?: Date }) {
    const inicio = data.data_inicio ?? new Date();
    return this.withRetry(() => this.memberPlanModel.create({ usuario_id: data.usuario_id, plano_id: data.plano_id, data_inicio: inicio } as any));
  }

  async generateMonthlyFees({ month, year, usuario_id }: GenerateParams) {
    // Gera mensalidades diretamente a partir das associações de plano (usuario_planos),
    // evitando depender do estado da tabela de membros.
    const associations = await this.withRetry(() =>
      typeof usuario_id === 'number'
        ? this.memberPlanModel.findAll({ where: { usuario_id } })
        : this.memberPlanModel.findAll()
    );
    const dueDateForPlan = (plan: Plan) => {
      const monthIndex = month - 1;
      // Ajusta dia de vencimento para não extrapolar o último dia do mês
      const lastDay = new Date(year, month, 0).getDate();
      const day = Math.min(Number(plan.dia_vencimento_padrao) || 10, lastDay);
      return new Date(year, monthIndex, day);
    };

    let createdCount = 0;
    // Pré-carrega mensalidades já existentes do mês/ano para evitar duplicidade
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const existingFees = await this.withRetry(() => this.feeModel.findAll({
      where: {
        vencimento: { [Op.between]: [monthStart, monthEnd] },
        status: { [Op.ne]: 'cancelado' },
      },
      attributes: ['usuario_id'],
    }));
    const existingByUser = new Set<number>(
      existingFees
        .map((f: any) => f.usuario_id)
        .filter((id: any): id is number => typeof id === 'number')
    );

    for (const mp of associations) {
      const plan = await this.withRetry(() => this.planModel.findByPk(mp.plano_id));
      // Ignora se plano não existe ou está inativo
      if (!plan || plan.ativo === false) continue;
      const usuarioId = mp.usuario_id;
      // Evita criar duplicatas por usuário dentro do mesmo mês
      if (existingByUser.has(usuarioId)) continue;
      const vencimento = dueDateForPlan(plan);
      await this.withRetry(() => this.feeModel.create({
        usuario_id: usuarioId,
        valor: Number(plan.valor),
        vencimento,
        status: 'pendente',
      } as any));
      existingByUser.add(usuarioId);
      createdCount++;
    }
    return { created: createdCount };
  }

  async listFees(filters: { status?: FeeStatus; month?: number; year?: number; usuario_id?: number }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    // Filtro direto por usuario_id quando disponível
    if (typeof filters.usuario_id === 'number') where.usuario_id = filters.usuario_id;
    if (filters.month && filters.year) {
      const start = new Date(filters.year, filters.month - 1, 1);
      const end = new Date(filters.year, filters.month, 0);
      where.vencimento = { [Op.between]: [start, end] };
    }
    const fees = await this.withRetry(() => this.feeModel.findAll({ where, order: [['vencimento', 'ASC']] }));
    // Enriquecer com dados de usuário para consumo do frontend
    try {
      const userIds = Array.from(new Set(fees.map((f: any) => f.usuario_id).filter((x: any): x is number => typeof x === 'number')));
      const users = userIds.length > 0 ? await this.userModel.findAll({ where: { id: { [Op.in]: userIds } } }) : [];
      const userById = new Map<number, User>();
      for (const u of users) userById.set(u.id, u);
      for (const f of fees) {
        const u = f.usuario_id ? userById.get(f.usuario_id) : undefined;
        // Use setDataValue to ensure fields appear in JSON serialization
        (f as any).setDataValue?.('usuario_id', u?.id ?? f.usuario_id ?? null);
        (f as any).setDataValue?.('usuario_nome', u?.nome ?? u?.email ?? null);
        (f as any).setDataValue?.('nome', u?.nome ?? u?.email ?? null);
      }
    } catch (e) {
      // silencioso: se falhar enriquecimento, retorna apenas as mensalidades
    }
    return fees;
  }

  async updateStatus(id: number, status: FeeStatus, observacao?: string) {
    const fee = await this.feeModel.findByPk(id);
    if (!fee) throw new NotFoundException('Mensalidade não encontrada');
    fee.status = status;
    if (observacao) fee.observacao = observacao;
    if (status === 'pago' && !fee.data_pagamento) fee.data_pagamento = new Date();
    await fee.save();
    return fee;
  }

  async markPaid(id: number, data_pagamento?: Date) {
    const fee = await this.feeModel.findByPk(id);
    if (!fee) throw new NotFoundException('Mensalidade não encontrada');
    fee.status = 'pago';
    fee.data_pagamento = data_pagamento ?? new Date();
    await this.withRetry(() => fee.save());
    return fee;
  }

  async cancel(id: number, observacao?: string) {
    return this.updateStatus(id, 'cancelado', observacao);
  }

  async updateUsuario(id: number, usuario_id: number | null) {
    const fee = await this.feeModel.findByPk(id);
    if (!fee) throw new NotFoundException('Mensalidade não encontrada');
    fee.usuario_id = typeof usuario_id === 'number' ? usuario_id : null as any;
    await this.withRetry(() => fee.save());
    return fee;
  }

  async autoUpdateOverdue() {
    const now = new Date();
    const pendentes = await this.feeModel.findAll({ where: { status: 'pendente' } });
    let updated = 0;
    for (const f of pendentes) {
      if (f.vencimento < now) {
        f.status = 'atrasado';
        await this.withRetry(() => f.save());
        updated++;
      }
    }
    return { updated };
  }

  async totals(month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const fees = await this.feeModel.findAll({ where: { vencimento: { [Op.between]: [start, end] } } });
    const totalRecebido = fees.filter(f => f.status === 'pago').reduce((sum, f) => sum + Number(f.valor), 0);
    const totalPendente = fees.filter(f => f.status === 'pendente' || f.status === 'atrasado').reduce((sum, f) => sum + Number(f.valor), 0);
    return { totalRecebido, totalPendente };
  }

  // Removido: backfill baseado em membro_id não é mais aplicável após remoção da coluna


  async notifyLate(id: number) {
    const fee = await this.feeModel.findByPk(id);
    if (!fee) throw new NotFoundException('Mensalidade não encontrada');
    if (fee.status === 'pendente' && fee.vencimento < new Date()) {
      fee.status = 'atrasado';
      await this.withRetry(() => fee.save());
    }
    // Apenas simula o registro de notificação
    fee.observacao = `${fee.observacao ? fee.observacao + ' | ' : ''}notificado atraso em ${new Date().toISOString().slice(0, 10)}`;
    await this.withRetry(() => fee.save());
    return fee;
  }

  async sendReminder(id: number) {
    const fee = await this.feeModel.findByPk(id);
    if (!fee) throw new NotFoundException('Mensalidade não encontrada');
    fee.observacao = `${fee.observacao ? fee.observacao + ' | ' : ''}lembrete enviado em ${new Date().toISOString().slice(0, 10)}`;
    await this.withRetry(() => fee.save());
    return fee;
  }
}