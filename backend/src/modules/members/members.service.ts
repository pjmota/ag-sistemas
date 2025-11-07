import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Member } from '../../database/models/member.model';

@Injectable()
export class MembersService {
  constructor(@InjectModel(Member) private memberModel: typeof Member) {}

  async create(data: { nome: string; email: string; telefone?: string }) {
    return this.memberModel.create({ ...data, status: 'ativo' });
  }

  async listActive() {
    return this.memberModel.findAll({ where: { status: 'ativo' } });
  }

  async updateStatus(id: number, status: 'pendente' | 'ativo' | 'recusado') {
    const m = await this.memberModel.findByPk(id);
    if (!m) throw new NotFoundException('Membro não encontrado');
    m.status = status;
    await m.save();
    return m;
  }
}