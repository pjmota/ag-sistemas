import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Referral } from '../../database/models/referral.model';

@Injectable()
export class ReferralsService {
  constructor(@InjectModel(Referral) private referralModel: typeof Referral) {}

  async create(data: {
    usuario_origem_id?: number;
    usuario_destino_id?: number;
    membro_origem_id?: number;
    membro_destino_id?: number;
    descricao: string;
  }) {
    const usuario_origem_id = data.usuario_origem_id ?? data.membro_origem_id;
    const usuario_destino_id = data.usuario_destino_id ?? data.membro_destino_id;
    return this.referralModel.create({ usuario_origem_id, usuario_destino_id, descricao: data.descricao, status: 'nova' } as any);
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