import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Member } from '../../database/models/member.model';
import { Referral } from '../../database/models/referral.model';
import { Thanks } from '../../database/models/thanks.model';
import { Op } from 'sequelize';

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Member) private memberModel: typeof Member,
    @InjectModel(Referral) private referralModel: typeof Referral,
    @InjectModel(Thanks) private thanksModel: typeof Thanks,
  ) {}

  async kpis() {
    try {
      const inicio = startOfMonth();
      const fim = endOfMonth();
      const totalMembrosAtivos = await this.memberModel.count({ where: { status: 'ativo' } });
      const totalIndicacoesMes = await this.referralModel.count({
        where: { data: { [Op.between]: [inicio, fim] } },
      });
      const totalObrigadosMes = await this.thanksModel.count({
        where: { data: { [Op.between]: [inicio, fim] } },
      });
      return { totalMembrosAtivos, totalIndicacoesMes, totalObrigadosMes };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[DashboardService] Falha ao calcular KPIs:', err);
      return { totalMembrosAtivos: 0, totalIndicacoesMes: 0, totalObrigadosMes: 0 };
    }
  }
}