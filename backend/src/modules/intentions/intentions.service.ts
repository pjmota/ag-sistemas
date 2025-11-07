import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Intention } from '../../database/models/intention.model';

@Injectable()
export class IntentionsService {
  constructor(@InjectModel(Intention) private intentionModel: typeof Intention) {}

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
    return intention;
  }
}