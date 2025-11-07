import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Referral } from '../../database/models/referral.model';

@Injectable()
export class ReferralsService {
  constructor(@InjectModel(Referral) private referralModel: typeof Referral) {}

  async create(data: { membro_origem_id: number; membro_destino_id: number; descricao: string }) {
    return this.referralModel.create({ ...data, status: 'nova' });
  }

  async getById(id: number) {
    const r = await this.referralModel.findByPk(id);
    if (!r) throw new NotFoundException('Indicação não encontrada');
    return r;
  }

  async listByMemberSent(memberId: number) {
    return this.referralModel.findAll({ where: { membro_origem_id: memberId } });
  }

  async listByMemberReceived(memberId: number) {
    return this.referralModel.findAll({ where: { membro_destino_id: memberId } });
  }

  async updateStatus(id: number, status: 'nova' | 'em contato' | 'fechada' | 'recusada') {
    const r = await this.referralModel.findByPk(id);
    if (!r) throw new NotFoundException('Indicação não encontrada');
    r.status = status;
    await r.save();
    return r;
  }
}