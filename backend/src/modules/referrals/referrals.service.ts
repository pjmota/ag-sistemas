import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Referral } from '../../database/models/referral.model';

@Injectable()
export class ReferralsService {
  constructor(@InjectModel(Referral) private referralModel: typeof Referral) {}

  async create(data: { usuario_origem_id: number; usuario_destino_id: number; descricao: string }) {
    return this.referralModel.create({ ...data, status: 'nova' });
  }

  async getById(id: number) {
    const r = await this.referralModel.findByPk(id);
    if (!r) throw new NotFoundException('Indicação não encontrada');
    return r;
  }

  async listByUserSent(userId: number) {
    return this.referralModel.findAll({ where: { usuario_origem_id: userId } });
  }

  async listByUserReceived(userId: number) {
    return this.referralModel.findAll({ where: { usuario_destino_id: userId } });
  }

  async updateStatus(
    id: number,
    status: 'nova' | 'em contato' | 'fechada' | 'recusada',
    agradecimentos_publicos?: string,
  ) {
    const r = await this.referralModel.findByPk(id);
    if (!r) throw new NotFoundException('Indicação não encontrada');
    r.status = status;
    if (typeof agradecimentos_publicos !== 'undefined') {
      r.agradecimentos_publicos = agradecimentos_publicos;
    }
    await r.save();
    return r;
  }
}