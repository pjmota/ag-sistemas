import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Intention } from '../../database/models/intention.model';
import { Member } from '../../database/models/member.model';

@Injectable()
export class IntentionsService {
  constructor(
    @InjectModel(Intention) private intentionModel: typeof Intention,
    @InjectModel(Member) private memberModel: typeof Member,
  ) {}

  async submit(data: { nome: string; email: string; empresa?: string; motivo: string }) {
    return this.intentionModel.create({ ...data, status: 'pendente' });
  }

  async listAll() {
    return this.intentionModel.findAll({ order: [['data', 'DESC']] });
  }

  async updateStatus(id: number, status: 'aprovada' | 'recusada') {
    const intention = await this.intentionModel.findByPk(id);
    if (!intention) throw new NotFoundException('Intenção não encontrada');
    intention.status = status;
    await intention.save();
    // Quando intenção é aprovada, cria (ou garante) registro em membros com dados da intenção
    if (status === 'aprovada') {
      const existing = await this.memberModel.findOne({ where: { email: intention.email } });
      if (!existing) {
        await this.memberModel.create({
          nome: intention.nome,
          email: intention.email,
          empresa: intention.empresa || null,
          status: 'pendente',
        } as any);
      }
    }
    return intention;
  }
}